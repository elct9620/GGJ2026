/**
 * Data Catalog Barrel Export
 *
 * 統一匯出所有遊戲資料目錄
 */

// Core Data Interface
export type { Data } from "./data";
export { createData } from "./data";

// BulletData Catalog
export { BulletData, bulletData } from "./bullet-data";
export type {
  BulletTypeProperties,
  VisualEffectConfig,
  HitEffectConfigKey,
} from "./bullet-data";

// EnemyData Catalog
export { EnemyData, enemyData } from "./enemy-data";
export type { EnemyTypeProperties } from "./enemy-data";

// RecipeData Catalog
export { RecipeData, recipeData, FOOD_HUD_COLOR } from "./recipe-data";
export type { Recipe, RecipeDisplayConfig, HUDColorType } from "./recipe-data";

// UpgradeData Catalog
export { UpgradeData, upgradeData } from "./upgrade-data";
export type {
  NormalUpgrade,
  BossUpgrade,
  NormalUpgradeType,
  BossUpgradeType,
  UpgradeCost,
} from "./upgrade-data";

// WaveData Catalog
export { WaveData, waveData } from "./wave-data";
export type { SpawnProbability } from "./wave-data";

// HitEffectData Catalog
export { HitEffectData, hitEffectData } from "./hit-effect-data";
export type {
  FlashConfig,
  KnockbackConfig,
  ScreenShakeConfig,
} from "./hit-effect-data";
