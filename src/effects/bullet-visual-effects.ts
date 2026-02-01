/**
 * Bullet Visual Effects System
 * SPEC § 2.6.3 Bullets - Visual Effects
 * SPEC § 4.2.4 Animation System
 *
 * Implements exaggerated Roguelike-style visual effects inspired by Vampire Survivors and Brotato.
 * Core Principles (SPEC § 2.6.3):
 * - Exaggeration: Visual size 1.5~16x larger than collision box
 * - Impact: Screen shake, hit flash, explosions
 * - Particle Density: 50~500 particles per effect
 * - Lighting: Bloom 150~300%, glow effects
 * - Destruction: Every bullet feels like destructive energy
 */

import { Graphics, Container } from "pixi.js";
import { Vector } from "../values/vector";
import { SpecialBulletType } from "../values/special-bullet";

/**
 * Single particle in a particle system
 */
interface Particle {
  position: Vector;
  velocity: Vector;
  alpha: number;
  lifetime: number;
  maxLifetime: number;
  size: number;
  graphics: Graphics;
}

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
 * Temporary effect with lifetime-based cleanup
 * Used for hit effects, pierce clouds, chain lightning, explosions
 */
interface TemporaryEffect {
  graphics: Graphics;
  lifetime: number;
  maxLifetime: number;
  particles?: Particle[]; // For particle-based effects
  updateFn?: (effect: TemporaryEffect, deltaTime: number) => void; // Custom update logic
}

/**
 * Ground residue effect that fades over time
 */
interface GroundResidue {
  graphics: Graphics;
  lifetime: number;
  maxLifetime: number;
  initialAlpha: number;
}

/**
 * Muzzle flash effect shown at bullet spawn
 */
interface MuzzleFlash {
  graphics: Graphics;
  lifetime: number;
  maxLifetime: number;
  color: number;
  radius: number;
}

/**
 * Visual Effects configuration based on SPEC § 2.6.3
 * All values directly from specification tables
 */
