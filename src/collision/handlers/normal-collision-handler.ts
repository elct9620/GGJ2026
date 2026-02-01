/**
 * Normal Collision Handler
 * SPEC § 2.6.3: Normal bullet - damage 1, consumed on hit
 */

import type { CollisionContext } from "../collision-handler";
import { BaseCollisionHandler } from "./base-collision-handler";
import { SpecialBulletType } from "../../values/special-bullet";

export class NormalCollisionHandler extends BaseCollisionHandler {
  readonly bulletType = SpecialBulletType.None;

  handle(context: CollisionContext): void {
    context.applyDamageAndPublishDeath(context.enemy, context.bullet.damage);
    this.applyUniversalHitEffects(context);
  }
}
