import { Entity } from "./entity";
import { Vector } from "../values/vector";
import { Damage } from "../values/damage";
import type { CollisionBox } from "../values/collision";
import { Graphics } from "pixi.js";
import { LAYOUT } from "../utils/constants";
import { BULLET_CONFIG } from "../config";
import type { Enemy } from "./enemy";

/**
 * Bullet entity fired by player
 * Spec: § 2.6.3 Bullets
 */
export class Bullet extends Entity {
  public position: Vector;
  public velocity: Vector;
  public readonly speed: number = BULLET_CONFIG.speed;
  public sprite: Graphics;

  // Value Object
  private _damage: Damage = Damage.normal();

  // Tracking bullet properties (SPEC § 2.3.3 - 豬血糕)
  public isTracking: boolean = false;
  public trackingTarget: Enemy | null = null;

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

  // 子彈視覺半徑（碰撞箱為 8×8，半徑為 4）
  private readonly radius = BULLET_CONFIG.collisionSize / 2;

  constructor(initialPosition: Vector, direction: Vector) {
    super();
    this.position = initialPosition;
    this.velocity = direction.normalize().multiply(this.speed);
    this.sprite = this.createSprite();
  }

  private createSprite(): Graphics {
    const sprite = new Graphics();

    // Draw a simple yellow circle for bullet (prototype visualization)
    sprite.circle(0, 0, this.radius);
    sprite.fill(0xf1c40f); // Yellow color

    return sprite;
  }

  /**
   * 碰撞箱（與視覺大小同步，8×8 px）
   * SPEC § 4.2.5: AABB 碰撞檢測
   */
  public get collisionBox(): CollisionBox {
    return { width: this.radius * 2, height: this.radius * 2 };
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
   * Update sprite position to match entity position
   */
  private updateSpritePosition(): void {
    this.sprite.position.set(this.position.x, this.position.y);
  }

  /**
   * Reset bullet state for object pool reuse
   */
  public reset(position: Vector, direction: Vector): void {
    this.active = true;
    this.position = position;
    this.velocity = direction.normalize().multiply(this.speed);
    this._damage = Damage.normal();
    this.isTracking = false;
    this.trackingTarget = null;
    this.updateSpritePosition();
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
