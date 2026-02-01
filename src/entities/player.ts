import { Entity } from "./entity";
import { Vector } from "../values/vector";
import { Health } from "../values/health";
import { Ammo } from "../values/ammo";
import type { CollisionBox } from "../values/collision";
import { LAYOUT, getEntityBounds } from "../utils/constants";
import { PLAYER_CONFIG } from "../config";

/**
 * Player entity with keyboard controls and shooting capability
 * Spec: § 2.6.1 Player
 *
 * Pure data container - rendering handled by PlayerRenderer
 */
export class Player extends Entity {
  public position: Vector;
  public readonly speed: number = PLAYER_CONFIG.speed;

  // Value Objects
  private _health: Health = Health.player();
  private _ammo: Ammo = Ammo.default();

  public isReloading: boolean = false;
  public reloadTimer: number = 0;
  private baseReloadTime: number = PLAYER_CONFIG.reloadTime;
  private reloadTimeReduction: number = 0;

  /**
   * Health Value Object (use takeDamage for modifications)
   */
  public get health(): Health {
    return this._health;
  }

  /**
   * Ammo Value Object (use consume/reload for modifications)
   */
  public get ammo(): Ammo {
    return this._ammo;
  }

  /**
   * Get effective reload time after upgrades
   * SPEC § 2.3.4: 好餓好餓升級減少重裝時間
   */
  public get reloadTime(): number {
    return Math.max(0.5, this.baseReloadTime - this.reloadTimeReduction);
  }

  constructor(initialPosition: Vector) {
    super();
    this.position = initialPosition;
  }

  /**
   * Move the player based on input direction
   * Constrains movement within game boundaries (SPEC § 2.7.2)
   * Player position is center-based, so boundaries account for half the player size
   */
  public move(direction: Vector, deltaTime: number): void {
    if (!this.active) return;

    // Calculate displacement based on speed and delta time
    const displacement = direction.normalize().multiply(this.speed * deltaTime);
    const newPosition = this.position.add(displacement);

    // Apply boundary constraints using centralized bounds calculation
    const bounds = getEntityBounds(LAYOUT.PLAYER_SIZE);
    const clampedX = Math.max(
      bounds.minX,
      Math.min(bounds.maxX, newPosition.x),
    );
    const clampedY = Math.max(
      bounds.minY,
      Math.min(bounds.maxY, newPosition.y),
    );

    this.position = new Vector(clampedX, clampedY);
  }

  /**
   * Attempt to shoot a bullet
   * Returns true if shooting was successful
   */
  public shoot(): boolean {
    if (!this.active || this.isReloading || !this._ammo.canShoot()) {
      return false;
    }

    this._ammo = this._ammo.consume();

    // Auto-reload when ammo reaches zero (SPEC § 2.3.2)
    if (this._ammo.isEmpty()) {
      this.startReload();
    }

    return true;
  }

  /**
   * Start the reload process
   */
  public startReload(): void {
    this.isReloading = true;
    this.reloadTimer = this.reloadTime;
  }

  /**
   * Update reload timer
   */
  public update(deltaTime: number): void {
    if (!this.active) return;

    if (this.isReloading) {
      this.reloadTimer -= deltaTime;

      if (this.reloadTimer <= 0) {
        this._ammo = this._ammo.reload();
        this.isReloading = false;
        this.reloadTimer = 0;
      }
    }
  }

  /**
   * 碰撞箱（與視覺大小同步）
   * SPEC § 4.2.5: AABB 碰撞檢測
   */
  public get collisionBox(): CollisionBox {
    return { width: LAYOUT.PLAYER_SIZE, height: LAYOUT.PLAYER_SIZE };
  }

  /**
   * Take damage from enemies reaching the baseline
   */
  public takeDamage(amount: number = 1): void {
    this._health = this._health.takeDamageAmount(amount);

    if (this._health.isDead()) {
      this.active = false;
    }
  }

  /**
   * Update magazine capacity (大胃王升級)
   * SPEC § 2.3.4: 增加彈匣容量
   * @param newMax New maximum ammo capacity
   */
  public updateMagazineCapacity(newMax: number): void {
    this._ammo = this._ammo.setMax(newMax);
  }

  /**
   * Set reload time reduction (好餓好餓升級)
   * SPEC § 2.3.4: 減少重裝時間
   * @param reduction Total reduction in seconds
   */
  public setReloadTimeReduction(reduction: number): void {
    this.reloadTimeReduction = reduction;
  }

  /**
   * Reset player state for object pool reuse
   */
  public reset(position: Vector): void {
    this.active = true;
    this.position = position;
    this._health = Health.player();
    this._ammo = Ammo.default();
    this.isReloading = false;
    this.reloadTimer = 0;
    this.reloadTimeReduction = 0;
  }
}
