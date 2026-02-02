/**
 * Oyster Omelette Collision Handler
 * SPEC § 2.3.3: 蚵仔煎 - 百分比傷害
 * Boss: 10% HP, Elite: 50% HP, Ghost: 70% HP
 */

import type { CollisionContext } from "../collision-handler";
import { BaseCollisionHandler } from "./base-collision-handler";
import { SpecialBulletType, getEnemyCategory } from "../../core/types";
import { getOysterOmeletDamagePercent } from "../../config";
import { Damage } from "../../values/damage";

export class OysterOmeletteCollisionHandler extends BaseCollisionHandler {
  readonly bulletType = SpecialBulletType.OysterOmelette;

  handle(context: CollisionContext): void {
    const percentDamage = this.calculatePercentDamage(context);
    context.applyDamageAndPublishDeath(context.enemy, percentDamage.toNumber());
    context.visualEffects?.createExplosionEffect(context.enemy.position);
    this.applyUniversalHitEffects(context);
  }

  /**
   * Calculate percentage damage based on enemy type (SPEC § 2.3.3)
   * 蚵仔煎：Boss 10% 當前 HP, 菁英 50% 當前 HP, 小怪 70% 當前 HP
   * 快吃升級增加百分比傷害
   */
  private calculatePercentDamage(context: CollisionContext): Damage {
    const category = getEnemyCategory(context.enemy.type);
    const basePercent = getOysterOmeletDamagePercent(category);

    const damageBonus = this.getKillThresholdDivisor(context);
    const bonusPercent = damageBonus - 1; // Convert multiplier to bonus (1 = no bonus)

    const percentage = basePercent + bonusPercent;

    return Damage.fromPercentage(context.enemy.health.current, percentage);
  }
}
