/**
 * Game Balance Configuration
 * 遊戲平衡數值統一管理
 *
 * 此檔案集中管理所有影響遊戲平衡的可調整參數
 * 參考 SPEC.md § 2.3 - § 2.6 的設計規格
 *
 * NOTE: 大部分遊戲資料已外部化到 src/data/*.json
 * 以下 re-export 供向後相容使用，建議直接使用 src/data/ 中的 Data Catalog
 */

// =============================================================================
// RE-EXPORTS FROM DATA CATALOGS (向後相容)
// =============================================================================

// Re-export from data catalogs for backwards compatibility
export { UPGRADE_CONFIG } from "./data/upgrade-data";
export { WAVE_CONFIG } from "./data/wave-data";
export { HIT_EFFECTS_CONFIG } from "./data/hit-effect-data";

// =============================================================================
// PLAYER CONFIG (SPEC § 2.6.1) - 系統常數，保留在此
// =============================================================================
export const PLAYER_CONFIG = {
  /** 玩家最大生命值 */
  maxHealth: 5,
  /** 玩家移動速度 (px/s) */
  speed: 200,
  /** 彈夾容量（基礎值，可被升級增加） */
  magazineCapacity: 6,
  /** 重裝時間 (秒) */
  reloadTime: 3,
} as const;

// =============================================================================
// ENEMY CONFIG (SPEC § 2.6.2) - 已外部化到 src/data/enemies.json
// 向後相容：保留匯出，但建議使用 enemyData
// =============================================================================
export const ENEMY_CONFIG = {
  ghost: {
    /** 餓鬼基礎血量 */
    health: 1,
    /** 餓鬼移動速度 (px/s) - SPEC: 0.5 units ≈ 50 px */
    speed: 50,
  },
  elite: {
    /** 菁英敵人基礎血量（紅/綠/藍餓鬼） */
    health: 2,
    /** 菁英敵人移動速度 (px/s) - SPEC: 0.4 units ≈ 40 px */
    speed: 40,
  },
  boss: {
    /** Boss 基礎血量 */
    health: 10,
    /** Boss 移動速度 (px/s) - SPEC: 0.3 units ≈ 30 px */
    speed: 30,
  },
  /** 敵人生成 X 座標（畫面右側外） */
  spawnX: 1950,
  /** 敵人 HP 成長公式係數 */
  hpScaling: {
    /** 餓鬼 HP 成長係數 - floor(1 + (W-1) × 0.03) */
    ghostCoefficient: 0.03,
    /** 菁英 HP 成長係數 - round(2 + (W-1) × 0.6) */
    eliteCoefficient: 0.6,
    /** Boss HP 成長係數 - round(10 + (W-5) × 1.5) */
    bossCoefficient: 1.5,
  },
} as const;

// =============================================================================
// BULLET CONFIG (SPEC § 2.6.3) - 部分外部化到 src/data/bullets.json
// 向後相容：保留匯出，但建議使用 bulletData
// =============================================================================
export const BULLET_CONFIG = {
  /** 普通子彈速度 (px/s) */
  speed: 400,
  /** 普通子彈傷害 */
  normalDamage: 1,
  /** 子彈顏色 (各種類型) - 已外部化到 bullets.json */
  colors: {
    normal: 0xf1c40f,
    nightMarket: 0x9b59b6,
    stinkyTofu: 0x27ae60,
    bubbleTea: 0x8b4513,
    bloodCake: 0xe74c3c,
    oysterOmelette: 0xe67e22,
  },
  /** 各子彈類型尺寸配置 - 已外部化到 bullets.json */
  sizes: {
    normal: 24,
    nightMarket: 48,
    stinkyTofu: 36,
    bubbleTea: 48,
    bloodCake: 42,
    oysterOmelette: 192,
  },
} as const;

// =============================================================================
// COMBAT CONFIG (SPEC § 2.3.2) - 系統常數，保留在此
// =============================================================================
export const COMBAT_CONFIG = {
  /** 射擊冷卻時間 (秒) */
  shootCooldown: 0.2,
  /** 特殊子彈 Buff 持續時間 (秒) */
  buffDuration: 2,
  /** 重裝完成延遲 (毫秒) - 用於 EventQueue */
  reloadDelayMs: 3000,
} as const;

// =============================================================================
// BOOTH CONFIG (SPEC § 2.3.1) - 系統常數，保留在此
// =============================================================================
export const BOOTH_CONFIG = {
  /** 每個攤位最大儲存量 */
  maxStorage: 6,
  /** 敵人每次偷取食材數量 */
  stealAmount: 1,
} as const;

// =============================================================================
// KILL COUNTER CONFIG (SPEC § 2.3.8) - 系統常數，保留在此
// =============================================================================
export const KILL_COUNTER_CONFIG = {
  /** 蚵仔煎消耗擊殺數門檻 */
  oysterOmeletThreshold: 20,
} as const;

// =============================================================================
// RECIPE CONFIG (SPEC § 2.3.3) - 已外部化到 src/data/recipes.json
// 向後相容：保留匯出，但建議使用 recipeData
// =============================================================================
export const RECIPE_CONFIG = {
  /** 夜市總匯 */
  nightMarket: {
    pearl: 1,
    tofu: 1,
    bloodCake: 1,
    baseDamage: 2,
    chainTargets: 5,
    chainDamageDecay: 0.2,
  },
  /** 臭豆腐 */
  stinkyTofu: {
    tofu: 3,
    baseDamage: 2,
    pierceCount: 1,
  },
  /** 珍珠奶茶 */
  bubbleTea: {
    pearl: 3,
    baseDamage: 1,
    extraBullets: 2,
  },
  /** 豬血糕 */
  bloodCake: {
    bloodCake: 3,
    baseDamage: 2,
    slowEffect: 0.1,
    trackingRange: 600,
  },
  /** 蚵仔煎 - 百分比傷害 */
  oysterOmelet: {
    bossDamagePercent: 0.1,
    eliteDamagePercent: 0.5,
    ghostDamagePercent: 0.7,
  },
} as const;

// =============================================================================
// TYPE EXPORTS
// =============================================================================
export type PlayerConfig = typeof PLAYER_CONFIG;
export type EnemyConfig = typeof ENEMY_CONFIG;
export type BulletConfig = typeof BULLET_CONFIG;
export type CombatConfig = typeof COMBAT_CONFIG;
export type BoothConfig = typeof BOOTH_CONFIG;
export type KillCounterConfig = typeof KILL_COUNTER_CONFIG;
export type RecipeConfig = typeof RECIPE_CONFIG;

// Re-exported types from data catalogs
import type { WAVE_CONFIG as WaveConfigType } from "./data/wave-data";
import type { UPGRADE_CONFIG as UpgradeConfigType } from "./data/upgrade-data";
import type { HIT_EFFECTS_CONFIG as HitEffectsConfigType } from "./data/hit-effect-data";
export type WaveConfig = typeof WaveConfigType;
export type UpgradeConfig = typeof UpgradeConfigType;
export type HitEffectsConfig = typeof HitEffectsConfigType;
