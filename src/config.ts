/**
 * Game Balance Configuration
 * 遊戲平衡數值統一管理
 *
 * 此檔案集中管理所有影響遊戲平衡的可調整參數
 * 參考 SPEC.md § 2.3 - § 2.6 的設計規格
 */

// =============================================================================
// PLAYER CONFIG (SPEC § 2.6.1)
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
// ENEMY CONFIG (SPEC § 2.6.2)
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
// BULLET CONFIG (SPEC § 2.6.3)
// =============================================================================
export const BULLET_CONFIG = {
  /** 普通子彈速度 (px/s) */
  speed: 400,
  /** 普通子彈傷害 */
  normalDamage: 1,
  /** 子彈碰撞箱大小 (px) */
  collisionSize: 8,
  /** 子彈視覺大小 (px) - 較大的視覺效果便於玩家辨識 */
  visualSize: 16,
  /** 子彈顏色 (各種類型) */
  colors: {
    /** 普通子彈 - 黃色 */
    normal: 0xf1c40f,
    /** 夜市總匯 - 紫色（連鎖閃電） */
    nightMarket: 0x9b59b6,
    /** 臭豆腐 - 綠色（貫穿） */
    stinkyTofu: 0x27ae60,
    /** 珍珠奶茶 - 棕色（散射） */
    bubbleTea: 0x8b4513,
    /** 豬血糕 - 紅色（追蹤） */
    bloodCake: 0xe74c3c,
    /** 蚵仔煎 - 橙色（百分比傷害） */
    oysterOmelette: 0xe67e22,
  },
} as const;

// =============================================================================
// COMBAT CONFIG (SPEC § 2.3.2)
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
// WAVE CONFIG (SPEC § 2.3.5)
// =============================================================================
export const WAVE_CONFIG = {
  /** Boss 出現間隔（每 N 波） */
  bossWaveInterval: 5,
  /** 敵人數量公式倍率 - 敵人數 = wave × multiplier */
  enemyMultiplier: 2,
  /** 回合結束到下一回合的延遲 (毫秒) */
  waveCompleteDelayMs: 2000,
  /** 敵人生成間隔（基礎）秒 */
  spawnIntervalMin: 2,
  spawnIntervalMax: 3,
  /** 敵人生成機率 (SPEC § 2.3.5) */
  spawnProbability: {
    ghost: 0.4, // 40% 餓鬼
    redGhost: 0.2, // 20% 紅餓鬼
    greenGhost: 0.2, // 20% 綠餓鬼
    blueGhost: 0.2, // 20% 藍餓鬼
  },
} as const;

// =============================================================================
// BOOTH CONFIG (SPEC § 2.3.1)
// =============================================================================
export const BOOTH_CONFIG = {
  /** 每個攤位最大儲存量 */
  maxStorage: 6,
  /** 敵人每次偷取食材數量 */
  stealAmount: 1,
} as const;

// =============================================================================
// KILL COUNTER CONFIG (SPEC § 2.3.8)
// =============================================================================
export const KILL_COUNTER_CONFIG = {
  /** 蚵仔煎消耗擊殺數門檻 */
  oysterOmeletThreshold: 20,
} as const;

// =============================================================================
// RECIPE CONFIG (SPEC § 2.3.3)
// =============================================================================
export const RECIPE_CONFIG = {
  /** 夜市總匯 */
  nightMarket: {
    pearl: 1,
    tofu: 1,
    bloodCake: 1,
    /** 基礎傷害 */
    baseDamage: 2,
    /** 連鎖目標數 */
    chainTargets: 5,
    /** 每次命中傷害衰減 */
    chainDamageDecay: 0.2, // -20%/命中
  },
  /** 臭豆腐 */
  stinkyTofu: {
    tofu: 3,
    /** 基礎傷害 */
    baseDamage: 2,
    /** 貫穿敵人數 */
    pierceCount: 1,
  },
  /** 珍珠奶茶 */
  bubbleTea: {
    pearl: 3,
    /** 基礎傷害 */
    baseDamage: 1,
    /** 額外子彈數（散射）- 三向散射 = 1 中心 + 2 側向 */
    extraBullets: 2,
  },
  /** 豬血糕 */
  bloodCake: {
    bloodCake: 3,
    /** 基礎傷害 */
    baseDamage: 2,
    /** 命中減速效果 */
    slowEffect: 0.1, // -10% 敵人移速
    /** 追蹤範圍 (px) - 基礎範圍約為遊戲區域寬度的 1/3 */
    trackingRange: 500,
  },
  /** 蚵仔煎 - 百分比傷害 (SPEC § 2.3.3) */
  oysterOmelet: {
    /** Boss 傷害百分比 */
    bossDamagePercent: 0.1, // 10% HP
    /** 菁英傷害百分比 */
    eliteDamagePercent: 0.5, // 50% HP
    /** 小怪傷害百分比 */
    ghostDamagePercent: 0.7, // 70% HP
  },
} as const;

// =============================================================================
// UPGRADE CONFIG (SPEC § 2.3.4)
// =============================================================================
export const UPGRADE_CONFIG = {
  /** 普通升級 */
  normal: {
    /** 加辣 - 臭豆腐傷害加成 */
    spicy: {
      damageBonus: 0.5,
      cost: { foodType: "Tofu" as const, amount: 3 },
    },
    /** 加椰果 - 珍珠奶茶子彈加成 */
    coconut: {
      bulletBonus: 1, // SPEC 說 +1
      cost: { foodType: "Pearl" as const, amount: 3 },
    },
    /** 加香菜 - 豬血糕範圍加成 */
    cilantro: {
      rangeBonus: 100, // +100px per upgrade
      cost: { foodType: "BloodCake" as const, amount: 3 },
    },
  },
  /** Boss 升級（無消耗） */
  boss: {
    /** 打折 - 配方消耗減少 */
    discount: {
      costReduction: 1,
      maxStacks: 1,
    },
    /** 大胃王 - 彈匣容量加成 */
    bigEater: {
      magazineBonus: 6,
      maxStacks: 3,
    },
    /** 快吃 - 蚵仔煎傷害加成 */
    fastEat: {
      damageBonus: 0.1, // +10%
      maxStacks: 1,
    },
    /** 飢餓三十 - Buff 時長加成 */
    hunger30: {
      durationBonus: 2, // +2s
      maxStacks: 4,
    },
    /** 總匯吃到飽 - 夜市總匯強化 */
    buffet: {
      chainMultiplier: 2,
      decayReduction: 0.1, // -10%/人
      maxStacks: 2,
    },
    /** 好餓好餓 - 換彈時間減少 */
    veryHungry: {
      reloadReduction: 0.5, // -0.5s
      maxStacks: 3,
    },
  },
  /** 升級選項數量 */
  optionsCount: 2,
} as const;

// =============================================================================
// TYPE EXPORTS
// =============================================================================
export type PlayerConfig = typeof PLAYER_CONFIG;
export type EnemyConfig = typeof ENEMY_CONFIG;
export type BulletConfig = typeof BULLET_CONFIG;
export type CombatConfig = typeof COMBAT_CONFIG;
export type WaveConfig = typeof WAVE_CONFIG;
export type BoothConfig = typeof BOOTH_CONFIG;
export type KillCounterConfig = typeof KILL_COUNTER_CONFIG;
export type RecipeConfig = typeof RECIPE_CONFIG;
export type UpgradeConfig = typeof UPGRADE_CONFIG;