const VISUAL_EFFECTS_CONFIG = {
  normal: {
    // SPEC § 2.6.3.1 Normal Bullet
    visualSize: 16, // 2x collision box (8×8)
    trailColor: 0xffffff, // White wind切線條
    trailCount: 3, // 3條白色風切線條
    trailWidth: 2,
    trailLength: 32, // 32px length (SPEC)
    trailLifetime: 0.2, // 200ms
    muzzleFlashColor: 0xffffff, // 白色閃光
    muzzleFlashRadius: 24, // 半徑 24px
    muzzleFlashDuration: 0.05, // 50ms
    hitColor: 0xffffff, // 白色爆裂
    hitParticles: 20, // 20 粒子噴濺
    hitRadius: 16, // 半徑 16px
    hitSpeed: 100, // 速度 100px/s
    hitDuration: 0.15,
  },
  nightMarket: {
    // SPEC § 2.6.3.2 Night Market Combo - 連鎖閃電
    visualSize: 32, // 2x collision box (16×16)
    trailColor: 0xffd700, // 金黃色電流
    trailCount: 5, // 5 條金黃色電流螺旋軌跡
    trailWidth: 3,
    trailLength: 64, // 64px (from 尾跡特效)
    trailLifetime: 0.3, // 300ms
    trailParticlesPerSecond: 100, // 100 個/秒 電流粒子
    muzzleFlashColor: 0xffd700, // 金黃色電流爆發
    muzzleFlashRadius: 48, // 半徑 48px
    muzzleFlashDuration: 0.1, // 100ms
    muzzleFlashParticles: 50, // 50 個電流粒子
    bloomRadius: 48, // 光暈半徑 48px
    bloomIntensity: 2.0, // 200% Bloom 強度
    bloomColor: 0xffd700,
    hitColor: 0xffd700, // 金黃色
    chainColor: 0xffd700, // 金黃色閃電鏈
    chainWidth: 4, // 4px 寬度
    chainDuration: 0.3, // 300ms
    chainParticles: 200, // 200 個粒子
    chainSpeed: 800, // 800px/s
    chainTargetParticles: 50, // 50 粒子/目標
    chainTargetDuration: 0.4, // 400ms
    explosionRadius: 64, // 最終爆炸半徑 64px
    explosionParticles: 150, // 150 個粒子
    explosionDuration: 0.5, // 500ms
    screenShakeMagnitude: 2, // 2px 振幅
    screenShakeDuration: 0.1, // 100ms
    residueSize: 32, // 地面灼燒痕跡 32×32 px
    residueDuration: 1.0, // 1 秒後消散
    residueAlpha: 0.8,
    visualRange: 200, // 整體視覺範圍 200×200 px (12.5x 誇張倍率)
  },
  stinkyTofu: {
    // SPEC § 2.6.3.3 Stinky Tofu - 貫穿毒霧
    visualSize: 24, // 2x collision box (12×12)
    trailColor: 0x27ae60, // 綠色氣體 (adjusted from #00FF00 for better visibility)
    trailCount: 5, // 5 條波浪狀氣體尾跡
    trailWidth: 4,
    trailLength: 80, // 80px 長度
    trailLifetime: 0.4, // 透明度 70%→0%
    trailParticlesPerSecond: 150, // 150 個/秒 氣體粒子
    trailWaveFrequency: 10, // 10Hz 波浪動畫
    muzzleFlashColor: 0x27ae60, // 綠色毒霧
    muzzleFlashRadius: 40, // 半徑 40px
    muzzleFlashDuration: 0.15, // 150ms
    muzzleFlashParticles: 80, // 80 個粒子
    bloomRadius: 36, // 光暈半徑 36px
    bloomIntensity: 1.8, // 180% Bloom 強度
    bloomColor: 0x27ae60,
    pierceColor: 0x27ae60, // 綠色臭氣雲
    pierceRadius: 80, // 半徑 80px
    pierceParticles: 200, // 200 個粒子
    pierceDuration: 0.5, // 500ms
    pierceSpeed: 150, // 150px/s
    screenShakeMagnitude: 3, // 3px 振幅
    screenShakeDuration: 0.15, // 150ms
    residueSize: 48, // 地面腐蝕痕跡 48×48 px
    residueDuration: 1.5, // 1.5 秒後消散
    residueAlpha: 0.9,
    visualRange: 160, // 整體視覺範圍 160×160 px (13.3x 誇張倍率)
  },
  bubbleTea: {
    // SPEC § 2.6.3.4 Bubble Tea - 三向散射
    visualSize: 32, // 3.2x collision box (10×10) - 巨大黑珍珠
    bulletScale: 1.5,
    trailColor: 0x8b4513, // 白色奶茶霧氣 (using brown for better visibility)
    trailCount: 50, // 50 個奶茶霧氣粒子/顆
    trailWidth: 3,
    trailLength: 48, // 半徑 48px
    trailLifetime: 0.25,
    trailAlpha: 0.6, // 透明度 60%→0%
    muzzleFlashColor: 0x1a1a1a, // 黑色珍珠雨
    muzzleFlashRadius: 32, // 珍珠尺寸 32×32 px
    muzzleFlashDuration: 0.1,
    bloomRadius: 40, // 光暈半徑 40px
    bloomIntensity: 1.5, // 150% Bloom 強度
    bloomColor: 0xffffff, // 白色光環
    hitColor: 0xffffff, // 白色奶茶液體
    hitParticles: 120, // 120 個粒子
    hitRadius: 64, // 半徑 64px
    hitSpeed: 180, // 180px/s
    hitDuration: 0.4, // 400ms 生命週期
    screenShakeMagnitude: 1, // 1px/顆
    screenShakeDuration: 0.08, // 80ms
    residueSize: 40, // 地面液體痕跡 40×40 px
    residueDuration: 0.8, // 0.8 秒後消散
    residueAlpha: 0.7,
    visualRange: 96, // 每顆珍珠視覺範圍 96×96 px (9.6x 誇張倍率)
  },
  bloodCake: {
    // SPEC § 2.6.3.5 Blood Cake - 追蹤黏液
    visualSize: 28, // 2x collision box (14×14)
    trailColor: 0x1a1a1a, // 黑色黏稠殘影
    trailCount: 7, // 7 條黑色黏稠殘影線
    trailWidth: 4,
    trailLength: 96, // 96px 長度
    trailLifetime: 0.5, // 500ms 生命週期
    trailParticlesPerSecond: 180, // 180 個/秒 黏稠尾跡粒子
    trailSpiralRadius: 64, // 64px 螺旋軌跡半徑
    trailTurnSpeed: 180, // 180°/s 追蹤轉向速度
    trailWaveFrequency: 8, // 8Hz 波浪動畫
    muzzleFlashColor: 0x8b0000, // 黑紅色黏稠液體
    muzzleFlashRadius: 36, // 半徑 36px
    muzzleFlashDuration: 0.12, // 120ms
    muzzleFlashParticles: 60, // 60 個粒子
    bloomRadius: 42, // 光暈半徑 42px
    bloomIntensity: 1.6, // 160% Bloom 強度
    bloomColor: 0x8b0000, // 深紅色
    hitColor: 0x1a1a1a, // 黑色黏液
    hitParticles: 180, // 180 個粒子
    hitRadius: 72, // 半徑 72px
    hitSpeed: 120, // 120px/s（緩慢）
    hitDuration: 0.6, // 600ms 生命週期
    slowDebuffParticles: 40, // 40 個黏液粒子
    slowDebuffDuration: 2.0, // 2 秒緩速
    screenShakeMagnitude: 2, // 2px 振幅
    screenShakeDuration: 0.1, // 100ms
    residueSize: 56, // 地面血糕痕跡 56×56 px
    residueDuration: 2.0, // 2 秒後消散
    residueAlpha: 0.85,
    visualRange: 168, // 整體視覺範圍 168×168 px (12x 誇張倍率)
  },
  oysterOmelette: {
    // SPEC § 2.6.3.6 Oyster Omelet - Ultimate
    visualSize: 128, // 4x collision box (32×32) - 巨大投擲物
    bulletScale: 3.5, // 3.5x larger
    trailColor: 0xe67e22, // 紅色甜辣醬火焰 (orange for trails)
    trailCount: 10, // 10 條紅色火焰尾跡
    trailWidth: 6,
    trailLength: 160, // 160px 長度
    trailLifetime: 0.6, // 600ms 生命週期
    trailParticlesPerSecond: 300, // 300 個/秒 火焰尾跡粒子
    trailGradient: [0xff0000, 0xff8800, 0xffff00], // 紅→橙→黃 漸變
    muzzleFlashColor: 0xff0000, // 紅色甜辣醬火焰
    muzzleFlashRadius: 96, // 半徑 96px
    muzzleFlashDuration: 0.2, // 200ms
    muzzleFlashParticles: 300, // 300 個粒子
    fullScreenFlashAlpha: 0.4, // 全螢幕閃紅光 40%→0%
    bloomRadius: 128, // 光暈半徑 128px
    bloomIntensity: 3.0, // 300% Bloom 強度（極強）
    bloomColor: 0xff0000, // 紅色
    bloomBreathFrequency: 5, // 5Hz 呼吸頻率
    gravityAcceleration: 400, // 400px/s² 重力加速度
    explosionColor: 0xff4444, // 紅色甜辣醬爆炸
    explosionRadius: 256, // 半徑 256px
    explosionParticles: 500, // 500 個粒子
    explosionSpeed: 300, // 300px/s
    explosionDuration: 1.0, // 1s 生命週期
    shockwaveRadius: 512, // 512px 衝擊波半徑
    shockwaveSpeed: 640, // 640px/s 擴散速度
    shockwaveDuration: 0.8, // 800ms
    screenShakeMagnitude: 8, // 8px 振幅（超強）
    screenShakeDuration: 0.5, // 500ms
    screenFlashCount: 3, // 3 次全螢幕閃光
    screenFlashInterval: 0.1, // 100ms 間隔
    screenFlashAlpha: 0.6, // 60%→0%
    freezeFrameDuration: 0.1, // 100ms 時間凍結
    residueSize: 128, // 地面灼燒痕跡 128×128 px
    residueDuration: 3.0, // 3 秒後消散
    residueAlpha: 1.0,
    aoeRadius: 256, // 範圍傷害 256px
    aoeParticlesPerEnemy: 80, // 80 粒子/敵人
    visualRange: 512, // 整體視覺範圍 512×512 px (16x 誇張倍率)
  },
} as const;

