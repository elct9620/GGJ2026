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
import type { KillCounterSystem } from "./kill-counter";
import { type FoodType, getBoothIdForFood } from "../entities/booth";
import { type Recipe, RECIPES } from "../values/recipes";

/**
 * Synthesis System
 * SPEC § 2.3.3: 透過按鍵快速發動特殊子彈效果
 *
 * Responsibilities:
 * - 監聽數字鍵 1-5
 * - 檢查食材是否滿足配方
 * - 消耗攤位食材
 * - 蚵仔煎消耗擊殺數（SPEC § 2.3.8）
 * - 發佈 SynthesisTriggered 事件
 */
export class SynthesisSystem implements ISystem {
  public readonly name = "SynthesisSystem";
  public readonly priority = SystemPriority.SYNTHESIS;

  // System dependencies
  private inputSystem: InputSystem | null = null;
  private boothSystem: BoothSystem | null = null;
  private eventQueue: EventQueue | null = null;
  private killCounterSystem: KillCounterSystem | null = null;

  /**
   * Initialize synthesis system
   */
  public initialize(): void {
    // No initialization needed
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
    this.killCounterSystem = null;
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
   * Set KillCounterSystem reference
   */
  public setKillCounterSystem(killCounterSystem: KillCounterSystem): void {
    this.killCounterSystem = killCounterSystem;
  }

  /**
   * Attempt to synthesize special bullet
   * SPEC § 2.3.3: 按鍵觸發檢查食材並消耗
   */
  private trySynthesize(recipeId: string): void {
    if (!this.boothSystem || !this.eventQueue) return;

    const recipe = RECIPES[recipeId];
    if (!recipe) return;

    // Check kill counter requirement (蚵仔煎)
    // SPEC § 2.3.8: 蚵仔煎需要消耗 20 擊殺數
    if (recipe.requiresKillCounter) {
      if (!this.killCounterSystem || !this.killCounterSystem.canConsume()) {
        // UI should show "擊殺數不足" feedback
        return;
      }
    }

    // Check food requirements
    if (!this.checkFoodRequirements(recipe)) {
      // UI should show "庫存不足" feedback
      return;
    }

    // Consume kill counter for oyster omelet (SPEC § 2.3.8)
    if (recipe.requiresKillCounter && this.killCounterSystem) {
      this.killCounterSystem.consume();
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
      const boothId = getBoothIdForFood(foodType as FoodType);
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
      const boothId = getBoothIdForFood(foodType as FoodType);

      for (let i = 0; i < amount; i++) {
        this.boothSystem.retrieveFood(boothId);
      }
    }
  }

  /**
   * Check if oyster omelet is available (for UI)
   * SPEC § 2.3.8: 檢查是否有足夠擊殺數
   */
  public canUseOysterOmelet(): boolean {
    return this.killCounterSystem?.canConsume() ?? false;
  }
}
