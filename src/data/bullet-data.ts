/**
 * Bullet Data Catalog
 * Centralizes all bullet type property mappings
 * SPEC § 2.6.3: Bullet visual and collision properties
 */

import { createData, type Data } from "./data";
import {
  SpecialBulletType,
  type BulletTypeProperties,
  type VisualEffectConfig,
  type HitEffectConfigKey,
} from "../core/types";
import { type AssetKey } from "../core/assets";
import bulletJson from "./bullets.json";

/**
 * JSON representation of bullet properties (asset keys as strings)
 */
interface BulletJsonEntry {
  size: number;
  color: number;
  configKey: HitEffectConfigKey;
  playerAsset: string;
  dirHintAsset: string;
  visualConfig: VisualEffectConfig;
}

/**
 * BulletData Catalog
 * Encapsulates bullet type data and provides helper methods
 */
export class BulletData {
  private readonly data: Data<SpecialBulletType, BulletTypeProperties>;

  constructor(
    json: Record<SpecialBulletType, BulletJsonEntry> = bulletJson as Record<
      SpecialBulletType,
      BulletJsonEntry
    >,
  ) {
    // Convert JSON entries to typed BulletTypeProperties
    const entries = {} as Record<SpecialBulletType, BulletTypeProperties>;
    for (const [key, value] of Object.entries(json)) {
      entries[key as SpecialBulletType] = {
        ...value,
        playerAsset: value.playerAsset as AssetKey,
        dirHintAsset: value.dirHintAsset as AssetKey,
      };
    }
    this.data = createData(entries);
  }

  /**
   * Get bullet properties for a given bullet type
   */
  get(type: SpecialBulletType): BulletTypeProperties {
    return this.data.get(type);
  }

  /**
   * Get all entries
   */
  get entries(): Record<SpecialBulletType, BulletTypeProperties> {
    return this.data.entries;
  }

  /**
   * Get bullet size for a given bullet type
   */
  getSize(type: SpecialBulletType): number {
    return this.data.get(type).size;
  }

  /**
   * Get bullet color for a given bullet type
   */
  getColor(type: SpecialBulletType): number {
    return this.data.get(type).color;
  }

  /**
   * Get hit effect config key for a given bullet type
   */
  getHitEffectConfigKey(type: SpecialBulletType): HitEffectConfigKey {
    return this.data.get(type).configKey;
  }

  /**
   * Get visual effect config for a given bullet type
   */
  getVisualEffectConfig(type: SpecialBulletType): VisualEffectConfig {
    return this.data.get(type).visualConfig;
  }

  /**
   * Get player asset key for a given buff type
   */
  getPlayerAssetForBuff(type: SpecialBulletType): AssetKey {
    return this.data.get(type).playerAsset;
  }

  /**
   * Get direction hint asset key for a given buff type
   */
  getDirHintAssetForBuff(type: SpecialBulletType): AssetKey {
    return this.data.get(type).dirHintAsset;
  }
}

/** Default BulletData instance */
export const bulletData = new BulletData();
