/**
 * Bullet Visual Effects System - Roguelike Spectacle Edition
 * SPEC § 2.6.3 Bullets - Visual Effects (Updated 2026-02-01)
 * SPEC § 4.2.4 Animation System
 *
 * Implements high-density particle system for exaggerated roguelike-style visual effects.
 * Designed for 60 FPS performance with 50-500 particles per bullet.
 */

import { Graphics, Container, BlurFilter, ColorMatrixFilter } from "pixi.js";
import { Vector } from "../values/vector";
import { SpecialBulletType } from "../values/special-bullet";

/**
 * Enhanced particle with velocity and physics
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
  gravity?: number; // For dripping effects (blood cake)
}

/**
 * Screen shake configuration
 */
export interface ScreenShakeData {
  magnitude: number;
  duration: number;
  frequency: number;
}

/**
 * Visual Effects configuration based on SPEC § 2.6.3 (Updated)
 * All values match the exaggerated roguelike-style specifications
 */
const VISUAL_EFFECTS_CONFIG = {
  // § 2.6.3.1 Normal Bullet
  normal: {
    // Flight trail
    trailParticlesPerFrame: 3, // 2-3 particles per frame
    trailColor: 0xffffff,
    trailWidth: 4,
    trailLength: 32,
    trailLifetime: 0.2,
    // Hit burst
    hitParticleCount: 40, // 30-50 particles
    hitParticleSpeed: 150, // 100-200 px/s
    hitParticleSize: 4, // 2-6px
    hitDuration: 0.3,
    // Glow
    bloomRadius: 24,
    bloomStrength: 0.3,
    // Visual scale
    visualScale: 2.0, // 16px visual / 8px collision
    // Screen shake
    shakeEnabled: true, // Only on enemy death
    shakeMagnitude: 2,
    shakeFrequency: 30,
    shakeDuration: 0.05,
  },

  // § 2.6.3.2 Night Market Combo
  nightMarket: {
    // Arc trail
    arcCount: 10, // 8-12 arcs
    arcRadius: 40,
    arcRotationSpeed: 180, // degrees/second
    trailParticlesPerSecond: 100,
    trailLifetime: 0.5,
    trailColor: 0xffd700,
    // Afterimages
    afterimageCount: 6, // 5-8 afterimages
    afterimageInterval: 0.05,
    afterimageLifetime: 0.3,
    // Hit burst
    hitParticleCount: 100, // 80-120 particles
    hitParticleSpeed: 300, // 200-400 px/s
    hitExplosionRadius: 80,
    // Chain lightning
    chainLightningWidth: 10, // 8-12px
    chainLightningDuration: 0.2,
    chainParticlesPerSegment: 50,
    chainTargetFlashFrequency: 10, // Hz
    chainTargetFlashDuration: 0.4,
    // Glow
    bloomRadius: 60,
    bloomStrength: 0.8,
    bloomPulseMin: 0.8,
    bloomPulseMax: 1.2,
    bloomPulsePeriod: 0.6,
    // Visual scale
    visualScale: 3.0, // 24px visual / 8px collision
    // Screen shake
    shakeMagnitude: 3,
    shakeFrequency: 40,
    shakeDuration: 0.08,
    shakeChainFinal: 6, // Final chain target shake
  },

  // § 2.6.3.3 Stinky Tofu
  stinkyTofu: {
    // Wavy trail
    trailWaveParticles: 70, // 60-80 particles
    trailWaveSpeed: 75, // 50-100 px/s
    trailLifetime: 0.6,
    trailColor: 0x7fff00, // Chartreuse Green
    // Speed lines
    speedLineCount: 4, // 3-5 lines
    speedLineLength: 40,
    speedLineWidth: 2,
    speedLineDuration: 0.1,
    // Pierce burst
    pierceParticleCount: 125, // 100-150 particles
    pierceExpansionRadius: 100,
    pierceDuration: 0.8,
    // Pierce ring
    pierceRingStartRadius: 60,
    pierceRingEndRadius: 120,
    pierceRingDuration: 0.3,
    // Glow
    bloomRadius: 50,
    bloomStrength: 0.6,
    bloomPulseMin: 0.7,
    bloomPulseMax: 1.0,
    bloomPulsePeriod: 0.8,
    // Visual scale
    visualScale: 2.5, // 20px visual / 8px collision
    // Screen shake
    shakeMagnitude: 4,
    shakeFrequency: 35,
    shakeDuration: 0.1,
    shakePierce: 5, // Second pierce shake
  },

  // § 2.6.3.4 Bubble Tea
  bubbleTea: {
    // Launch burst
    launchParticleCount: 70, // 60-80 particles
    launchParticleSpeed: 200, // 150-250 px/s
    launchBurstRadius: 60,
    // Pearl appearance (per bullet)
    pearlGradientCenter: 0x000000,
    pearlGradientEdge: 0x1a1a1a,
    pearlHighlightColor: 0xffffff,
    pearlHighlightAlpha: 0.8,
    // Milk tea trail (per bullet)
    milkTeaTrailParticles: 50, // 40-60 per bullet
    milkTeaTrailColor: 0xd2691e, // Chocolate
    milkTeaTrailWidth: 16,
    milkTeaTrailLength: 50,
    milkTeaTrailLifetime: 0.4,
    // Hit burst (per bullet)
    hitParticleCount: 60, // 50-70 per bullet
    hitExplosionRadius: 70,
    hitDuration: 0.4,
    // Glow (per bullet)
    bloomRadius: 50,
    bloomStrength: 0.5,
    // Visual scale
    visualScale: 3.5, // 28px visual / 8px collision (largest pearl)
    // Screen shake (stacking)
    shakeMagnitude: 3,
    shakeFrequency: 38,
    shakeDuration: 0.06,
    shakeMaxStack: 8, // Max shake when all 3 hit simultaneously
  },

  // § 2.6.3.5 Blood Cake
  bloodCake: {
    // Bullet appearance
    coreColor: 0x0a0a0a,
    edgeColor: 0x4a0000,
    peanutParticleCount: 17, // 15-20 particles
    peanutColor: 0xffd700,
    peanutSize: 3, // 2-4px
    // Tracking trail
    curveRadius: 45, // 30-60px
    curvePeriod: 0.8,
    guidingLineColor: 0xff0000,
    guidingLineAlpha: 0.4,
    guidingLineWidth: 2,
    // Sticky trail
    stickyTrailParticles: 65, // 50-80 particles
    stickyTrailColor: 0x4a0000,
    stickyTrailWidth: 20,
    stickyTrailLength: 60,
    stickyTrailLifetime: 0.8,
    stickyTrailGravity: 50, // px/s² downward
    // Tracking particles
    trackingParticlesPerSecond: 20,
    trackingParticleSpeed: 80, // 60-100 px/s
    trackingParticleLifetime: 0.5,
    // Hit burst
    hitParticleCount: 85, // 70-100 particles
    hitExplosionRadius: 80,
    hitIrregularShape: true, // Non-circular explosion
    // Slow debuff visual
    slowDebuffDuration: 2.0,
    slowDebuffParticlesPerSecond: 40,
    slowDebuffAlpha: 0.5,
    // Glow
    bloomRadius: 45,
    bloomStrength: 0.7,
    bloomPulseMin: 0.6,
    bloomPulseMax: 1.0,
    bloomPulsePeriod: 1.0,
    // Visual scale
    visualScale: 2.75, // 22px visual / 8px collision
    // Screen shake
    shakeMagnitude: 4,
    shakeFrequency: 36,
    shakeDuration: 0.09,
    shakeSlowDebuff: 2, // Extra shake on slow trigger
  },

  // § 2.6.3.6 Oyster Omelet (Ultimate)
  oysterOmelette: {
    // Charge-up
    chargeTime: 0.3,
    chargeParticleCount: 100,
    chargeParticleSpeed: -200, // Inward
    chargeShockwaveRadius: 100,
    chargeShockwaveAlpha: 0.7,
    chargeScreenTint: 0xff4500,
    chargeScreenTintAlpha: 0.2,
    chargeScreenTintDuration: 0.1,
    // Projectile appearance
    projectileSize: 128,
    projectileColor: 0xdc143c, // Crimson
    // Parabola flight
    initialVelocity: 500, // px/s
    gravity: 800, // px/s²
    rotationSpeed: 180, // degrees/second
    afterimageCount: 10,
    afterimageInterval: 0.1,
    // Flight effects
    flameRingCount: 3,
    flameRingRadii: [80, 120, 160],
    flameRingRotationSpeeds: [120, -120, 120], // Opposite directions
    flameParticlesPerSecond: 150,
    flameParticleSpeed: 150, // 100-200 px/s
    flameParticleLifetime: 0.6,
    // Glow (flight)
    bloomRadius: 200,
    bloomStrength: 1.0,
    bloomPulseMin: 0.8,
    bloomPulseMax: 1.2,
    bloomPulsePeriod: 0.4,
    // Explosion (three layers)
    explosionLayer1Radius: 150, // White flash
    explosionLayer1Duration: 0.1,
    explosionLayer1Color: 0xffffff,
    explosionLayer2Radius: 250, // Red-orange flame
    explosionLayer2Duration: 0.3,
    explosionLayer2Color: 0xff4500,
    explosionLayer3Radius: 350, // Deep red smoke
    explosionLayer3Duration: 0.6,
    explosionLayer3Color: 0x8b0000,
    explosionTotalParticles: 400, // 300-500 particles
    explosionParticleSpeed: 400, // 200-600 px/s
    // Light pillar
    lightPillarWidth: 60,
    lightPillarHeight: 1080, // Full screen
    lightPillarColor: 0xffffff,
    lightPillarDuration: 0.3,
    lightPillarAlpha: 0.6,
    // Environment light
    environmentLightColor: 0xff4500,
    environmentLightAlpha: 0.4,
    environmentLightDuration: 0.5,
    // Aftermath smoke
    aftermathParticleCount: 500,
    aftermathRadius: 300,
    aftermathDuration: 2.0,
    aftermathRiseSpeed: 45, // 30-60 px/s
    // Visual scale
    visualScale: 4.0, // 128px visual / 32px collision
    collisionScale: 4.0, // 32px collision vs 8px normal
    // Screen shake (strongest)
    shakeMagnitude: 12,
    shakeFrequency: 50,
    shakeDuration: 0.4,
    shakePeakMagnitude: 12,
    shakePeakDuration: 0.1,
    shakeAftershockStart: 6,
    shakeAftershockEnd: 2,
    shakeAftershockDuration: 0.3,
  },
} as const;

