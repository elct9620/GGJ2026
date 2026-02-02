import { Entity } from "./entity";
import { Vector } from "../values/vector";
import type { CollisionBox } from "../values/collision";
import { FoodType } from "../core/types";

/**
 * Food item dropped by enemies
 * Spec: § 2.3.1 Booth System - Food Types
 *
 * Pure data entity - rendering handled by FoodRenderer
 */
export class Food extends Entity {
  public position: Vector;
  public readonly type: FoodType;

  // 統一碰撞大小
  private readonly size = 16;

  constructor(type: FoodType, initialPosition: Vector) {
    super();
    this.type = type;
    this.position = initialPosition;
  }

  /**
   * 碰撞箱（統一大小 16×16 px）
   * SPEC § 4.2.5: AABB 碰撞檢測
   */
  public get collisionBox(): CollisionBox {
    return { width: this.size, height: this.size };
  }

  /**
   * Reset food state for object pool reuse
   */
  public reset(_type: FoodType, position: Vector): void {
    this.active = true;
    // Note: Cannot change readonly type after construction
    // This would need to be handled by creating separate pools per type
    this.position = position;
  }
}
