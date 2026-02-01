/**
 * Bullet Visual Effects System
 * SPEC § 2.6.3 Bullets - Visual Effects
 * SPEC § 4.2.4 Animation System
 *
 * Implements exaggerated visual effects for bullets:
 * - Muzzle flash, trails, hit effects, explosions
 * - Bloom/glow effects, screen shake, hit flash
 * - Ground residue, shockwaves, fullscreen flashes
 * - Particle systems (50~500 particles)
 *
 * Design philosophy: "Extremely flashy", "Highly recognizable", "Destructive impact"
 * Reference: Vampire Survivors, Brotato visual style
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
 * Particle for effects (explosions, splashes, sparks)
 */
interface Particle {
  position: Vector;
  velocity: Vector;
  alpha: number;
  lifetime: number;
  maxLifetime: number;
  size: number;
  color: number;
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
  alpha?: number; // For fade-out animations
  scale?: number; // For expansion animations
  initialAlpha?: number;
  initialScale?: number;
}

/**
 * Visual Effects configuration based on SPEC § 2.6.3
 * All values match specification exactly for "extremely flashy" effects
 */
const VISUAL_EFFECTS_CONFIG = {
  normal: {
    // SPEC § 2.6.3.1: Normal Bullet
    trailColor: 0xffffff,
    trailWidth: 2,
    trailLength: 3, // 3 wind trails
    trailLifetime: 0.2, // 200ms
    hitColor: 0xffffff,
    hitRadius: 16, // SPEC: 半徑 16px
    hitParticles: 20, // SPEC: 20 粒子噴濺
    hitDuration: 0.15,
    muzzleFlashRadius: 24, // SPEC: 半徑 24px
    muzzleFlashDuration: 0.05, // SPEC: 50ms
    visualScale: 2.0, // SPEC: 視覺尺寸 16×16 px (判定 8×8 px)
  },
  nightMarket: {
    // SPEC § 2.6.3.2: Night Market Combo (連鎖閃電)
    trailColor: 0xffd700, // Golden electric
    trailWidth: 3,
    trailLength: 8,
    trailLifetime: 0.3,
    trailParticlesPerSecond: 100, // SPEC: 電流粒子 100 個/秒
    hitColor: 0xffd700,
    chainColor: 0xffd700,
    chainWidth: 4, // SPEC: 每條閃電寬度 4px
    chainDuration: 0.3, // SPEC: 持續 300ms
    chainParticles: 200, // SPEC: 閃電鏈粒子 200 個
    flashDuration: 0.15, // SPEC: 敵人閃金黃色 150ms
    bloomRadius: 48, // SPEC: 光暈半徑 48px
    bloomIntensity: 2.0, // SPEC: Bloom 強度 200%
    muzzleFlashRadius: 48, // SPEC: 半徑 48px
    muzzleFlashDuration: 0.1, // SPEC: 100ms
    muzzleFlashParticles: 50, // SPEC: 電流粒子 50 個
    explosionRadius: 64, // SPEC: 最終爆炸半徑 64px
    explosionParticles: 150, // SPEC: 爆炸粒子 150 個
    groundResidueDuration: 1.0, // SPEC: 1 秒後消散
    groundResidueSize: 32, // SPEC: 32×32 px
    screenShakeMagnitude: 2, // SPEC: 振幅 2px
    screenShakeDuration: 0.1, // SPEC: 100ms
    visualScale: 2.0, // SPEC: 視覺尺寸 32×32 px (判定 16×16 px)
  },
  stinkyTofu: {
    // SPEC § 2.6.3.3: Stinky Tofu (貫穿毒霧)
    trailColor: 0x00ff00, // Green gas (SPEC: #00FF00)
    trailWidth: 4,
    trailLength: 12,
    trailLifetime: 0.4,
    trailParticlesPerSecond: 150, // SPEC: 氣體粒子 150 個/秒
    pierceColor: 0x00ff00,
    pierceRadius: 80, // SPEC: 半徑 80px
    pierceDuration: 0.5, // SPEC: 持續 500ms
    pierceParticles: 200, // SPEC: 臭氣雲粒子 200 個
    bloomRadius: 36, // SPEC: 光暈半徑 36px
    bloomIntensity: 1.8, // SPEC: Bloom 強度 180%
    muzzleFlashRadius: 40, // SPEC: 半徑 40px
    muzzleFlashDuration: 0.15, // SPEC: 150ms
    muzzleFlashParticles: 80, // SPEC: 粒子 80 個
    groundResidueDuration: 1.5, // SPEC: 1.5 秒後消散
    groundResidueSize: 48, // SPEC: 48×48 px
    screenShakeMagnitude: 3, // SPEC: 振幅 3px
    screenShakeDuration: 0.15, // SPEC: 150ms
    visualScale: 2.0, // SPEC: 視覺尺寸 24×24 px (判定 12×12 px)
  },
  bubbleTea: {
    // SPEC § 2.6.3.4: Bubble Tea (三向散射)
    bulletScale: 3.2, // SPEC: 視覺尺寸 32×32 px (判定 10×10 px) = 3.2x
    trailColor: 0xffffff, // White milk tea fog
    trailWidth: 3,
    trailLength: 6,
    trailLifetime: 0.25,
    trailParticlesPerSecond: 60, // SPEC: 尾跡粒子 60 個/秒
    hitColor: 0xffffff,
    hitRadius: 64, // SPEC: 液體噴濺半徑 64px
    hitParticles: 120, // SPEC: 粒子 120 個
    hitDuration: 0.4, // SPEC: 生命週期 400ms
    bloomRadius: 40, // SPEC: 光暈半徑 40px
    bloomIntensity: 1.5, // SPEC: Bloom 強度 150%
    muzzleFlashRadius: 32, // Pearl rain spread
    muzzleFlashDuration: 0.1,
    groundResidueDuration: 0.8, // SPEC: 0.8 秒後消散
    groundResidueSize: 40, // SPEC: 40×40 px
    screenShakeMagnitude: 1, // SPEC: 每顆 1px (三顆同時 3px)
    screenShakeDuration: 0.08, // SPEC: 80ms
    visualScale: 3.2, // SPEC: 巨大圓潤黑珍珠
  },
  bloodCake: {
    // SPEC § 2.6.3.5: Blood Cake (追蹤黏液)
    trailColor: 0x8b0000, // Dark red (SPEC: #8B0000)
    trailWidth: 4,
    trailLength: 10,
    trailLifetime: 0.5, // SPEC: 生命週期 500ms
    trailParticlesPerSecond: 180, // SPEC: 黏稠尾跡粒子 180 個/秒
    hitColor: 0x1a1a1a, // Black sticky liquid
    hitRadius: 72, // SPEC: 黏液噴濺半徑 72px
    hitParticles: 180, // SPEC: 粒子 180 個
    hitDuration: 0.6, // SPEC: 生命週期 600ms
    bloomRadius: 42, // SPEC: 光暈半徑 42px
    bloomIntensity: 1.6, // SPEC: Bloom 強度 160%
    muzzleFlashRadius: 36, // SPEC: 黏液半徑 36px
    muzzleFlashDuration: 0.12, // SPEC: 120ms
    muzzleFlashParticles: 60, // SPEC: 粒子 60 個
    slowVisualDuration: 2.0, // SPEC: 緩速視覺持續 2 秒
    slowVisualParticles: 40, // SPEC: 敵人身上黏液粒子 40 個
    groundResidueDuration: 2.0, // SPEC: 2 秒後消散
    groundResidueSize: 56, // SPEC: 56×56 px
    screenShakeMagnitude: 2, // SPEC: 振幅 2px
    screenShakeDuration: 0.1, // SPEC: 100ms
    residueAlpha: 0.8,
    visualScale: 2.0, // SPEC: 視覺尺寸 28×28 px (判定 14×14 px)
  },
  oysterOmelette: {
    // SPEC § 2.6.3.6: Oyster Omelette (終極爆炸)
    bulletScale: 4.0, // SPEC: 視覺尺寸 128×128 px (判定 32×32 px) = 4x
    trailColor: 0xff0000, // Red sauce flame (SPEC: #FF0000)
    trailWidth: 6,
    trailLength: 15,
    trailLifetime: 0.3,
    trailParticlesPerSecond: 300, // SPEC: 紅色火焰尾跡粒子 300 個/秒
    explosionColor: 0xff0000, // Red explosion
    explosionRadius: 256, // SPEC: 爆炸半徑 256px
    explosionParticles: 500, // SPEC: 粒子 500 個
    explosionDuration: 1.0, // SPEC: 生命週期 1s
    shockwaveRadius: 512, // SPEC: 衝擊波半徑 512px
    shockwaveDuration: 0.8, // SPEC: 持續 800ms
    bloomRadius: 128, // SPEC: 光暈半徑 128px
    bloomIntensity: 3.0, // SPEC: Bloom 強度 300%
    muzzleFlashRadius: 96, // SPEC: 火焰半徑 96px
    muzzleFlashDuration: 0.2, // SPEC: 200ms
    muzzleFlashParticles: 300, // SPEC: 粒子 300 個
    fullscreenFlashCount: 3, // SPEC: 閃紅光 3 次
    fullscreenFlashInterval: 0.1, // SPEC: 間隔 100ms
    fullscreenFlashAlpha: 0.6, // SPEC: 透明度 60%→0%
    freezeFrameDuration: 0.1, // SPEC: 時間凍結 100ms
    groundResidueDuration: 3.0, // SPEC: 3 秒後消散
    groundResidueSize: 128, // SPEC: 128×128 px
    screenShakeMagnitude: 8, // SPEC: 振幅 8px
    screenShakeDuration: 0.5, // SPEC: 500ms
    visualScale: 4.0, // SPEC: 巨大投擲物
  },
} as const;

