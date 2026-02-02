/**
 * Base Collision Handler
 * Provides common functionality for collision handlers
 * SPEC § 2.6.3: Universal hit effects (flash, knockback, screen shake)
 */

import type { CollisionHandler, CollisionContext } from "../collision-handler";
import type { SpecialBulletType, HitEffectConfigKey } from "../../core/types";
import type { Enemy } from "../../entities/enemy";
import { hitEffectData, bulletData } from "../../data";

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
   */
  protected applyUniversalHitEffects(context: CollisionContext): void {
    this.applyFlashEffect(context);
    this.applyKnockback(context);
    this.triggerScreenShake(context);
    this.createHitEffect(context);
  }

  /**
   * Apply flash effect to enemy based on bullet type
   * SPEC § 2.6.3: 閃白效果 100~300ms
   * Flash effect stored in GameState for EnemyRenderer to consume
   */
  protected applyFlashEffect(context: CollisionContext): void {
    const configKey = this.getConfigKey();
    const config = hitEffectData.getFlash(configKey);
    context.gameState.setEnemyFlashEffect(context.enemy.id, {
      color: config.color,
      duration: config.duration,
    });
  }

  /**
   * Apply knockback effect to enemy
   * Universal: 15px rightward displacement over 80ms
   */
  protected applyKnockback(context: CollisionContext): void {
    const { distance, duration } = hitEffectData.knockback;
    context.enemy.applyKnockback(distance, duration);
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
  protected createHitEffect(context: CollisionContext): void {
    context.visualEffects?.createHitEffect(
      context.enemy.position,
      context.bullet.type,
    );
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
   * Get stinky tofu damage bonus (加辣升級)
   * SPEC § 2.3.3: 臭豆腐傷害加成
   */
  protected getStinkyTofuDamageBonus(context: CollisionContext): number {
    return (
      context.bullet.upgradeSnapshot?.stinkyTofuDamageBonus ??
      context.gameState.upgrades.stinkyTofuDamageBonus
    );
  }

  /**
   * Get night market chain multiplier (總匯吃到飽升級)
   * SPEC § 2.3.3: 連鎖目標數乘數
   */
  protected getNightMarketChainMultiplier(context: CollisionContext): number {
    return (
      context.bullet.upgradeSnapshot?.nightMarketChainMultiplier ??
      context.gameState.upgrades.nightMarketChainMultiplier
    );
  }

  /**
   * Get night market decay reduction (總匯吃到飽升級)
   * SPEC § 2.3.3: 連鎖傷害衰減減少
   */
  protected getNightMarketDecayReduction(context: CollisionContext): number {
    return (
      context.bullet.upgradeSnapshot?.nightMarketDecayReduction ??
      context.gameState.upgrades.nightMarketDecayReduction
    );
  }

  /**
   * Get kill threshold divisor (快吃升級)
   * SPEC § 2.3.3: 蚵仔煎百分比傷害加成
   */
  protected getKillThresholdDivisor(context: CollisionContext): number {
    return (
      context.bullet.upgradeSnapshot?.killThresholdDivisor ??
      context.gameState.upgrades.killThresholdDivisor
    );
  }

  // ─────────────────────────────────────────────────────────────────
  // Universal Hit Effects (for chain attacks)
  // ─────────────────────────────────────────────────────────────────

  /**
   * Apply universal hit effects to a specific enemy
   * Used by chain attacks where effects are applied to multiple enemies
   * SPEC § 2.6.3: 通用視覺效果規則
   */
  protected applyUniversalHitEffectsToEnemy(
    context: CollisionContext,
    enemy: Enemy,
  ): void {
    const configKey = bulletData.getHitEffectConfigKey(this.bulletType);

    // Flash effect stored in GameState for EnemyRenderer
    const flashConfig = hitEffectData.getFlash(configKey);
    context.gameState.setEnemyFlashEffect(enemy.id, {
      color: flashConfig.color,
      duration: flashConfig.duration,
    });

    // Knockback
    const { distance, duration } = hitEffectData.knockback;
    enemy.applyKnockback(distance, duration);

    // Screen shake
    const shakeConfig = hitEffectData.getScreenShake(configKey);
    context.visualEffects?.triggerScreenShake(
      shakeConfig.magnitude,
      shakeConfig.duration,
    );

    // Hit effect
    context.visualEffects?.createHitEffect(enemy.position, this.bulletType);
  }
}