/**
 * Bullet Visual Effects Manager
 * Handles all visual effects for bullets (trails, hit effects, particles, bloom, ground residue)
 */
export class BulletVisualEffects {
  private container: Container;
  private trails: Map<string, TrailParticle[]> = new Map();
  private temporaryEffects: TemporaryEffect[] = [];
  private groundResidues: GroundResidue[] = [];
  private muzzleFlashes: MuzzleFlash[] = [];

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
   * Create muzzle flash effect when bullet is fired
   * SPEC § 2.6.3: 槍口閃光 - all bullet types have muzzle flash
   */
  public createMuzzleFlash(
    position: Vector,
    bulletType: SpecialBulletType,
  ): void {
    const config = this.getConfigForType(bulletType);
    if (!config.muzzleFlashRadius) return;

    const flash = new Graphics();

    // Create glow effect with multiple circles for bloom
    const bloomLayers = 3;
    for (let i = 0; i < bloomLayers; i++) {
      const layerRadius =
        config.muzzleFlashRadius * (1 + i * 0.3);
      const layerAlpha = (config.muzzleFlashParticles ? 0.8 : 0.8) / (i + 1);

      flash.circle(0, 0, layerRadius);
      flash.fill({ color: config.muzzleFlashColor, alpha: layerAlpha });
    }

    flash.position.set(position.x, position.y);
    this.container.addChild(flash);

    this.muzzleFlashes.push({
      graphics: flash,
      lifetime: 0,
      maxLifetime: config.muzzleFlashDuration,
      color: config.muzzleFlashColor,
      radius: config.muzzleFlashRadius,
    });

    // Create additional particles for special bullets
    if (config.muzzleFlashParticles) {
      this.createParticleBurst(
        position,
        config.muzzleFlashParticles,
        config.muzzleFlashColor,
        config.muzzleFlashRadius,
        100, // particle speed
        config.muzzleFlashDuration,
      );
    }
  }

