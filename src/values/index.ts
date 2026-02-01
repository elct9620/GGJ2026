/**
 * Value Objects Barrel Export
 *
 * 統一匯出所有值物件，方便引用
 *
 * NOTE: Data Catalogs (BulletData, EnemyData, RecipeData, etc.) should be
 * imported directly from "src/data" instead of this module.
 */

// 幾何相關
export { Vector } from "./vector";
export type { CollisionBox } from "./collision";

// 遊戲數值
export { Damage } from "./damage";
export { Health } from "./health";
export { Ammo } from "./ammo";

// 核心型別 (re-export from core/types for convenience)
export {
  EnemyType,
  isEliteType,
  SpecialBulletType,
  FoodType,
  BoothId,
  getBoothIdForFood,
} from "../core/types";
export type {
  EnemyType as EnemyTypeValue,
  SpecialBulletType as SpecialBulletTypeValue,
  FoodType as FoodTypeValue,
  BoothId as BoothIdValue,
  BulletTypeProperties,
  VisualEffectConfig,
  HitEffectConfigKey,
  EnemyTypeProperties,
} from "../core/types";

// Data interface (re-export from data/)
export { createData } from "../data";
export type { Data } from "../data";

// 子彈升級快照
export type { BulletUpgradeSnapshot } from "./bullet-upgrade-snapshot";
export { createDefaultUpgradeSnapshot } from "./bullet-upgrade-snapshot";
