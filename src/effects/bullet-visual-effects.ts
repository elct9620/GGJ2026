/**
 * Bullet Visual Effects System
 * SPEC § 2.6.3 Bullets - Visual Effects
 * SPEC § 4.2.4 Animation System
 *
 * Implements lightweight visual effects for bullets using Pixi.js Graphics primitives.
 * Designed for Game Jam constraints (no @pixi/particle-emitter dependency).
 */

import { Graphics, Container } from "pixi.js";
import { Vector } from "../values/vector";
import { SpecialBulletType } from "../values/special-bullet";

/**
 * Trail particle for bullet flight effects
 */
interface TrailParticle {
  position: Vector;
  alpha: number;
  lifetime: number;
  maxLifetime: number;
  graphics: Graphics;
}

/**
 * Visual Effects configuration based on SPEC § 2.6.3
 */
const VISUAL_EFFECTS_CONFIG = {
  normal: {
    trailColor: 0xffffff, // White trail
    trailWidth: 2,
    trailLength: 5,
    trailLifetime: 0.2, // seconds
    hitColor: 0xffffff, // White pop
    hitRadius: 8,
    hitDuration: 0.15, // seconds
  },
  nightMarket: {
    trailColor: 0xffd700, // Golden electric
    trailWidth: 3,
    trailLength: 8,
    trailLifetime: 0.3,
    hitColor: 0xffd700, // Golden lightning
    chainColor: 0xffd700,
    chainWidth: 2,
    flashDuration: 0.2,
  },
  stinkyTofu: {
    trailColor: 0x27ae60, // Green gas
    trailWidth: 4,
    trailLength: 12,
    trailLifetime: 0.4,
    pierceColor: 0x27ae60, // Green stink cloud
    pierceRadius: 20,
    pierceDuration: 0.3,
  },
  bubbleTea: {
    bulletScale: 1.5, // Larger bullets (SPEC: 巨大)
    trailColor: 0x8b4513, // Brown
    trailWidth: 3,
    trailLength: 6,
    trailLifetime: 0.25,
  },
  bloodCake: {
    trailColor: 0x1a1a1a, // Black sticky residue
    trailWidth: 4,
    trailLength: 10,
    trailLifetime: 0.5, // Longer lasting sticky trail
    residueAlpha: 0.6,
  },
  oysterOmelette: {
    bulletScale: 3.5, // 3-4x larger (SPEC: 體積比普通子彈大 3-4 倍)
    trailColor: 0xe67e22, // Orange
    trailWidth: 6,
    trailLength: 15,
    trailLifetime: 0.3,
    explosionColor: 0xff4444, // Red explosion
    explosionRadius: 40,
    explosionDuration: 0.4,
    screenShakeMagnitude: 8,
    screenShakeDuration: 0.3,
  },
} as const;

/**
 * Bullet Visual Effects Manager
 * Handles all visual effects for bullets (trails, hit effects, particles)
 */
export class BulletVisualEffects {
  private container: Container;
  private trails: Map<string, TrailParticle[]> = new Map();
  private hitEffects: Graphics[] = [];
  private chainEffects: Graphics[] = [];

  constructor() {
    this.container = new Container();
    this.container.label = "BulletVisualEffects";
  }

  /**
   * Get the visual effects container
   */
  public getContainer(): Container {
    return this.container;
  }

