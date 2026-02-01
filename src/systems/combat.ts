/**
 * Combat System
 * SPEC § 2.3.2: 管理玩家射擊、碰撞檢測、特殊子彈 Buff
 */

import { InjectableSystem } from "../core/systems/injectable";
import { SystemPriority } from "../core/systems/system.interface";
import type { Player } from "../entities/player";
import type { Bullet } from "../entities/bullet";
import { Enemy, EnemyType, isEliteType } from "../entities/enemy";
import type { EventQueue } from "./event-queue";
import { EventType } from "./event-queue";
import { checkAABBCollision } from "../values/collision";
import { RECIPE_BUFF_MAPPING } from "../values/recipes";
import { SpecialBulletType } from "../values/special-bullet";
import { Damage } from "../values/damage";
import { COMBAT_CONFIG, RECIPE_CONFIG } from "../config";
import { DependencyKeys } from "../core/systems/dependency-keys";
import type { UpgradeSystem } from "./upgrade";
import type { GameStateManager } from "../core/game-state";
import { Vector } from "../values/vector";

// Re-export for backwards compatibility
export { SpecialBulletType } from "../values/special-bullet";

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
}

/**
 * Bullet spawner callback type
 * GameScene implements this to handle Container management
 */
export type BulletSpawner = (request: BulletSpawnRequest) => Bullet;

/**
 * 碰撞效果處理器類型
 * 只負責傷害計算與效果應用，不管迴圈邏輯
 */
type HitEffect = (bullet: Bullet, enemy: Enemy) => void;

/**
 * 貫穿效果處理器回傳值
 * 用於決定是否繼續貫穿
 */
