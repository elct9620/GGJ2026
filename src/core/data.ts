/**
 * Core Data Definitions
 * Unified type definitions and data interfaces for the game
 *
 * This file centralizes all discriminated union types and provides
 * a generic Data interface for type-to-properties mappings.
 */

import type { AssetKey } from "./assets";

// =============================================================================
// Generic Data Interface
// =============================================================================

/**
 * Generic Data interface for type-to-properties mapping
 * @template K - Type key (e.g., EnemyType, SpecialBulletType)
 * @template V - Properties type (e.g., EnemyTypeProperties)
 */
export interface Data<K extends string, V> {
  readonly entries: Record<K, V>;
  get(key: K): V;
}

/**
 * Factory function to create a Data instance
 * @template K - Type key
 * @template V - Properties type
 * @param entries - Record of key-value pairs
 * @returns A Data instance
 */
export function createData<K extends string, V>(
  entries: Record<K, V>,
): Data<K, V> {
  return {
    entries,
    get(key: K): V {
      const value = entries[key];
      if (value === undefined) {
        throw new Error(`Unknown key: ${key}`);
      }
      return value;
    },
  };
}

// Backwards compatibility aliases
/** @deprecated Use Data<K, V> instead */
export type TypeRegistry<K extends string, V> = Data<K, V>;

/** @deprecated Use createData() instead */
export const createRegistry = createData;

// =============================================================================
// Enemy Types
// =============================================================================

/**
 * Enemy Type definitions
 * SPEC § 2.6.2: Enemy types (separated to avoid circular dependencies)
 */
export const EnemyType = {
  Ghost: "Ghost", // 餓鬼 (SPEC § 2.6.2) - 小怪，不掉落食材
  RedGhost: "RedGhost", // 紅餓鬼 (SPEC § 2.6.2) - 菁英，掉落豆腐
  GreenGhost: "GreenGhost", // 綠餓鬼 (SPEC § 2.6.2) - 菁英，掉落珍珠
  BlueGhost: "BlueGhost", // 藍餓鬼 (SPEC § 2.6.2) - 菁英，掉落米血
  Boss: "Boss", // 餓死鬼 (SPEC § 2.6.2)
} as const;

export type EnemyType = (typeof EnemyType)[keyof typeof EnemyType];

/**
 * Check if enemy type is Elite (colored ghost)
 * SPEC § 2.6.2: 菁英敵人有 2 HP，固定掉落對應食材
 */
export function isEliteType(type: EnemyType): boolean {
  return (
    type === EnemyType.RedGhost ||
    type === EnemyType.GreenGhost ||
    type === EnemyType.BlueGhost
  );
}

// =============================================================================
// Special Bullet Types
// =============================================================================

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

// =============================================================================
// Food Types
// =============================================================================

/**
 * Food Type definitions (SPEC § 2.3.1 Booth System)
 * Using const object pattern due to erasableSyntaxOnly restriction
 */
export const FoodType = {
  Pearl: "Pearl", // 珍珠
  Tofu: "Tofu", // 豆腐
  BloodCake: "BloodCake", // 米血
} as const;

export type FoodType = (typeof FoodType)[keyof typeof FoodType];

// =============================================================================
// Booth Types
// =============================================================================

/**
 * Booth ID constants (1-indexed per SPEC § 2.3.1)
 * Use these instead of magic numbers for type safety
 */
export const BoothId = {
  Pearl: 1,
  Tofu: 2,
  BloodCake: 3,
} as const;

export type BoothId = (typeof BoothId)[keyof typeof BoothId];

/**
 * Map FoodType to Booth ID (1-indexed per SPEC § 2.3.1)
 */
export function getBoothIdForFood(foodType: FoodType): BoothId {
  const mapping: Record<FoodType, BoothId> = {
    Pearl: BoothId.Pearl,
    Tofu: BoothId.Tofu,
    BloodCake: BoothId.BloodCake,
  };
  return mapping[foodType];
}

// =============================================================================
// Bullet Type Properties
// =============================================================================

/**
 * Hit effect config key type for HIT_EFFECTS_CONFIG lookups
 * Matches keys in HIT_EFFECTS_CONFIG.flash from config.ts
 */
export type HitEffectConfigKey =
  | "normal"
  | "nightMarket"
  | "stinkyTofu"
  | "bubbleTea"
  | "bloodCake"
  | "oysterOmelette";

/**
 * Visual effect configuration for bullet trails and hit effects
 * SPEC § 2.6.3: Bullet visual and collision properties
 */
export interface VisualEffectConfig {
  trailColor: number;
  trailLength: number;
  trailLifetime: number;
  hitColor?: number;
  hitDuration?: number;
  chainColor?: number;
  chainWidth?: number;
  flashDuration?: number;
  pierceColor?: number;
  pierceRadius?: number;
  pierceDuration?: number;
  residueAlpha?: number;
  explosionColor?: number;
  explosionRadius?: number;
  explosionDuration?: number;
  screenShakeMagnitude?: number;
  screenShakeDuration?: number;
}

/**
 * Complete bullet type properties
 * Contains all information needed for visual, collision, and player appearance
 * SPEC § 2.6.3: Bullet visual and collision properties
 */
export interface BulletTypeProperties {
  /** Bullet size in pixels (collision and visual unified) */
  size: number;
  /** Bullet color for rendering */
  color: number;
  /** Config key for HIT_EFFECTS_CONFIG lookup */
  configKey: HitEffectConfigKey;
  /** Player sprite asset key when this buff is active */
  playerAsset: AssetKey;
  /** Direction hint sprite asset key when this buff is active */
  dirHintAsset: AssetKey;
  /** Visual effect configuration */
  visualConfig: VisualEffectConfig;
}

// =============================================================================
// Enemy Type Properties
// =============================================================================

/**
 * Enemy type properties
 * Contains all information needed for visual, stats, and behavior
 * SPEC § 2.6.2: Enemy types and their properties
 */
export interface EnemyTypeProperties {
  /** Base health value (before wave scaling) */
  baseHealth: number;
  /** Movement speed in px/s */
  speed: number;
  /** Sprite asset key */
  assetKey: AssetKey;
  /** Sprite size in pixels */
  size: number;
  /** Food drop when defeated (null = no drop) */
  foodDrop: FoodType | null;
  /** Whether this enemy shows health bar */
  showHealthBar: boolean;
}
