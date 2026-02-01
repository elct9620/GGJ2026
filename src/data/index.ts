/**
 * Data Catalog Barrel Export
 *
 * 統一匯出所有遊戲資料目錄
 */

// BulletData Catalog
export {
  BulletData,
  bulletData,
  BulletTypeRegistry,
  getBulletProperties,
  getBulletSize,
  getBulletColor,
  getHitEffectConfigKey,
  getVisualEffectConfig,
  getPlayerAssetForBuff,
  getDirHintAssetForBuff,
} from "./bullet-data";
export type {
  BulletTypeProperties,
  VisualEffectConfig,
  HitEffectConfigKey,
} from "./bullet-data";

// EnemyData Catalog
export {
  EnemyData,
  enemyData,
  EnemyTypeRegistry,
  getEnemyProperties,
  getEnemyAssetKey,
  getEnemySpeed,
  getEnemySize,
  getEnemyFoodDrop,
  shouldShowHealthBar,
  getEnemyHealthForWave,
} from "./enemy-data";
export type { EnemyTypeProperties } from "./enemy-data";

// RecipeData Catalog
export {
  RecipeData,
  recipeData,
  RECIPES,
  RECIPE_BUFF_MAPPING,
  RECIPE_DISPLAY,
  FOOD_HUD_COLOR,
} from "./recipe-data";
export type { Recipe, RecipeDisplayConfig, HUDColorType } from "./recipe-data";

// UpgradeData Catalog
export { UpgradeData, upgradeData, UPGRADE_CONFIG } from "./upgrade-data";
export type {
  NormalUpgrade,
  BossUpgrade,
  NormalUpgradeType,
  BossUpgradeType,
  UpgradeCost,
} from "./upgrade-data";

// WaveData Catalog
export { WaveData, waveData, WAVE_CONFIG } from "./wave-data";
export type { SpawnProbability } from "./wave-data";

// HitEffectData Catalog
export {
  HitEffectData,
  hitEffectData,
  HIT_EFFECTS_CONFIG,
} from "./hit-effect-data";
export type {
  FlashConfig,
  KnockbackConfig,
  ScreenShakeConfig,
} from "./hit-effect-data";