  /**
   * Create trail effect for bullet flight
   * SPEC § 2.6.3: Different trails for each bullet type with particle counts
   */
  public createTrail(
    bulletId: string,
    position: Vector,
    bulletType: SpecialBulletType,
  ): void {
    const config = this.getConfigForType(bulletType);
    if (!config) return;

    // Create main trail line
    const particle: TrailParticle = {
      position,
      alpha: 1,
      lifetime: 0,
      maxLifetime: config.trailLifetime,
      graphics: new Graphics(),
    };

    // Draw trail based on bullet type
    if (config.trailWidth) {
      particle.graphics.circle(0, 0, config.trailWidth);
      particle.graphics.fill({ color: config.trailColor, alpha: 0.8 });
    }
    particle.graphics.position.set(position.x, position.y);

    this.container.addChild(particle.graphics);

    // Store trail particle
    if (!this.trails.has(bulletId)) {
      this.trails.set(bulletId, []);
    }
    const bulletTrails = this.trails.get(bulletId)!;
    bulletTrails.push(particle);

    // Limit trail length (SPEC: different counts for each type)
    const maxTrailLength = config.trailCount || config.trailLength || 5;
    if (bulletTrails.length > maxTrailLength) {
      const removed = bulletTrails.shift()!;
      this.container.removeChild(removed.graphics);
      removed.graphics.destroy();
    }

    // Create additional particle effects for special bullets
    if (config.trailParticlesPerSecond && Math.random() < 0.5) {
      // 50% chance per frame to spawn particle
      this.createTrailParticle(
        position,
        config.trailColor,
        config.trailWidth || 2,
        config.trailLifetime,
      );
    }
  }

  /**
   * Create individual trail particle (for high particle density effects)
   */
  private createTrailParticle(
    position: Vector,
    color: number,
    size: number,
    lifetime: number,
  ): void {
    const particle = new Graphics();
    particle.circle(0, 0, size);
    particle.fill({ color, alpha: 0.6 });
    particle.position.set(position.x, position.y);

    this.container.addChild(particle);
    this.addTemporaryEffect(particle, lifetime);
  }

