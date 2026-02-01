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

  /**
   * Trigger screen shake (returns shake parameters for GameScene)
   */
  public triggerScreenShake(): { magnitude: number; duration: number } {
    return this.effects.triggerScreenShake();
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
