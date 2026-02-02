import { FoodType, BoothId, getBoothIdForFood } from "../core/types";
import { SystemPriority } from "../core/systems/system.interface";
import { InjectableSystem } from "../core/systems/injectable";
import { EventType } from "./event-queue";
import { DependencyKeys } from "../core/systems/dependency-keys";
import type { GameStateManager } from "../core/game-state";

/**
 * Booth system for storing food ingredients
 * Spec: § 2.3.1 Booth System
 *
 * This system operates on centralized booth state in GameStateManager.
 * Rendering is handled by BoothRenderer (separation of concerns).
 */
export class BoothSystem extends InjectableSystem {
  public readonly name = "BoothSystem";
  public readonly priority = SystemPriority.BOOTH;

  constructor() {
    super();
    this.declareDependency(DependencyKeys.EventQueue, false);
    this.declareDependency(DependencyKeys.GameState, true);
  }

  /**
   * Get GameState dependency
   */
  private get gameState(): GameStateManager {
    return this.getDependency<GameStateManager>(DependencyKeys.GameState);
  }

  /**
   * Initialize booth system (System lifecycle)
   */
  public initialize(): void {
    // Booth state is initialized by GameScene via GameState.initializeBooths()
  }

  /**
   * Update method (System lifecycle)
   */
  public update(_deltaTime: number): void {
    // Booth updates are event-driven, no per-frame update needed
  }

  /**
   * Clean up resources (System lifecycle)
   */
  public destroy(): void {
    // No resources to clean up (rendering handled by BoothRenderer)
  }

  /**
   * Publish FoodConsumed event (unified event publishing)
   */
  private publishFoodConsumed(boothId: BoothId, amount: number): void {
    this.publishEvent(EventType.FoodConsumed, {
      boothId: String(boothId),
      amount,
    });
  }

  /**
   * Store food in appropriate booth
   * Returns true if successful, false if booth is full
   */
  public storeFood(foodType: FoodType): boolean {
    const success = this.gameState.storeFood(foodType);
    if (success) {
      const boothId = getBoothIdForFood(foodType);
      this.publishEvent(EventType.FoodStored, {
        boothId: String(boothId),
        foodType,
      });
    }
    return success;
  }

  /**
   * Retrieve food from booth for synthesis
   * Returns food type if successful, null if booth is empty
   */
  public retrieveFood(boothId: BoothId): FoodType | null {
    const booth = this.gameState.booths.get(boothId);
    if (!booth) return null;

    const success = this.gameState.consumeFood(boothId, 1);
    if (success) {
      this.publishFoodConsumed(boothId, 1);
      return booth.foodType;
    }
    return null;
  }

  /**
   * Consume multiple food items from a booth
   * Returns true if all food was consumed, false if insufficient
   * SPEC § 2.3.3: 合成時消耗食材
   */
  public consumeFood(boothId: BoothId, amount: number): boolean {
    const success = this.gameState.consumeFood(boothId, amount);
    if (success) {
      this.publishFoodConsumed(boothId, amount);
    }
    return success;
  }

  /**
   * Consume food when enemy collides with box
   * Called by BoxSystem when blocking enemies (SPEC § 2.3.7)
   */
  public stealFood(boothId: BoothId): boolean {
    const success = this.gameState.stealFood(boothId);
    if (success) {
      this.publishFoodConsumed(boothId, 1);
    }
    return success;
  }

  /**
   * Get food count for specific booth
   */
  public getFoodCount(boothId: BoothId): number {
    return this.gameState.getBoothFoodCount(boothId);
  }

  /**
   * Reset all booths to empty state
   */
  public reset(): void {
    this.gameState.resetBooths();
  }

  /**
   * Get total food count across all booths
   */
  public getTotalFoodCount(): number {
    return this.gameState.getBoothTotalFoodCount();
  }
}