/**
 * Particle pool for performance optimization
 * Reuses Graphics objects to avoid GC pressure
 */
class ParticlePool {
  private pool: Graphics[] = [];
  private maxSize: number = 1000; // SPEC § 4.2.4: Max 1000 particles

  public acquire(): Graphics {
    if (this.pool.length > 0) {
      return this.pool.pop()!;
    }
    return new Graphics();
  }

  public release(graphics: Graphics): void {
    if (this.pool.length < this.maxSize) {
      graphics.clear();
      graphics.visible = false;
      this.pool.push(graphics);
    } else {
      graphics.destroy();
    }
  }

  public destroy(): void {
    for (const graphics of this.pool) {
      graphics.destroy();
    }
    this.pool = [];
  }
}

/**
 * Enhanced Bullet Visual Effects Manager
 * Implements high-density particle system for roguelike-style spectacle
 */
export class BulletVisualEffects {
  private container: Container;
  private particlePool: ParticlePool;
  private activeParticles: Particle[] = [];
  private trails: Map<string, Particle[]> = new Map();

  // Effect containers for z-index management
  private trailContainer: Container;
  private particleContainer: Container;
  private glowContainer: Container;

  // Bloom filter (simulated with blur for performance)
  private bloomFilter: BlurFilter | null = null;

