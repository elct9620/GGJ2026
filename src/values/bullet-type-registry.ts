/**
 * Bullet Type Registry
 * Centralizes all bullet type property mappings to eliminate duplicate switch statements
 * SPEC § 2.6.3: Bullet visual and collision properties
 *
 * This registry follows the DRY principle - bullet type properties are defined once
 * and accessed through a single source of truth.
 */

import { SpecialBulletType } from "../core/types";
import { BULLET_CONFIG, HIT_EFFECTS_CONFIG } from "../config";
import { AssetKeys, type AssetKey } from "../core/assets";

/**
 * Hit effect config key type for HIT_EFFECTS_CONFIG lookups
 */
export type HitEffectConfigKey = keyof typeof HIT_EFFECTS_CONFIG.flash;

/**
 * Visual effect configuration for bullet trails and hit effects
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

/**
 * Visual effects configuration per bullet type
 * Extracted from bullet-visual-effects.ts VISUAL_EFFECTS_CONFIG
 */
const VISUAL_CONFIGS: Record<SpecialBulletType, VisualEffectConfig> = {
  [SpecialBulletType.None]: {
    trailColor: 0xffffff,
    trailLength: 8,
    trailLifetime: 0.2,
    hitColor: 0xffffff,
    hitDuration: 0.15,
  },
  [SpecialBulletType.NightMarket]: {
    trailColor: 0xffd700,
    trailLength: 8,
    trailLifetime: 0.3,
    hitColor: 0xffd700,
    chainColor: 0xffd700,
    chainWidth: 4,
    flashDuration: 0.2,
  },
  [SpecialBulletType.StinkyTofu]: {
    trailColor: 0x27ae60,
    trailLength: 14,
    trailLifetime: 0.4,
    pierceColor: 0x27ae60,
    pierceRadius: 48,
    pierceDuration: 0.3,
  },
  [SpecialBulletType.BubbleTea]: {
    trailColor: 0xffffff,
    trailLength: 6,
    trailLifetime: 0.25,
  },
  [SpecialBulletType.BloodCake]: {
    trailColor: 0x1a1a1a,
    trailLength: 14,
    trailLifetime: 0.5,
    residueAlpha: 0.6,
  },
  [SpecialBulletType.OysterOmelette]: {
    trailColor: 0xe67e22,
    trailLength: 10,
    trailLifetime: 0.3,
    explosionColor: 0xff4444,
    explosionRadius: 128,
    explosionDuration: 0.4,
    screenShakeMagnitude: 8,
    screenShakeDuration: 0.5,
  },
};

/**
 * Bullet Type Registry
 * Single source of truth for all bullet type properties
 */
export const BulletTypeRegistry: Record<
  SpecialBulletType,
  BulletTypeProperties
> = {
  [SpecialBulletType.None]: {
    size: BULLET_CONFIG.sizes.normal,
    color: BULLET_CONFIG.colors.normal,
    configKey: "normal",
    playerAsset: AssetKeys.playerBase,
    dirHintAsset: AssetKeys.playerDirHint01,
    visualConfig: VISUAL_CONFIGS[SpecialBulletType.None],
  },
  [SpecialBulletType.NightMarket]: {
    size: BULLET_CONFIG.sizes.nightMarket,
    color: BULLET_CONFIG.colors.nightMarket,
    configKey: "nightMarket",
    playerAsset: AssetKeys.playerNightMarket,
    dirHintAsset: AssetKeys.playerDirHint01,
    visualConfig: VISUAL_CONFIGS[SpecialBulletType.NightMarket],
  },
  [SpecialBulletType.StinkyTofu]: {
    size: BULLET_CONFIG.sizes.stinkyTofu,
    color: BULLET_CONFIG.colors.stinkyTofu,
    configKey: "stinkyTofu",
    playerAsset: AssetKeys.playerStinkyTofu,
    dirHintAsset: AssetKeys.playerDirHint01,
    visualConfig: VISUAL_CONFIGS[SpecialBulletType.StinkyTofu],
  },
  [SpecialBulletType.BubbleTea]: {
    size: BULLET_CONFIG.sizes.bubbleTea,
    color: BULLET_CONFIG.colors.bubbleTea,
    configKey: "bubbleTea",
    playerAsset: AssetKeys.playerBubbleTea,
    dirHintAsset: AssetKeys.playerDirHint02, // Scatter indicator
    visualConfig: VISUAL_CONFIGS[SpecialBulletType.BubbleTea],
  },
  [SpecialBulletType.BloodCake]: {
    size: BULLET_CONFIG.sizes.bloodCake,
    color: BULLET_CONFIG.colors.bloodCake,
    configKey: "bloodCake",
    playerAsset: AssetKeys.playerBloodCake,
    dirHintAsset: AssetKeys.playerDirHint01,
    visualConfig: VISUAL_CONFIGS[SpecialBulletType.BloodCake],
  },
  [SpecialBulletType.OysterOmelette]: {
    size: BULLET_CONFIG.sizes.oysterOmelette,
    color: BULLET_CONFIG.colors.oysterOmelette,
    configKey: "oysterOmelette",
    playerAsset: AssetKeys.playerOysterOmelette,
    dirHintAsset: AssetKeys.playerDirHint01,
    visualConfig: VISUAL_CONFIGS[SpecialBulletType.OysterOmelette],
  },
};

/**
 * Get bullet properties for a given bullet type
 * Provides a function-based accessor for consistency
 */
export function getBulletProperties(
  bulletType: SpecialBulletType,
): BulletTypeProperties {
  return BulletTypeRegistry[bulletType];
}

/**
 * Get bullet size for a given bullet type
 */
export function getBulletSize(bulletType: SpecialBulletType): number {
  return BulletTypeRegistry[bulletType].size;
}

/**
 * Get bullet color for a given bullet type
 */
export function getBulletColor(bulletType: SpecialBulletType): number {
  return BulletTypeRegistry[bulletType].color;
}

/**
 * Get hit effect config key for a given bullet type
 */
export function getHitEffectConfigKey(
  bulletType: SpecialBulletType,
): HitEffectConfigKey {
  return BulletTypeRegistry[bulletType].configKey;
}

/**
 * Get visual effect config for a given bullet type
 */
export function getVisualEffectConfig(
  bulletType: SpecialBulletType,
): VisualEffectConfig {
  return BulletTypeRegistry[bulletType].visualConfig;
}

/**
 * Get player asset key for a given buff type
 */
export function getPlayerAssetForBuff(buffType: SpecialBulletType): AssetKey {
  return BulletTypeRegistry[buffType].playerAsset;
}

/**
 * Get direction hint asset key for a given buff type
 */
export function getDirHintAssetForBuff(buffType: SpecialBulletType): AssetKey {
  return BulletTypeRegistry[buffType].dirHintAsset;
}
