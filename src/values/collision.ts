/**
 * Collision System - AABB 碰撞檢測
 * SPEC § 4.2.5: AABB 碰撞檢測
 */

/**
 * 碰撞箱介面
 * 定義實體的碰撞區域大小
 */
export interface CollisionBox {
  width: number;
  height: number;
}

/**
 * AABB 碰撞檢測（假設 anchor 在中心）
 * @param posA 實體 A 的位置（中心點）
 * @param boxA 實體 A 的碰撞箱
 * @param posB 實體 B 的位置（中心點）
 * @param boxB 實體 B 的碰撞箱
 * @returns 是否發生碰撞
 */
export function checkAABBCollision(
  posA: { x: number; y: number },
  boxA: CollisionBox,
  posB: { x: number; y: number },
  boxB: CollisionBox,
): boolean {
  const dx = Math.abs(posA.x - posB.x);
  const dy = Math.abs(posA.y - posB.y);
  const overlapX = (boxA.width + boxB.width) / 2;
  const overlapY = (boxA.height + boxB.height) / 2;
  return dx < overlapX && dy < overlapY;
}
