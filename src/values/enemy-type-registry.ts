/**
 * Enemy Type Registry
 * Centralizes all enemy type property mappings to eliminate duplicate switch statements
 * SPEC § 2.6.2: Enemy types and their properties
 *
 * This registry follows the DRY principle - enemy type properties are defined once
 * and accessed through a single source of truth.
 */

import {
  EnemyType,
  isEliteType,
  FoodType,
  createRegistry,
  type EnemyTypeProperties,
} from "../core/types";
import { AssetKeys } from "../core/assets";
import { ENEMY_CONFIG } from "../config";
import { LAYOUT } from "../utils/constants";

// Re-export types from core/types for backwards compatibility
export type { EnemyTypeProperties } from "../core/types";

/**
 * Enemy Type Registry
 * Single source of truth for all enemy type properties
 * Uses TypeRegistry<K, V> interface from core/types
 */
export const EnemyTypeRegistry = createRegistry<EnemyType, EnemyTypeProperties>(
  {
    [EnemyType.Ghost]: {
      baseHealth: ENEMY_CONFIG.ghost.health,
      speed: ENEMY_CONFIG.ghost.speed,
      assetKey: AssetKeys.ghost,
      size: LAYOUT.ENEMY_SIZE,
      foodDrop: null,
      showHealthBar: false,
    },
    [EnemyType.RedGhost]: {
      baseHealth: ENEMY_CONFIG.elite.health,
      speed: ENEMY_CONFIG.elite.speed,
      assetKey: AssetKeys.redGhost,
      size: LAYOUT.ENEMY_SIZE,
      foodDrop: FoodType.Tofu,
      showHealthBar: true,
    },
    [EnemyType.GreenGhost]: {
      baseHealth: ENEMY_CONFIG.elite.health,
      speed: ENEMY_CONFIG.elite.speed,
      assetKey: AssetKeys.greenGhost,
      size: LAYOUT.ENEMY_SIZE,
      foodDrop: FoodType.Pearl,
      showHealthBar: true,
    },
    [EnemyType.BlueGhost]: {
      baseHealth: ENEMY_CONFIG.elite.health,
      speed: ENEMY_CONFIG.elite.speed,
      assetKey: AssetKeys.blueGhost,
      size: LAYOUT.ENEMY_SIZE,
      foodDrop: FoodType.BloodCake,
      showHealthBar: true,
    },
    [EnemyType.Boss]: {
      baseHealth: ENEMY_CONFIG.boss.health,
      speed: ENEMY_CONFIG.boss.speed,
      assetKey: AssetKeys.boss,
      size: LAYOUT.BOSS_SIZE,
      foodDrop: null, // Boss drops upgrade, handled by UpgradeSystem
      showHealthBar: true,
    },
  },
);

/**
 * Get enemy properties for a given enemy type
 */
export function getEnemyProperties(enemyType: EnemyType): EnemyTypeProperties {
  return EnemyTypeRegistry.get(enemyType);
}

/**
 * Get asset key for a given enemy type
 */
export function getEnemyAssetKey(
  enemyType: EnemyType,
): EnemyTypeProperties["assetKey"] {
  return EnemyTypeRegistry.get(enemyType).assetKey;
}

/**
 * Get base speed for a given enemy type
 */
export function getEnemySpeed(enemyType: EnemyType): number {
  return EnemyTypeRegistry.get(enemyType).speed;
}

/**
 * Get size for a given enemy type
 */
export function getEnemySize(enemyType: EnemyType): number {
  return EnemyTypeRegistry.get(enemyType).size;
}

/**
 * Get food drop for a given enemy type
 */
export function getEnemyFoodDrop(enemyType: EnemyType): FoodType | null {
  return EnemyTypeRegistry.get(enemyType).foodDrop;
}

/**
 * Check if enemy type should show health bar
 */
export function shouldShowHealthBar(enemyType: EnemyType): boolean {
  return EnemyTypeRegistry.get(enemyType).showHealthBar;
}

/**
 * Get health for enemy at specific wave
 * SPEC § 2.6.2: HP scales with wave number
 */
export function getEnemyHealthForWave(
  enemyType: EnemyType,
  wave: number,
): number {
  if (enemyType === EnemyType.Ghost) {
    // floor(1 + (W-1) × 0.03)
    return Math.floor(
      ENEMY_CONFIG.ghost.health +
        (wave - 1) * ENEMY_CONFIG.hpScaling.ghostCoefficient,
    );
  } else if (isEliteType(enemyType)) {
    // round(2 + (W-1) × 0.6)
    return Math.round(
      ENEMY_CONFIG.elite.health +
        (wave - 1) * ENEMY_CONFIG.hpScaling.eliteCoefficient,
    );
  } else {
    // Boss: round(10 + (W-5) × 1.5)
    return Math.round(
      ENEMY_CONFIG.boss.health +
        Math.max(0, wave - 5) * ENEMY_CONFIG.hpScaling.bossCoefficient,
    );
  }
}
