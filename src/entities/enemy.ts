import { SpriteEntity } from "./entity";
import { Vector } from "../values/vector";
import { Health } from "../values/health";
import { Damage } from "../values/damage";
import type { CollisionBox } from "../values/collision";
import { Container, Graphics, Sprite } from "pixi.js";
import { getTexture } from "../core/assets";
import type { FoodType } from "../core/types";
import { LAYOUT } from "../utils/constants";
import { EnemyType, isEliteType } from "../core/types";
import {
  getEnemyProperties,
  getEnemyFoodDrop,
  shouldShowHealthBar,
} from "../values";

// Re-export for backwards compatibility
export { EnemyType, isEliteType } from "../core/types";

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

  // Flash effect system (SPEC § 2.6.3 通用視覺效果)
  private originalTint: number = 0xffffff;
  private flashDuration: number = 0;

  // Knockback effect system (通用受擊效果)
  private knockbackVelocity: number = 0;
  private knockbackDuration: number = 0;

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

    // Get properties from registry (SPEC § 2.6.2)
    const props = getEnemyProperties(type);
    this.baseSpeed = props.speed;

    // HP scales with wave number
    if (type === EnemyType.Ghost) {
      this._health = Health.ghostForWave(wave);
    } else if (isEliteType(type)) {
      this._health = Health.eliteForWave(wave);
    } else {
      this._health = Health.bossForWave(wave);
    }

    this.sprite = new Container();
    this.enemySprite = this.createSprite();
    this.sprite.addChild(this.enemySprite);

    // Add health bar if needed
    if (shouldShowHealthBar(type)) {
      this.healthBarContainer = new Graphics();
      this.sprite.addChild(this.healthBarContainer);
      this.updateHealthBar();
    }

    this.updateSpritePosition();
  }

  private createSprite(): Sprite {
    const props = getEnemyProperties(this.type);
    const sprite = new Sprite(getTexture(props.assetKey));

    sprite.width = props.size;
    sprite.height = props.size;

    // Set anchor to center
    sprite.anchor.set(0.5, 0.5);

    return sprite;
  }

  /**
   * Apply flash effect when hit by bullet (SPEC § 2.6.3 通用視覺效果)
   * @param color Tint color for flash effect
   * @param duration Duration of flash in seconds
   */
  public flashHit(color: number = 0xffffff, duration: number = 0.1): void {
    this.originalTint = 0xffffff; // Store original tint (always white)
    this.enemySprite.tint = color;
    this.flashDuration = duration;
  }

  /**
   * Apply knockback effect when hit by bullet (通用受擊效果)
   * Pushes enemy to the right (away from baseline)
   * @param distance Distance to knock back in pixels
   * @param duration Duration of knockback in seconds
   */
  public applyKnockback(distance: number, duration: number): void {
    if (duration <= 0) return;
    this.knockbackVelocity = distance / duration;
    this.knockbackDuration = duration;
  }

  /**
   * Move enemy to the left (toward baseline)
   * Spec: § 2.6.2 / § 2.7.2 - enemies move left toward x = 340 baseline
   */
  public update(deltaTime: number): void {
    if (!this.active) return;

    // Update flash effect duration
    if (this.flashDuration > 0) {
      this.flashDuration -= deltaTime;
      if (this.flashDuration <= 0) {
        this.enemySprite.tint = this.originalTint;
        this.flashDuration = 0;
      }
    }

    // Update knockback effect (push right, away from baseline)
    if (this.knockbackDuration > 0) {
      const knockbackDisplacement = this.knockbackVelocity * deltaTime;
      this.position = this.position.add(new Vector(knockbackDisplacement, 0));
      this.knockbackDuration -= deltaTime;
    }

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

    // Update health bar if applicable
    if (shouldShowHealthBar(this.type)) {
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
   * SPEC § 4.2.5: AABB 碰撞檢測，使用 EnemyTypeRegistry 取得尺寸
   */
  public get collisionBox(): CollisionBox {
    const size = getEnemyProperties(this.type).size;
    return { width: size, height: size };
  }

  /**
   * Drop food item when defeated (or null if no drop)
   * SPEC § 2.6.2: Uses EnemyTypeRegistry for food drop mapping
   */
  public dropFood(): FoodType | null {
    return getEnemyFoodDrop(this.type);
  }

  /**
   * Update health bar visualization for Boss and Elite enemies
   */
  private updateHealthBar(): void {
    if (!shouldShowHealthBar(this.type) || !this.healthBarContainer) return;

    this.healthBarContainer.clear();

    const barWidth = 8;
    const barHeight = 6;
    const barSpacing = 2;
    const totalWidth =
      this.maxHealth * barWidth + (this.maxHealth - 1) * barSpacing;
    const startX = -totalWidth / 2;
    // Health bar position based on sprite size from registry
    const spriteHeight = getEnemyProperties(this.type).size;
    const startY = -spriteHeight / 2 - 15;

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

    // Reset flash effect
    this.enemySprite.tint = 0xffffff;
    this.originalTint = 0xffffff;
    this.flashDuration = 0;

    // Reset knockback effect
    this.knockbackVelocity = 0;
    this.knockbackDuration = 0;

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
