/**
 * Bullet Visual Effects System
 * SPEC § 2.6.3: Manages visual effects for bullets (trails, hits, explosions)
 *
 * This system wraps BulletVisualEffects and integrates it into the game loop.
 */

import type { Container } from "pixi.js";
import { BulletVisualEffects } from "../effects/bullet-visual-effects";
import type { ISystem } from "../core/systems/system.interface";
import { SystemPriority } from "../core/systems/system.interface";
import type { Bullet } from "../entities/bullet";
import type { Vector } from "../values/vector";
import type { SpecialBulletType } from "../values/special-bullet";

/**
 * Bullet Visual Effects System
 * Manages visual feedback for bullets throughout their lifecycle
 */
export class BulletVisualEffectsSystem implements ISystem {
  public readonly name = "BulletVisualEffectsSystem";
  public readonly priority = SystemPriority.DEFAULT;

  private effects: BulletVisualEffects;
  private bullets: Bullet[] = [];

  // Track which bullets we've created trails for this frame
  private bulletTrailsThisFrame = new Set<string>();

  constructor() {
    this.effects = new BulletVisualEffects();
  }

  /**
   * Get the visual effects container for scene graph
   */
  public getContainer(): Container {
    return this.effects.getContainer();
  }

  /**
   * Set bullet array reference
   */
  public setBullets(bullets: Bullet[]): void {
    this.bullets = bullets;
  }

  /**
   * Initialize system
   */
  public initialize(): void {
    // No initialization needed
  }

  /**
   * Update visual effects and create trails for active bullets
   */
  public update(deltaTime: number): void {
    this.bulletTrailsThisFrame.clear();

    // Update existing effects (fade trails, etc.)
    this.effects.update(deltaTime);

    // Update screen shake
    this.updateScreenShake(deltaTime);

    // Create trails for all active bullets
    for (const bullet of this.bullets) {
      if (!bullet.active) {
        // Clean up trails when bullet becomes inactive
        this.effects.clearBulletTrails(bullet.id);
        continue;
      }

      // Create trail particle for this bullet
      this.effects.createTrail(bullet.id, bullet.position, bullet.type);
      this.bulletTrailsThisFrame.add(bullet.id);
    }
  }

  /**
   * Update screen shake effect
   */
  private updateScreenShake(deltaTime: number): void {
    if (this.screenShakeDuration > 0) {
      this.screenShakeDuration -= deltaTime;

      // Calculate random offset within magnitude
      const offsetX = (Math.random() - 0.5) * 2 * this.screenShakeMagnitude;
      const offsetY = (Math.random() - 0.5) * 2 * this.screenShakeMagnitude;
      this.screenShakeOffset = { x: offsetX, y: offsetY };

      // Reset when duration expires
      if (this.screenShakeDuration <= 0) {
        this.screenShakeMagnitude = 0;
        this.screenShakeDuration = 0;
        this.screenShakeOffset = { x: 0, y: 0 };
      }
    }
  }

  /**
   * Create hit effect when bullet hits enemy
   * Called by CombatSystem on collision
   */
  public createHitEffect(
    position: Vector,
    bulletType: SpecialBulletType,
  ): void {
    this.effects.createHitEffect(position, bulletType);
  }

  /**
   * Create pierce effect for Stinky Tofu
   */
  public createPierceEffect(position: Vector): void {
    this.effects.createPierceEffect(position);
  }

  /**
   * Create chain lightning effect for Night Market
   */
  public createChainEffect(from: Vector, to: Vector): void {
    this.effects.createChainEffect(from, to);
  }

  /**
   * Create explosion effect for Oyster Omelette
   */
  public createExplosionEffect(position: Vector): void {
    this.effects.createExplosionEffect(position);
  }

  // Screen shake state
  private screenShakeMagnitude: number = 0;
  private screenShakeDuration: number = 0;
  private screenShakeOffset: { x: number; y: number } = { x: 0, y: 0 };

  /**
   * Trigger screen shake effect
   * SPEC § 2.6.3: Screen shake on all bullet impacts
   * @param magnitude Shake magnitude in pixels
   * @param duration Shake duration in seconds
   */
  public triggerScreenShake(magnitude: number, duration: number): void {
    // Always apply new shake if stronger or equal (resets duration)
    // This ensures each hit triggers visible feedback
    if (magnitude >= this.screenShakeMagnitude) {
      this.screenShakeMagnitude = magnitude;
      this.screenShakeDuration = duration;
    }
  }

  /**
   * Get current screen shake offset for GameScene to apply
   */
  public getScreenShakeOffset(): { x: number; y: number } {
    return this.screenShakeOffset;
  }

  /**
   * Clean up bullet trails when bullet is destroyed
   */
  public clearBulletTrails(bulletId: string): void {
    this.effects.clearBulletTrails(bulletId);
  }

  /**
   * Cleanup resources
   */
  public destroy(): void {
    this.effects.destroy();
  }
}
