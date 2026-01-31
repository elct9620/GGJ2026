import { Entity } from "./entity";
import { Vector } from "../values/vector";
import { Graphics } from "pixi.js";

export const EnemyType = {
  Ghost: "Ghost", // 餓鬼 (SPEC § 2.6.2)
  Boss: "Boss", // 餓死鬼 (SPEC § 2.6.2)
} as const;

export type EnemyType = (typeof EnemyType)[keyof typeof EnemyType];

export const FoodType = {
  Pearl: "Pearl", // 珍珠
  Tofu: "Tofu", // 豆腐
  BloodCake: "BloodCake", // 米血
} as const;

export type FoodType = (typeof FoodType)[keyof typeof FoodType];

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
  public sprite: Graphics;

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

    this.sprite = this.createSprite();
  }

  private createSprite(): Graphics {
    const sprite = new Graphics();

    if (this.type === EnemyType.Ghost) {
      // Draw a simple red triangle for Ghost (prototype visualization)
      sprite.moveTo(0, -15);
      sprite.lineTo(12, 15);
      sprite.lineTo(-12, 15);
      sprite.lineTo(0, -15);
      sprite.fill(0xe74c3c); // Red color
    } else {
      // Draw a larger purple hexagon for Boss (prototype visualization)
      const size = 20;
      for (let i = 0; i < 6; i++) {
        const angle = (Math.PI / 3) * i;
        const x = size * Math.cos(angle);
        const y = size * Math.sin(angle);
        if (i === 0) {
          sprite.moveTo(x, y);
        } else {
          sprite.lineTo(x, y);
        }
      }
      sprite.fill(0x9b59b6); // Purple color

      // Add health indicator (simple bars)
      for (let i = 0; i < this.maxHealth; i++) {
        sprite.rect(-12 + i * 8, -28, 6, 4);
        sprite.fill(0x2ecc71); // Green for health bars
      }
    }

    return sprite;
  }

  /**
   * Move enemy to the left (toward baseline)
   * Spec: § 2.6.2 - enemies move left toward x = 384
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
   * Check if enemy has reached the baseline (x = 384)
   * Spec: § 2.8.2 - enemies reaching baseline cause player damage
   */
  public hasReachedBaseline(): boolean {
    return this.position.x <= 384;
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
    if (this.type !== EnemyType.Boss) return;

    // Recreate sprite with updated health
    this.sprite.clear();

    // Draw hexagon
    const size = 20;
    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI / 3) * i;
      const x = size * Math.cos(angle);
      const y = size * Math.sin(angle);
      if (i === 0) {
        this.sprite.moveTo(x, y);
      } else {
        this.sprite.lineTo(x, y);
      }
    }
    this.sprite.fill(0x9b59b6);

    // Draw health bars (green for remaining health, gray for lost health)
    for (let i = 0; i < this.maxHealth; i++) {
      this.sprite.rect(-12 + i * 8, -28, 6, 4);
      this.sprite.fill(i < this.health ? 0x2ecc71 : 0x7f8c8d);
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
