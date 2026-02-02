/**
 * Base Collision Handler
 * Provides common functionality for collision handlers
 * SPEC § 2.6.3: Universal hit effects (flash, knockback, screen shake)
 */

import type { CollisionHandler, CollisionContext } from "../collision-handler";
import type { SpecialBulletType, HitEffectConfigKey } from "../../core/types";
import type { Enemy } from "../../entities/enemy";
import { hitEffectData, bulletData } from "../../data";
import type { BulletUpgradeSnapshot } from "../../values/bullet-upgrade-snapshot";

/**
 * Abstract base class for collision handlers
 * Provides common hit effect creation and universal hit effects
 */
export abstract class BaseCollisionHandler implements CollisionHandler {
  abstract readonly bulletType: SpecialBulletType;
  abstract handle(context: CollisionContext): void;

  /**
   * Apply universal hit effects: flash, knockback, screen shake, hit visual
   * All collision handlers should call this after applying damage
   * SPEC § 2.6.3: 通用視覺效果規則
   * @param context Collision context
   * @param enemy Optional enemy to apply effects to (defaults to context.enemy)
   */
  protected applyUniversalHitEffects(
    context: CollisionContext,
    enemy: Enemy = context.enemy,
  ): void {
    this.applyFlashEffect(context, enemy);
    this.applyKnockback(context, enemy);
    this.triggerScreenShake(context);
    this.createHitEffect(context, enemy);
  }

  /**
   * Apply flash effect to enemy based on bullet type
   * SPEC § 2.6.3: 閃白效果 100~300ms
   * Flash effect stored in GameState for EnemyRenderer to consume
   */
  protected applyFlashEffect(
    context: CollisionContext,
    enemy: Enemy = context.enemy,
  ): void {
    const configKey = this.getConfigKey();
    const config = hitEffectData.getFlash(configKey);
    context.gameState.setEnemyFlashEffect(enemy.id, {
      color: config.color,
      duration: config.duration,
    });
  }

  /**
   * Apply knockback effect to enemy
   * Universal: 15px rightward displacement over 80ms
   */
  protected applyKnockback(
    context: CollisionContext,
    enemy: Enemy = context.enemy,
  ): void {
    const { distance, duration } = hitEffectData.knockback;
    enemy.applyKnockback(distance, duration);
  }

  /**
   * Trigger screen shake effect based on bullet type
   * SPEC § 2.6.3: 螢幕震動（所有子彈）
   */
  protected triggerScreenShake(context: CollisionContext): void {
    const configKey = this.getConfigKey();
    const config = hitEffectData.getScreenShake(configKey);
    context.visualEffects?.triggerScreenShake(
      config.magnitude,
      config.duration,
    );
  }

  /**
   * Create hit effect at enemy position
   */
  protected createHitEffect(
    context: CollisionContext,
    enemy: Enemy = context.enemy,
  ): void {
    context.visualEffects?.createHitEffect(enemy.position, context.bullet.type);
  }

  /**
   * Get config key based on bullet type
   * Uses BulletData for centralized property lookup
   */
  private getConfigKey(): HitEffectConfigKey {
    return bulletData.getHitEffectConfigKey(this.bulletType);
  }

  // ─────────────────────────────────────────────────────────────────
  // Upgrade Value Accessors
  // Snapshot-first pattern: use bullet's upgrade snapshot if available,
  // otherwise fallback to centralized GameState
  // ─────────────────────────────────────────────────────────────────

  /**
   * Get upgrade value with snapshot-first pattern
   * Uses BulletUpgradeSnapshot keys (subset of UpgradeState)
   */
  protected getUpgradeValue<K extends keyof BulletUpgradeSnapshot>(
    context: CollisionContext,
    key: K,
  ): BulletUpgradeSnapshot[K] {
    return (
      context.bullet.upgradeSnapshot?.[key] ?? context.gameState.upgrades[key]
    );
  }

  /**
   * Get stinky tofu damage bonus (加辣升級)
   * SPEC § 2.3.3: 臭豆腐傷害加成
   */
  protected getStinkyTofuDamageBonus(context: CollisionContext): number {
    return this.getUpgradeValue(context, "stinkyTofuDamageBonus");
  }

  /**
   * Get night market chain multiplier (總匯吃到飽升級)
   * SPEC § 2.3.3: 連鎖目標數乘數
   */
  protected getNightMarketChainMultiplier(context: CollisionContext): number {
    return this.getUpgradeValue(context, "nightMarketChainMultiplier");
  }

  /**
   * Get night market decay reduction (總匯吃到飽升級)
   * SPEC § 2.3.3: 連鎖傷害衰減減少
   */
  protected getNightMarketDecayReduction(context: CollisionContext): number {
    return this.getUpgradeValue(context, "nightMarketDecayReduction");
  }

  /**
   * Get kill threshold divisor (快吃升級)
   * SPEC § 2.3.3: 蚵仔煎百分比傷害加成
   */
  protected getKillThresholdDivisor(context: CollisionContext): number {
    return this.getUpgradeValue(context, "killThresholdDivisor");
  }
}
