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

// 特殊子彈
export { SpecialBulletType } from "./special-bullet";
export type { SpecialBulletType as SpecialBulletTypeValue } from "./special-bullet";

// 子彈升級快照
export type { BulletUpgradeSnapshot } from "./bullet-upgrade-snapshot";
export { createDefaultUpgradeSnapshot } from "./bullet-upgrade-snapshot";
