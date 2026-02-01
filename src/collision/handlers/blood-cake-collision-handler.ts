/**
 * Blood Cake Collision Handler
 * SPEC § 2.3.3: 豬血糕 - 追蹤 + 減速
 * Damage: 2, tracks nearest enemy, applies -10% speed debuff on hit
 */

import type { CollisionContext } from "../collision-handler";
import { BaseCollisionHandler } from "./base-collision-handler";
import { SpecialBulletType } from "../../values/special-bullet";
import { RECIPE_CONFIG } from "../../config";

export class BloodCakeCollisionHandler extends BaseCollisionHandler {
  readonly bulletType = SpecialBulletType.BloodCake;

  handle(context: CollisionContext): void {
    const damage = RECIPE_CONFIG.bloodCake.baseDamage;
    const slowPercent = RECIPE_CONFIG.bloodCake.slowEffect;

    context.applyDamageAndPublishDeath(context.enemy, damage);
    this.createHitEffect(context);

    // Apply slow debuff if enemy survived
    if (context.enemy.active) {
      context.enemy.applySlowDebuff(slowPercent);
    }
  }
}