  /**
   * Create hit effect when bullet hits enemy
   * SPEC § 2.6.3: Particle burst with specific counts for each type
   */
  public createHitEffect(
    position: Vector,
    bulletType: SpecialBulletType,
  ): void {
    const config = this.getConfigForType(bulletType);
    if (!config) return;

    const color = config.hitColor || config.trailColor || 0xffffff;
    const particleCount = config.hitParticles || 20;
    const radius = config.hitRadius || 16;
    const speed = config.hitSpeed || 100;
    const duration = config.hitDuration || 0.15;

    // Create central pop effect
    const hitEffect = new Graphics();
    hitEffect.circle(0, 0, radius);
    hitEffect.fill({ color, alpha: 0.8 });
    hitEffect.position.set(position.x, position.y);

    this.container.addChild(hitEffect);
    this.addTemporaryEffect(hitEffect, duration);

    // Create particle burst (SPEC: 20~500 particles)
    this.createParticleBurst(
      position,
      particleCount,
      color,
      radius,
      speed,
      duration,
    );

    // Create ground residue
    if (config.residueSize) {
      this.createGroundResidue(
        position,
        color,
        config.residueSize,
        config.residueDuration || 1.0,
        config.residueAlpha || 0.8,
      );
    }
  }

  /**
   * Create particle burst effect
   * SPEC § 2.6.3: 粒子華麗度 - 50~500 particles based on bullet type
   */
  private createParticleBurst(
    position: Vector,
    particleCount: number,
    color: number,
    radius: number,
    speed: number,
    lifetime: number,
  ): void {
    const particles: Particle[] = [];

    for (let i = 0; i < particleCount; i++) {
      const angle = (Math.PI * 2 * i) / particleCount;
      const speedVariation = speed * (0.5 + Math.random() * 0.5);
      const velocity = new Vector(
        Math.cos(angle) * speedVariation,
        Math.sin(angle) * speedVariation,
      );

      const particleGraphics = new Graphics();
      const particleSize = 2 + Math.random() * 3;
      particleGraphics.circle(0, 0, particleSize);
      particleGraphics.fill({ color, alpha: 0.8 });
      particleGraphics.position.set(position.x, position.y);

      this.container.addChild(particleGraphics);

      particles.push({
        position: new Vector(position.x, position.y), // Clone position
        velocity,
        alpha: 1,
        lifetime: 0,
        maxLifetime: lifetime,
        size: particleSize,
        graphics: particleGraphics,
      });
    }

    // Add as temporary effect with particle update logic
    this.addTemporaryEffect(
      new Graphics(), // Dummy graphics for container
      lifetime,
      particles,
      (effect, deltaTime) => {
        // Update particle positions and alpha
        effect.particles?.forEach((particle) => {
          particle.position.x += particle.velocity.x * deltaTime;
          particle.position.y += particle.velocity.y * deltaTime;
          particle.lifetime += deltaTime;
          particle.alpha = 1 - particle.lifetime / particle.maxLifetime;
          particle.graphics.alpha = particle.alpha;
          particle.graphics.position.set(particle.position.x, particle.position.y);
        });
      },
    );
  }

  /**
   * Create pierce effect for Stinky Tofu
   * SPEC § 2.6.3.3: Green stink cloud with 200 particles when piercing
   */
  public createPierceEffect(position: Vector): void {
    const config = VISUAL_EFFECTS_CONFIG.stinkyTofu;

    // Create main pierce cloud
    const pierceCloud = new Graphics();
    pierceCloud.circle(0, 0, config.pierceRadius);
    pierceCloud.fill({ color: config.pierceColor, alpha: 0.6 });
    pierceCloud.position.set(position.x, position.y);

    this.container.addChild(pierceCloud);
    this.addTemporaryEffect(pierceCloud, config.pierceDuration);

    // Create particle burst (SPEC: 200 粒子)
    this.createParticleBurst(
      position,
      config.pierceParticles,
      config.pierceColor,
      config.pierceRadius,
      config.pierceSpeed,
      config.pierceDuration,
    );

    // Create ground residue
    this.createGroundResidue(
      position,
      config.pierceColor,
      config.residueSize,
      config.residueDuration,
      config.residueAlpha,
    );
  }

