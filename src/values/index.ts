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

// 核心型別 (re-export from core/data)
export {
  EnemyType,
  isEliteType,
  SpecialBulletType,
  FoodType,
  BoothId,
  getBoothIdForFood,
  createData,
  // Backwards compatibility
  createRegistry,
} from "../core/data";
export type {
  Data,
  // Backwards compatibility
  TypeRegistry,
  EnemyType as EnemyTypeValue,
  SpecialBulletType as SpecialBulletTypeValue,
  FoodType as FoodTypeValue,
  BoothId as BoothIdValue,
  BulletTypeProperties,
  VisualEffectConfig,
  HitEffectConfigKey,
  EnemyTypeProperties,
} from "../core/data";

// Data Catalogs (re-export from src/data/)
export {
  // BulletData
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
  // EnemyData
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
  // RecipeData
  RecipeData,
  recipeData,
  RECIPES,
  RECIPE_BUFF_MAPPING,
  RECIPE_DISPLAY,
  FOOD_HUD_COLOR,
  // UpgradeData
  UpgradeData,
  upgradeData,
  UPGRADE_CONFIG,
  // WaveData
  WaveData,
  waveData,
  WAVE_CONFIG,
  // HitEffectData
  HitEffectData,
  hitEffectData,
  HIT_EFFECTS_CONFIG,
} from "../data";
export type {
  Recipe,
  RecipeDisplayConfig,
  HUDColorType,
  NormalUpgrade,
  BossUpgrade,
  NormalUpgradeType,
  BossUpgradeType,
  UpgradeCost,
  SpawnProbability,
  FlashConfig,
  KnockbackConfig,
  ScreenShakeConfig,
} from "../data";

// 子彈升級快照
export type { BulletUpgradeSnapshot } from "./bullet-upgrade-snapshot";
export { createDefaultUpgradeSnapshot } from "./bullet-upgrade-snapshot";
