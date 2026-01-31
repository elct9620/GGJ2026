/**
 * Recipe Definitions
 * SPEC § 2.3.3: 特殊子彈配方
 */

import type { FoodType } from "../entities/booth";

/**
 * Recipe configuration (SPEC § 2.3.3)
 */
export interface Recipe {
  id: string;
  name: string;
  foodRequirements: Partial<Record<FoodType, number>>;
  requiresKillCounter?: boolean;
}

/**
 * All available recipes (SPEC § 2.3.3)
 */
export const RECIPES: Record<string, Recipe> = {
  "1": {
    id: "1",
    name: "夜市總匯",
    foodRequirements: { Pearl: 1, Tofu: 1, BloodCake: 1 },
  },
  "2": {
    id: "2",
    name: "臭豆腐",
    foodRequirements: { Tofu: 3 },
  },
  "3": {
    id: "3",
    name: "珍珠奶茶",
    foodRequirements: { Pearl: 3 },
  },
  "4": {
    id: "4",
    name: "豬血糕",
    foodRequirements: { BloodCake: 3 },
  },
  "5": {
    id: "5",
    name: "蚵仔煎",
    foodRequirements: {},
    requiresKillCounter: true,
  },
};
