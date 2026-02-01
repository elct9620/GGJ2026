/**
 * Upgrade Data Catalog
 * Centralizes all upgrade definitions
 * SPEC § 2.3.4: Upgrade System
 */

import { type FoodType } from "../core/types";
import upgradesJson from "./upgrades.json";

/**
 * Normal upgrade cost
 */
export interface UpgradeCost {
  foodType: FoodType;
  amount: number;
}

/**
 * Normal upgrade definition
 */
export interface NormalUpgrade {
  damageBonus?: number;
  bulletBonus?: number;
  rangeBonus?: number;
  cost: UpgradeCost;
}

/**
 * Boss upgrade definition
 */
export interface BossUpgrade {
  costReduction?: number;
  magazineBonus?: number;
  damageBonus?: number;
  durationBonus?: number;
  chainMultiplier?: number;
  decayReduction?: number;
  reloadReduction?: number;
  maxStacks: number;
}

/**
 * Normal upgrade types
 */
export type NormalUpgradeType = "spicy" | "coconut" | "cilantro";

/**
 * Boss upgrade types
 */
export type BossUpgradeType =
  | "discount"
  | "bigEater"
  | "fastEat"
  | "hunger30"
  | "buffet"
  | "veryHungry";

/**
 * Raw JSON structure
 */
interface UpgradeJsonData {
  normal: Record<NormalUpgradeType, NormalUpgrade>;
  boss: Record<BossUpgradeType, BossUpgrade>;
  optionsCount: number;
}

/**
 * UpgradeData Catalog
 * Encapsulates upgrade data and provides helper methods
 */
export class UpgradeData {
  private readonly normalUpgrades: Record<NormalUpgradeType, NormalUpgrade>;
  private readonly bossUpgrades: Record<BossUpgradeType, BossUpgrade>;
  public readonly optionsCount: number;

  constructor(json: UpgradeJsonData = upgradesJson as UpgradeJsonData) {
    this.normalUpgrades = json.normal;
    this.bossUpgrades = json.boss;
    this.optionsCount = json.optionsCount;
  }

  /**
   * Get normal upgrade by type
   */
  getNormal(type: NormalUpgradeType): NormalUpgrade {
    const upgrade = this.normalUpgrades[type];
    if (!upgrade) {
      throw new Error(`Unknown normal upgrade: ${type}`);
    }
    return upgrade;
  }

  /**
   * Get boss upgrade by type
   */
  getBoss(type: BossUpgradeType): BossUpgrade {
    const upgrade = this.bossUpgrades[type];
    if (!upgrade) {
      throw new Error(`Unknown boss upgrade: ${type}`);
    }
    return upgrade;
  }

  /**
   * Get all normal upgrades
   */
  get normal(): Record<NormalUpgradeType, NormalUpgrade> {
    return this.normalUpgrades;
  }

  /**
   * Get all boss upgrades
   */
  get boss(): Record<BossUpgradeType, BossUpgrade> {
    return this.bossUpgrades;
  }

  /**
   * Get all normal upgrade types
   */
  getNormalUpgradeTypes(): NormalUpgradeType[] {
    return Object.keys(this.normalUpgrades) as NormalUpgradeType[];
  }

  /**
   * Get all boss upgrade types
   */
  getBossUpgradeTypes(): BossUpgradeType[] {
    return Object.keys(this.bossUpgrades) as BossUpgradeType[];
  }
}

/** Default UpgradeData instance */
export const upgradeData = new UpgradeData();
