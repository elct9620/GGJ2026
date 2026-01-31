import { Entity } from "./entity";
import { Vector } from "../values/vector";
import { Container, Sprite } from "pixi.js";
import { getTexture, AssetKeys } from "../core/assets";

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

  // Visual representation
  public sprite: Container;
  private playerSprite: Sprite;
  private dirHintSprite: Sprite;

  // Visual size (256×256) vs collision size (24×24)
  private readonly visualSize: number = 256;

  constructor(initialPosition: Vector) {
    super();
    this.position = initialPosition;

    // Create container to hold player sprite and direction hint
    this.sprite = new Container();
    this.playerSprite = this.createPlayerSprite();
    this.dirHintSprite = this.createDirHintSprite();

    this.sprite.addChild(this.playerSprite);
    this.sprite.addChild(this.dirHintSprite);

    this.updateSpritePosition();
  }

  private createPlayerSprite(): Sprite {
    const sprite = new Sprite(getTexture(AssetKeys.player));

    // Asset size is 256×256, scale down for game balance
    const scale = 0.5; // 128×128 visual size
    sprite.width = this.visualSize * scale;
    sprite.height = this.visualSize * scale;

    // Set anchor to center for proper positioning
    sprite.anchor.set(0.5, 0.5);

    return sprite;
  }

  private createDirHintSprite(): Sprite {
    const sprite = new Sprite(getTexture(AssetKeys.playerDirHint));

    // Asset size is 100×256, scale proportionally
    const scale = 0.3;
    sprite.width = 100 * scale;
    sprite.height = 256 * scale;

    // Position to the right of player
    sprite.anchor.set(0, 0.5);
    sprite.position.set(this.playerSprite.width / 2, 0);

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