  /**
   * Create chain lightning effect for Night Market
   * SPEC § 2.6.3.2: Golden lightning chain with 200 particles jumping between enemies
   */
  public createChainEffect(from: Vector, to: Vector): void {
    const config = VISUAL_EFFECTS_CONFIG.nightMarket;

    // Create lightning bolt line
    const lightning = new Graphics();
    lightning.moveTo(from.x, from.y);
    lightning.lineTo(to.x, to.y);
    lightning.stroke({ color: config.chainColor, width: config.chainWidth });

    this.container.addChild(lightning);
    this.addTemporaryEffect(lightning, config.chainDuration);

    // Create lightning particles along the chain (SPEC: 200 粒子)
    const chainLength = Math.sqrt(
      Math.pow(to.x - from.x, 2) + Math.pow(to.y - from.y, 2),
    );
    const particleCount = config.chainParticles;

    for (let i = 0; i < particleCount; i++) {
      const t = i / particleCount;
      const pos = new Vector(
        from.x + (to.x - from.x) * t,
        from.y + (to.y - from.y) * t,
      );

      // Add random offset for lightning jaggedness
      pos.x += (Math.random() - 0.5) * 10;
      pos.y += (Math.random() - 0.5) * 10;

      this.createTrailParticle(
        pos,
        config.chainColor,
        2,
        config.chainDuration,
      );
    }
  }

  /**
   * Create chain target effect (particles on chained enemies)
   * SPEC § 2.6.3.2: 50 particles per target, 400ms duration
   */
  public createChainTargetEffect(position: Vector): void {
    const config = VISUAL_EFFECTS_CONFIG.nightMarket;

    this.createParticleBurst(
      position,
      config.chainTargetParticles,
      config.chainColor,
      32, // radius
      150, // speed
      config.chainTargetDuration,
    );
  }

  /**
   * Create final chain explosion effect
   * SPEC § 2.6.3.2: 150 particles, 64px radius, 500ms, with Bloom 200%
   */
  public createChainExplosionEffect(position: Vector): void {
    const config = VISUAL_EFFECTS_CONFIG.nightMarket;

    // Create bloom glow
    const explosion = new Graphics();
    const bloomLayers = 5;
    for (let i = 0; i < bloomLayers; i++) {
      const layerRadius = config.explosionRadius * (1 + i * 0.4);
      const layerAlpha = 0.8 / (i + 1);
      explosion.circle(0, 0, layerRadius);
      explosion.fill({ color: config.chainColor, alpha: layerAlpha });
    }
    explosion.position.set(position.x, position.y);

    this.container.addChild(explosion);
    this.addTemporaryEffect(explosion, config.explosionDuration);

    // Create particle burst (SPEC: 150 粒子)
    this.createParticleBurst(
      position,
      config.explosionParticles,
      config.chainColor,
      config.explosionRadius,
      200, // speed
      config.explosionDuration,
    );

    // Create ground residue
    this.createGroundResidue(
      position,
      config.chainColor,
      config.residueSize,
      config.residueDuration,
      config.residueAlpha,
    );
  }

