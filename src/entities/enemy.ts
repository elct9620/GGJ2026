import { Entity } from "./entity";
import { Vector } from "../values/vector";
import type { CollisionBox } from "../values/collision";
import { Container, Graphics, Sprite } from "pixi.js";
import { getTexture, AssetKeys } from "../core/assets";
import { LAYOUT } from "../utils/constants";
import { FoodType } from "./booth";

export const EnemyType = {
  Ghost: "Ghost", // 餓鬼 (SPEC § 2.6.2)
  Boss: "Boss", // 餓死鬼 (SPEC § 2.6.2)
} as const;

export type EnemyType = (typeof EnemyType)[keyof typeof EnemyType];

/**
 * Enemy entity (Ghost or Boss)
 * Spec: § 2.6.2 Enemies
 */
export class Enemy extends Entity {
  public position: Vector;
  public readonly type: EnemyType;
  public health: number;
  public readonly maxHealth: number;
  public readonly speed: number; // px/s
  public sprite: Container;

  private enemySprite: Sprite;
  private healthBarContainer: Graphics | null = null;

  constructor(type: EnemyType, initialPosition: Vector) {
    super();
    this.type = type;
    this.position = initialPosition;

    // Set stats based on enemy type (SPEC § 2.6.2)
    if (type === EnemyType.Ghost) {
      this.maxHealth = 1;
      this.health = 1;
      this.speed = 50; // 0.5 units/s ≈ 50 px/s
    } else {
      // Boss
      this.maxHealth = 3;
      this.health = 3;
      this.speed = 30; // 0.3 units/s ≈ 30 px/s
    }

    this.sprite = new Container();
    this.enemySprite = this.createSprite();
    this.sprite.addChild(this.enemySprite);

    // Add health bar for Boss
    if (type === EnemyType.Boss) {
      this.healthBarContainer = new Graphics();
      this.sprite.addChild(this.healthBarContainer);
      this.updateHealthBar();
    }

    this.updateSpritePosition();
  }

  private createSprite(): Sprite {
    const sprite = new Sprite(getTexture(AssetKeys.monster));

    // Asset size is 256×256, use full size per SPEC § 2.7.2
    // Both Ghost and Boss use 256×256, Boss has purple tint
    sprite.width = LAYOUT.ENEMY_SIZE;
    sprite.height = LAYOUT.ENEMY_SIZE;

    // Set anchor to center
    sprite.anchor.set(0.5, 0.5);

    // Tint Boss to differentiate
    if (this.type === EnemyType.Boss) {
      sprite.tint = 0x9b59b6; // Purple tint for Boss
    }

    return sprite;
  }

  /**
   * Move enemy to the left (toward baseline)
   * Spec: § 2.6.2 / § 2.7.2 - enemies move left toward x = 340 baseline
   */
  public update(deltaTime: number): void {
    if (!this.active) return;

    // Move left
    const displacement = new Vector(-this.speed * deltaTime, 0);
    this.position = this.position.add(displacement);

    this.updateSpritePosition();
  }

  /**
   * Take damage from bullet
   * Returns true if enemy died
   */
  public takeDamage(amount: number): boolean {
    if (!this.active) return false;

    this.health = Math.max(0, this.health - amount);

    // Update health bar for Boss
    if (this.type === EnemyType.Boss) {
      this.updateHealthBar();
    }

    if (this.health <= 0) {
      this.active = false;
      return true; // Enemy died
    }

    return false;
  }

  /**
   * Check if enemy has reached the baseline (x = 340)
   * Spec: § 2.7.2 / § 2.8.2 - enemies reaching baseline cause player damage
   */
  public hasReachedBaseline(): boolean {
    return this.position.x <= LAYOUT.BASELINE_X;
  }

  /**
   * 碰撞箱（與視覺大小同步）
   * SPEC § 4.2.5: AABB 碰撞檢測
   */
  public get collisionBox(): CollisionBox {
    return { width: LAYOUT.ENEMY_SIZE, height: LAYOUT.ENEMY_SIZE };
  }

  /**
   * Drop random food item when defeated
   * Spec: § 2.6.2 - 100% drop rate, random type
   */
  public dropFood(): FoodType {
    const foodTypes = [FoodType.Pearl, FoodType.Tofu, FoodType.BloodCake];
    const randomIndex = Math.floor(Math.random() * foodTypes.length);
    return foodTypes[randomIndex];
  }

  /**
   * Update health bar visualization for Boss
   */
  private updateHealthBar(): void {
    if (this.type !== EnemyType.Boss || !this.healthBarContainer) return;

    this.healthBarContainer.clear();

    const barWidth = 8;
    const barHeight = 6;
    const barSpacing = 2;
    const totalWidth =
      this.maxHealth * barWidth + (this.maxHealth - 1) * barSpacing;
    const startX = -totalWidth / 2;
    const startY = -this.enemySprite.height / 2 - 15;

    // Draw health bars (green for remaining health, gray for lost health)
    for (let i = 0; i < this.maxHealth; i++) {
      const x = startX + i * (barWidth + barSpacing);
      this.healthBarContainer.rect(x, startY, barWidth, barHeight);
      this.healthBarContainer.fill(i < this.health ? 0x2ecc71 : 0x7f8c8d);
    }
  }

  /**
   * Update sprite position to match entity position
   */
  private updateSpritePosition(): void {
    this.sprite.position.set(this.position.x, this.position.y);
  }

  /**
   * Reset enemy state for object pool reuse
   */
  public reset(type: EnemyType, position: Vector): void {
    this.active = true;
    // Note: Cannot change readonly type after construction
    // This would need to be handled by creating separate pools per type
    this.position = position;

    if (type === EnemyType.Ghost) {
      this.health = 1;
    } else {
      this.health = 3;
      this.updateHealthBar();
    }

    this.updateSpritePosition();
  }
}
