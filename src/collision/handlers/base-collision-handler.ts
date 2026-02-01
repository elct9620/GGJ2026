/**
 * Base Collision Handler
 * Provides common functionality for collision handlers
 * SPEC § 2.6.3: Universal hit effects (flash, knockback, screen shake)
 */

import type { CollisionHandler, CollisionContext } from "../collision-handler";
import type { SpecialBulletType, HitEffectConfigKey } from "../../core/types";
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
}
