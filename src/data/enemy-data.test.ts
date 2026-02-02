/**
 * EnemyData Catalog Tests
 * SPEC § 2.6.2: Centralized enemy type property management
 */

import { describe, it, expect } from "vitest";
import { EnemyData, enemyData } from "./enemy-data";
import { EnemyType, FoodType } from "../core/types";
import { AssetKeys } from "../core/assets";
import { LAYOUT } from "../utils/constants";

describe("EnemyData", () => {
  describe("Data Structure", () => {
    it("should contain all enemy types", () => {
      const enemyTypes = Object.values(EnemyType);
      enemyTypes.forEach((type) => {
        expect(enemyData.get(type)).toBeDefined();
      });
    });

    it("should have all required properties for each type", () => {
      Object.values(EnemyType).forEach((type) => {
        const props = enemyData.get(type);
        expect(props.baseHealth).toBeTypeOf("number");
        expect(props.speed).toBeTypeOf("number");
        expect(props.assetKey).toBeTypeOf("string");
        expect(props.size).toBeTypeOf("number");
        expect(props.showHealthBar).toBeTypeOf("boolean");
      });
    });
  });

  describe("get", () => {
    it("should return Ghost properties", () => {
      const props = enemyData.get(EnemyType.Ghost);
      expect(props.baseHealth).toBe(1);
      expect(props.speed).toBe(160);
      expect(props.size).toBe(LAYOUT.ENEMY_SIZE);
      expect(props.foodDrop).toBeNull();
      expect(props.showHealthBar).toBe(false);
    });

    it("should return Boss properties", () => {
      const props = enemyData.get(EnemyType.Boss);
      expect(props.baseHealth).toBe(10);
      expect(props.speed).toBe(100);
      expect(props.size).toBe(LAYOUT.BOSS_SIZE);
      expect(props.foodDrop).toBeNull();
      expect(props.showHealthBar).toBe(true);
    });

    it("should return Elite properties", () => {
      const eliteTypes = [
        EnemyType.RedGhost,
        EnemyType.GreenGhost,
        EnemyType.BlueGhost,
      ];
      eliteTypes.forEach((type) => {
        const props = enemyData.get(type);
        expect(props.baseHealth).toBe(2);
        expect(props.speed).toBe(130);
        expect(props.size).toBe(LAYOUT.ENEMY_SIZE);
        expect(props.showHealthBar).toBe(true);
      });
    });
  });

  describe("getAssetKey", () => {
    it("should return correct asset keys for each type", () => {
      expect(enemyData.getAssetKey(EnemyType.Ghost)).toBe(AssetKeys.ghost);
      expect(enemyData.getAssetKey(EnemyType.RedGhost)).toBe(
        AssetKeys.redGhost,
      );
      expect(enemyData.getAssetKey(EnemyType.GreenGhost)).toBe(
        AssetKeys.greenGhost,
      );
      expect(enemyData.getAssetKey(EnemyType.BlueGhost)).toBe(
        AssetKeys.blueGhost,
      );
      expect(enemyData.getAssetKey(EnemyType.Boss)).toBe(AssetKeys.boss);
    });
  });

  describe("getSpeed", () => {
    it("should return correct speeds", () => {
      expect(enemyData.getSpeed(EnemyType.Ghost)).toBe(160);
      expect(enemyData.getSpeed(EnemyType.Boss)).toBe(100);
      expect(enemyData.getSpeed(EnemyType.RedGhost)).toBe(130);
    });
  });

  describe("getSize", () => {
    it("should return correct sizes", () => {
      expect(enemyData.getSize(EnemyType.Ghost)).toBe(LAYOUT.ENEMY_SIZE);
      expect(enemyData.getSize(EnemyType.Boss)).toBe(LAYOUT.BOSS_SIZE);
      expect(enemyData.getSize(EnemyType.RedGhost)).toBe(LAYOUT.ENEMY_SIZE);
    });
  });

  describe("getFoodDrop", () => {
    it("should return null for Ghost", () => {
      expect(enemyData.getFoodDrop(EnemyType.Ghost)).toBeNull();
    });

    it("should return null for Boss", () => {
      expect(enemyData.getFoodDrop(EnemyType.Boss)).toBeNull();
    });

    it("should return Tofu for RedGhost", () => {
      expect(enemyData.getFoodDrop(EnemyType.RedGhost)).toBe(FoodType.Tofu);
    });

    it("should return Pearl for GreenGhost", () => {
      expect(enemyData.getFoodDrop(EnemyType.GreenGhost)).toBe(FoodType.Pearl);
    });

    it("should return BloodCake for BlueGhost", () => {
      expect(enemyData.getFoodDrop(EnemyType.BlueGhost)).toBe(
        FoodType.BloodCake,
      );
    });
  });

  describe("shouldShowHealthBar", () => {
    it("should return false for Ghost", () => {
      expect(enemyData.shouldShowHealthBar(EnemyType.Ghost)).toBe(false);
    });

    it("should return true for Boss", () => {
      expect(enemyData.shouldShowHealthBar(EnemyType.Boss)).toBe(true);
    });

    it("should return true for Elite types", () => {
      expect(enemyData.shouldShowHealthBar(EnemyType.RedGhost)).toBe(true);
      expect(enemyData.shouldShowHealthBar(EnemyType.GreenGhost)).toBe(true);
      expect(enemyData.shouldShowHealthBar(EnemyType.BlueGhost)).toBe(true);
    });
  });

  describe("getHealthForWave", () => {
    it("should calculate Ghost health for wave 1", () => {
      const health = enemyData.getHealthForWave(EnemyType.Ghost, 1);
      expect(health).toBe(1);
    });

    it("should scale Ghost health with wave (floor formula)", () => {
      // floor(1 + (W-1) × 0.03)
      const health = enemyData.getHealthForWave(EnemyType.Ghost, 34);
      expect(health).toBe(1); // floor(1 + 33 × 0.03) = floor(1.99) = 1

      const healthWave35 = enemyData.getHealthForWave(EnemyType.Ghost, 35);
      expect(healthWave35).toBe(2); // floor(1 + 34 × 0.03) = floor(2.02) = 2
    });

    it("should calculate Elite health for wave 1", () => {
      const health = enemyData.getHealthForWave(EnemyType.RedGhost, 1);
      expect(health).toBe(2);
    });

    it("should scale Elite health with wave", () => {
      // round(2 + (W-1) × 0.6)
      const health = enemyData.getHealthForWave(EnemyType.RedGhost, 5);
      expect(health).toBe(4); // round(2 + 4 × 0.6) = round(4.4) = 4
    });

    it("should calculate Boss health for wave 5", () => {
      const health = enemyData.getHealthForWave(EnemyType.Boss, 5);
      expect(health).toBe(10); // round(10 + 0 × 1.5) = 10
    });

    it("should scale Boss health with wave", () => {
      // round(10 + (W-5) × 1.5)
      const health = enemyData.getHealthForWave(EnemyType.Boss, 10);
      expect(health).toBe(18); // round(10 + 5 × 1.5) = round(17.5) = 18
    });

    it("should not scale Boss health for waves before 5", () => {
      // Uses max(0, wave - 5) for boss
      const health = enemyData.getHealthForWave(EnemyType.Boss, 3);
      expect(health).toBe(10);
    });
  });

  describe("spawnX", () => {
    it("should have spawn X coordinate", () => {
      expect(enemyData.spawnX).toBe(1950);
    });
  });

  describe("custom instance", () => {
    it("should allow creating instance with custom JSON", () => {
      const customJson = {
        Ghost: {
          baseHealth: 5,
          speed: 100,
          assetKey: "monster_0",
          size: 256,
          foodDrop: null,
          showHealthBar: false,
        },
        RedGhost: {
          baseHealth: 10,
          speed: 80,
          assetKey: "monster_red",
          size: 256,
          foodDrop: "Tofu",
          showHealthBar: true,
        },
        GreenGhost: {
          baseHealth: 10,
          speed: 80,
          assetKey: "monster_green",
          size: 256,
          foodDrop: "Pearl",
          showHealthBar: true,
        },
        BlueGhost: {
          baseHealth: 10,
          speed: 80,
          assetKey: "monster_blue",
          size: 256,
          foodDrop: "BloodCake",
          showHealthBar: true,
        },
        Boss: {
          baseHealth: 50,
          speed: 20,
          assetKey: "monster_boss",
          size: 512,
          foodDrop: null,
          showHealthBar: true,
        },
        hpScaling: {
          ghostCoefficient: 0.1,
          eliteCoefficient: 1.0,
          bossCoefficient: 2.0,
        },
        spawnX: 2000,
      };

      const customEnemyData = new EnemyData(customJson);
      expect(customEnemyData.get(EnemyType.Ghost).baseHealth).toBe(5);
      expect(customEnemyData.spawnX).toBe(2000);
    });
  });
});
