import { describe, test, expect } from "vitest";
import {
  createDefaultUpgradeSnapshot,
  type BulletUpgradeSnapshot,
} from "./bullet-upgrade-snapshot";

describe("BulletUpgradeSnapshot", () => {
  describe("createDefaultUpgradeSnapshot", () => {
    test("creates snapshot with no bonuses", () => {
      const snapshot = createDefaultUpgradeSnapshot();

      expect(snapshot.stinkyTofuDamageBonus).toBe(0);
      expect(snapshot.nightMarketChainMultiplier).toBe(1);
      expect(snapshot.nightMarketDecayReduction).toBe(0);
      expect(snapshot.killThresholdDivisor).toBe(1);
      expect(snapshot.bloodCakeRangeBonus).toBe(0);
    });

    test("returns new object each time", () => {
      const snapshot1 = createDefaultUpgradeSnapshot();
      const snapshot2 = createDefaultUpgradeSnapshot();

      expect(snapshot1).not.toBe(snapshot2);
    });
  });

  describe("BulletUpgradeSnapshot interface", () => {
    test("can create custom snapshot with bonuses", () => {
      const snapshot: BulletUpgradeSnapshot = {
        stinkyTofuDamageBonus: 2,
        nightMarketChainMultiplier: 1.5,
        nightMarketDecayReduction: 0.05,
        killThresholdDivisor: 1.2,
        bloodCakeRangeBonus: 100,
      };

      expect(snapshot.stinkyTofuDamageBonus).toBe(2);
      expect(snapshot.nightMarketChainMultiplier).toBe(1.5);
      expect(snapshot.nightMarketDecayReduction).toBe(0.05);
      expect(snapshot.killThresholdDivisor).toBe(1.2);
      expect(snapshot.bloodCakeRangeBonus).toBe(100);
    });
  });
});