  // Performance tracking
  private totalParticleCount: number = 0;
  private readonly maxTotalParticles: number = 1000; // SPEC § 4.2.4

  constructor() {
    this.container = new Container();
    this.container.label = "BulletVisualEffects";

    // Create layered containers
    this.trailContainer = new Container();
    this.trailContainer.label = "Trails";
    this.particleContainer = new Container();
    this.particleContainer.label = "Particles";
    this.glowContainer = new Container();
    this.glowContainer.label = "Glows";

    this.container.addChild(this.trailContainer);
    this.container.addChild(this.particleContainer);
    this.container.addChild(this.glowContainer);

    // Initialize particle pool
    this.particlePool = new ParticlePool();

    // Apply bloom effect (simulated with blur)
    this.setupBloomEffect();
  }

  /**
   * Setup bloom effect using BlurFilter (lightweight alternative to @pixi/filter-bloom)
   * SPEC § 4.2.4: Bloom filter requirement
   */
  private setupBloomEffect(): void {
    // Use BlurFilter as lightweight bloom simulation
    // Real bloom would require @pixi/filter-bloom dependency
    this.bloomFilter = new BlurFilter({
      strength: 4,
      quality: 4,
    });
    this.glowContainer.filters = [this.bloomFilter];
  }

  /**
   * Get the visual effects container
   */
  public getContainer(): Container {
    return this.container;
  }