  /**
   * Create explosion effect for Oyster Omelette
   * SPEC § 2.6.3.6: 500 particles, 256px radius, with shockwave and Bloom 300%
   */
  public createExplosionEffect(position: Vector): void {
    const config = VISUAL_EFFECTS_CONFIG.oysterOmelette;

    // Create main explosion with ultra-strong bloom (300%)
    const explosion = new Graphics();
    const bloomLayers = 7; // More layers for 300% bloom
    for (let i = 0; i < bloomLayers; i++) {
      const layerRadius = config.explosionRadius * (1 + i * 0.5);
      const layerAlpha = 0.9 / (i + 1);
      explosion.circle(0, 0, layerRadius);
      explosion.fill({ color: config.explosionColor, alpha: layerAlpha });
    }
    explosion.position.set(position.x, position.y);

    this.container.addChild(explosion);
    this.addTemporaryEffect(explosion, config.explosionDuration);

    // Create massive particle burst (SPEC: 500 粒子)
    this.createParticleBurst(
      position,
      config.explosionParticles,
      config.explosionColor,
      config.explosionRadius,
      config.explosionSpeed,
      config.explosionDuration,
    );

    // Create shockwave (SPEC: 512px radius, 800ms)
    this.createShockwave(
      position,
      config.shockwaveRadius,
      config.shockwaveSpeed,
      config.shockwaveDuration,
    );

    // Create ground residue (SPEC: 128×128 px, 3 seconds)
    this.createGroundResidue(
      position,
      config.explosionColor,
      config.residueSize,
      config.residueDuration,
      config.residueAlpha,
    );
  }

  /**
   * Create shockwave effect (expanding circle)
   * SPEC § 2.6.3.6: 512px radius, 640px/s expansion speed, 800ms duration
   */
  private createShockwave(
    position: Vector,
    maxRadius: number,
    speed: number,
    duration: number,
  ): void {
    const shockwave = new Graphics();
    shockwave.position.set(position.x, position.y);
    this.container.addChild(shockwave);

    let currentRadius = 0;

    this.addTemporaryEffect(
      shockwave,
      duration,
      undefined,
      (effect, deltaTime) => {
        currentRadius += speed * deltaTime;
        const progress = currentRadius / maxRadius;
        const alpha = Math.max(0, 1 - progress);

        // Redraw expanding circle
        effect.graphics.clear();
        effect.graphics.circle(0, 0, currentRadius);
        effect.graphics.stroke({
          color: 0xff4444,
          width: 6,
          alpha: alpha,
        });
      },
    );
  }

  /**
   * Create ground residue effect
   * SPEC § 2.6.3: All bullet types leave ground marks (0.8~3 seconds)
   */
  private createGroundResidue(
    position: Vector,
    color: number,
    size: number,
    duration: number,
    initialAlpha: number,
  ): void {
    const residue = new Graphics();
    residue.circle(0, 0, size / 2);
    residue.fill({ color, alpha: initialAlpha });
    residue.position.set(position.x, position.y);

    this.container.addChild(residue);

    this.groundResidues.push({
      graphics: residue,
      lifetime: 0,
      maxLifetime: duration,
      initialAlpha,
    });
  }

  /**
   * Trigger screen shake effect
   * SPEC § 2.6.3: Different magnitudes for each bullet type (1~8px)
   * Returns shake data for the game scene to apply
   */
  public triggerScreenShake(bulletType: SpecialBulletType): {
    magnitude: number;
    duration: number;
  } | null {
    const config = this.getConfigForType(bulletType);
    if (!config.screenShakeMagnitude) return null;

    return {
      magnitude: config.screenShakeMagnitude,
      duration: config.screenShakeDuration || 0.1,
    };
  }

  /**
   * Trigger freeze frame effect for Oyster Omelette
   * SPEC § 2.6.3.6: 100ms freeze frame on impact
   */
  public triggerFreezeFrame(): { duration: number } {
    const config = VISUAL_EFFECTS_CONFIG.oysterOmelette;
    return {
      duration: config.freezeFrameDuration,
    };
  }

  /**
   * Create full screen flash effect for Oyster Omelette
   * SPEC § 2.6.3.6: 3 flashes, 100ms interval, 60%→0% alpha
   */
  public createFullScreenFlash(): void {
    const config = VISUAL_EFFECTS_CONFIG.oysterOmelette;

    // This would be handled by the game scene, but we return the parameters
    // In a real implementation, this would create overlay graphics
    // For now, creating a simple red flash effect marker
    const flash = new Graphics();
    flash.rect(0, 0, 1920, 1080); // Full screen
    flash.fill({ color: 0xff0000, alpha: config.fullScreenFlashAlpha || 0.4 });

    this.container.addChild(flash);
    this.addTemporaryEffect(flash, 0.2); // Flash duration
  }

