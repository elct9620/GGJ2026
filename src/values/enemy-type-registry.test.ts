import { describe, it, expect } from "vitest";
import {
  EnemyTypeRegistry,
  getEnemyProperties,
  getEnemyAssetKey,
  getEnemySpeed,
  getEnemySize,
  getEnemyFoodDrop,
  shouldShowHealthBar,
  getEnemyHealthForWave,
} from "./enemy-type-registry";
import { EnemyType, FoodType } from "../core/types";
import { AssetKeys } from "../core/assets";
import { ENEMY_CONFIG } from "../config";
import { LAYOUT } from "../utils/constants";

describe("EnemyTypeRegistry", () => {
  describe("Registry Structure", () => {
    it("should contain all enemy types", () => {
      const enemyTypes = Object.values(EnemyType);
      enemyTypes.forEach((type) => {
        expect(EnemyTypeRegistry[type]).toBeDefined();
      });
    });

    it("should have all required properties for each type", () => {
      Object.values(EnemyType).forEach((type) => {
        const props = EnemyTypeRegistry[type];
        expect(props.baseHealth).toBeTypeOf("number");
        expect(props.speed).toBeTypeOf("number");
        expect(props.assetKey).toBeTypeOf("string");
        expect(props.size).toBeTypeOf("number");
        expect(props.showHealthBar).toBeTypeOf("boolean");
      });
    });
  });

  describe("getEnemyProperties", () => {
    it("should return Ghost properties", () => {
      const props = getEnemyProperties(EnemyType.Ghost);
      expect(props.baseHealth).toBe(ENEMY_CONFIG.ghost.health);
      expect(props.speed).toBe(ENEMY_CONFIG.ghost.speed);
      expect(props.size).toBe(LAYOUT.ENEMY_SIZE);
      expect(props.foodDrop).toBeNull();
      expect(props.showHealthBar).toBe(false);
    });

    it("should return Boss properties", () => {
      const props = getEnemyProperties(EnemyType.Boss);
      expect(props.baseHealth).toBe(ENEMY_CONFIG.boss.health);
      expect(props.speed).toBe(ENEMY_CONFIG.boss.speed);
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
        const props = getEnemyProperties(type);
        expect(props.baseHealth).toBe(ENEMY_CONFIG.elite.health);
        expect(props.speed).toBe(ENEMY_CONFIG.elite.speed);
        expect(props.size).toBe(LAYOUT.ENEMY_SIZE);
        expect(props.showHealthBar).toBe(true);
      });
    });
  });

  describe("getEnemyAssetKey", () => {
    it("should return correct asset keys for each type", () => {
      expect(getEnemyAssetKey(EnemyType.Ghost)).toBe(AssetKeys.ghost);
      expect(getEnemyAssetKey(EnemyType.RedGhost)).toBe(AssetKeys.redGhost);
      expect(getEnemyAssetKey(EnemyType.GreenGhost)).toBe(AssetKeys.greenGhost);
      expect(getEnemyAssetKey(EnemyType.BlueGhost)).toBe(AssetKeys.blueGhost);
      expect(getEnemyAssetKey(EnemyType.Boss)).toBe(AssetKeys.boss);
    });
  });

  describe("getEnemySpeed", () => {
    it("should return correct speeds", () => {
      expect(getEnemySpeed(EnemyType.Ghost)).toBe(ENEMY_CONFIG.ghost.speed);
      expect(getEnemySpeed(EnemyType.Boss)).toBe(ENEMY_CONFIG.boss.speed);
      expect(getEnemySpeed(EnemyType.RedGhost)).toBe(ENEMY_CONFIG.elite.speed);
    });
  });

  describe("getEnemySize", () => {
    it("should return correct sizes", () => {
      expect(getEnemySize(EnemyType.Ghost)).toBe(LAYOUT.ENEMY_SIZE);
      expect(getEnemySize(EnemyType.Boss)).toBe(LAYOUT.BOSS_SIZE);
      expect(getEnemySize(EnemyType.RedGhost)).toBe(LAYOUT.ENEMY_SIZE);
    });
  });

  describe("getEnemyFoodDrop", () => {
    it("should return null for Ghost", () => {
      expect(getEnemyFoodDrop(EnemyType.Ghost)).toBeNull();
    });

    it("should return null for Boss", () => {
      expect(getEnemyFoodDrop(EnemyType.Boss)).toBeNull();
    });

    it("should return Tofu for RedGhost", () => {
      expect(getEnemyFoodDrop(EnemyType.RedGhost)).toBe(FoodType.Tofu);
    });

    it("should return Pearl for GreenGhost", () => {
      expect(getEnemyFoodDrop(EnemyType.GreenGhost)).toBe(FoodType.Pearl);
    });

    it("should return BloodCake for BlueGhost", () => {
      expect(getEnemyFoodDrop(EnemyType.BlueGhost)).toBe(FoodType.BloodCake);
    });
  });

  describe("shouldShowHealthBar", () => {
    it("should return false for Ghost", () => {
      expect(shouldShowHealthBar(EnemyType.Ghost)).toBe(false);
    });

    it("should return true for Boss", () => {
      expect(shouldShowHealthBar(EnemyType.Boss)).toBe(true);
    });

    it("should return true for Elite types", () => {
      expect(shouldShowHealthBar(EnemyType.RedGhost)).toBe(true);
      expect(shouldShowHealthBar(EnemyType.GreenGhost)).toBe(true);
      expect(shouldShowHealthBar(EnemyType.BlueGhost)).toBe(true);
    });
  });

  describe("getEnemyHealthForWave", () => {
    it("should calculate Ghost health for wave 1", () => {
      const health = getEnemyHealthForWave(EnemyType.Ghost, 1);
      expect(health).toBe(1);
    });

    it("should scale Ghost health with wave (floor formula)", () => {
      // floor(1 + (W-1) × 0.03)
      const health = getEnemyHealthForWave(EnemyType.Ghost, 34);
      expect(health).toBe(1); // floor(1 + 33 × 0.03) = floor(1.99) = 1

      const healthWave35 = getEnemyHealthForWave(EnemyType.Ghost, 35);
      expect(healthWave35).toBe(2); // floor(1 + 34 × 0.03) = floor(2.02) = 2
    });

    it("should calculate Elite health for wave 1", () => {
      const health = getEnemyHealthForWave(EnemyType.RedGhost, 1);
      expect(health).toBe(2);
    });

    it("should scale Elite health with wave", () => {
      // round(2 + (W-1) × 0.6)
      const health = getEnemyHealthForWave(EnemyType.RedGhost, 5);
      expect(health).toBe(4); // round(2 + 4 × 0.6) = round(4.4) = 4
    });

    it("should calculate Boss health for wave 5", () => {
      const health = getEnemyHealthForWave(EnemyType.Boss, 5);
      expect(health).toBe(10); // round(10 + 0 × 1.5) = 10
    });

    it("should scale Boss health with wave", () => {
      // round(10 + (W-5) × 1.5)
      const health = getEnemyHealthForWave(EnemyType.Boss, 10);
      expect(health).toBe(18); // round(10 + 5 × 1.5) = round(17.5) = 18
    });

    it("should not scale Boss health for waves before 5", () => {
      // Uses max(0, wave - 5) for boss
      const health = getEnemyHealthForWave(EnemyType.Boss, 3);
      expect(health).toBe(10);
    });
  });
});
