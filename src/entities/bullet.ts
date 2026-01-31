import { Entity } from "./entity";
import { Vector } from "../values/vector";
import { Graphics } from "pixi.js";
import { LAYOUT } from "../utils/constants";

/**
 * Bullet entity fired by player
 * Spec: § 2.6.3 Bullets
 */
export class Bullet extends Entity {
  public position: Vector;
  public velocity: Vector;
  public readonly speed: number = 400; // px/s (SPEC § 2.6.3)
  public damage: number = 1; // Base damage (SPEC § 2.6.3)
  public sprite: Graphics;

  constructor(initialPosition: Vector, direction: Vector) {
    super();
    this.position = initialPosition;
    this.velocity = direction.normalize().multiply(this.speed);
    this.sprite = this.createSprite();
  }

  private createSprite(): Graphics {
    const sprite = new Graphics();

    // Draw a simple yellow circle for bullet (prototype visualization)
    sprite.circle(0, 0, 4);
    sprite.fill(0xf1c40f); // Yellow color

    return sprite;
  }

  /**
   * Update bullet position
   */
  public update(deltaTime: number): void {
    if (!this.active) return;

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
    this.damage = 1;
    this.updateSpritePosition();
  }
}
