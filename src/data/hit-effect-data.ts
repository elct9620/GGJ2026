/**
 * Hit Effect Data Catalog
 * Centralizes all hit effect configurations
 * SPEC § 2.6.3: Hit visual effects
 */

import { type HitEffectConfigKey } from "../core/data";
import hitEffectsJson from "./hit-effects.json";

/**
 * Flash effect configuration
 */
export interface FlashConfig {
  color: number;
  duration: number;
}

/**
 * Knockback effect configuration
 */
export interface KnockbackConfig {
  distance: number;
  duration: number;
}

/**
 * Screen shake effect configuration
 */
export interface ScreenShakeConfig {
  magnitude: number;
  duration: number;
}

/**
 * Raw JSON structure
 */
interface HitEffectJsonData {
  flash: Record<HitEffectConfigKey, FlashConfig>;
  knockback: KnockbackConfig;
  screenShake: Record<HitEffectConfigKey, ScreenShakeConfig>;
}

/**
 * HitEffectData Catalog
 * Encapsulates hit effect configurations and provides helper methods
 */
export class HitEffectData {
  private readonly flashConfigs: Record<HitEffectConfigKey, FlashConfig>;
  public readonly knockback: KnockbackConfig;
  private readonly screenShakeConfigs: Record<
    HitEffectConfigKey,
    ScreenShakeConfig
  >;

  constructor(json: HitEffectJsonData = hitEffectsJson as HitEffectJsonData) {
    this.flashConfigs = json.flash;
    this.knockback = json.knockback;
    this.screenShakeConfigs = json.screenShake;
  }

  /**
   * Get flash config for a bullet type
   */
  getFlash(key: HitEffectConfigKey): FlashConfig {
    const config = this.flashConfigs[key];
    if (!config) {
      throw new Error(`Unknown hit effect key: ${key}`);
    }
    return config;
  }

  /**
   * Get screen shake config for a bullet type
   */
  getScreenShake(key: HitEffectConfigKey): ScreenShakeConfig {
    const config = this.screenShakeConfigs[key];
    if (!config) {
      throw new Error(`Unknown hit effect key: ${key}`);
    }
    return config;
  }

  /**
   * Get all flash configs
   */
  get flash(): Record<HitEffectConfigKey, FlashConfig> {
    return this.flashConfigs;
  }

  /**
   * Get all screen shake configs
   */
  get screenShake(): Record<HitEffectConfigKey, ScreenShakeConfig> {
    return this.screenShakeConfigs;
  }
}

/** Default HitEffectData instance */
export const hitEffectData = new HitEffectData();

// Backwards compatibility exports
/** @deprecated Use hitEffectData directly */
export const HIT_EFFECTS_CONFIG = {
  flash: hitEffectData.flash,
  knockback: hitEffectData.knockback,
  screenShake: hitEffectData.screenShake,
};
