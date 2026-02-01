/**
 * Recipe Data Catalog
 * Centralizes all recipe definitions
 * SPEC § 2.3.3: 特殊子彈配方
 */

import {
  createData,
  type Data,
  FoodType,
  SpecialBulletType,
} from "../core/data";
import recipesJson from "./recipes.json";

/**
 * Recipe configuration (SPEC § 2.3.3)
 */
export interface Recipe {
  id: string;
  name: string;
  buffType: SpecialBulletType;
  foodRequirements: Partial<Record<FoodType, number>>;
  requiresKillCounter: boolean;
  // Recipe-specific properties
  baseDamage?: number;
  chainTargets?: number;
  chainDamageDecay?: number;
  pierceCount?: number;
  extraBullets?: number;
  slowEffect?: number;
  trackingRange?: number;
  bossDamagePercent?: number;
  eliteDamagePercent?: number;
  ghostDamagePercent?: number;
  display: RecipeDisplayConfig;
}

/**
 * Recipe display configuration for HUD
 */
export interface RecipeDisplayConfig {
  label: string;
  costs: FoodType[];
}

/**
 * HUD color type for cost indicators
 * 0=gray, 1=red, 2=blue, 3=green
 */
export type HUDColorType = 0 | 1 | 2 | 3;

/**
 * FoodType to HUD color mapping
 * Pearl=blue(2), Tofu=green(3), BloodCake=red(1)
 */
export const FOOD_HUD_COLOR: Record<FoodType, HUDColorType> = {
  Pearl: 2,
  Tofu: 3,
  BloodCake: 1,
};

/**
 * Raw JSON entry structure
 */
interface RecipeJsonEntry {
  id: string;
  name: string;
  buffType: string;
  foodRequirements: Record<string, number>;
  requiresKillCounter: boolean;
  baseDamage?: number;
  chainTargets?: number;
  chainDamageDecay?: number;
  pierceCount?: number;
  extraBullets?: number;
  slowEffect?: number;
  trackingRange?: number;
  bossDamagePercent?: number;
  eliteDamagePercent?: number;
  ghostDamagePercent?: number;
  display: {
    label: string;
    costs: string[];
  };
}

/**
 * RecipeData Catalog
 * Encapsulates recipe data and provides helper methods
 */
export class RecipeData {
  private readonly data: Data<string, Recipe>;

  constructor(
    json: Record<string, RecipeJsonEntry> = recipesJson as Record<
      string,
      RecipeJsonEntry
    >,
  ) {
    // Convert JSON entries to typed Recipe
    const entries = {} as Record<string, Recipe>;
    for (const [key, value] of Object.entries(json)) {
      const foodReqs = {} as Partial<Record<FoodType, number>>;
      for (const [foodKey, amount] of Object.entries(value.foodRequirements)) {
        foodReqs[foodKey as FoodType] = amount;
      }
      entries[key] = {
        ...value,
        buffType: value.buffType as SpecialBulletType,
        foodRequirements: foodReqs,
        display: {
          label: value.display.label,
          costs: value.display.costs as FoodType[],
        },
      };
    }
    this.data = createData(entries);
  }

  /**
   * Get recipe by ID
   */
  get(id: string): Recipe {
    return this.data.get(id);
  }

  /**
   * Get all recipes
   */
  get entries(): Record<string, Recipe> {
    return this.data.entries;
  }

  /**
   * Get buff type for a recipe
   */
  getBuffType(id: string): SpecialBulletType {
    return this.data.get(id).buffType;
  }

  /**
   * Get food requirements for a recipe
   */
  getFoodRequirements(id: string): Partial<Record<FoodType, number>> {
    return this.data.get(id).foodRequirements;
  }

  /**
   * Check if recipe requires kill counter
   */
  requiresKillCounter(id: string): boolean {
    return this.data.get(id).requiresKillCounter;
  }

  /**
   * Get display config for a recipe
   */
  getDisplay(id: string): RecipeDisplayConfig {
    return this.data.get(id).display;
  }

  /**
   * Get all recipe IDs
   */
  getAllIds(): string[] {
    return Object.keys(this.data.entries);
  }
}

/** Default RecipeData instance */
export const recipeData = new RecipeData();

// Backwards compatibility exports
/** @deprecated Use recipeData.entries instead */
export const RECIPES = recipeData.entries;

/**
 * Recipe ID to SpecialBulletType mapping (SPEC § 2.3.3)
 * @deprecated Use recipeData.getBuffType() instead
 */
export const RECIPE_BUFF_MAPPING: Record<string, SpecialBulletType> =
  Object.fromEntries(
    Object.entries(recipeData.entries).map(([id, recipe]) => [
      id,
      recipe.buffType,
    ]),
  );

/**
 * Recipe display configurations for HUD (SPEC § 2.3.3)
 * @deprecated Use recipeData.getDisplay() instead
 */
export const RECIPE_DISPLAY: Record<string, RecipeDisplayConfig> =
  Object.fromEntries(
    Object.entries(recipeData.entries).map(([id, recipe]) => [
      id,
      recipe.display,
    ]),
  );