/**
 * Bullet Visual Effects Manager
 * Handles all visual effects for bullets (trails, hit effects, particles, bloom, shake, etc.)
 */
export class BulletVisualEffects {
  private container: Container;
  private trails: Map<string, TrailParticle[]> = new Map();
  private particles: Particle[] = [];
  private temporaryEffects: TemporaryEffect[] = [];

  // Screen shake state
  private screenShakeActive = false;
  private screenShakeMagnitude = 0;
  private screenShakeDuration = 0;
  private screenShakeElapsed = 0;

  // Fullscreen flash state (for Oyster Omelette)
  private fullscreenFlashes: Array<{
    alpha: number;
    lifetime: number;
    maxLifetime: number;
    color: number;
  }> = [];

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
   * Create muzzle flash when bullet is fired
   * SPEC § 2.6.3: All bullets have muzzle flash (VE-01, VE-06, VE-17, VE-25, VE-34, VE-44)
   */
  public createMuzzleFlash(
    position: Vector,
    bulletType: SpecialBulletType,
  ): void {
    const config = this.getConfigForType(bulletType);
    if (!config) return;

    const flash = new Graphics();
    const radius = config.muzzleFlashRadius || 24;
    const color = config.trailColor;
    const particleCount = config.muzzleFlashParticles || 0;

    // Main flash circle
    flash.circle(0, 0, radius);
    flash.fill({ color, alpha: 0.8 });
    flash.position.set(position.x, position.y);

    this.container.addChild(flash);
    this.addTemporaryEffect(flash, config.muzzleFlashDuration || 0.05, {
      fadeOut: true,
      initialAlpha: 0.8,
    });

    // Add particles for special bullets
    if (particleCount > 0) {
      this.createParticleBurst(position, color, particleCount, 100, 0.2);
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

    const particle: TrailParticle = {
      position,
      alpha: 1,
      lifetime: 0,
      maxLifetime: config.trailLifetime,
      graphics: new Graphics(),
    };

    // Draw trail particle based on bullet type with bloom effect
    const radius = config.trailWidth / 2;
    particle.graphics.circle(0, 0, radius);
    particle.graphics.fill({ color: config.trailColor, alpha: 0.8 });

    // Add bloom glow for special bullets
    if (config.bloomRadius && config.bloomIntensity) {
      const glowRadius = config.bloomRadius / 4; // Scaled down for trail
      particle.graphics.circle(0, 0, glowRadius);
      particle.graphics.fill({
        color: config.trailColor,
        alpha: 0.3 * config.bloomIntensity,
      });
    }

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
   * SPEC § 2.6.3: White pop for normal, massive particle bursts for special bullets
   */
  public createHitEffect(
    position: Vector,
    bulletType: SpecialBulletType,
  ): void {
    const config = this.getConfigForType(bulletType);
    if (!config) return;

    const color = config.hitColor || 0xffffff;
    const radius = config.hitRadius || 16;
    const particleCount = config.hitParticles || 20;

    // Main hit circle with bloom
    const hitEffect = new Graphics();
    hitEffect.circle(0, 0, radius);
    hitEffect.fill({ color, alpha: 0.8 });

    // Add bloom glow for special bullets
    if (config.bloomRadius && config.bloomIntensity) {
      hitEffect.circle(0, 0, config.bloomRadius);
      hitEffect.fill({
        color,
        alpha: 0.4 * config.bloomIntensity,
      });
    }

    hitEffect.position.set(position.x, position.y);
    this.container.addChild(hitEffect);
    this.addTemporaryEffect(hitEffect, config.hitDuration || 0.15, {
      fadeOut: true,
      expand: true,
      initialAlpha: 0.8,
      initialScale: 1.0,
    });

    // Particle burst
    this.createParticleBurst(
      position,
      color,
      particleCount,
      config.hitParticles === 120 ? 180 : 150, // Bubble tea has slower splash
      config.hitDuration || 0.4,
    );

    // Trigger screen shake for special bullets
    if (config.screenShakeMagnitude && config.screenShakeDuration) {
      this.activateScreenShake(
        config.screenShakeMagnitude,
        config.screenShakeDuration,
      );
    }

    // Create ground residue for special bullets
    if (config.groundResidueDuration && config.groundResidueSize) {
      this.createGroundResidue(
        position,
        color,
        config.groundResidueSize,
        config.groundResidueDuration,
      );
    }
  }

  /**
   * Create pierce effect for Stinky Tofu
   * SPEC § 2.6.3.3: Green stink cloud when piercing (VE-21)
   */
  public createPierceEffect(position: Vector): void {
    const config = VISUAL_EFFECTS_CONFIG.stinkyTofu;
    const pierceCloud = new Graphics();

    // Main pierce cloud with bloom
    pierceCloud.circle(0, 0, config.pierceRadius);
    pierceCloud.fill({ color: config.pierceColor, alpha: 0.6 });

    // Add bloom glow
    pierceCloud.circle(0, 0, config.bloomRadius);
    pierceCloud.fill({
      color: config.pierceColor,
      alpha: 0.3 * config.bloomIntensity,
    });

    pierceCloud.position.set(position.x, position.y);
    this.container.addChild(pierceCloud);
    this.addTemporaryEffect(pierceCloud, config.pierceDuration, {
      fadeOut: true,
      expand: true,
      initialAlpha: 0.6,
      initialScale: 0.8,
    });

    // Particle burst (SPEC: 200 個粒子)
    this.createParticleBurst(
      position,
      config.pierceColor,
      config.pierceParticles,
      150,
      config.pierceDuration,
    );

    // Screen shake
    this.activateScreenShake(
      config.screenShakeMagnitude,
      config.screenShakeDuration,
    );

    // Ground residue
    this.createGroundResidue(
      position,
      config.pierceColor,
      config.groundResidueSize,
      config.groundResidueDuration,
    );
  }

  /**
   * Create chain lightning effect for Night Market
   * SPEC § 2.6.3.2: Golden lightning chain with zigzag animation (VE-11)
   */
  public createChainEffect(from: Vector, to: Vector): void {
    const config = VISUAL_EFFECTS_CONFIG.nightMarket;
    const lightning = new Graphics();

    // Create zigzag lightning path (multiple segments for distortion effect)
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const segments = 8;
    const segmentLength = Math.sqrt(dx * dx + dy * dy) / segments;

    lightning.moveTo(from.x, from.y);

    for (let i = 1; i <= segments; i++) {
      const t = i / segments;
      const x = from.x + dx * t + (Math.random() - 0.5) * segmentLength * 0.5;
      const y = from.y + dy * t + (Math.random() - 0.5) * segmentLength * 0.5;
      lightning.lineTo(x, y);
    }

    lightning.stroke({ color: config.chainColor, width: config.chainWidth });

    // Add glow effect
    lightning.moveTo(from.x, from.y);
    lightning.lineTo(to.x, to.y);
    lightning.stroke({
      color: config.chainColor,
      width: config.chainWidth * 3,
      alpha: 0.3,
    });

    this.container.addChild(lightning);
    this.addTemporaryEffect(lightning, config.chainDuration, {
      fadeOut: true,
      initialAlpha: 1.0,
    });

    // Particle trail along lightning (SPEC: 200 個粒子)
    const particleCount = config.chainParticles / 4; // Distribute along path
    for (let i = 0; i < particleCount; i++) {
      const t = i / particleCount;
      const pos = new Vector(from.x + dx * t, from.y + dy * t);
      this.createSingleParticle(
        pos,
        new Vector((Math.random() - 0.5) * 100, (Math.random() - 0.5) * 100),
        config.chainColor,
        4,
        config.chainDuration,
      );
    }
  }

  /**
   * Create explosion effect for Oyster Omelette
   * SPEC § 2.6.3.6: Massive red explosion with shockwave (VE-49, VE-52)
   */
  public createExplosionEffect(position: Vector): void {
    const config = VISUAL_EFFECTS_CONFIG.oysterOmelette;

    // Main explosion circle with mega bloom
    const explosion = new Graphics();
    explosion.circle(0, 0, config.explosionRadius);
    explosion.fill({ color: config.explosionColor, alpha: 0.8 });

    // Mega bloom glow (SPEC: 強度 300%)
    explosion.circle(0, 0, config.bloomRadius);
    explosion.fill({
      color: config.explosionColor,
      alpha: 0.5 * config.bloomIntensity,
    });

    explosion.position.set(position.x, position.y);
    this.container.addChild(explosion);
    this.addTemporaryEffect(explosion, config.explosionDuration, {
      fadeOut: true,
      expand: true,
      initialAlpha: 0.8,
      initialScale: 0.5,
    });

    // Shockwave ring (SPEC: 半徑 512px, VE-52)
    this.createShockwave(
      position,
      config.explosionColor,
      config.shockwaveRadius,
      config.shockwaveDuration,
    );

    // Massive particle explosion (SPEC: 500 個粒子, VE-49)
    this.createParticleBurst(
      position,
      config.explosionColor,
      config.explosionParticles,
      300, // High speed
      config.explosionDuration,
    );

    // Ultra screen shake (SPEC: 振幅 8px, VE-50)
    this.activateScreenShake(
      config.screenShakeMagnitude,
      config.screenShakeDuration,
    );

    // Fullscreen flash x3 (SPEC: VE-53)
    this.triggerFullscreenFlashes(
      config.explosionColor,
      config.fullscreenFlashCount,
      config.fullscreenFlashInterval,
      config.fullscreenFlashAlpha,
    );

    // Ground residue (SPEC: 128×128 px, VE-55)
    this.createGroundResidue(
      position,
      config.explosionColor,
      config.groundResidueSize,
      config.groundResidueDuration,
    );
  }

  /**
   * Create particle burst effect
   * SPEC § 2.6.3: 20~500 particles depending on bullet type
   */
  private createParticleBurst(
    position: Vector,
    color: number,
    count: number,
    speed: number,
    lifetime: number,
  ): void {
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + Math.random() * 0.2;
      const velocity = new Vector(
        Math.cos(angle) * speed * (0.5 + Math.random() * 0.5),
        Math.sin(angle) * speed * (0.5 + Math.random() * 0.5),
      );

      this.createSingleParticle(
        position,
        velocity,
        color,
        2 + Math.random() * 4,
        lifetime * (0.5 + Math.random() * 0.5),
      );
    }
  }

  /**
   * Create single particle
   */
  private createSingleParticle(
    position: Vector,
    velocity: Vector,
    color: number,
    size: number,
    lifetime: number,
  ): void {
    const graphics = new Graphics();
    graphics.circle(0, 0, size);
    graphics.fill({ color, alpha: 0.8 });
    graphics.position.set(position.x, position.y);

    this.container.addChild(graphics);

    this.particles.push({
      position: new Vector(position.x, position.y),
      velocity,
      alpha: 0.8,
      lifetime: 0,
      maxLifetime: lifetime,
      size,
      color,
      graphics,
    });
  }

  /**
   * Create ground residue effect
   * SPEC § 2.6.3: Ground marks that fade out after hits
   */
  private createGroundResidue(
    position: Vector,
    color: number,
    size: number,
    duration: number,
  ): void {
    const residue = new Graphics();
    residue.circle(0, 0, size / 2);
    residue.fill({ color, alpha: 0.5 });
    residue.position.set(position.x, position.y);

    this.container.addChild(residue);
    this.addTemporaryEffect(residue, duration, {
      fadeOut: true,
      initialAlpha: 0.5,
    });
  }

  /**
   * Create shockwave ring effect
   * SPEC § 2.6.3.6: Oyster Omelette shockwave (VE-52)
   */
  private createShockwave(
    position: Vector,
    color: number,
    maxRadius: number,
    duration: number,
  ): void {
    const shockwave = new Graphics();
    shockwave.circle(0, 0, 10); // Start small
    shockwave.stroke({ color, width: 4, alpha: 1.0 });
    shockwave.position.set(position.x, position.y);

    this.container.addChild(shockwave);
    this.addTemporaryEffect(shockwave, duration, {
      fadeOut: true,
      expand: true,
      initialAlpha: 1.0,
      initialScale: 0.02, // Start at 10px, expand to maxRadius
    });
  }

  /**
   * Activate screen shake
   * SPEC § 2.6.3: All special bullets have screen shake (VE-62)
   */
  private activateScreenShake(magnitude: number, duration: number): void {
    // If already shaking, use the larger magnitude
    if (this.screenShakeActive && magnitude < this.screenShakeMagnitude) {
      return;
    }

    this.screenShakeActive = true;
    this.screenShakeMagnitude = magnitude;
    this.screenShakeDuration = duration;
    this.screenShakeElapsed = 0;
  }

  /**
   * Trigger fullscreen flashes
   * SPEC § 2.6.3.6: Oyster Omelette flashes red 3 times (VE-53)
   */
  private triggerFullscreenFlashes(
    color: number,
    count: number,
    interval: number,
    maxAlpha: number,
  ): void {
    for (let i = 0; i < count; i++) {
      this.fullscreenFlashes.push({
        alpha: maxAlpha,
        lifetime: i * interval,
        maxLifetime: i * interval + interval,
        color,
      });
    }
  }

  /**
   * Get current screen shake offset
   * SPEC § 2.6.3: Returns offset for game scene to apply
   */
  public getScreenShakeOffset(): Vector {
    if (!this.screenShakeActive) {
      return new Vector(0, 0);
    }

    // Simple random shake within magnitude bounds
    const magnitude = this.screenShakeMagnitude;
    return new Vector(
      (Math.random() - 0.5) * 2 * magnitude,
      (Math.random() - 0.5) * 2 * magnitude,
    );
  }

  /**
   * Get fullscreen flash alpha (for game scene to apply)
   * SPEC § 2.6.3.6: Fullscreen flash overlay
   */
  public getFullscreenFlashAlpha(): number {
    let maxAlpha = 0;
    for (const flash of this.fullscreenFlashes) {
      const progress = flash.lifetime / flash.maxLifetime;
      const alpha = flash.alpha * (1 - progress);
      maxAlpha = Math.max(maxAlpha, alpha);
    }
    return maxAlpha;
  }

  /**
   * Trigger screen shake effect (legacy API for compatibility)
   * SPEC § 2.6.3.6: Screen shake on impact
   * Returns shake data for the game scene to apply
   */
  public triggerScreenShake(): {
    magnitude: number;
    duration: number;
  } {
    const config = VISUAL_EFFECTS_CONFIG.oysterOmelette;
    this.activateScreenShake(
      config.screenShakeMagnitude,
      config.screenShakeDuration,
    );
    return {
      magnitude: config.screenShakeMagnitude,
      duration: config.screenShakeDuration,
    };
  }

  /**
   * Add a temporary effect with lifetime-based cleanup
   * Supports fade-out and expansion animations
   */
  private addTemporaryEffect(
    graphics: Graphics,
    duration: number,
    options?: {
      fadeOut?: boolean;
      expand?: boolean;
      initialAlpha?: number;
      initialScale?: number;
    },
  ): void {
    this.temporaryEffects.push({
      graphics,
      lifetime: 0,
      maxLifetime: duration,
      alpha: options?.fadeOut ? options.initialAlpha ?? 1.0 : undefined,
      scale: options?.expand ? options.initialScale ?? 1.0 : undefined,
      initialAlpha: options?.initialAlpha ?? 1.0,
      initialScale: options?.initialScale ?? 1.0,
    });
  }

  /**
   * Update all active visual effects (trails fade, particles age, shake, flashes)
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

    // Update particles (move, fade, remove expired)
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const particle = this.particles[i];
      particle.lifetime += deltaTime;

      // Update position
      particle.position.x += particle.velocity.x * deltaTime;
      particle.position.y += particle.velocity.y * deltaTime;
      particle.graphics.position.set(particle.position.x, particle.position.y);

      // Fade out
      particle.alpha = 1 - particle.lifetime / particle.maxLifetime;
      particle.graphics.alpha = particle.alpha;

      // Remove expired
      if (particle.lifetime >= particle.maxLifetime) {
        this.container.removeChild(particle.graphics);
        particle.graphics.destroy();
        this.particles.splice(i, 1);
      }
    }

    // Update temporary effects (hit effects, pierce clouds, chain lightning, explosions)
    for (let i = this.temporaryEffects.length - 1; i >= 0; i--) {
      const effect = this.temporaryEffects[i];
      effect.lifetime += deltaTime;

      const progress = effect.lifetime / effect.maxLifetime;

      // Apply fade-out animation
      if (effect.alpha !== undefined && effect.initialAlpha !== undefined) {
        effect.graphics.alpha = effect.initialAlpha * (1 - progress);
      }

      // Apply expansion animation
      if (effect.scale !== undefined && effect.initialScale !== undefined) {
        const scale = effect.initialScale + (1 - effect.initialScale) * progress;
        effect.graphics.scale.set(scale);
      }

      if (effect.lifetime >= effect.maxLifetime) {
        this.container.removeChild(effect.graphics);
        effect.graphics.destroy();
        this.temporaryEffects.splice(i, 1);
      }
    }

    // Update screen shake
    if (this.screenShakeActive) {
      this.screenShakeElapsed += deltaTime;
      if (this.screenShakeElapsed >= this.screenShakeDuration) {
        this.screenShakeActive = false;
        this.screenShakeElapsed = 0;
      }
    }

    // Update fullscreen flashes
    for (let i = this.fullscreenFlashes.length - 1; i >= 0; i--) {
      const flash = this.fullscreenFlashes[i];
      flash.lifetime += deltaTime;

      if (flash.lifetime >= flash.maxLifetime) {
        this.fullscreenFlashes.splice(i, 1);
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

    // Clear all particles
    for (const particle of this.particles) {
      this.container.removeChild(particle.graphics);
      particle.graphics.destroy();
    }
    this.particles = [];

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