  /**
   * Create trail effect for bullet flight
   * SPEC § 2.6.3: Different trails for each bullet type
   */
  public createTrail(
    bulletId: string,
    position: Vector,
    bulletType: SpecialBulletType,
  ): void {
    const config = this.getConfigForType(bulletType);
    if (!config) return;

    const particle: TrailParticle = {
      position,
      alpha: 1,
      lifetime: 0,
      maxLifetime: config.trailLifetime,
      graphics: new Graphics(),
    };

    // Draw trail particle based on bullet type
    particle.graphics.circle(0, 0, config.trailWidth / 2);
    particle.graphics.fill({ color: config.trailColor, alpha: 0.8 });
    particle.graphics.position.set(position.x, position.y);

    this.container.addChild(particle.graphics);

    // Store trail particle
    if (!this.trails.has(bulletId)) {
      this.trails.set(bulletId, []);
    }
    const bulletTrails = this.trails.get(bulletId)!;
    bulletTrails.push(particle);

    // Limit trail length
    if (bulletTrails.length > config.trailLength) {
      const removed = bulletTrails.shift()!;
      this.container.removeChild(removed.graphics);
      removed.graphics.destroy();
    }
  }

  /**
   * Create hit effect when bullet hits enemy
   * SPEC § 2.6.3: White pop for normal, special effects for others
   */
  public createHitEffect(
    position: Vector,
    bulletType: SpecialBulletType,
  ): void {
    const config = this.getConfigForType(bulletType);
    if (!config) return;

    const hitEffect = new Graphics();
    const color = config.hitColor || 0xffffff;
    const radius = config.hitRadius || 8;

    // Simple pop effect - expanding circle that fades
    hitEffect.circle(0, 0, radius);
    hitEffect.fill({ color, alpha: 0.8 });
    hitEffect.position.set(position.x, position.y);

    this.container.addChild(hitEffect);
    this.hitEffects.push(hitEffect);

    // Auto-remove after duration
    setTimeout(
      () => {
        this.container.removeChild(hitEffect);
        hitEffect.destroy();
        const index = this.hitEffects.indexOf(hitEffect);
        if (index > -1) {
          this.hitEffects.splice(index, 1);
        }
      },
      (config.hitDuration || 0.15) * 1000,
    );
  }

  /**
   * Create pierce effect for Stinky Tofu
   * SPEC § 2.6.3.3: Green stink cloud when piercing
   */
  public createPierceEffect(position: Vector): void {
    const config = VISUAL_EFFECTS_CONFIG.stinkyTofu;
    const pierceCloud = new Graphics();

    // Draw wavy green gas cloud
    pierceCloud.circle(0, 0, config.pierceRadius);
    pierceCloud.fill({ color: config.pierceColor, alpha: 0.6 });
    pierceCloud.position.set(position.x, position.y);

    this.container.addChild(pierceCloud);

    // Fade out and remove
    setTimeout(() => {
      this.container.removeChild(pierceCloud);
      pierceCloud.destroy();
    }, config.pierceDuration * 1000);
  }

  /**
   * Create chain lightning effect for Night Market
   * SPEC § 2.6.3.2: Golden lightning chain jumping between enemies
   */
  public createChainEffect(from: Vector, to: Vector): void {
    const config = VISUAL_EFFECTS_CONFIG.nightMarket;
    const lightning = new Graphics();

    // Draw lightning bolt line
    lightning.moveTo(from.x, from.y);
    lightning.lineTo(to.x, to.y);
    lightning.stroke({ color: config.chainColor, width: config.chainWidth });

    this.container.addChild(lightning);
    this.chainEffects.push(lightning);

    // Flash and remove
    setTimeout(() => {
      this.container.removeChild(lightning);
      lightning.destroy();
      const index = this.chainEffects.indexOf(lightning);
      if (index > -1) {
        this.chainEffects.splice(index, 1);
      }
    }, config.flashDuration * 1000);
  }

  /**
   * Create explosion effect for Oyster Omelette
   * SPEC § 2.6.3.6: Red explosion on impact
   */
  public createExplosionEffect(position: Vector): void {
    const config = VISUAL_EFFECTS_CONFIG.oysterOmelette;
    const explosion = new Graphics();

    // Draw expanding circle explosion
    explosion.circle(0, 0, config.explosionRadius);
    explosion.fill({ color: config.explosionColor, alpha: 0.7 });
    explosion.position.set(position.x, position.y);

    this.container.addChild(explosion);

    // Fade out and remove
    setTimeout(() => {
      this.container.removeChild(explosion);
      explosion.destroy();
    }, config.explosionDuration * 1000);
  }

