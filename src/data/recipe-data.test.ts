/**
 * RecipeData Catalog Tests
 * SPEC § 2.3.3: Recipe definitions
 */

import { describe, it, expect } from "vitest";
import { RecipeData, recipeData, FOOD_HUD_COLOR } from "./recipe-data";
import { FoodType, SpecialBulletType } from "../core/types";

describe("RecipeData", () => {
  describe("data structure", () => {
    it("should have all recipe IDs", () => {
      expect(recipeData.getAllIds()).toEqual(["1", "2", "3", "4", "5"]);
    });

    it("should have required properties for each recipe", () => {
      for (const id of recipeData.getAllIds()) {
        const recipe = recipeData.get(id);
        expect(recipe.id).toBe(id);
        expect(recipe.name).toBeTypeOf("string");
        expect(recipe.buffType).toBeTypeOf("string");
        expect(recipe.foodRequirements).toBeDefined();
        expect(recipe.display).toBeDefined();
        expect(recipe.display.label).toBeTypeOf("string");
        expect(Array.isArray(recipe.display.costs)).toBe(true);
      }
    });
  });

  describe("get", () => {
    it("should return recipe 1 (夜市總匯)", () => {
      const recipe = recipeData.get("1");
      expect(recipe.name).toBe("夜市總匯");
      expect(recipe.buffType).toBe(SpecialBulletType.NightMarket);
      expect(recipe.foodRequirements).toEqual({
        Pearl: 1,
        Tofu: 1,
        BloodCake: 1,
      });
      expect(recipe.baseDamage).toBe(2);
      expect(recipe.chainTargets).toBe(5);
    });

    it("should return recipe 2 (臭豆腐)", () => {
      const recipe = recipeData.get("2");
      expect(recipe.name).toBe("臭豆腐");
      expect(recipe.buffType).toBe(SpecialBulletType.StinkyTofu);
      expect(recipe.foodRequirements).toEqual({ Tofu: 3 });
      expect(recipe.pierceCount).toBe(1);
    });

    it("should return recipe 3 (珍珠奶茶)", () => {
      const recipe = recipeData.get("3");
      expect(recipe.name).toBe("珍珠奶茶");
      expect(recipe.buffType).toBe(SpecialBulletType.BubbleTea);
      expect(recipe.foodRequirements).toEqual({ Pearl: 3 });
      expect(recipe.extraBullets).toBe(2);
    });

    it("should return recipe 4 (豬血糕)", () => {
      const recipe = recipeData.get("4");
      expect(recipe.name).toBe("豬血糕");
      expect(recipe.buffType).toBe(SpecialBulletType.BloodCake);
      expect(recipe.foodRequirements).toEqual({ BloodCake: 3 });
      expect(recipe.trackingRange).toBe(600);
    });

    it("should return recipe 5 (蚵仔煎)", () => {
      const recipe = recipeData.get("5");
      expect(recipe.name).toBe("蚵仔煎");
      expect(recipe.buffType).toBe(SpecialBulletType.OysterOmelette);
      expect(recipe.requiresKillCounter).toBe(true);
      expect(recipe.bossDamagePercent).toBe(0.1);
    });
  });

  describe("getBuffType", () => {
    it("should return correct buff types", () => {
      expect(recipeData.getBuffType("1")).toBe(SpecialBulletType.NightMarket);
      expect(recipeData.getBuffType("2")).toBe(SpecialBulletType.StinkyTofu);
      expect(recipeData.getBuffType("3")).toBe(SpecialBulletType.BubbleTea);
      expect(recipeData.getBuffType("4")).toBe(SpecialBulletType.BloodCake);
      expect(recipeData.getBuffType("5")).toBe(
        SpecialBulletType.OysterOmelette,
      );
    });
  });

  describe("getFoodRequirements", () => {
    it("should return food requirements", () => {
      expect(recipeData.getFoodRequirements("1")).toEqual({
        Pearl: 1,
        Tofu: 1,
        BloodCake: 1,
      });
      expect(recipeData.getFoodRequirements("5")).toEqual({});
    });
  });

  describe("requiresKillCounter", () => {
    it("should return false for most recipes", () => {
      expect(recipeData.requiresKillCounter("1")).toBe(false);
      expect(recipeData.requiresKillCounter("2")).toBe(false);
      expect(recipeData.requiresKillCounter("3")).toBe(false);
      expect(recipeData.requiresKillCounter("4")).toBe(false);
    });

    it("should return true for recipe 5", () => {
      expect(recipeData.requiresKillCounter("5")).toBe(true);
    });
  });

  describe("getDisplay", () => {
    it("should return display config", () => {
      const display = recipeData.getDisplay("1");
      expect(display.label).toBe("技能1");
      expect(display.costs).toEqual([
        FoodType.Pearl,
        FoodType.Tofu,
        FoodType.BloodCake,
      ]);
    });
  });

  describe("FOOD_HUD_COLOR", () => {
    it("should have correct color mappings", () => {
      // Colors match DropItemPool (booth-renderer.ts):
      // - Tofu = Red (DropItemPool_0) → skillTip1
      // - Pearl = Green (DropItemPool_2) → skillTip3
      // - BloodCake = Blue (DropItemPool_1) → skillTip2
      expect(FOOD_HUD_COLOR.Tofu).toBe(1); // red
      expect(FOOD_HUD_COLOR.Pearl).toBe(3); // green
      expect(FOOD_HUD_COLOR.BloodCake).toBe(2); // blue
    });
  });

  describe("custom instance", () => {
    it("should allow creating instance with custom JSON", () => {
      const customJson = {
        "1": {
          id: "1",
          name: "Custom Recipe",
          buffType: "NightMarket",
          foodRequirements: { Pearl: 5 },
          requiresKillCounter: false,
          display: { label: "Custom", costs: ["Pearl"] },
        },
      };

      const customRecipeData = new RecipeData(customJson);
      expect(customRecipeData.get("1").name).toBe("Custom Recipe");
    });
  });
});
