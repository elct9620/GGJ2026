import { Entity } from "./entity";
import { Vector } from "../values/vector";
import { Health } from "../values/health";
import { Damage } from "../values/damage";
import type { CollisionBox } from "../values/collision";
import type { FoodType } from "../core/types";
import { LAYOUT } from "../utils/constants";
import { EnemyType, isEliteType } from "../core/types";
import { enemyData } from "../data";

/**
 * Enemy entity (Ghost or Boss)
 * Spec: § 2.6.2 Enemies
 *
 * Pure data container - rendering handled by EnemyRenderer
 */
export class Enemy extends Entity {
  public position: Vector;
  public readonly type: EnemyType;
  public readonly baseSpeed!: number; // px/s (original speed, assigned in constructor)

  // Value Object
  private _health: Health;

  // Slow debuff system (SPEC § 2.3.3 - 豬血糕效果)
  private speedMultiplier: number = 1.0;
  private slowDuration: number = 0;
  private readonly slowEffectDuration: number = 3; // seconds

  // Knockback effect system (通用受擊效果)
  private knockbackVelocity: number = 0;
  private knockbackDuration: number = 0;

  /**
   * Health Value Object (use takeDamage for modifications)
   */
  public get health(): Health {
    return this._health;
  }

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

    // Get properties from data catalog (SPEC § 2.6.2)
    const props = enemyData.get(type);
    this.baseSpeed = props.speed;

    // HP scales with wave number
    this._health = this.initializeHealth(type, wave);
  }

  /**
   * Initialize health based on enemy type and wave
   * SPEC § 2.6.2: HP scales with wave number
   */
  private initializeHealth(type: EnemyType, wave: number): Health {
    if (type === EnemyType.Ghost) {
      return Health.ghostForWave(wave);
    } else if (isEliteType(type)) {
      return Health.eliteForWave(wave);
    } else {
      return Health.bossForWave(wave);
    }
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
    const size = enemyData.getSize(this.type);
    return { width: size, height: size };
  }

  /**
   * Food drop when defeated (or null if no drop)
   * SPEC § 2.6.2: Uses EnemyData for food drop mapping
   */
  public get foodDrop(): FoodType | null {
    return enemyData.getFoodDrop(this.type);
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

    // Reset knockback effect
    this.knockbackVelocity = 0;
    this.knockbackDuration = 0;

    this._health = this.initializeHealth(type, wave);
  }
}