  /**
   * Create trail effect for bullet flight
   * SPEC § 2.6.3: High-density trails for each bullet type
   */
  public createTrail(
    bulletId: string,
    position: Vector,
    velocity: Vector,
    bulletType: SpecialBulletType,
  ): void {
    const config = this.getConfigForType(bulletType);
    if (!config) return;

    // Particle count based on bullet type
    const particleCount = this.getTrailParticleCount(bulletType);

    for (let i = 0; i < particleCount; i++) {
      if (this.totalParticleCount >= this.maxTotalParticles) {
        break; // Performance limit reached
      }

      const particle = this.createParticle(position, velocity, bulletType, "trail");
      if (particle) {
        this.activeParticles.push(particle);
        this.totalParticleCount++;

        // Store in bullet trail map
        if (!this.trails.has(bulletId)) {
          this.trails.set(bulletId, []);
        }
        this.trails.get(bulletId)!.push(particle);
      }
    }
  }

  /**
   * Create hit effect when bullet hits enemy
   * SPEC § 2.6.3: High-density burst effects (30-500 particles)
   */
  public createHitEffect(
    position: Vector,
    bulletType: SpecialBulletType,
    targetVelocity?: Vector,
  ): void {
    const config = this.getConfigForType(bulletType);
    if (!config) return;

    const particleCount = this.getHitParticleCount(bulletType);

    for (let i = 0; i < particleCount; i++) {
      if (this.totalParticleCount >= this.maxTotalParticles) {
        break;
      }

      // Random velocity for 360° burst
      const angle = (Math.random() * Math.PI * 2);
      const speed = this.getHitParticleSpeed(bulletType);
      const velocity = new Vector(
        Math.cos(angle) * speed,
        Math.sin(angle) * speed,
      );

      const particle = this.createParticle(position, velocity, bulletType, "hit");
      if (particle) {
        this.activeParticles.push(particle);
        this.totalParticleCount++;
      }
    }
  }

  /**
   * Create pierce effect for Stinky Tofu
   * SPEC § 2.6.3.3: Pierce ring expansion + green gas cloud
   */
  public createPierceEffect(position: Vector): void {
    const config = VISUAL_EFFECTS_CONFIG.stinkyTofu;

    // Pierce ring expansion
    const ring = this.particlePool.acquire();
    ring.circle(0, 0, config.pierceRingStartRadius);
    ring.stroke({ color: config.trailColor, width: 4, alpha: 0.8 });
    ring.position.set(position.x, position.y);
    ring.visible = true;
    this.particleContainer.addChild(ring);

    // Animate ring expansion (simplified - in real impl would use Tween)
    setTimeout(() => {
      ring.clear();
      ring.circle(0, 0, config.pierceRingEndRadius);
      ring.stroke({ color: config.trailColor, width: 4, alpha: 0.0 });
      this.particleContainer.removeChild(ring);
      this.particlePool.release(ring);
    }, config.pierceRingDuration * 1000);

    // Gas cloud particles
    for (let i = 0; i < config.pierceParticleCount; i++) {
      if (this.totalParticleCount >= this.maxTotalParticles) break;

      const angle = Math.random() * Math.PI * 2;
      const speed = 100 + Math.random() * 50; // 80-150 px/s
      const velocity = new Vector(
        Math.cos(angle) * speed,
        Math.sin(angle) * speed,
      );

      const particle = this.createParticle(
        position,
        velocity,
        SpecialBulletType.StinkyTofu,
        "pierce",
      );
      if (particle) {
        this.activeParticles.push(particle);
        this.totalParticleCount++;
      }
    }
  }