  /**
   * Add a temporary effect with lifetime-based cleanup
   * Replaces setTimeout pattern for update-loop lifecycle management
   */
  private addTemporaryEffect(
    graphics: Graphics,
    duration: number,
    particles?: Particle[],
    updateFn?: (effect: TemporaryEffect, deltaTime: number) => void,
  ): void {
    this.temporaryEffects.push({
      graphics,
      lifetime: 0,
      maxLifetime: duration,
      particles,
      updateFn,
    });
  }

  /**
   * Update all active visual effects (trails fade, particles age, explosions expand)
   */
  public update(deltaTime: number): void {
    // Update muzzle flashes
    for (let i = this.muzzleFlashes.length - 1; i >= 0; i--) {
      const flash = this.muzzleFlashes[i];
      flash.lifetime += deltaTime;

      // Fade out
      const alpha = 1 - flash.lifetime / flash.maxLifetime;
      flash.graphics.alpha = alpha;

      if (flash.lifetime >= flash.maxLifetime) {
        this.container.removeChild(flash.graphics);
        flash.graphics.destroy();
        this.muzzleFlashes.splice(i, 1);
      }
    }

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

    // Update temporary effects (hit effects, pierce clouds, chain lightning, explosions)
    for (let i = this.temporaryEffects.length - 1; i >= 0; i--) {
      const effect = this.temporaryEffects[i];
      effect.lifetime += deltaTime;

      // Call custom update function if provided
      if (effect.updateFn) {
        effect.updateFn(effect, deltaTime);
      }

      // Update particles if present
      if (effect.particles) {
        for (let j = effect.particles.length - 1; j >= 0; j--) {
          const particle = effect.particles[j];
          particle.lifetime += deltaTime;

          if (particle.lifetime >= particle.maxLifetime) {
            this.container.removeChild(particle.graphics);
            particle.graphics.destroy();
            effect.particles.splice(j, 1);
          }
        }
      }

      if (effect.lifetime >= effect.maxLifetime) {
        this.container.removeChild(effect.graphics);
        effect.graphics.destroy();
        this.temporaryEffects.splice(i, 1);
      }
    }

    // Update ground residues (fade over time)
    for (let i = this.groundResidues.length - 1; i >= 0; i--) {
      const residue = this.groundResidues[i];
      residue.lifetime += deltaTime;

      // Fade alpha
      const progress = residue.lifetime / residue.maxLifetime;
      residue.graphics.alpha = residue.initialAlpha * (1 - progress);

      if (residue.lifetime >= residue.maxLifetime) {
        this.container.removeChild(residue.graphics);
        residue.graphics.destroy();
        this.groundResidues.splice(i, 1);
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
      if (effect.particles) {
        for (const particle of effect.particles) {
          this.container.removeChild(particle.graphics);
          particle.graphics.destroy();
        }
      }
      this.container.removeChild(effect.graphics);
      effect.graphics.destroy();
    }
    this.temporaryEffects = [];

    // Clear ground residues
    for (const residue of this.groundResidues) {
      this.container.removeChild(residue.graphics);
      residue.graphics.destroy();
    }
    this.groundResidues = [];

    // Clear muzzle flashes
    for (const flash of this.muzzleFlashes) {
      this.container.removeChild(flash.graphics);
      flash.graphics.destroy();
    }
    this.muzzleFlashes = [];

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
   * SPEC § 2.6.3: Visual size exaggeration (1.5~4x larger than collision box)
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

  /**
   * Get visual size for bullet (for rendering)
   * SPEC § 2.6.3: Each bullet type has specific visual size
   */
  public static getBulletVisualSize(bulletType: SpecialBulletType): number {
    const config = VISUAL_EFFECTS_CONFIG[
      bulletType === SpecialBulletType.None
        ? "normal"
        : bulletType === SpecialBulletType.NightMarket
          ? "nightMarket"
          : bulletType === SpecialBulletType.StinkyTofu
            ? "stinkyTofu"
            : bulletType === SpecialBulletType.BubbleTea
              ? "bubbleTea"
              : bulletType === SpecialBulletType.BloodCake
                ? "bloodCake"
                : "oysterOmelette"
    ];
    return config.visualSize || 16;
  }
}
