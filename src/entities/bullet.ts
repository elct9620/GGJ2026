import { SpriteEntity } from "./entity";
import { Vector } from "../values/vector";
import { Damage } from "../values/damage";
import type { CollisionBox } from "../values/collision";
import { Graphics } from "pixi.js";
import { LAYOUT } from "../utils/constants";
import { BULLET_CONFIG } from "../config";
import type { Enemy } from "./enemy";
import { SpecialBulletType } from "../values/special-bullet";
import type { BulletUpgradeSnapshot } from "../values/bullet-upgrade-snapshot";
import { getBulletSize, getBulletColor } from "../values/bullet-type-registry";

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

  // Bullet type for visual differentiation
  private bulletType: SpecialBulletType = SpecialBulletType.None;

  // Upgrade snapshot captured at bullet creation time
  private _upgradeSnapshot: BulletUpgradeSnapshot | null = null;

  /**
   * Get bullet type (for visual effects)
   */
  public get type(): SpecialBulletType {
    return this.bulletType;
  }

  /**
   * Get upgrade snapshot captured at bullet creation time
   * Returns null if no snapshot was provided (for backwards compatibility)
   */
  public get upgradeSnapshot(): BulletUpgradeSnapshot | null {
    return this._upgradeSnapshot;
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

  constructor(
    initialPosition: Vector,
    direction: Vector,
    bulletType: SpecialBulletType = SpecialBulletType.None,
    upgradeSnapshot?: BulletUpgradeSnapshot,
  ) {
    super();
    this.position = initialPosition;
    this.velocity = direction.normalize().multiply(this.speed);
    this.bulletType = bulletType;
    this._upgradeSnapshot = upgradeSnapshot ?? null;
    this.sprite = this.createSprite();
  }

  /**
   * Get bullet size based on type (視覺與碰撞統一)
   * Uses BulletTypeRegistry for centralized property lookup
   */
  private getBulletSize(): number {
    return getBulletSize(this.bulletType);
  }

  private createSprite(): Graphics {
    const sprite = new Graphics();
    const color = this.getBulletColor();
    const radius = this.getBulletSize() / 2;

    sprite.circle(0, 0, radius);
    sprite.fill(color);

    return sprite;
  }

  /**
   * Get bullet color based on type
   * Uses BulletTypeRegistry for centralized property lookup
   */
  private getBulletColor(): number {
    return getBulletColor(this.bulletType);
  }

  /**
   * 碰撞箱（視覺與碰撞統一）
   * SPEC § 4.2.5: AABB 碰撞檢測
   */
  public get collisionBox(): CollisionBox {
    const size = this.getBulletSize();
    return {
      width: size,
      height: size,
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
   * Recalculates direction toward tracking target each frame
   */
  private updateTrackingDirection(): void {
    if (!this.trackingTarget) return;

    const direction = this.trackingTarget.position.subtract(this.position);
    if (direction.magnitude() > 0) {
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
   * @param position Initial position
   * @param direction Direction vector
   * @param bulletType Special bullet type
   * @param upgradeSnapshot Upgrade state captured at bullet creation time
   */
  public reset(
    position: Vector,
    direction: Vector,
    bulletType: SpecialBulletType = SpecialBulletType.None,
    upgradeSnapshot?: BulletUpgradeSnapshot,
  ): void {
    this.active = true;
    this.position = position;
    this.velocity = direction.normalize().multiply(this.speed);
    this._damage = Damage.normal();
    this.isTracking = false;
    this.trackingTarget = null;
    this.bulletType = bulletType;
    this._upgradeSnapshot = upgradeSnapshot ?? null;
    this.updateSprite();
    this.updateSpritePosition();
  }

  /**
   * Update sprite appearance based on current bullet type
   */
  private updateSprite(): void {
    this.sprite.clear();
    const color = this.getBulletColor();
    const radius = this.getBulletSize() / 2;
    this.sprite.circle(0, 0, radius);
    this.sprite.fill(color);
  }

  /**
   * Enable tracking mode for this bullet (SPEC § 2.3.3 - 豬血糕)
   * @param target Enemy to track
   */
  public setTracking(target: Enemy): void {
    this.isTracking = true;
    this.trackingTarget = target;
  }
}
