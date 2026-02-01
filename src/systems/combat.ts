/**
 * Combat System
 * SPEC § 2.3.2: 管理玩家射擊、碰撞檢測、特殊子彈 Buff
 */

import { InjectableSystem } from "../core/systems/injectable";
import { SystemPriority } from "../core/systems/system.interface";
import type { Player } from "../entities/player";
import type { Bullet } from "../entities/bullet";
import { Enemy } from "../entities/enemy";
import type { EventQueue } from "./event-queue";
import { EventType } from "./event-queue";
import { checkAABBCollision } from "../values/collision";
import { recipeData } from "../data";
import { SpecialBulletType } from "../core/types";
import { COMBAT_CONFIG, RECIPE_CONFIG } from "../config";
import { DependencyKeys } from "../core/systems/dependency-keys";
import type { BulletVisualEffectsSystem } from "./bullet-visual-effects";
import type { GameStateManager } from "../core/game-state";
import { Vector } from "../values/vector";
import {
  type CollisionContext,
  type CollisionHandler,
  CollisionHandlerRegistry,
  createCollisionHandlerRegistry,
  StinkyTofuCollisionHandler,
} from "../collision";
import type { BulletUpgradeSnapshot } from "../values/bullet-upgrade-snapshot";

/**
 * Bullet spawn request data
 * Contains all information needed to create a bullet
 */
export interface BulletSpawnRequest {
  position: Vector;
  direction: Vector;
  bulletType: SpecialBulletType;
  isTracking?: boolean;
  trackingTarget?: Enemy;
  upgradeSnapshot?: BulletUpgradeSnapshot;
}

/**
 * Bullet spawner callback type
 * GameScene implements this to handle Container management
 */
export type BulletSpawner = (request: BulletSpawnRequest) => Bullet;

/**
 * Combat System
 * SPEC § 2.3.2: 玩家透過射擊擊敗敵人
 *
 * Responsibilities:
 * - 射擊冷卻管理
 * - 彈夾重裝管理（3 秒）
 * - 特殊子彈 Buff 管理（2 秒）
 * - 子彈 vs 敵人碰撞檢測
 * - 發佈事件: ReloadComplete, BuffExpired, EnemyDeath
 *
 * State Management:
 * - Buff state (currentBuff, buffTimeRemaining) is stored in GameStateManager
 * - Internal details (shootCooldown) remain in this system
 */
export class CombatSystem extends InjectableSystem {
  public readonly name = "CombatSystem";
  public readonly priority = SystemPriority.COMBAT;

  // References to game entities (not injectable - set via setters)
  private player: Player | null = null;
  private bullets: Bullet[] = [];
  private enemies: Enemy[] = [];

  // Bullet spawner callback (set by GameScene)
  private bulletSpawner: BulletSpawner | null = null;

  // Shooting cooldown (SPEC § 2.3.2) - internal implementation detail
  private shootCooldown = 0;
  private readonly shootCooldownTime = COMBAT_CONFIG.shootCooldown;

  // Buff duration config
  private readonly buffDuration = COMBAT_CONFIG.buffDuration;

  // Collision handler registry (Strategy Pattern)
  private collisionRegistry: CollisionHandlerRegistry;

  constructor() {
    super();
    this.declareDependency(DependencyKeys.EventQueue, false); // Optional for testing
    this.declareDependency(DependencyKeys.BulletVisualEffects, false); // Optional for testing
    this.declareDependency(DependencyKeys.GameState); // Required

    // Initialize collision handler registry
    this.collisionRegistry = createCollisionHandlerRegistry();
  }

  /**
   * Get EventQueue dependency (optional)
   */
  private get eventQueue(): EventQueue | null {
    return this.getOptionalDependency<EventQueue>(DependencyKeys.EventQueue);
  }

  /**
   * Get BulletVisualEffectsSystem dependency (optional)
   */
  private get visualEffects(): BulletVisualEffectsSystem | null {
    return this.getOptionalDependency<BulletVisualEffectsSystem>(
      DependencyKeys.BulletVisualEffects,
    );
  }

  /**
   * Get GameStateManager dependency
   */
  private get gameState(): GameStateManager {
    return this.getDependency<GameStateManager>(DependencyKeys.GameState);
  }

  /**
   * Initialize combat system
   */
  public initialize(): void {
    this.shootCooldown = 0;
    // Combat state is initialized by GameStateManager
  }