  /**
   * Create chain lightning effect for Night Market
   * SPEC § 2.6.3.2: Zigzag lightning with particle spray
   */
  public createChainEffect(from: Vector, to: Vector, chainIndex: number): void {
    const config = VISUAL_EFFECTS_CONFIG.nightMarket;

    // Draw zigzag lightning bolt
    const lightning = this.particlePool.acquire();
    const segments = 5;
    const dx = (to.x - from.x) / segments;
    const dy = (to.y - from.y) / segments;

    lightning.moveTo(from.x, from.y);
    for (let i = 1; i <= segments; i++) {
      const offsetX = (Math.random() - 0.5) * 20;
      const offsetY = (Math.random() - 0.5) * 20;
      lightning.lineTo(from.x + dx * i + offsetX, from.y + dy * i + offsetY);
    }

    // Brightness decay per chain
    const brightness = 1.0 - chainIndex * 0.2;
    lightning.stroke({
      color: config.trailColor,
      width: config.chainLightningWidth,
      alpha: 0.8 * brightness,
    });
    lightning.visible = true;
    this.particleContainer.addChild(lightning);

    // Particle spray along lightning path
    for (let i = 0; i < config.chainParticlesPerSegment; i++) {
      if (this.totalParticleCount >= this.maxTotalParticles) break;

      const t = Math.random();
      const particlePos = new Vector(
        from.x + (to.x - from.x) * t,
        from.y + (to.y - from.y) * t,
      );
      const angle = Math.random() * Math.PI * 2;
      const speed = 100 + Math.random() * 100;
      const velocity = new Vector(
        Math.cos(angle) * speed,
        Math.sin(angle) * speed,
      );

      const particle = this.createParticle(
        particlePos,
        velocity,
        SpecialBulletType.NightMarket,
        "chain",
      );
      if (particle) {
        this.activeParticles.push(particle);
        this.totalParticleCount++;
      }
    }

    // Remove lightning after duration
    setTimeout(() => {
      this.particleContainer.removeChild(lightning);
      this.particlePool.release(lightning);
    }, config.chainLightningDuration * 1000);
  }

  /**
   * Create explosion effect for Oyster Omelette
   * SPEC § 2.6.3.6: Three-layer explosion (300-500 particles)
   */
  public createExplosionEffect(position: Vector): void {
    const config = VISUAL_EFFECTS_CONFIG.oysterOmelette;

    // Layer 1: White flash (innermost)
    this.createExplosionLayer(
      position,
      config.explosionLayer1Radius,
      config.explosionLayer1Color,
      config.explosionLayer1Duration,
      100,
    );

    // Layer 2: Red-orange flame (middle)
    setTimeout(() => {
      this.createExplosionLayer(
        position,
        config.explosionLayer2Radius,
        config.explosionLayer2Color,
        config.explosionLayer2Duration,
        150,
      );
    }, 100);

    // Layer 3: Deep red smoke (outer)
    setTimeout(() => {
      this.createExplosionLayer(
        position,
        config.explosionLayer3Radius,
        config.explosionLayer3Color,
        config.explosionLayer3Duration,
        150,
      );
    }, 200);

    // Light pillar
    this.createLightPillar(position);

    // Environment light overlay
    this.createEnvironmentLight();
  }

  /**
   * Create a single explosion layer
   */
  private createExplosionLayer(
    position: Vector,
    radius: number,
    color: number,
    duration: number,
    particleCount: number,
  ): void {
    const circle = this.particlePool.acquire();
    circle.circle(0, 0, radius);
    circle.fill({ color, alpha: 0.7 });
    circle.position.set(position.x, position.y);
    circle.visible = true;
    this.particleContainer.addChild(circle);

    // Fade out
    setTimeout(() => {
      this.particleContainer.removeChild(circle);
      this.particlePool.release(circle);
    }, duration * 1000);

    // Particles
    for (let i = 0; i < particleCount; i++) {
      if (this.totalParticleCount >= this.maxTotalParticles) break;

      const angle = Math.random() * Math.PI * 2;
      const speed = 200 + Math.random() * 400; // 200-600 px/s
      const velocity = new Vector(
        Math.cos(angle) * speed,
        Math.sin(angle) * speed,
      );

      const particle = this.createParticle(
        position,
        velocity,
        SpecialBulletType.OysterOmelette,
        "explosion",
      );
      if (particle) {
        particle.color = color;
        this.activeParticles.push(particle);
        this.totalParticleCount++;
      }
    }
  }

