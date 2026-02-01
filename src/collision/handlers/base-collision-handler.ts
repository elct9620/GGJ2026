/**
 * Base Collision Handler
 * Provides common functionality for collision handlers
 */

import type { CollisionHandler, CollisionContext } from "../collision-handler";
import type { SpecialBulletType } from "../../values/special-bullet";

/**
 * Abstract base class for collision handlers
 * Provides common hit effect creation
 */
export abstract class BaseCollisionHandler implements CollisionHandler {
  abstract readonly bulletType: SpecialBulletType;
  abstract handle(context: CollisionContext): void;

  /**
   * Create hit effect at enemy position
   */
  protected createHitEffect(context: CollisionContext): void {
    context.visualEffects?.createHitEffect(
      context.enemy.position,
      context.bullet.type,
    );
  }
}