  /**
   * Update combat system (每幀呼叫)
   */
  public update(deltaTime: number): void {
    this.updateShootCooldown(deltaTime);
    this.updateBuff(deltaTime);
    this.checkCollisions();
  }

  /**
   * Cleanup resources
   */
  public destroy(): void {
    this.player = null;
    this.bullets = [];
    this.enemies = [];
  }

  /**
   * Set player reference (not injectable - entity reference)
   */
  public setPlayer(player: Player): void {
    this.player = player;
  }

  /**
   * Set bullet array reference (not injectable - entity reference)
   */
  public setBullets(bullets: Bullet[]): void {
    this.bullets = bullets;
  }

  /**
   * Set enemy array reference (not injectable - entity reference)
   */
  public setEnemies(enemies: Enemy[]): void {
    this.enemies = enemies;
  }

  /**
   * Set bullet spawner callback (Callback Pattern like WaveSystem.setSpawnCallback)
   * GameScene provides this to handle Container management
   */
  public setBulletSpawner(spawner: BulletSpawner): void {
    this.bulletSpawner = spawner;
  }

  /**
   * Subscribe to events after EventQueue is injected
   * Called by GameScene after injection
   */
  public subscribeToEvents(): void {
    if (this.eventQueue) {
      this.eventQueue.subscribe(
        EventType.SynthesisTriggered,
        this.onSynthesisTriggered.bind(this),
      );
    }
  }

  /**
   * Attempt to shoot a bullet
   * Returns true if shooting was successful
   */
  public shoot(): boolean {
    if (!this.player || this.shootCooldown > 0) {
      return false;
    }

    // Player.shoot() handles ammo and reload logic
    if (this.player.shoot()) {
      this.shootCooldown = this.shootCooldownTime;

      // Publish BulletFired event for audio system
      this.publishEvent(EventType.BulletFired, {});

      // Check if reload was triggered (SPEC § 2.3.2)
      if (this.player.isReloading) {
        this.publishEvent(
          EventType.ReloadComplete,
          {},
          COMBAT_CONFIG.reloadDelayMs,
        );
      }

      return true;
    }

    return false;
  }

  /**
   * Perform shoot and spawn bullets based on current buff (SPEC § 2.3.3)
   * This method combines shoot() check with bullet spawning logic
   * @returns Array of spawned bullets (empty if shoot failed or no spawner)
   */
  public performShoot(): Bullet[] {
    if (!this.shoot()) {
      return [];
    }

    if (!this.bulletSpawner || !this.player) {
      return [];
    }

    return this.spawnBulletsForCurrentBuff();
  }

  /**
   * Spawn bullets based on current buff type
   * Centralizes all buff-specific bullet spawning logic
   */
  private spawnBulletsForCurrentBuff(): Bullet[] {
    const currentBuff = this.gameState.combat.currentBuff;

    switch (currentBuff) {
      case SpecialBulletType.BubbleTea:
        return this.spawnBubbleTeaBullets();
      case SpecialBulletType.BloodCake:
        return this.spawnTrackingBullet();
      default:
        return this.spawnSingleBullet(currentBuff);
    }
  }

  /**
   * Create upgrade snapshot capturing current upgrade state
   * This snapshot is attached to bullets at creation time to ensure
   * consistent behavior throughout the bullet's lifetime
   *
   * Reads directly from GameStateManager for centralized state access
   */
  private createUpgradeSnapshot(): BulletUpgradeSnapshot {
    const state = this.gameState.upgrades;
    return {
      stinkyTofuDamageBonus: state.stinkyTofuDamageBonus,
      nightMarketChainMultiplier: state.nightMarketChainMultiplier,
      nightMarketDecayReduction: state.nightMarketDecayReduction,
      killThresholdDivisor: state.killThresholdDivisor,
      bloodCakeRangeBonus: state.bloodCakeRangeBonus,
    };
  }

  /**
   * Spawn a single bullet with specified type
   */
  private spawnSingleBullet(bulletType: SpecialBulletType): Bullet[] {
    if (!this.bulletSpawner || !this.player) return [];

    const snapshot = this.createUpgradeSnapshot();
    const bullet = this.bulletSpawner({
      position: this.player.position,
      direction: new Vector(1, 0),
      bulletType,
      upgradeSnapshot: snapshot,
    });

    return [bullet];
  }

