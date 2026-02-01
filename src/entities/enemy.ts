import { SpriteEntity } from "./entity";
import { Vector } from "../values/vector";
import { Health } from "../values/health";
import { Damage } from "../values/damage";
import type { CollisionBox } from "../values/collision";
import { Container, Graphics, Sprite } from "pixi.js";
import { getTexture, AssetKeys } from "../core/assets";
import { LAYOUT } from "../utils/constants";
import { FoodType } from "./booth";
import { ENEMY_CONFIG } from "../config";

export const EnemyType = {
  Ghost: "Ghost", // 餓鬼 (SPEC § 2.6.2) - 小怪，不掉落食材
  RedGhost: "RedGhost", // 紅餓鬼 (SPEC § 2.6.2) - 菁英，掉落豆腐
  GreenGhost: "GreenGhost", // 綠餓鬼 (SPEC § 2.6.2) - 菁英，掉落珍珠
  BlueGhost: "BlueGhost", // 藍餓鬼 (SPEC § 2.6.2) - 菁英，掉落米血
  Boss: "Boss", // 餓死鬼 (SPEC § 2.6.2)
} as const;

export type EnemyType = (typeof EnemyType)[keyof typeof EnemyType];

/**
 * Check if enemy type is Elite (colored ghost)
 * SPEC § 2.6.2: 菁英敵人有 2 HP，固定掉落對應食材
 */
export function isEliteType(type: EnemyType): boolean {
  return (
    type === EnemyType.RedGhost ||
    type === EnemyType.GreenGhost ||
    type === EnemyType.BlueGhost
  );
}

/**
 * Enemy entity (Ghost or Boss)
 * Spec: § 2.6.2 Enemies
 */
export class Enemy extends SpriteEntity {
  public position: Vector;
  public readonly type: EnemyType;
  public readonly baseSpeed!: number; // px/s (original speed, assigned in constructor)
  public sprite: Container;

  // Value Object
  private _health: Health;

  // Slow debuff system (SPEC § 2.3.3 - 豬血糕效果)
  private speedMultiplier: number = 1.0;
  private slowDuration: number = 0;
  private readonly slowEffectDuration: number = 3; // seconds

  // Read-only health accessor (use takeDamage for modifications)
  public get health(): number {
    return this._health.current;
  }

  public get maxHealth(): number {
    return this._health.max;
  }

  // Value Object accessor
  public get healthVO(): Health {
    return this._health;
  }

  private enemySprite: Sprite;
  private healthBarContainer: Graphics | null = null;

  /**
   * Current effective speed (base speed × multiplier)
   */
  public get speed(): number {
    return this.baseSpeed * this.speedMultiplier;
  }

  constructor(type: EnemyType, initialPosition: Vector, wave: number = 1) {
    super();
    this.type = type;
    this.position = initialPosition;

    // Set stats based on enemy type (SPEC § 2.6.2)
    // HP scales with wave number
    if (type === EnemyType.Ghost) {
      this._health = Health.ghostForWave(wave);
      this.baseSpeed = ENEMY_CONFIG.ghost.speed;
    } else if (isEliteType(type)) {
      // Elite enemies: Red/Green/Blue Ghost
      this._health = Health.eliteForWave(wave);
      this.baseSpeed = ENEMY_CONFIG.elite.speed;
    } else {
      // Boss
      this._health = Health.bossForWave(wave);
      this.baseSpeed = ENEMY_CONFIG.boss.speed;
    }

    this.sprite = new Container();
    this.enemySprite = this.createSprite();
    this.sprite.addChild(this.enemySprite);

    // Add health bar for Boss or Elite
    if (type === EnemyType.Boss || isEliteType(type)) {
      this.healthBarContainer = new Graphics();
      this.sprite.addChild(this.healthBarContainer);
      this.updateHealthBar();
    }

    this.updateSpritePosition();
  }

  private createSprite(): Sprite {
    const sprite = new Sprite(getTexture(AssetKeys.monster));

    // Asset size is 256×256, use full size per SPEC § 2.7.2
    // Both Ghost and Boss use 256×256
    sprite.width = LAYOUT.ENEMY_SIZE;
    sprite.height = LAYOUT.ENEMY_SIZE;

    // Set anchor to center
    sprite.anchor.set(0.5, 0.5);

    // Apply tint based on enemy type (SPEC § 2.6.2)
    sprite.tint = this.getEnemyTint();

    return sprite;
  }

