/**
 * Night Market Collision Handler
 * SPEC § 2.3.3: 夜市總匯 - 連鎖攻擊
 * Damage: 2, chains 5 targets × chainMultiplier, -20% + decayReduction per hit
 * 總匯吃到飽升級增加連鎖數並減少衰減
 */

import type { CollisionContext } from "../collision-handler";
import { BaseCollisionHandler } from "./base-collision-handler";
import { SpecialBulletType } from "../../core/types";
import { RECIPE_CONFIG } from "../../config";
import { hitEffectData } from "../../data";
import type { Enemy } from "../../entities/enemy";

export class NightMarketCollisionHandler extends BaseCollisionHandler {
  readonly bulletType = SpecialBulletType.NightMarket;

  private static readonly CHAIN_RANGE = 300; // Maximum chain distance in pixels

  handle(context: CollisionContext): void {
    const baseDamage = RECIPE_CONFIG.nightMarket.baseDamage;
    const baseChainTargets = RECIPE_CONFIG.nightMarket.chainTargets;
    const baseDecay = RECIPE_CONFIG.nightMarket.chainDamageDecay;

    // Use snapshot if available, fallback to centralized GameState
    const chainMultiplier =
      context.bullet.upgradeSnapshot?.nightMarketChainMultiplier ??
      context.gameState.upgrades.nightMarketChainMultiplier;
    const decayReduction =
      context.bullet.upgradeSnapshot?.nightMarketDecayReduction ??
      context.gameState.upgrades.nightMarketDecayReduction;

    const chainTargets = Math.floor(baseChainTargets * chainMultiplier);
    const damageDecay = Math.max(0, baseDecay - decayReduction);

    // Start chain attack from first hit
    this.performChainAttack(
      context,
      context.enemy,
      baseDamage,
      chainTargets,
      damageDecay,
      NightMarketCollisionHandler.CHAIN_RANGE,
    );
  }

  /**
   * Perform chain attack for NightMarket buff
   * @param context Collision context
   * @param firstTarget First enemy hit
   * @param baseDamage Starting damage
   * @param maxTargets Maximum targets to chain
   * @param decayRate Damage decay per hit (0.2 = -20%)
   * @param maxRange Maximum chain distance
   */
  private performChainAttack(
    context: CollisionContext,
    firstTarget: Enemy,
    baseDamage: number,
    maxTargets: number,
    decayRate: number,
    maxRange: number,
  ): void {
    const hitEnemies = new Set<string>();
    let currentTarget: Enemy | null = firstTarget;
    let previousTarget: Enemy | null = null;
    let currentDamage = baseDamage;

    // Get flash config for chain hits
    const flashConfig = hitEffectData.getFlash("nightMarket");
    const knockbackConfig = hitEffectData.knockback;
    const shakeConfig = hitEffectData.getScreenShake("nightMarket");

    for (let i = 0; i < maxTargets && currentTarget !== null; i++) {
      // Create chain lightning effect from previous to current target
      if (previousTarget && context.visualEffects) {
        context.visualEffects.createChainEffect(
          previousTarget.position,
          currentTarget.position,
        );
      }

      // Apply damage to current target
      context.applyDamageAndPublishDeath(
        currentTarget,
        Math.round(currentDamage),
      );

      // Apply universal hit effects for each chain target
      currentTarget.flashHit(flashConfig.color, flashConfig.duration);
      currentTarget.applyKnockback(
        knockbackConfig.distance,
        knockbackConfig.duration,
      );
      context.visualEffects?.triggerScreenShake(
        shakeConfig.magnitude,
        shakeConfig.duration,
      );
      context.visualEffects?.createHitEffect(
        currentTarget.position,
        SpecialBulletType.NightMarket,
      );

      hitEnemies.add(currentTarget.id);

      // Apply damage decay for next hit
      currentDamage = currentDamage * (1 - decayRate);

      // Move to next target
      previousTarget = currentTarget;
      currentTarget = context.findClosestEnemy(
        currentTarget.position,
        hitEnemies,
        maxRange,
      );
    }
  }
}
