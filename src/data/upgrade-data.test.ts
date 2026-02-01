/**
 * UpgradeData Catalog Tests
 * SPEC § 2.3.4: Upgrade System
 */

import { describe, it, expect } from "vitest";
import { UpgradeData, upgradeData, UPGRADE_CONFIG } from "./upgrade-data";

describe("UpgradeData", () => {
  describe("normal upgrades", () => {
    it("should have spicy upgrade", () => {
      const upgrade = upgradeData.getNormal("spicy");
      expect(upgrade.damageBonus).toBe(0.5);
      expect(upgrade.cost.foodType).toBe("Tofu");
      expect(upgrade.cost.amount).toBe(3);
    });

    it("should have coconut upgrade", () => {
      const upgrade = upgradeData.getNormal("coconut");
      expect(upgrade.bulletBonus).toBe(1);
      expect(upgrade.cost.foodType).toBe("Pearl");
      expect(upgrade.cost.amount).toBe(3);
    });

    it("should have cilantro upgrade", () => {
      const upgrade = upgradeData.getNormal("cilantro");
      expect(upgrade.rangeBonus).toBe(100);
      expect(upgrade.cost.foodType).toBe("BloodCake");
      expect(upgrade.cost.amount).toBe(3);
    });

    it("should get all normal upgrade types", () => {
      const types = upgradeData.getNormalUpgradeTypes();
      expect(types).toContain("spicy");
      expect(types).toContain("coconut");
      expect(types).toContain("cilantro");
    });
  });

  describe("boss upgrades", () => {
    it("should have discount upgrade", () => {
      const upgrade = upgradeData.getBoss("discount");
      expect(upgrade.costReduction).toBe(1);
      expect(upgrade.maxStacks).toBe(1);
    });

    it("should have bigEater upgrade", () => {
      const upgrade = upgradeData.getBoss("bigEater");
      expect(upgrade.magazineBonus).toBe(6);
      expect(upgrade.maxStacks).toBe(3);
    });

    it("should have fastEat upgrade", () => {
      const upgrade = upgradeData.getBoss("fastEat");
      expect(upgrade.damageBonus).toBe(0.1);
      expect(upgrade.maxStacks).toBe(1);
    });

    it("should have hunger30 upgrade", () => {
      const upgrade = upgradeData.getBoss("hunger30");
      expect(upgrade.durationBonus).toBe(2);
      expect(upgrade.maxStacks).toBe(4);
    });

    it("should have buffet upgrade", () => {
      const upgrade = upgradeData.getBoss("buffet");
      expect(upgrade.chainMultiplier).toBe(2);
      expect(upgrade.decayReduction).toBe(0.1);
      expect(upgrade.maxStacks).toBe(2);
    });

    it("should have veryHungry upgrade", () => {
      const upgrade = upgradeData.getBoss("veryHungry");
      expect(upgrade.reloadReduction).toBe(0.5);
      expect(upgrade.maxStacks).toBe(3);
    });

    it("should get all boss upgrade types", () => {
      const types = upgradeData.getBossUpgradeTypes();
      expect(types).toContain("discount");
      expect(types).toContain("bigEater");
      expect(types).toContain("fastEat");
      expect(types).toContain("hunger30");
      expect(types).toContain("buffet");
      expect(types).toContain("veryHungry");
    });
  });

  describe("optionsCount", () => {
    it("should be 2", () => {
      expect(upgradeData.optionsCount).toBe(2);
    });
  });

  describe("error handling", () => {
    it("should throw for unknown normal upgrade", () => {
      expect(() => upgradeData.getNormal("unknown" as "spicy")).toThrowError();
    });

    it("should throw for unknown boss upgrade", () => {
      expect(() => upgradeData.getBoss("unknown" as "discount")).toThrowError();
    });
  });

  describe("custom instance", () => {
    it("should allow creating instance with custom JSON", () => {
      const customJson = {
        normal: {
          spicy: {
            damageBonus: 1.0,
            cost: { foodType: "Tofu" as const, amount: 5 },
          },
          coconut: {
            bulletBonus: 2,
            cost: { foodType: "Pearl" as const, amount: 5 },
          },
          cilantro: {
            rangeBonus: 200,
            cost: { foodType: "BloodCake" as const, amount: 5 },
          },
        },
        boss: {
          discount: { costReduction: 2, maxStacks: 2 },
          bigEater: { magazineBonus: 10, maxStacks: 5 },
          fastEat: { damageBonus: 0.2, maxStacks: 2 },
          hunger30: { durationBonus: 3, maxStacks: 5 },
          buffet: { chainMultiplier: 3, decayReduction: 0.2, maxStacks: 3 },
          veryHungry: { reloadReduction: 1.0, maxStacks: 5 },
        },
        optionsCount: 3,
      };

      const customUpgradeData = new UpgradeData(customJson);
      expect(customUpgradeData.getNormal("spicy").damageBonus).toBe(1.0);
      expect(customUpgradeData.optionsCount).toBe(3);
    });
  });

  describe("backwards compatibility", () => {
    it("UPGRADE_CONFIG should work", () => {
      expect(UPGRADE_CONFIG.normal.spicy.damageBonus).toBe(0.5);
      expect(UPGRADE_CONFIG.boss.discount.costReduction).toBe(1);
      expect(UPGRADE_CONFIG.optionsCount).toBe(2);
    });
  });
});