  /**
   * Get tint color based on enemy type
   * SPEC § 2.6.2: Visual differentiation for enemy types
   */
  private getEnemyTint(): number {
    switch (this.type) {
      case EnemyType.RedGhost:
        return 0xe74c3c; // Red tint for Red Ghost (drops Tofu)
      case EnemyType.GreenGhost:
        return 0x2ecc71; // Green tint for Green Ghost (drops Pearl)
      case EnemyType.BlueGhost:
        return 0x3498db; // Blue tint for Blue Ghost (drops BloodCake)
      case EnemyType.Boss:
        return 0x9b59b6; // Purple tint for Boss
      default:
        return 0xffffff; // No tint for regular Ghost
    }
  }

  /**
   * Move enemy to the left (toward baseline)
   * Spec: § 2.6.2 / § 2.7.2 - enemies move left toward x = 340 baseline
   */
  public update(deltaTime: number): void {
    if (!this.active) return;

    // Update slow debuff duration
    if (this.slowDuration > 0) {
      this.slowDuration -= deltaTime;
      if (this.slowDuration <= 0) {
        this.slowDuration = 0;
        this.speedMultiplier = 1.0;
      }
    }

    // Move left (using effective speed = baseSpeed × speedMultiplier)
    const displacement = new Vector(-this.speed * deltaTime, 0);
    this.position = this.position.add(displacement);

    this.updateSpritePosition();
  }

  /**
   * Apply slow debuff to enemy (SPEC § 2.3.3 - 豬血糕效果)
   * @param slowPercent Speed reduction percentage (0.1 = -10%)
   */
  public applySlowDebuff(slowPercent: number): void {
    // Stack slow effects (multiplicative)
    this.speedMultiplier = this.speedMultiplier * (1 - slowPercent);
    this.slowDuration = this.slowEffectDuration;
  }

  /**
   * Take damage from bullet
   * Returns true if enemy died
   */
  public takeDamage(amount: number): boolean {
    if (!this.active) return false;

    // Support both number and Damage value object
    const damage = typeof amount === "number" ? new Damage(amount) : amount;
    this._health = this._health.takeDamage(damage);

    // Update health bar for Boss and Elite enemies
    if (this.type === EnemyType.Boss || isEliteType(this.type)) {
      this.updateHealthBar();
    }

    if (this._health.isDead()) {
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
   * Drop food item when defeated (or null if no drop)
   * SPEC § 2.6.2:
   * - Ghost (餓鬼): 不掉落食材
   * - RedGhost (紅餓鬼): 100% 掉落豆腐
   * - GreenGhost (綠餓鬼): 100% 掉落珍珠
   * - BlueGhost (藍餓鬼): 100% 掉落米血
   * - Boss: 不掉落食材（掉落特殊升級，由 UpgradeSystem 處理）
   */
  public dropFood(): FoodType | null {
    switch (this.type) {
      case EnemyType.RedGhost:
        return FoodType.Tofu;
      case EnemyType.GreenGhost:
        return FoodType.Pearl;
      case EnemyType.BlueGhost:
        return FoodType.BloodCake;
      default:
        // Ghost and Boss don't drop food
        return null;
    }
  }

  /**
   * Update health bar visualization for Boss and Elite enemies
   */
  private updateHealthBar(): void {
    if (
      (this.type !== EnemyType.Boss && !isEliteType(this.type)) ||
      !this.healthBarContainer
    )
      return;

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
   * Reset enemy state for object pool reuse
   * SPEC § 2.6.2: HP scales with wave number
   */
  public reset(type: EnemyType, position: Vector, wave: number = 1): void {
    this.active = true;
    // Note: Cannot change readonly type after construction
    // This would need to be handled by creating separate pools per type
    this.position = position;

    // Reset slow debuff
    this.speedMultiplier = 1.0;
    this.slowDuration = 0;

    if (type === EnemyType.Ghost) {
      this._health = Health.ghostForWave(wave);
    } else if (isEliteType(type)) {
      this._health = Health.eliteForWave(wave);
      this.updateHealthBar();
    } else {
      this._health = Health.bossForWave(wave);
      this.updateHealthBar();
    }

    this.updateSpritePosition();
  }
}