  /**
   * Trigger screen shake effect for Oyster Omelette
   * SPEC § 2.6.3.6: Screen shake on impact
   * Returns shake data for the game scene to apply
   */
  public triggerScreenShake(): {
    magnitude: number;
    duration: number;
  } {
    const config = VISUAL_EFFECTS_CONFIG.oysterOmelette;
    return {
      magnitude: config.screenShakeMagnitude,
      duration: config.screenShakeDuration,
    };
  }

  /**
   * Update all active visual effects (trails fade, particles age)
   */
  public update(deltaTime: number): void {
    // Update all trails (fade out over time)
    for (const [bulletId, trails] of this.trails.entries()) {
      for (let i = trails.length - 1; i >= 0; i--) {
        const trail = trails[i];
        trail.lifetime += deltaTime;

        // Fade alpha based on lifetime
        trail.alpha = 1 - trail.lifetime / trail.maxLifetime;
        trail.graphics.alpha = trail.alpha;

        // Remove expired trails
        if (trail.lifetime >= trail.maxLifetime) {
          this.container.removeChild(trail.graphics);
          trail.graphics.destroy();
          trails.splice(i, 1);
        }
      }

      // Clean up empty trail arrays
      if (trails.length === 0) {
        this.trails.delete(bulletId);
      }
    }
  }

  /**
   * Clean up trails for a specific bullet (when bullet is destroyed)
   */
  public clearBulletTrails(bulletId: string): void {
    const trails = this.trails.get(bulletId);
    if (!trails) return;

    for (const trail of trails) {
      this.container.removeChild(trail.graphics);
      trail.graphics.destroy();
    }

    this.trails.delete(bulletId);
  }

  /**
   * Clean up all visual effects
   */
  public destroy(): void {
    // Clear all trails
    for (const [bulletId] of this.trails.entries()) {
      this.clearBulletTrails(bulletId);
    }

    // Clear hit effects
    for (const hitEffect of this.hitEffects) {
      this.container.removeChild(hitEffect);
      hitEffect.destroy();
    }
    this.hitEffects = [];

    // Clear chain effects
    for (const chainEffect of this.chainEffects) {
      this.container.removeChild(chainEffect);
      chainEffect.destroy();
    }
    this.chainEffects = [];

    this.container.destroy();
  }

  /**
   * Get configuration for bullet type
   */
  private getConfigForType(bulletType: SpecialBulletType): any {
    switch (bulletType) {
      case SpecialBulletType.NightMarket:
        return VISUAL_EFFECTS_CONFIG.nightMarket;
      case SpecialBulletType.StinkyTofu:
        return VISUAL_EFFECTS_CONFIG.stinkyTofu;
      case SpecialBulletType.BubbleTea:
        return VISUAL_EFFECTS_CONFIG.bubbleTea;
      case SpecialBulletType.BloodCake:
        return VISUAL_EFFECTS_CONFIG.bloodCake;
      case SpecialBulletType.OysterOmelette:
        return VISUAL_EFFECTS_CONFIG.oysterOmelette;
      default:
        return VISUAL_EFFECTS_CONFIG.normal;
    }
  }

  /**
   * Get bullet scale for visual size
   * SPEC § 2.6.3: Some bullets appear larger (Bubble Tea, Oyster Omelette)
   */
  public static getBulletScale(bulletType: SpecialBulletType): number {
    switch (bulletType) {
      case SpecialBulletType.BubbleTea:
        return VISUAL_EFFECTS_CONFIG.bubbleTea.bulletScale;
      case SpecialBulletType.OysterOmelette:
        return VISUAL_EFFECTS_CONFIG.oysterOmelette.bulletScale;
      default:
        return 1.0;
    }
  }
}
