/**
 * Enemy Data Catalog
 * Centralizes all enemy type property mappings
 * SPEC § 2.6.2: Enemy types and their properties
 */

import { createData, type Data } from "./data";
import {
  EnemyType,
  isEliteType,
  FoodType,
  type EnemyTypeProperties,
} from "../core/types";
import { type AssetKey } from "../core/assets";
import enemyJson from "./enemies.json";

// Re-export types for backwards compatibility
export type { EnemyTypeProperties } from "../core/types";

/**
 * HP scaling configuration
 */
interface HpScalingConfig {
  ghostCoefficient: number;
  eliteCoefficient: number;
  bossCoefficient: number;
}

/**
 * JSON representation of enemy properties
 */
interface EnemyJsonEntry {
  baseHealth: number;
  speed: number;
  assetKey: string;
  size: number;
  foodDrop: string | null;
  showHealthBar: boolean;
}

/**
 * Raw JSON structure
 */
interface EnemyJsonData {
  Ghost: EnemyJsonEntry;
  RedGhost: EnemyJsonEntry;
  GreenGhost: EnemyJsonEntry;
  BlueGhost: EnemyJsonEntry;
  Boss: EnemyJsonEntry;
  hpScaling: HpScalingConfig;
  spawnX: number;
}

/**
 * EnemyData Catalog
 * Encapsulates enemy type data and provides helper methods
 */
export class EnemyData {
  private readonly data: Data<EnemyType, EnemyTypeProperties>;
  private readonly hpScaling: HpScalingConfig;
  public readonly spawnX: number;

  constructor(json: EnemyJsonData = enemyJson as unknown as EnemyJsonData) {
    const { hpScaling, spawnX, ...types } = json;
    this.hpScaling = hpScaling;
    this.spawnX = spawnX;

    // Convert JSON entries to typed EnemyTypeProperties
    const entries = {} as Record<EnemyType, EnemyTypeProperties>;
    for (const [key, value] of Object.entries(types)) {
      const entry = value as EnemyJsonEntry;
      entries[key as EnemyType] = {
        ...entry,
        assetKey: entry.assetKey as AssetKey,
        foodDrop: entry.foodDrop as FoodType | null,
      };
    }
    this.data = createData(entries);
  }

  /**
   * Get enemy properties for a given enemy type
   */
  get(type: EnemyType): EnemyTypeProperties {
    return this.data.get(type);
  }

  /**
   * Get all entries
   */
  get entries(): Record<EnemyType, EnemyTypeProperties> {
    return this.data.entries;
  }

  /**
   * Get asset key for a given enemy type
   */
  getAssetKey(type: EnemyType): AssetKey {
    return this.data.get(type).assetKey;
  }

  /**
   * Get base speed for a given enemy type
   */
  getSpeed(type: EnemyType): number {
    return this.data.get(type).speed;
  }

  /**
   * Get size for a given enemy type
   */
  getSize(type: EnemyType): number {
    return this.data.get(type).size;
  }

  /**
   * Get food drop for a given enemy type
   */
  getFoodDrop(type: EnemyType): FoodType | null {
    return this.data.get(type).foodDrop;
  }

  /**
   * Check if enemy type should show health bar
   */
  shouldShowHealthBar(type: EnemyType): boolean {
    return this.data.get(type).showHealthBar;
  }

  /**
   * Get health for enemy at specific wave
   * SPEC § 2.6.2: HP scales with wave number
   */
  getHealthForWave(type: EnemyType, wave: number): number {
    if (type === EnemyType.Ghost) {
      // floor(1 + (W-1) × 0.03)
      return Math.floor(
        this.data.get(type).baseHealth +
          (wave - 1) * this.hpScaling.ghostCoefficient,
      );
    } else if (isEliteType(type)) {
      // round(2 + (W-1) × 0.6)
      return Math.round(
        this.data.get(type).baseHealth +
          (wave - 1) * this.hpScaling.eliteCoefficient,
      );
    } else {
      // Boss: round(10 + (W-5) × 1.5)
      return Math.round(
        this.data.get(type).baseHealth +
          Math.max(0, wave - 5) * this.hpScaling.bossCoefficient,
      );
    }
  }
}

/** Default EnemyData instance */
export const enemyData = new EnemyData();
