/**
 * Special Bullet Types
 * SPEC § 2.3.3: 特殊子彈類型定義
 */

/**
 * Special bullet types (SPEC § 2.3.3)
 */
export const SpecialBulletType = {
  None: "None", // 普通子彈
  NightMarket: "NightMarket", // 夜市總匯（連鎖閃電）
  StinkyTofu: "StinkyTofu", // 臭豆腐（貫穿）
  BubbleTea: "BubbleTea", // 珍珠奶茶（散射）
  BloodCake: "BloodCake", // 豬血糕（追蹤）
  OysterOmelette: "OysterOmelette", // 蚵仔煎（高傷害）
} as const;

export type SpecialBulletType =
  (typeof SpecialBulletType)[keyof typeof SpecialBulletType];
