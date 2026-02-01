/**
 * Value Objects Barrel Export
 *
 * 統一匯出所有值物件，方便引用
 */

// 幾何相關
export { Vector } from "./vector";
export type { CollisionBox } from "./collision";

// 遊戲數值
export { Damage } from "./damage";
export { Health } from "./health";
export { Ammo } from "./ammo";

// 遊戲配方
export {
  RECIPES,
  RECIPE_BUFF_MAPPING,
  RECIPE_DISPLAY,
  FOOD_HUD_COLOR,
} from "./recipes";
export type { Recipe, RecipeDisplayConfig, HUDColorType } from "./recipes";

// 核心型別 (re-export from core/types)
export {
  EnemyType,
  isEliteType,
  SpecialBulletType,
  FoodType,
  BoothId,
  getBoothIdForFood,
} from "../core/types";
export type {
  TypeRegistry,
  EnemyType as EnemyTypeValue,
  SpecialBulletType as SpecialBulletTypeValue,
  FoodType as FoodTypeValue,
  BoothId as BoothIdValue,
} from "../core/types";

// 子彈類型註冊表
export {
  BulletTypeRegistry,
  getBulletProperties,
  getBulletSize,
  getBulletColor,
  getHitEffectConfigKey,
  getVisualEffectConfig,
  getPlayerAssetForBuff,
  getDirHintAssetForBuff,
} from "./bullet-type-registry";
export type {
  BulletTypeProperties,
  VisualEffectConfig,
  HitEffectConfigKey,
} from "./bullet-type-registry";

// 子彈升級快照
export type { BulletUpgradeSnapshot } from "./bullet-upgrade-snapshot";
export { createDefaultUpgradeSnapshot } from "./bullet-upgrade-snapshot";
