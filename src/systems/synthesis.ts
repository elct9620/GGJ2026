/**
 * Synthesis System
 * SPEC § 2.3.3: 透過按鍵快速發動特殊子彈效果（即時消耗食材）
 */

import { InjectableSystem } from "../core/systems/injectable";
import { SystemPriority } from "../core/systems/system.interface";
import type { BoothSystem } from "./booth";
import type { InputSystem } from "./input";
import type { EventQueue } from "./event-queue";
import { EventType } from "./event-queue";
import type { KillCounterSystem } from "./kill-counter";
import { type FoodType, getBoothIdForFood } from "../core/types";
import { type Recipe, recipeData } from "../data";
import { DependencyKeys } from "../core/systems/dependency-keys";
import type { GameStateManager } from "../core/game-state";

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
export class SynthesisSystem extends InjectableSystem {
  public readonly name = "SynthesisSystem";
  public readonly priority = SystemPriority.SYNTHESIS;

  constructor() {
    super();
    this.declareDependency(DependencyKeys.InputSystem);
    this.declareDependency(DependencyKeys.BoothSystem);
    this.declareDependency(DependencyKeys.EventQueue);
    this.declareDependency(DependencyKeys.KillCounterSystem, false); // Optional
    this.declareDependency(DependencyKeys.GameState, false); // Optional for upgrade state
  }

  /**
   * Get InputSystem dependency
   */
  private get inputSystem(): InputSystem {
    return this.getDependency<InputSystem>(DependencyKeys.InputSystem);
  }

  /**
   * Get BoothSystem dependency
   */
  private get boothSystem(): BoothSystem {
    return this.getDependency<BoothSystem>(DependencyKeys.BoothSystem);
  }

  /**
   * Get EventQueue dependency
   */
  private get eventQueue(): EventQueue {
    return this.getDependency<EventQueue>(DependencyKeys.EventQueue);
  }

  /**
   * Get KillCounterSystem dependency (optional)
   */
  private get killCounterSystem(): KillCounterSystem | null {
    return this.getOptionalDependency<KillCounterSystem>(
      DependencyKeys.KillCounterSystem,
    );
  }

  /**
   * Get GameStateManager dependency (optional)
   */
  private get gameState(): GameStateManager | null {
    return this.getOptionalDependency<GameStateManager>(
      DependencyKeys.GameState,
    );
  }

  /**
   * Get adjusted cost after applying discount upgrade
   * SPEC § 2.3.4: 打折 reduces food cost by recipeCostReduction (min 1)
   * Reads directly from GameStateManager for centralized state access
   */
  private getAdjustedCost(baseAmount: number): number {
    const reduction = this.gameState?.upgrades.recipeCostReduction ?? 0;
    return Math.max(1, baseAmount - reduction);
  }

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
    // Check for synthesis key press (1-5)
    const synthesisKey = this.inputSystem.getSynthesisKeyPressed();
    if (synthesisKey !== null) {
      // Publish ButtonClicked event for audio system
      this.eventQueue.publish(EventType.ButtonClicked, {});
      this.trySynthesize(synthesisKey.toString());
    }
  }

  /**
   * Cleanup resources
   */
  public destroy(): void {
    // No cleanup needed - dependencies are managed by InjectableSystem
  }

  /**
   * Attempt to synthesize special bullet
   * SPEC § 2.3.3: 按鍵觸發檢查食材並消耗
   */
  private trySynthesize(recipeId: string): void {
    // Get recipe from data catalog (returns undefined if not found)
    let recipe: Recipe;
    try {
      recipe = recipeData.get(recipeId);
    } catch {
      return; // Recipe not found
    }

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
   * SPEC § 2.3.4: 打折升級減少消耗
   */
  private checkFoodRequirements(recipe: Recipe): boolean {
    for (const [foodType, required] of Object.entries(
      recipe.foodRequirements,
    ) as [FoodType, number][]) {
      const boothId = getBoothIdForFood(foodType);
      const available = this.boothSystem.getFoodCount(boothId);
      const adjustedCost = this.getAdjustedCost(required);

      if (available < adjustedCost) {
        return false;
      }
    }

    return true;
  }

  /**
   * Consume food from booths for recipe
   * SPEC § 2.3.3: 直接從攤位扣除對應食材
   * SPEC § 2.3.4: 打折升級減少消耗
   */
  private consumeFood(recipe: Recipe): void {
    for (const [foodType, amount] of Object.entries(
      recipe.foodRequirements,
    ) as [FoodType, number][]) {
      const boothId = getBoothIdForFood(foodType);
      const adjustedCost = this.getAdjustedCost(amount);
      this.boothSystem.consumeFood(boothId, adjustedCost);
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
