/**
 * Synthesis System
 * SPEC § 2.3.3: 透過按鍵快速發動特殊子彈效果（即時消耗食材）
 */

import type { ISystem } from "../core/systems/system.interface";
import { SystemPriority } from "../core/systems/system.interface";
import type { BoothSystem } from "./booth";
import type { InputSystem } from "./input";
import type { EventQueue } from "./event-queue";
import { EventType } from "./event-queue";
import type { FoodType } from "../entities/enemy";

/**
 * Recipe configuration (SPEC § 2.3.3)
 */
interface Recipe {
  id: string;
  name: string;
  foodRequirements: Partial<Record<FoodType, number>>;
  requiresKillCounter?: boolean;
}

/**
 * Synthesis System
 * SPEC § 2.3.3: 透過按鍵快速發動特殊子彈效果
 *
 * Responsibilities:
 * - 監聽數字鍵 1-5
 * - 檢查食材是否滿足配方
 * - 消耗攤位食材
 * - 發佈 SynthesisTriggered 事件
 */
export class SynthesisSystem implements ISystem {
  public readonly name = "SynthesisSystem";
  public readonly priority = SystemPriority.SYNTHESIS;

  // System dependencies
  private inputSystem: InputSystem | null = null;
  private boothSystem: BoothSystem | null = null;
  private eventQueue: EventQueue | null = null;

  // Kill counter unlock state
  private isKillCounterUnlocked = false;

  // Recipe definitions (SPEC § 2.3.3)
  private readonly recipes: Record<string, Recipe> = {
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

  /**
   * Initialize synthesis system
   */
  public initialize(): void {
    this.isKillCounterUnlocked = false;

    // Subscribe to KillCounterUnlocked event
    if (this.eventQueue) {
      this.eventQueue.subscribe(
        EventType.KillCounterUnlocked,
        this.onKillCounterUnlocked.bind(this),
      );
    }
  }

  /**
   * Update synthesis system (每幀呼叫)
   */
  public update(): void {
    if (!this.inputSystem || !this.boothSystem || !this.eventQueue) return;

    // Check for synthesis key press (1-5)
    const synthesisKey = this.inputSystem.getSynthesisKeyPressed();
    if (synthesisKey !== null) {
      this.trySynthesize(synthesisKey.toString());
    }
  }

  /**
   * Cleanup resources
   */
  public destroy(): void {
    this.inputSystem = null;
    this.boothSystem = null;
    this.eventQueue = null;
  }

  /**
   * Set InputSystem reference
   */
  public setInputSystem(inputSystem: InputSystem): void {
    this.inputSystem = inputSystem;
  }

  /**
   * Set BoothSystem reference
   */
  public setBoothSystem(boothSystem: BoothSystem): void {
    this.boothSystem = boothSystem;
  }

  /**
   * Set EventQueue reference
   */
  public setEventQueue(eventQueue: EventQueue): void {
    this.eventQueue = eventQueue;
  }

  /**
   * Attempt to synthesize special bullet
   * SPEC § 2.3.3: 按鍵觸發檢查食材並消耗
   */
  private trySynthesize(recipeId: string): void {
    if (!this.boothSystem || !this.eventQueue) return;

    const recipe = this.recipes[recipeId];
    if (!recipe) return;

    // Check kill counter requirement (蚵仔煎)
    if (recipe.requiresKillCounter && !this.isKillCounterUnlocked) {
      // UI should show "未解鎖" feedback
      return;
    }

    // Check food requirements
    if (!this.checkFoodRequirements(recipe)) {
      // UI should show "庫存不足" feedback
      return;
    }

    // Consume food from booths
    this.consumeFood(recipe);

    // Publish SynthesisTriggered event (SPEC § 2.3.6)
    this.eventQueue.publish(EventType.SynthesisTriggered, {
      recipeId: recipe.id,
    });
  }

  /**
   * Check if booth has enough food for recipe
   * SPEC § 2.3.3: 檢查食材是否滿足配方
   */
  private checkFoodRequirements(recipe: Recipe): boolean {
    if (!this.boothSystem) return false;

    for (const [foodType, required] of Object.entries(
      recipe.foodRequirements,
    )) {
      const boothId = this.getFoodBoothId(foodType as FoodType);
      const available = this.boothSystem.getFoodCount(boothId);

      if (available < required) {
        return false;
      }
    }

    return true;
  }

  /**
   * Consume food from booths for recipe
   * SPEC § 2.3.3: 直接從攤位扣除對應食材
   */
  private consumeFood(recipe: Recipe): void {
    if (!this.boothSystem) return;

    for (const [foodType, amount] of Object.entries(recipe.foodRequirements)) {
      const boothId = this.getFoodBoothId(foodType as FoodType);

      for (let i = 0; i < amount; i++) {
        this.boothSystem.retrieveFood(boothId);
      }
    }
  }

  /**
   * Map food type to booth ID (1-indexed per SPEC § 2.3.1)
   */
  private getFoodBoothId(foodType: FoodType): number {
    switch (foodType) {
      case "Pearl":
        return 1;
      case "Tofu":
        return 2;
      case "BloodCake":
        return 3;
      default:
        return 1;
    }
  }

  /**
   * Handle KillCounterUnlocked event
   */
  private onKillCounterUnlocked(): void {
    this.isKillCounterUnlocked = true;
  }

  /**
   * Check if kill counter is unlocked (for UI)
   */
  public isOysterOmeletteUnlocked(): boolean {
    return this.isKillCounterUnlocked;
  }
}