  /**
   * Create light pillar for Oyster Omelette explosion
   * SPEC § 2.6.3.6: Full-screen vertical light beam
   */
  private createLightPillar(position: Vector): void {
    const config = VISUAL_EFFECTS_CONFIG.oysterOmelette;
    const pillar = this.particlePool.acquire();

    pillar.rect(
      -config.lightPillarWidth / 2,
      -config.lightPillarHeight / 2,
      config.lightPillarWidth,
      config.lightPillarHeight,
    );
    pillar.fill({ color: config.lightPillarColor, alpha: config.lightPillarAlpha });
    pillar.position.set(position.x, 540); // Center vertically
    pillar.visible = true;
    this.glowContainer.addChild(pillar);

    // Fade out
    setTimeout(() => {
      this.glowContainer.removeChild(pillar);
      this.particlePool.release(pillar);
    }, config.lightPillarDuration * 1000);
  }

  /**
   * Create environment light overlay for Oyster Omelette
   * SPEC § 2.6.3.6: Full-screen red-orange tint
   */
  private createEnvironmentLight(): void {
    const config = VISUAL_EFFECTS_CONFIG.oysterOmelette;
    const overlay = this.particlePool.acquire();

    overlay.rect(0, 0, 1920, 1080);
    overlay.fill({
      color: config.environmentLightColor,
      alpha: config.environmentLightAlpha,
    });
    overlay.visible = true;
    this.glowContainer.addChild(overlay);

    // Fade out
    setTimeout(() => {
      this.glowContainer.removeChild(overlay);
      this.particlePool.release(overlay);
    }, config.environmentLightDuration * 1000);
  }

  /**
   * Trigger screen shake effect
   * SPEC § 2.6.3: All bullet types trigger shake on hit
   * Returns shake data for GameScene to apply to camera
   */
  public triggerScreenShake(bulletType: SpecialBulletType): ScreenShakeData {
    const config = this.getConfigForType(bulletType);
    if (!config) {
      return { magnitude: 0, duration: 0, frequency: 30 };
    }

    return {
      magnitude: config.shakeMagnitude || 2,
      duration: config.shakeDuration || 0.05,
      frequency: config.shakeFrequency || 30,
    };
  }

  /**
   * Create hit flash effect on enemy sprite
   * SPEC § 2.6.3: Enemy flashes white/colored on hit
   * Returns ColorMatrixFilter configuration
   */
  public createHitFlash(
    bulletType: SpecialBulletType,
  ): { brightness: number; duration: number; color?: number } {
    const flashConfig: Record<string, any> = {
      [SpecialBulletType.Normal]: { brightness: 1.8, duration: 0.1 },
      [SpecialBulletType.NightMarket]: {
        brightness: 2.0,
        duration: 0.12,
        color: 0xffd700,
      },
      [SpecialBulletType.StinkyTofu]: {
        brightness: 1.7,
        duration: 0.15,
        color: 0x7fff00,
      },
      [SpecialBulletType.BubbleTea]: {
        brightness: 1.6,
        duration: 0.12,
        color: 0xd2691e,
      },
      [SpecialBulletType.BloodCake]: {
        brightness: 1.7,
        duration: 0.13,
        color: 0x8b0000,
      },
      [SpecialBulletType.OysterOmelette]: {
        brightness: 2.5,
        duration: 0.2,
        color: 0xff4500,
      },
    };

    return (
      flashConfig[bulletType] || { brightness: 1.8, duration: 0.1 }
    );
  }