  /**
   * Spawn BubbleTea spread bullets (SPEC § 2.3.3, § 2.3.4)
   * Creates 3+ bullets: up (+15°), center (0°), down (-15°), then wider spreads
   */
  private spawnBubbleTeaBullets(): Bullet[] {
    if (!this.bulletSpawner || !this.player) return [];

    const bullets: Bullet[] = [];
    const upgradeState = this.gameState.upgrades;
    const snapshot = this.createUpgradeSnapshot();

    // Base extra bullets + upgrade bonus (SPEC § 2.3.4: 加椰果)
    const baseExtra = RECIPE_CONFIG.bubbleTea.extraBullets;
    const upgradeBonus = upgradeState.bubbleTeaBulletBonus;
    const totalBullets = 1 + baseExtra + upgradeBonus; // center + extras

    const spreadAngle = 15; // degrees between each bullet
    const bulletType = SpecialBulletType.BubbleTea;

    // Generate bullets in a symmetric spread pattern
    // For 3 bullets: up (+15°), center (0°), down (-15°)
    // For 5 bullets: (+30°), (+15°), (0°), (-15°), (-30°)
    const halfBullets = Math.floor(totalBullets / 2);

    for (let i = 0; i < totalBullets; i++) {
      // Calculate angle offset from center
      // i=0 -> top, i=halfBullets -> center, i=totalBullets-1 -> bottom
      const angleOffset = (halfBullets - i) * spreadAngle;
      const radians = (angleOffset * Math.PI) / 180;
      const dir = new Vector(Math.cos(radians), Math.sin(radians));

      const bullet = this.bulletSpawner({
        position: this.player.position,
        direction: dir,
        bulletType,
        upgradeSnapshot: snapshot,
      });
      bullets.push(bullet);
    }

    return bullets;
  }

  /**
   * Spawn BloodCake tracking bullet (SPEC § 2.3.3)
   * Tracks the nearest enemy based on bullet spawn position
   */
  private spawnTrackingBullet(): Bullet[] {
    if (!this.bulletSpawner || !this.player) return [];

    // Create snapshot first to use for initial target finding
    const snapshot = this.createUpgradeSnapshot();

    // Find nearest enemy to track using snapshot's range bonus
    // Initial target is based on bullet spawn position (= player position)
    const baseRange = RECIPE_CONFIG.bloodCake.trackingRange;
    const maxRange = baseRange + snapshot.bloodCakeRangeBonus;
    const target = this.findClosestEnemy(
      this.player.position,
      undefined,
      maxRange,
    );

    const bullet = this.bulletSpawner({
      position: this.player.position,
      direction: new Vector(1, 0),
      bulletType: SpecialBulletType.BloodCake,
      isTracking: true, // Always enable tracking for BloodCake bullets
      trackingTarget: target ?? undefined,
      upgradeSnapshot: snapshot,
    });

    return [bullet];
  }

  /**
   * Get current special bullet buff type
   */
  public getCurrentBuff(): SpecialBulletType {
    return this.gameState.combat.currentBuff;
  }

  /**
   * Get remaining buff time
   */
  public getBuffTimer(): number {
    return this.gameState.combat.buffTimeRemaining;
  }

  /**
   * Check if buff is active
   */
  public isBuffActive(): boolean {
    const combat = this.gameState.combat;
    return (
      combat.currentBuff !== SpecialBulletType.None &&
      combat.buffTimeRemaining > 0
    );
  }

  /**
   * Update shooting cooldown
   */
  private updateShootCooldown(deltaTime: number): void {
    this.shootCooldown = Math.max(0, this.shootCooldown - deltaTime);
  }

  /**
   * Update buff timer (SPEC § 2.3.2)
   */
  private updateBuff(deltaTime: number): void {
    const expired = this.gameState.updateBuffTimer(deltaTime);

    if (expired) {
      // Reset player appearance to base when buff expires
      this.player?.updateAppearanceForBuff(SpecialBulletType.None);

      // GameStateManager already cleared the buff, just publish the event
      this.publishEvent(EventType.BuffExpired, {
        buffType: SpecialBulletType.None, // Already cleared
      });
    }
  }

  /**
   * Check bullet-enemy collisions (SPEC § 2.3.2, § 4.2.5)
   * 使用 AABB 碰撞檢測，根據子彈類型分派至對應處理器
   * Uses Strategy Pattern via CollisionHandlerRegistry
   */
  private checkCollisions(): void {
    for (const bullet of this.bullets) {
      if (!bullet.active) continue;

      // Get handler based on bullet type, not current buff
      const handler = this.collisionRegistry.getHandler(bullet.type);
      if (!handler) continue;

      // Process collision for this bullet
      this.processBulletCollision(bullet, handler);
    }
  }

