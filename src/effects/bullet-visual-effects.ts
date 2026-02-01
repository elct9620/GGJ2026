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
import { BULLET_CONFIG } from "../config";

/**
 * Trail particle for bullet flight effects
 */
interface TrailParticle {
  position: Vector;
  alpha: number;
  lifetime: number;
  maxLifetime: number;
  initialRadius: number;
  graphics: Graphics;
}

/**
 * Temporary effect with lifetime-based cleanup
 * Used for hit effects, pierce clouds, chain lightning, explosions
 */
interface TemporaryEffect {
  graphics: Graphics;
  lifetime: number;
  maxLifetime: number;
}

/**
 * Visual Effects configuration based on SPEC § 2.6.3
 *
 * 尾跡長度規範 (SPEC § 2.6.3 通用視覺效果規則)：
 * - 普通: 32px
 * - 特殊: 48~96px
 * - 終極: 160px
 *
 * 粒子寬度與子彈大小成比例（子彈大小約為 256px 怪物的 1/16 ~ 1/2）
 */
const VISUAL_EFFECTS_CONFIG = {
  normal: {
    trailColor: 0xffffff, // White trail
    trailLength: 8, // 粒子數量（加倍）
    trailLifetime: 0.2, // seconds
    hitColor: 0xffffff, // White pop
    hitDuration: 0.15, // seconds
  },
  nightMarket: {
    trailColor: 0xffd700, // Golden electric
    trailLength: 8, // 粒子數量（加倍）
    trailLifetime: 0.3,
    hitColor: 0xffd700, // Golden lightning
    chainColor: 0xffd700,
    chainWidth: 4, // 閃電鏈寬度
    flashDuration: 0.2,
  },
  stinkyTofu: {
    trailColor: 0x27ae60, // Green gas
    trailLength: 14, // 粒子數量（加倍）
    trailLifetime: 0.4,
    pierceColor: 0x27ae60, // Green stink cloud
    pierceRadius: 48, // 貫穿臭氣雲
    pierceDuration: 0.3,
  },
  bubbleTea: {
    trailColor: 0xffffff, // White milk tea mist
    trailLength: 6, // 粒子數量（加倍）
    trailLifetime: 0.25,
  },
  bloodCake: {
    trailColor: 0x1a1a1a, // Black sticky residue
    trailLength: 14, // 粒子數量（加倍）
    trailLifetime: 0.5, // Longer lasting sticky trail
    residueAlpha: 0.6,
  },
  oysterOmelette: {
    trailColor: 0xe67e22, // Orange
    trailLength: 10, // 粒子數量（加倍）
    trailLifetime: 0.3,
    explosionColor: 0xff4444, // Red explosion
    explosionRadius: 128, // 爆炸半徑
    explosionDuration: 0.4,
    screenShakeMagnitude: 8,
    screenShakeDuration: 0.5,
  },
} as const;

/**
 * Bullet Visual Effects Manager
 * Handles all visual effects for bullets (trails, hit effects, particles)
 */
export class BulletVisualEffects {
  private container: Container;
  private trails: Map<string, TrailParticle[]> = new Map();
  private temporaryEffects: TemporaryEffect[] = [];

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
   * Get bullet size based on type (mirrors Bullet.getBulletSize)
   */
  private getBulletSize(bulletType: SpecialBulletType): number {
    const sizes = BULLET_CONFIG.sizes;
    switch (bulletType) {
      case SpecialBulletType.NightMarket:
        return sizes.nightMarket;
      case SpecialBulletType.StinkyTofu:
        return sizes.stinkyTofu;
      case SpecialBulletType.BubbleTea:
        return sizes.bubbleTea;
      case SpecialBulletType.BloodCake:
        return sizes.bloodCake;
      case SpecialBulletType.OysterOmelette:
        return sizes.oysterOmelette;
      default:
        return sizes.normal;
    }
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

    // 尾跡初始大小與子彈大小相同
    const bulletSize = this.getBulletSize(bulletType);
    const radius = bulletSize / 2;
    const particle: TrailParticle = {
      position,
      alpha: 1,
      lifetime: 0,
      maxLifetime: config.trailLifetime,
      initialRadius: radius,
      graphics: new Graphics(),
    };

    // Draw trail particle based on bullet type
    particle.graphics.circle(0, 0, radius);
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
    // 命中效果大小與子彈大小相同
    const bulletSize = this.getBulletSize(bulletType);
    const radius = bulletSize / 2;

    // Simple pop effect - expanding circle that fades
    hitEffect.circle(0, 0, radius);
    hitEffect.fill({ color, alpha: 0.8 });
    hitEffect.position.set(position.x, position.y);

    this.container.addChild(hitEffect);
    this.addTemporaryEffect(hitEffect, config.hitDuration || 0.15);
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
    this.addTemporaryEffect(pierceCloud, config.pierceDuration);
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
    this.addTemporaryEffect(lightning, config.flashDuration);
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
    this.addTemporaryEffect(explosion, config.explosionDuration);
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
   * Add a temporary effect with lifetime-based cleanup
   * Replaces setTimeout pattern for update-loop lifecycle management
   */
  private addTemporaryEffect(graphics: Graphics, duration: number): void {
    this.temporaryEffects.push({
      graphics,
      lifetime: 0,
      maxLifetime: duration,
    });
  }

  /**
   * Update all active visual effects (trails fade, particles age)
   */
  public update(deltaTime: number): void {
    // Update all trails (fade out and shrink over time)
    for (const [bulletId, trails] of this.trails.entries()) {
      for (let i = trails.length - 1; i >= 0; i--) {
        const trail = trails[i];
        trail.lifetime += deltaTime;

        // Calculate progress (0 to 1)
        const progress = trail.lifetime / trail.maxLifetime;

        // Fade alpha based on lifetime
        trail.alpha = 1 - progress;
        trail.graphics.alpha = trail.alpha;

        // Shrink scale based on lifetime (1.0 → 0.0)
        const scale = 1 - progress;
        trail.graphics.scale.set(scale, scale);

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

    // Update temporary effects (hit effects, pierce clouds, chain lightning, explosions)
    for (let i = this.temporaryEffects.length - 1; i >= 0; i--) {
      const effect = this.temporaryEffects[i];
      effect.lifetime += deltaTime;

      if (effect.lifetime >= effect.maxLifetime) {
        this.container.removeChild(effect.graphics);
        effect.graphics.destroy();
        this.temporaryEffects.splice(i, 1);
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

    // Clear all temporary effects
    for (const effect of this.temporaryEffects) {
      this.container.removeChild(effect.graphics);
      effect.graphics.destroy();
    }
    this.temporaryEffects = [];

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
}