  /**
   * Update all active particles (age, fade, physics)
   */
  public update(deltaTime: number): void {
    // Update all particles
    for (let i = this.activeParticles.length - 1; i >= 0; i--) {
      const particle = this.activeParticles[i];

      // Age particle
      particle.lifetime += deltaTime;

      // Apply physics
      particle.position = particle.position.add(
        particle.velocity.multiply(deltaTime),
      );

      // Apply gravity if needed (blood cake sticky trail)
      if (particle.gravity) {
        particle.velocity = new Vector(
          particle.velocity.x,
          particle.velocity.y + particle.gravity * deltaTime,
        );
      }

      // Fade alpha
      particle.alpha = 1 - particle.lifetime / particle.maxLifetime;

      // Update graphics
      particle.graphics.alpha = particle.alpha;
      particle.graphics.position.set(particle.position.x, particle.position.y);

      // Remove expired particles
      if (particle.lifetime >= particle.maxLifetime) {
        this.particleContainer.removeChild(particle.graphics);
        this.particlePool.release(particle.graphics);
        this.activeParticles.splice(i, 1);
        this.totalParticleCount--;
      }
    }
  }

  /**
   * Clean up trails for a specific bullet
   */
  public clearBulletTrails(bulletId: string): void {
    const trails = this.trails.get(bulletId);
    if (!trails) return;

    for (const trail of trails) {
      const index = this.activeParticles.indexOf(trail);
      if (index > -1) {
        this.activeParticles.splice(index, 1);
        this.totalParticleCount--;
      }
      this.particleContainer.removeChild(trail.graphics);
      this.particlePool.release(trail.graphics);
    }

    this.trails.delete(bulletId);
  }

  /**
   * Clean up all visual effects
   */
  public destroy(): void {
    // Clear all particles
    for (const particle of this.activeParticles) {
      this.particleContainer.removeChild(particle.graphics);
      this.particlePool.release(particle.graphics);
    }
    this.activeParticles = [];
    this.trails.clear();
    this.totalParticleCount = 0;

    // Destroy pool
    this.particlePool.destroy();

    // Destroy containers
    this.container.destroy({ children: true });
  }

  /**
   * Get bullet scale for visual size
   * SPEC § 2.6.3: Visual size 1.5-4x larger than collision box
   */
  public static getBulletScale(bulletType: SpecialBulletType): number {
    const config = VISUAL_EFFECTS_CONFIG[bulletType as keyof typeof VISUAL_EFFECTS_CONFIG] as any;
    return config?.visualScale || 1.0;
  }

  // ========================================================================
  // Private Helper Methods
  // ========================================================================

  /**
   * Create a single particle with physics
   */
  private createParticle(
    position: Vector,
    velocity: Vector,
    bulletType: SpecialBulletType,
    effectType: "trail" | "hit" | "pierce" | "chain" | "explosion",
  ): Particle | null {
    const graphics = this.particlePool.acquire();
    const config = this.getConfigForType(bulletType);
    if (!config) return null;

    // Determine particle properties based on bullet type and effect type
    const size = this.getParticleSize(bulletType, effectType);
    const color = this.getParticleColor(bulletType, effectType);
    const lifetime = this.getParticleLifetime(bulletType, effectType);
    const gravity = this.getParticleGravity(bulletType);

    // Draw particle
    graphics.circle(0, 0, size);
    graphics.fill({ color, alpha: 1.0 });
    graphics.position.set(position.x, position.y);
    graphics.visible = true;

    // Add to appropriate container
    if (effectType === "trail") {
      this.trailContainer.addChild(graphics);
    } else {
      this.particleContainer.addChild(graphics);
    }

    return {
      position,
      velocity,
      alpha: 1.0,
      lifetime: 0,
      maxLifetime: lifetime,
      size,
      color,
      graphics,
      gravity,
    };
  }

  /**
   * Get trail particle count per frame for bullet type
   */
  private getTrailParticleCount(bulletType: SpecialBulletType): number {
    const counts: Record<string, number> = {
      [SpecialBulletType.Normal]: 3,
      [SpecialBulletType.NightMarket]: 5, // High-density for electric arc
      [SpecialBulletType.StinkyTofu]: 4, // Wavy gas
      [SpecialBulletType.BubbleTea]: 3, // Per bullet (×3 total)
      [SpecialBulletType.BloodCake]: 4, // Sticky drips
      [SpecialBulletType.OysterOmelette]: 8, // Flame trail
    };
    return counts[bulletType] || 2;
  }

