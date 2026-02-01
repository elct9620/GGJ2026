import { SpriteEntity } from "./entity";
import { Vector } from "../values/vector";
import { Damage } from "../values/damage";
import type { CollisionBox } from "../values/collision";
import { Graphics } from "pixi.js";
import { LAYOUT } from "../utils/constants";
import { BULLET_CONFIG } from "../config";
import type { Enemy } from "./enemy";
import { SpecialBulletType } from "../values/special-bullet";

/**
 * Bullet entity fired by player
 * Spec: § 2.6.3 Bullets
 */
export class Bullet extends SpriteEntity {
  public position: Vector;
  public velocity: Vector;
  public readonly speed: number = BULLET_CONFIG.speed;
  public sprite: Graphics;

  // Value Object
  private _damage: Damage = Damage.normal();

  // Tracking bullet properties (SPEC § 2.3.3 - 豬血糕)
  public isTracking: boolean = false;
  public trackingTarget: Enemy | null = null;
  public trackingRange: number = 0;
  private findNearestEnemy:
    | ((position: Vector, maxRange: number) => Enemy | null)
    | null = null;

  // Bullet type for visual differentiation
  private bulletType: SpecialBulletType = SpecialBulletType.None;

  /**
   * Get bullet type (for visual effects)
   */
  public get type(): SpecialBulletType {
    return this.bulletType;
  }

  // Backward compatible getter/setter
  public get damage(): number {
    return this._damage.toNumber();
  }

  public set damage(value: number) {
    this._damage = new Damage(value);
  }

  // Value Object accessor
  public get damageVO(): Damage {
    return this._damage;
  }

  // 子彈視覺半徑（使用較大的視覺大小便於辨識）
  private readonly visualRadius = BULLET_CONFIG.visualSize / 2;
  // 子彈碰撞半徑（維持 8×8 碰撞箱）
  private readonly collisionRadius = BULLET_CONFIG.collisionSize / 2;

  constructor(
    initialPosition: Vector,
    direction: Vector,
    bulletType: SpecialBulletType = SpecialBulletType.None,
  ) {
    super();
    this.position = initialPosition;
    this.velocity = direction.normalize().multiply(this.speed);
    this.bulletType = bulletType;
    this.sprite = this.createSprite();
  }

  private createSprite(): Graphics {
    const sprite = new Graphics();
    const color = this.getBulletColor();

    // Draw bullet with visual size for better visibility
    sprite.circle(0, 0, this.visualRadius);
    sprite.fill(color);

    return sprite;
  }

  /**
   * Get bullet color based on type
   */
  private getBulletColor(): number {
    const colors = BULLET_CONFIG.colors;
    switch (this.bulletType) {
      case SpecialBulletType.NightMarket:
        return colors.nightMarket;
      case SpecialBulletType.StinkyTofu:
        return colors.stinkyTofu;
      case SpecialBulletType.BubbleTea:
        return colors.bubbleTea;
      case SpecialBulletType.BloodCake:
        return colors.bloodCake;
      case SpecialBulletType.OysterOmelette:
        return colors.oysterOmelette;
      default:
        return colors.normal;
    }
  }

  /**
   * 碰撞箱（8×8 px，視覺大小與碰撞分離）
   * SPEC § 4.2.5: AABB 碰撞檢測
   */
  public get collisionBox(): CollisionBox {
    return {
      width: this.collisionRadius * 2,
      height: this.collisionRadius * 2,
    };
  }

  /**
   * Update bullet position
   */
  public update(deltaTime: number): void {
    if (!this.active) return;

    // Handle tracking bullet behavior (SPEC § 2.3.3 - 豬血糕)
    if (this.isTracking && this.trackingTarget?.active) {
      this.updateTrackingDirection();
    }

    // Move bullet based on velocity
    const displacement = this.velocity.multiply(deltaTime);
    this.position = this.position.add(displacement);

    // Deactivate if bullet goes off-screen (right side)
    // SPEC § 2.2.1 - bullets fly off screen
    if (this.position.x > 1920 || this.position.x < 0) {
      this.active = false;
    }

    this.updateSpritePosition();
  }

  /**
   * Update velocity to track target (SPEC § 2.3.3)
   * Dynamically finds nearest enemy within tracking range and recalculates direction
   */
  private updateTrackingDirection(): void {
    // Find nearest enemy within tracking range (SPEC § 2.3.3 + issue #76)
    if (this.findNearestEnemy && this.trackingRange > 0) {
      this.trackingTarget = this.findNearestEnemy(
        this.position,
        this.trackingRange,
      );
    }

    // If no valid target found, continue in current direction
    if (!this.trackingTarget || !this.trackingTarget.active) {
      return;
    }

    // Calculate distance to target
    const direction = this.trackingTarget.position.subtract(this.position);
    const distance = direction.magnitude();

    // Verify target is within tracking range
    if (distance > this.trackingRange) {
      this.trackingTarget = null;
      return;
    }

    // Update velocity toward target
    if (distance > 0) {
      this.velocity = direction.normalize().multiply(this.speed);
    }
  }

  /**
   * Check if bullet has left the game area
   * SPEC § 2.7.2: baseline at x = 340
   */
  public isOffScreen(): boolean {
    return this.position.x > 1920 || this.position.x < LAYOUT.BASELINE_X;
  }

  /**
   * Reset bullet state for object pool reuse
   */
  public reset(
    position: Vector,
    direction: Vector,
    bulletType: SpecialBulletType = SpecialBulletType.None,
  ): void {
    this.active = true;
    this.position = position;
    this.velocity = direction.normalize().multiply(this.speed);
    this._damage = Damage.normal();
    this.isTracking = false;
    this.trackingTarget = null;
    this.trackingRange = 0;
    this.findNearestEnemy = null;
    this.bulletType = bulletType;
    this.updateSprite();
    this.updateSpritePosition();
  }

  /**
   * Update sprite appearance based on current bullet type
   */
  private updateSprite(): void {
    this.sprite.clear();
    const color = this.getBulletColor();
    this.sprite.circle(0, 0, this.visualRadius);
    this.sprite.fill(color);
  }

  /**
   * Enable tracking mode for this bullet (SPEC § 2.3.3 - 豬血糕)
   * @param range Tracking range in pixels
   * @param findEnemyCallback Callback to find nearest enemy within range
   */
  public setTracking(
    range: number,
    findEnemyCallback: (position: Vector, maxRange: number) => Enemy | null,
  ): void {
    this.isTracking = true;
    this.trackingRange = range;
    this.findNearestEnemy = findEnemyCallback;
    this.trackingTarget = null; // Target is dynamically found during flight
  }
}
