/**
 * Bullet Upgrade Snapshot
 * Captures upgrade state at the moment of bullet creation
 * Ensures bullets use consistent upgrade values throughout their lifetime
 */

export interface BulletUpgradeSnapshot {
  /** StinkyTofu: damage bonus from 加辣 upgrade */
  stinkyTofuDamageBonus: number;
  /** NightMarket: chain multiplier from 總匯吃到飽 upgrade */
  nightMarketChainMultiplier: number;
  /** NightMarket: decay reduction from 總匯吃到飽 upgrade */
  nightMarketDecayReduction: number;
  /** OysterOmelette: kill threshold divisor from 快吃 upgrade */
  killThresholdDivisor: number;
  /** BloodCake: tracking range bonus from 加香菜 upgrade */
  bloodCakeRangeBonus: number;
}

/**
 * Create a default upgrade snapshot with no bonuses
 */
export function createDefaultUpgradeSnapshot(): BulletUpgradeSnapshot {
  return {
    stinkyTofuDamageBonus: 0,
    nightMarketChainMultiplier: 1,
    nightMarketDecayReduction: 0,
    killThresholdDivisor: 1,
    bloodCakeRangeBonus: 0,
  };
}