  /**
   * Get hit particle count for bullet type
   */
  private getHitParticleCount(bulletType: SpecialBulletType): number {
    const counts: Record<string, number> = {
      [SpecialBulletType.Normal]: 40,
      [SpecialBulletType.NightMarket]: 100,
      [SpecialBulletType.StinkyTofu]: 125,
      [SpecialBulletType.BubbleTea]: 60, // Per bullet
      [SpecialBulletType.BloodCake]: 85,
      [SpecialBulletType.OysterOmelette]: 150, // Per layer
    };
    return counts[bulletType] || 30;
  }

  /**
   * Get hit particle speed for bullet type
   */
  private getHitParticleSpeed(bulletType: SpecialBulletType): number {
    const speeds: Record<string, number> = {
      [SpecialBulletType.Normal]: 150, // 100-200 px/s average
      [SpecialBulletType.NightMarket]: 300, // 200-400 px/s
      [SpecialBulletType.StinkyTofu]: 115, // 80-150 px/s
      [SpecialBulletType.BubbleTea]: 100, // 80-120 px/s
      [SpecialBulletType.BloodCake]: 150, // Variable
      [SpecialBulletType.OysterOmelette]: 400, // 200-600 px/s
    };
    return speeds[bulletType] || 150;
  }

  /**
   * Get particle size based on bullet type and effect
   */
  private getParticleSize(
    bulletType: SpecialBulletType,
    effectType: string,
  ): number {
    if (effectType === "trail") {
      return 2 + Math.random() * 2; // 2-4px
    }
    return 3 + Math.random() * 5; // 3-8px for hit effects
  }

  /**
   * Get particle color based on bullet type
   */
  private getParticleColor(
    bulletType: SpecialBulletType,
    effectType: string,
  ): number {
    const colors: Record<string, number> = {
      [SpecialBulletType.Normal]: 0xffffff,
      [SpecialBulletType.NightMarket]: 0xffd700,
      [SpecialBulletType.StinkyTofu]: 0x7fff00,
      [SpecialBulletType.BubbleTea]: 0xd2691e,
      [SpecialBulletType.BloodCake]: 0x4a0000,
      [SpecialBulletType.OysterOmelette]: 0xff4500,
    };
    return colors[bulletType] || 0xffffff;
  }

  /**
   * Get particle lifetime based on bullet type and effect
   */
  private getParticleLifetime(
    bulletType: SpecialBulletType,
    effectType: string,
  ): number {
    if (effectType === "trail") {
      const lifetimes: Record<string, number> = {
        [SpecialBulletType.Normal]: 0.2,
        [SpecialBulletType.NightMarket]: 0.3,
        [SpecialBulletType.StinkyTofu]: 0.6,
        [SpecialBulletType.BubbleTea]: 0.4,
        [SpecialBulletType.BloodCake]: 0.8,
        [SpecialBulletType.OysterOmelette]: 0.6,
      };
      return lifetimes[bulletType] || 0.3;
    }
    return 0.3 + Math.random() * 0.3; // 0.3-0.6s for hit effects
  }

  /**
   * Get particle gravity (for blood cake sticky drips)
   */
  private getParticleGravity(bulletType: SpecialBulletType): number | undefined {
    if (bulletType === SpecialBulletType.BloodCake) {
      return 50; // 50 px/s² downward
    }
    return undefined;
  }

  /**
   * Get configuration for bullet type
   */
  private getConfigForType(bulletType: SpecialBulletType): any {
    const configMap: Record<string, any> = {
      [SpecialBulletType.NightMarket]: VISUAL_EFFECTS_CONFIG.nightMarket,
      [SpecialBulletType.StinkyTofu]: VISUAL_EFFECTS_CONFIG.stinkyTofu,
      [SpecialBulletType.BubbleTea]: VISUAL_EFFECTS_CONFIG.bubbleTea,
      [SpecialBulletType.BloodCake]: VISUAL_EFFECTS_CONFIG.bloodCake,
      [SpecialBulletType.OysterOmelette]: VISUAL_EFFECTS_CONFIG.oysterOmelette,
    };
    return configMap[bulletType] || VISUAL_EFFECTS_CONFIG.normal;
  }
}
