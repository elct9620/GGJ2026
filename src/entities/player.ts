import { Entity } from "./entity";
import { Vector } from "../values/vector";
import { Graphics } from "pixi.js";

/**
 * Player entity with keyboard controls and shooting capability
 * Spec: § 2.6.1 Player
 */
export class Player extends Entity {
  public position: Vector;
  public readonly speed: number = 200; // px/s (SPEC § 2.6.1)
  public readonly collisionSize: number = 24; // 24×24 px (SPEC § 2.6.1)
  public health: number = 5; // 5 lives (SPEC § 2.6.1)
  public ammo: number = 6; // Magazine capacity (SPEC § 2.6.1)
  public readonly maxAmmo: number = 6;
  public isReloading: boolean = false;
  public reloadTimer: number = 0;
  public readonly reloadTime: number = 3; // 3 seconds (SPEC § 2.3.2)

  // Visual representation (simple rectangle for prototype)
  public sprite: Graphics;

  constructor(initialPosition: Vector) {
    super();
    this.position = initialPosition;
    this.sprite = this.createSprite();
  }

  private createSprite(): Graphics {
    const sprite = new Graphics();

    // Draw a simple blue square for the player (prototype visualization)
    sprite.rect(
      -this.collisionSize / 2,
      -this.collisionSize / 2,
      this.collisionSize,
      this.collisionSize,
    );
    sprite.fill(0x4a90e2); // Blue color

    // Add a direction indicator (small white rectangle pointing right)
    sprite.rect(this.collisionSize / 2 - 2, -2, 8, 4);
    sprite.fill(0xffffff);

    return sprite;
  }

  /**
   * Move the player based on input direction
   * Constrains movement within game boundaries (SPEC § 2.7.2)
   */
  public move(direction: Vector, deltaTime: number): void {
    if (!this.active) return;

    // Calculate displacement based on speed and delta time
    const displacement = direction.normalize().multiply(this.speed * deltaTime);
    const newPosition = this.position.add(displacement);

    // Apply boundary constraints (SPEC § 2.7.2)
    // Left boundary: x = 384 (booth area right side)
    // Right boundary: x = 1920
    // Top boundary: y = 0
    // Bottom boundary: y = 1080
    const clampedX = Math.max(384, Math.min(1920, newPosition.x));
    const clampedY = Math.max(0, Math.min(1080, newPosition.y));

    this.position = new Vector(clampedX, clampedY);
    this.updateSpritePosition();
  }

  /**
   * Attempt to shoot a bullet
   * Returns true if shooting was successful
   */
  public shoot(): boolean {
    if (!this.active || this.isReloading || this.ammo <= 0) {
      return false;
    }

    this.ammo--;

    // Auto-reload when ammo reaches zero (SPEC § 2.3.2)
    if (this.ammo === 0) {
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
        this.ammo = this.maxAmmo;
        this.isReloading = false;
        this.reloadTimer = 0;
      }
    }

    this.updateSpritePosition();
  }

  /**
   * Take damage from enemies reaching the baseline
   */
  public takeDamage(amount: number = 1): void {
    this.health = Math.max(0, this.health - amount);

    if (this.health <= 0) {
      this.active = false;
    }
  }

  /**
   * Update sprite position to match entity position
   */
  private updateSpritePosition(): void {
    this.sprite.position.set(this.position.x, this.position.y);
  }

  /**
   * Reset player state for object pool reuse
   */
  public reset(position: Vector): void {
    this.active = true;
    this.position = position;
    this.health = 5;
    this.ammo = 6;
    this.isReloading = false;
    this.reloadTimer = 0;
    this.updateSpritePosition();
  }
}
