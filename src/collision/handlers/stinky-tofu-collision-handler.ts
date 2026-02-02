/**
 * Stinky Tofu Collision Handler
 * SPEC § 2.3.3: 臭豆腐 - 貫穿效果
 * Damage: 2 + stinkyTofuDamageBonus (加辣升級)
 * Pierce count is determined by Bullet.maxPierceCount (data-driven)
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
}