  /**
   * Process collision for a single bullet
   * @param bullet The bullet to check collisions for
   * @param handler The collision handler for this bullet type
   */
  private processBulletCollision(
    bullet: Bullet,
    handler: CollisionHandler,
  ): void {
    // Determine max pierce count based on handler type
    const maxPierceCount =
      handler instanceof StinkyTofuCollisionHandler
        ? handler.getTotalHits()
        : 1;

    let pierceCount = 0;
    for (const enemy of this.enemies) {
      if (!enemy.active) continue;

      if (this.checkBulletEnemyCollision(bullet, enemy)) {
        const context = this.createCollisionContext(bullet, enemy);
        handler.handle(context);
        pierceCount++;

        // Stop after max pierce count
        if (pierceCount >= maxPierceCount) {
          bullet.active = false;
          break;
        }
      }
    }
  }

  /**
   * Create collision context for handler
   */
  private createCollisionContext(
    bullet: Bullet,
    enemy: Enemy,
  ): CollisionContext {
    return {
      bullet,
      enemy,
      enemies: this.enemies,
      visualEffects: this.visualEffects,
      eventQueue: this.eventQueue,
      gameState: this.gameState,
      applyDamageAndPublishDeath: this.applyDamageAndPublishDeath.bind(this),
      findClosestEnemy: this.findClosestEnemy.bind(this),
    };
  }

  /**
   * Find closest active enemy to a position
   * @param position Reference position (Vector or object with x, y)
   * @param excludeIds Set of enemy IDs to exclude (optional)
   * @param maxRange Maximum distance (optional)
   */
  private findClosestEnemy(
    position: Vector | { x: number; y: number },
    excludeIds?: Set<string>,
    maxRange?: number,
  ): Enemy | null {
    let closest: Enemy | null = null;
    let closestDistance = maxRange ?? Infinity;
    const positionVector =
      position instanceof Vector
        ? position
        : new Vector(position.x, position.y);

    for (const enemy of this.enemies) {
      if (!enemy.active) continue;
      if (excludeIds && excludeIds.has(enemy.id)) continue;

      const distance = enemy.position.distance(positionVector);

      if (distance < closestDistance) {
        closest = enemy;
        closestDistance = distance;
      }
    }

    return closest;
  }

  /**
   * Check AABB collision between bullet and enemy
   */
  private checkBulletEnemyCollision(bullet: Bullet, enemy: Enemy): boolean {
    return checkAABBCollision(
      bullet.position,
      bullet.collisionBox,
      enemy.position,
      enemy.collisionBox,
    );
  }

  /**
   * Apply damage to enemy and publish death event if killed
   */
  private applyDamageAndPublishDeath(enemy: Enemy, damage: number): void {
    const died = enemy.takeDamage(damage);

    // Publish EnemyHit event for audio system
    this.publishEvent(EventType.EnemyHit, {});

    if (died) {
      this.publishEvent(EventType.EnemyDeath, {
        enemyId: enemy.id,
        position: { x: enemy.position.x, y: enemy.position.y },
      });
    }
  }

  /**
   * Handle SynthesisTriggered event (SPEC § 2.3.6)
   */
  private onSynthesisTriggered(data: { recipeId: string }): void {
    // Prevent buff stacking (SPEC § 2.3.2 Error Scenarios)
    if (this.isBuffActive()) {
      return;
    }

    // Map recipe ID to bullet type
    const buffType = this.mapRecipeToBuffType(data.recipeId);
    if (buffType === SpecialBulletType.None) {
      return;
    }

    // Calculate buff duration with 飢餓三十 upgrade bonus
    const durationBonus = this.gameState.upgrades.buffDurationMultiplier;
    const effectiveDuration = this.buffDuration + (durationBonus - 1);

    // Activate buff via GameStateManager
    this.gameState.activateBuff(buffType, effectiveDuration);

    // Update player appearance for the new buff
    this.player?.updateAppearanceForBuff(buffType);

    // Publish BuffExpired event with delay (SPEC § 2.3.6)
    this.publishEvent(
      EventType.BuffExpired,
      { buffType },
      effectiveDuration * 1000,
    );
  }

  /**
   * Map recipe ID (1-5) to buff type (SPEC § 2.3.3)
   */
  private mapRecipeToBuffType(recipeId: string): SpecialBulletType {
    try {
      return recipeData.getBuffType(recipeId);
    } catch {
      return SpecialBulletType.None;
    }
  }
}
