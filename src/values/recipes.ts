/**
 * Recipe Definitions
 * SPEC § 2.3.3: 特殊子彈配方
 */

import { FoodType, type FoodType as FoodTypeType } from "../entities/booth";
import { SpecialBulletType } from "./special-bullet";
import { RECIPE_CONFIG } from "../config";

/**
 * Recipe configuration (SPEC § 2.3.3)
 */
export interface Recipe {
  id: string;
  name: string;
  foodRequirements: Partial<Record<FoodTypeType, number>>;
  requiresKillCounter?: boolean;
}

/**
 * Recipe ID to SpecialBulletType mapping (SPEC § 2.3.3)
 * Key 1 = StinkyTofu (Tofu), Key 2 = BubbleTea (Pearl), Key 3 = BloodCake, Key 4 = NightMarket, Key 5 = OysterOmelette
 */
export const RECIPE_BUFF_MAPPING: Record<string, SpecialBulletType> = {
  "1": SpecialBulletType.StinkyTofu,
  "2": SpecialBulletType.BubbleTea,
  "3": SpecialBulletType.BloodCake,
  "4": SpecialBulletType.NightMarket,
  "5": SpecialBulletType.OysterOmelette,
};

/**
 * HUD color type for cost indicators
 * 0=gray, 1=red, 2=blue, 3=green
 */
export type HUDColorType = 0 | 1 | 2 | 3;

/**
 * FoodType to HUD color mapping
 * Pearl=blue(2), Tofu=green(3), BloodCake=red(1)
 */
export const FOOD_HUD_COLOR: Record<FoodTypeType, HUDColorType> = {
  Pearl: 2,
  Tofu: 3,
  BloodCake: 1,
};

/**
 * Recipe display configuration for HUD
 */
export interface RecipeDisplayConfig {
  label: string;
  costs: FoodTypeType[];
}

/**
 * Recipe display configurations for HUD (SPEC § 2.3.3)
 * Key 1 = StinkyTofu, Key 2 = BubbleTea, Key 3 = BloodCake, Key 4 = NightMarket, Key 5 = OysterOmelette
 */
export const RECIPE_DISPLAY: Record<string, RecipeDisplayConfig> = {
  "1": {
    label: "技能1",
    costs: [FoodType.Tofu, FoodType.Tofu, FoodType.Tofu],
  },
  "2": {
    label: "技能2",
    costs: [FoodType.Pearl, FoodType.Pearl, FoodType.Pearl],
  },
  "3": {
    label: "技能3",
    costs: [FoodType.BloodCake, FoodType.BloodCake, FoodType.BloodCake],
  },
  "4": {
    label: "技能4",
    costs: [FoodType.Pearl, FoodType.Tofu, FoodType.BloodCake],
  },
  "5": {
    label: "大招",
    costs: [FoodType.Tofu], // Display placeholder for kill count
  },
};

/**
 * All available recipes (SPEC § 2.3.3)
 * 配方消耗量從 config.ts 讀取
 * Key 1 = StinkyTofu, Key 2 = BubbleTea, Key 3 = BloodCake, Key 4 = NightMarket, Key 5 = OysterOmelette
 */
export const RECIPES: Record<string, Recipe> = {
  "1": {
    id: "1",
    name: "臭豆腐",
    foodRequirements: { Tofu: RECIPE_CONFIG.stinkyTofu.tofu },
  },
  "2": {
    id: "2",
    name: "珍珠奶茶",
    foodRequirements: { Pearl: RECIPE_CONFIG.bubbleTea.pearl },
  },
  "3": {
    id: "3",
    name: "豬血糕",
    foodRequirements: { BloodCake: RECIPE_CONFIG.bloodCake.bloodCake },
  },
  "4": {
    id: "4",
    name: "夜市總匯",
    foodRequirements: {
      Pearl: RECIPE_CONFIG.nightMarket.pearl,
      Tofu: RECIPE_CONFIG.nightMarket.tofu,
      BloodCake: RECIPE_CONFIG.nightMarket.bloodCake,
    },
  },
  "5": {
    id: "5",
    name: "蚵仔煎",
    foodRequirements: {},
    requiresKillCounter: true,
  },
};
