/**
 * Stinky Tofu Collision Handler
 * SPEC § 2.3.3: 臭豆腐 - 貫穿效果
 * Damage: 2 + stinkyTofuDamageBonus (加辣升級)
 * Pierces 1 enemy (hits up to pierceCount + 1 enemies)
 */

import type { CollisionContext } from "../collision-handler";
import { BaseCollisionHandler } from "./base-collision-handler";
import { SpecialBulletType } from "../../core/types";
import { RECIPE_CONFIG } from "../../config";

export class StinkyTofuCollisionHandler extends BaseCollisionHandler {
  readonly bulletType = SpecialBulletType.StinkyTofu;

  handle(context: CollisionContext): void {
    const baseDamage = RECIPE_CONFIG.stinkyTofu.baseDamage;
    const damageBonus = this.getStinkyTofuDamageBonus(context);
    const damage = baseDamage + damageBonus;

    context.applyDamageAndPublishDeath(context.enemy, damage);
    context.visualEffects?.createPierceEffect(context.enemy.position);
    this.applyUniversalHitEffects(context);
  }

  /**
   * Get the total number of enemies this bullet can hit
   * pierceCount = 1 means hit first + pierce through 1 more = 2 total hits
   */
  getTotalHits(): number {
    return RECIPE_CONFIG.stinkyTofu.pierceCount + 1;
  }
}