type PierceHitResult = { consumed: boolean };

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

  constructor() {
    super();
    this.declareDependency(DependencyKeys.EventQueue, false); // Optional for testing
    this.declareDependency(DependencyKeys.UpgradeSystem, false); // Optional for testing
    this.declareDependency(DependencyKeys.GameState); // Required
  }

  /**
   * Get EventQueue dependency (optional)
   */
  private get eventQueue(): EventQueue | null {
    return this.getOptionalDependency<EventQueue>(DependencyKeys.EventQueue);
  }

  /**
   * Get UpgradeSystem dependency (optional)
   */
  private get upgradeSystem(): UpgradeSystem | null {
    return this.getOptionalDependency<UpgradeSystem>(
      DependencyKeys.UpgradeSystem,
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

      // Check if reload was triggered (SPEC § 2.3.2)
      if (this.player.isReloading && this.eventQueue) {
        this.eventQueue.publish(
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
   * Spawn a single bullet with specified type
   */
  private spawnSingleBullet(bulletType: SpecialBulletType): Bullet[] {
    if (!this.bulletSpawner || !this.player) return [];

    const bullet = this.bulletSpawner({
      position: this.player.position,
      direction: new Vector(1, 0),
      bulletType,
    });

    return [bullet];
  }

  /**
   * Spawn BubbleTea spread bullets (SPEC § 2.3.3, § 2.3.4)
   * Creates 3+ bullets: center + extra at alternating ±15°, ±30°, etc.
   */
  private spawnBubbleTeaBullets(): Bullet[] {
    if (!this.bulletSpawner || !this.player) return [];

    const bullets: Bullet[] = [];
    const upgradeState = this.upgradeSystem?.getState();

    // Base extra bullets + upgrade bonus (SPEC § 2.3.4: 加椰果)
    const baseExtra = RECIPE_CONFIG.bubbleTea.extraBullets;
    const upgradeBonus = upgradeState?.bubbleTeaBulletBonus ?? 0;
    const totalExtraBullets = baseExtra + upgradeBonus;

    const spreadAngle = 15; // degrees
    const bulletType = SpecialBulletType.BubbleTea;

    // Center bullet
    const centerBullet = this.bulletSpawner({
      position: this.player.position,
      direction: new Vector(1, 0),
      bulletType,
    });
    bullets.push(centerBullet);

    // Extra spread bullets (alternating left/right at increasing angles)
    for (let i = 0; i < totalExtraBullets; i++) {
      const angleIndex = Math.floor(i / 2) + 1;
      const directionSign = i % 2 === 0 ? 1 : -1;
      const angleOffset = spreadAngle * angleIndex * directionSign;
      const radians = (angleOffset * Math.PI) / 180;
      const dir = new Vector(Math.cos(radians), Math.sin(radians));

      const bullet = this.bulletSpawner({
        position: this.player.position,
        direction: dir,
        bulletType,
      });
      bullets.push(bullet);
    }

    return bullets;
  }

  /**
   * Spawn BloodCake tracking bullet (SPEC § 2.3.3)
   * Tracks the nearest enemy
   */
  private spawnTrackingBullet(): Bullet[] {
    if (!this.bulletSpawner || !this.player) return [];

    // Find nearest enemy to track
    const target = this.findNearestEnemyToPlayer();

    const bullet = this.bulletSpawner({
      position: this.player.position,
      direction: new Vector(1, 0),
      bulletType: SpecialBulletType.BloodCake,
      isTracking: target !== null,
      trackingTarget: target ?? undefined,
    });

    return [bullet];
  }

  /**
   * Find the nearest active enemy to the player
   */
  private findNearestEnemyToPlayer(): Enemy | null {
    if (!this.player) return null;

    let nearest: Enemy | null = null;
    let minDistance = Infinity;

    for (const enemy of this.enemies) {
      if (!enemy.active) continue;

      const distance = enemy.position.distance(this.player.position);

      if (distance < minDistance) {
        nearest = enemy;
        minDistance = distance;
      }
    }

    return nearest;
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

    if (expired && this.eventQueue) {
      // GameStateManager already cleared the buff, just publish the event
      this.eventQueue.publish(EventType.BuffExpired, {
        buffType: SpecialBulletType.None, // Already cleared
      });
    }
  }

  /**
   * Check bullet-enemy collisions (SPEC § 2.3.2, § 4.2.5)
   * 使用 AABB 碰撞檢測，根據當前 Buff 分派至對應處理器
   */
  private checkCollisions(): void {
    const currentBuff = this.gameState.combat.currentBuff;

    switch (currentBuff) {
      case SpecialBulletType.NightMarket:
        this.handleNightMarketCollision();
        break;
      case SpecialBulletType.StinkyTofu:
        this.handleStinkyTofuCollision();
        break;
      case SpecialBulletType.BloodCake:
        this.handleBloodCakeCollision();
        break;
      case SpecialBulletType.OysterOmelette:
        this.handleOysterOmeletteCollision();
        break;
      default:
        this.handleNormalCollision();
    }
  }

  /**
   * 通用碰撞處理：擊中第一個敵人後停止
   * 4 個 handler (Normal, OysterOmelette, BloodCake, NightMarket) 共用此迴圈
   */
  private processFirstHitCollision(effect: HitEffect): void {
    this.processPierceCollision(1, (bullet, enemy) => {
      effect(bullet, enemy);
      return { consumed: true };
    });
  }

  /**
   * 貫穿碰撞處理：子彈可穿透多個敵人
   * @param maxPierceCount 最大貫穿次數（1 = 第一次命中後消耗）
   * @param effect 每次命中時的效果處理器，回傳 consumed 決定是否消耗子彈
   */
  private processPierceCollision(
    maxPierceCount: number,
    effect: (bullet: Bullet, enemy: Enemy) => PierceHitResult,
  ): void {
    for (const bullet of this.bullets) {
      if (!bullet.active) continue;

      let pierceCount = 0;
      for (const enemy of this.enemies) {
        if (!enemy.active) continue;

        if (this.checkBulletEnemyCollision(bullet, enemy)) {
          const result = effect(bullet, enemy);
          pierceCount++;

          // 當效果要求消耗或達到最大貫穿次數時，停止此子彈
          if (result.consumed || pierceCount >= maxPierceCount) {
            bullet.active = false;
            break;
          }
        }
      }
    }
  }

  /**
   * Normal bullet collision (SPEC § 2.6.3)
   * Damage: 1, consumed on hit
   */
  private handleNormalCollision(): void {
    this.processFirstHitCollision((bullet, enemy) => {
      this.applyDamageAndPublishDeath(enemy, bullet.damage);
    });
  }

  /**
   * StinkyTofu (臭豆腐) - 貫穿效果 (SPEC § 2.3.3)
   * Damage: 2 + stinkyTofuDamageBonus (加辣升級)
   * Pierces 1 enemy (hits up to pierceCount + 1 enemies)
   */
  private handleStinkyTofuCollision(): void {
    const baseDamage = RECIPE_CONFIG.stinkyTofu.baseDamage;
    const damageBonus =
      this.upgradeSystem?.getState().stinkyTofuDamageBonus ?? 0;
    const damage = baseDamage + damageBonus;
    // pierceCount = 1 means hit first + pierce through 1 more = 2 total hits
    const totalHits = RECIPE_CONFIG.stinkyTofu.pierceCount + 1;

    this.processPierceCollision(totalHits, (_bullet, enemy) => {
      this.applyDamageAndPublishDeath(enemy, damage);
      return { consumed: false }; // Never consume early, let pierce count handle it
    });
  }

  /**
   * OysterOmelette (蚵仔煎) - 百分比傷害 (SPEC § 2.3.3)
   * Boss: 10% HP, Elite: 50% HP, Ghost: 70% HP
   */
  private handleOysterOmeletteCollision(): void {
    this.processFirstHitCollision((_bullet, enemy) => {
      const percentDamage = this.calculatePercentDamage(enemy);
      this.applyDamageAndPublishDeath(enemy, percentDamage.toNumber());
    });
  }

  /**
   * BloodCake (豬血糕) - 追蹤 + 減速 (SPEC § 2.3.3)
   * Damage: 2, tracks nearest enemy, applies -10% speed debuff on hit
   */
  private handleBloodCakeCollision(): void {
    const damage = RECIPE_CONFIG.bloodCake.baseDamage;
    const slowPercent = RECIPE_CONFIG.bloodCake.slowEffect;

    this.processFirstHitCollision((_bullet, enemy) => {
      this.applyDamageAndPublishDeath(enemy, damage);

      // Apply slow debuff if enemy survived
      if (enemy.active) {
        enemy.applySlowDebuff(slowPercent);
      }
    });
  }

  /**
   * NightMarket (夜市總匯) - 連鎖攻擊 (SPEC § 2.3.3)
   * Damage: 2, chains 5 targets × chainMultiplier, -20% + decayReduction per hit
   * 總匯吃到飽升級增加連鎖數並減少衰減
   */
  private handleNightMarketCollision(): void {
    const baseDamage = RECIPE_CONFIG.nightMarket.baseDamage;
    const baseChainTargets = RECIPE_CONFIG.nightMarket.chainTargets;
    const baseDecay = RECIPE_CONFIG.nightMarket.chainDamageDecay;
    const chainRange = 300; // Maximum chain distance in pixels

    // 總匯吃到飽 upgrade effects
    const chainMultiplier =
      this.upgradeSystem?.getState().nightMarketChainMultiplier ?? 1;
    const decayReduction =
      this.upgradeSystem?.getState().nightMarketDecayReduction ?? 0;

    const chainTargets = Math.floor(baseChainTargets * chainMultiplier);
    const damageDecay = Math.max(0, baseDecay - decayReduction);

    this.processFirstHitCollision((_bullet, enemy) => {
      // Start chain attack from first hit
      this.performChainAttack(
        enemy,
        baseDamage,
        chainTargets,
        damageDecay,
        chainRange,
      );
    });
  }

  /**
   * Perform chain attack for NightMarket buff
   * @param firstTarget First enemy hit
   * @param baseDamage Starting damage
   * @param maxTargets Maximum targets to chain
   * @param decayRate Damage decay per hit (0.2 = -20%)
   * @param maxRange Maximum chain distance
   */
  private performChainAttack(
    firstTarget: Enemy,
    baseDamage: number,
    maxTargets: number,
    decayRate: number,
    maxRange: number,
  ): void {
    const hitEnemies = new Set<string>();
    let currentTarget: Enemy | null = firstTarget;
    let currentDamage = baseDamage;

    for (let i = 0; i < maxTargets && currentTarget !== null; i++) {
      // Apply damage to current target
      this.applyDamageAndPublishDeath(currentTarget, Math.round(currentDamage));
      hitEnemies.add(currentTarget.id);

      // Apply damage decay for next hit
      currentDamage = currentDamage * (1 - decayRate);

      // Find next closest enemy within range
      currentTarget = this.findClosestEnemy(
        currentTarget.position,
        hitEnemies,
        maxRange,
      );
    }
  }

  /**
   * Find closest active enemy to a position
   * @param position Reference position
   * @param excludeIds Set of enemy IDs to exclude
   * @param maxRange Maximum distance (optional)
   */
  private findClosestEnemy(
    position: { x: number; y: number },
    excludeIds: Set<string>,
    maxRange?: number,
  ): Enemy | null {
    let closest: Enemy | null = null;
    let closestDistance = maxRange ?? Infinity;
    const positionVector = new Vector(position.x, position.y);

    for (const enemy of this.enemies) {
      if (!enemy.active || excludeIds.has(enemy.id)) continue;

      const distance = enemy.position.distance(positionVector);

      if (distance < closestDistance) {
        closest = enemy;
        closestDistance = distance;
      }
    }

    return closest;
  }

  /**
   * Calculate percentage damage based on enemy type (SPEC § 2.3.3)
   * 蚵仔煎：Boss 10% 當前 HP, 菁英 50% 當前 HP, 小怪 70% 當前 HP
   * 快吃升級增加百分比傷害
   */
  private calculatePercentDamage(enemy: Enemy): Damage {
    const { bossDamagePercent, eliteDamagePercent, ghostDamagePercent } =
      RECIPE_CONFIG.oysterOmelet;

    // 快吃 upgrade bonus (killThresholdDivisor adds +10% per stack)
    const damageBonus =
      this.upgradeSystem?.getState().killThresholdDivisor ?? 1;
    const bonusPercent = damageBonus - 1; // Convert multiplier to bonus (1 = no bonus)

    let percentage: number;
    if (enemy.type === EnemyType.Boss) {
      percentage = bossDamagePercent + bonusPercent;
    } else if (isEliteType(enemy.type)) {
      percentage = eliteDamagePercent + bonusPercent;
    } else {
      percentage = ghostDamagePercent + bonusPercent;
    }

    return Damage.fromPercentage(enemy.health, percentage);
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

    if (died && this.eventQueue) {
      this.eventQueue.publish(EventType.EnemyDeath, {
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
    const durationBonus =
      this.upgradeSystem?.getState().buffDurationMultiplier ?? 1;
    const effectiveDuration = this.buffDuration + (durationBonus - 1);

    // Activate buff via GameStateManager
    this.gameState.activateBuff(buffType, effectiveDuration);

    // Publish BuffExpired event with delay (SPEC § 2.3.6)
    if (this.eventQueue) {
      this.eventQueue.publish(
        EventType.BuffExpired,
        { buffType },
        effectiveDuration * 1000,
      );
    }
  }

  /**
   * Map recipe ID (1-5) to buff type (SPEC § 2.3.3)
   */
  private mapRecipeToBuffType(recipeId: string): SpecialBulletType {
    return RECIPE_BUFF_MAPPING[recipeId] ?? SpecialBulletType.None;
  }
}
