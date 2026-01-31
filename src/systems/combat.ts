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

// Re-export for backwards compatibility
export { SpecialBulletType } from "../values/special-bullet";

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
 */
export class CombatSystem extends InjectableSystem {
  public readonly name = "CombatSystem";
  public readonly priority = SystemPriority.COMBAT;

  // References to game entities (not injectable - set via setters)
  private player: Player | null = null;
  private bullets: Bullet[] = [];
  private enemies: Enemy[] = [];

  // Shooting cooldown (SPEC § 2.3.2)
  private shootCooldown = 0;
  private readonly shootCooldownTime = COMBAT_CONFIG.shootCooldown;

  // Special bullet buff state (SPEC § 2.3.2)
  private currentBuff: SpecialBulletType = SpecialBulletType.None;
  private buffTimer = 0;
  private readonly buffDuration = COMBAT_CONFIG.buffDuration;

  constructor() {
    super();
    this.declareDependency(DependencyKeys.EventQueue, false); // Optional for testing
  }

  /**
   * Get EventQueue dependency (optional)
   */
  private get eventQueue(): EventQueue | null {
    if (this.hasDependency(DependencyKeys.EventQueue)) {
      return this.getDependency<EventQueue>(DependencyKeys.EventQueue);
    }
    return null;
  }

  /**
   * Initialize combat system
   */
  public initialize(): void {
    this.shootCooldown = 0;
    this.currentBuff = SpecialBulletType.None;
    this.buffTimer = 0;
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
   * Get current special bullet buff type
   */
  public getCurrentBuff(): SpecialBulletType {
    return this.currentBuff;
  }

  /**
   * Get remaining buff time
   */
  public getBuffTimer(): number {
    return this.buffTimer;
  }

  /**
   * Check if buff is active
   */
  public isBuffActive(): boolean {
    return this.currentBuff !== SpecialBulletType.None && this.buffTimer > 0;
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
    if (this.buffTimer > 0) {
      this.buffTimer -= deltaTime;

      if (this.buffTimer <= 0) {
        // Buff expired
        const expiredBuff = this.currentBuff;
        this.currentBuff = SpecialBulletType.None;
        this.buffTimer = 0;

        // Publish BuffExpired event (SPEC § 2.3.6)
        if (this.eventQueue) {
          this.eventQueue.publish(EventType.BuffExpired, {
            buffType: expiredBuff,
          });
        }
      }
    }
  }

  /**
   * Check bullet-enemy collisions (SPEC § 2.3.2, § 4.2.5)
   * 使用 AABB 碰撞檢測，根據當前 Buff 分派至對應處理器
   */
  private checkCollisions(): void {
    switch (this.currentBuff) {
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
   * Damage: 2, pierces 1 enemy (hits up to pierceCount + 1 enemies)
   */
  private handleStinkyTofuCollision(): void {
    const damage = RECIPE_CONFIG.stinkyTofu.baseDamage;
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
   * Damage: 2, chains 5 targets, -20% damage per hit
   */
  private handleNightMarketCollision(): void {
    const baseDamage = RECIPE_CONFIG.nightMarket.baseDamage;
    const chainTargets = RECIPE_CONFIG.nightMarket.chainTargets;
    const damageDecay = RECIPE_CONFIG.nightMarket.chainDamageDecay;
    const chainRange = 300; // Maximum chain distance in pixels

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

    for (const enemy of this.enemies) {
      if (!enemy.active || excludeIds.has(enemy.id)) continue;

      const dx = enemy.position.x - position.x;
      const dy = enemy.position.y - position.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance < closestDistance) {
        closest = enemy;
        closestDistance = distance;
      }
    }

    return closest;
  }

  /**
   * Calculate percentage damage based on enemy type (SPEC § 2.3.3)
   */
  private calculatePercentDamage(enemy: Enemy): Damage {
    const { bossDamagePercent, eliteDamagePercent, ghostDamagePercent } =
      RECIPE_CONFIG.oysterOmelet;

    let percentage: number;
    if (enemy.type === EnemyType.Boss) {
      percentage = bossDamagePercent;
    } else if (isEliteType(enemy.type)) {
      percentage = eliteDamagePercent;
    } else {
      percentage = ghostDamagePercent;
    }

    return Damage.fromPercentage(enemy.maxHealth, percentage);
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

    // Activate buff
    this.currentBuff = buffType;
    this.buffTimer = this.buffDuration;

    // Publish BuffExpired event with delay (SPEC § 2.3.6)
    if (this.eventQueue) {
      this.eventQueue.publish(
        EventType.BuffExpired,
        { buffType },
        this.buffDuration * 1000,
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
