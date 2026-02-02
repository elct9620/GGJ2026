/**
 * Box System (Booth Pool Defense)
 * SPEC § 2.3.7: 寶箱防禦系統，與攤位食材數量同步
 *
 * Note: Visual representation (DropItemPool_*.png) is handled by BoothSystem.
 *       This system only handles collision detection and food consumption logic.
 */

import { InjectableSystem } from "../core/systems/injectable";
import { SystemPriority } from "../core/systems/system.interface";
import type { EventQueue } from "./event-queue";
import { EventType } from "./event-queue";
import type { BoothSystem } from "./booth";
import { BoothId } from "../core/types";
import { LAYOUT } from "../utils/constants";
import { DependencyKeys } from "../core/systems/dependency-keys";
import type { GameStateManager } from "../core/game-state";

/**
 * Booth Pool dimensions (matches DropItemPool sprite size)
 * Based on ui_rough_pixelSpec.png
 */
const BOOTH_POOL_WIDTH = 128;
const BOOTH_POOL_HEIGHT = 256;

/**
 * Box System (Booth Pool Defense)
 * SPEC § 2.3.7: 寶箱防禦系統
 *
 * Responsibilities:
 * - 敵人碰撞檢測（在 Booth Pool 區域 x=340~468）
 * - 碰撞時消耗食材並消滅敵人（不掉落）
 *
 * Note: Box active state is derived from BoothSystem.getFoodCount() (Single Source of Truth)
 *       No event subscription needed - stateless design
 */
export class BoxSystem extends InjectableSystem {
  public readonly name = "BoxSystem";
  public readonly priority = SystemPriority.DEFAULT;

  // Booth Pool collision area (SPEC § 2.7.2)
  // Area: x=340 to x=468, y=136 to y=904
  private readonly poolX = LAYOUT.BASELINE_X;
  private readonly poolStartY =
    LAYOUT.GAME_AREA_Y + (LAYOUT.GAME_AREA_HEIGHT - BOOTH_POOL_HEIGHT * 3) / 2;

  // Booth ID to Y position mapping (for collision detection)
  private readonly boothYPositions: Map<BoothId, { min: number; max: number }> =
    new Map();

  constructor() {
    super();
    this.declareDependency(DependencyKeys.EventQueue);
    this.declareDependency(DependencyKeys.BoothSystem);
    this.declareDependency(DependencyKeys.GameState);
  }

  /**
   * Get GameStateManager dependency
   */
  private get gameState(): GameStateManager {
    return this.getDependency<GameStateManager>(DependencyKeys.GameState);
  }

  /**
   * Get EventQueue dependency
   */
  private get eventQueue(): EventQueue {
    return this.getDependency<EventQueue>(DependencyKeys.EventQueue);
  }

  /**
   * Get BoothSystem dependency
   */
  private get boothSystem(): BoothSystem {
    return this.getDependency<BoothSystem>(DependencyKeys.BoothSystem);
  }

  /**
   * Initialize box system
   */
  public initialize(): void {
    // Setup booth Y position ranges for collision detection
    // Tofu: booth 1 (top), Pearl: booth 2 (middle), BloodCake: booth 3 (bottom)
    const boothHeight = BOOTH_POOL_HEIGHT;
    this.boothYPositions.set(BoothId.Tofu, {
      min: this.poolStartY,
      max: this.poolStartY + boothHeight,
    });
    this.boothYPositions.set(BoothId.Pearl, {
      min: this.poolStartY + boothHeight,
      max: this.poolStartY + boothHeight * 2,
    });
    this.boothYPositions.set(BoothId.BloodCake, {
      min: this.poolStartY + boothHeight * 2,
      max: this.poolStartY + boothHeight * 3,
    });

    // No event subscription needed - box active state is derived from BoothSystem
  }

  /**
   * Update box system - check enemy collisions with booth pool area
   */
  public update(): void {
    // Check if any boxes are active (derived from BoothSystem)
    if (!this.isBoxActive()) return;

    // Check enemy collisions with each booth's box (SPEC § 2.3.7)
    const enemies = this.gameState.getActiveEnemies();
    for (const enemy of enemies) {
      if (!enemy.active) continue;

      const enemyX = enemy.position.x;
      const enemyY = enemy.position.y;

      // Check if enemy is within booth pool X range
      const inPoolX =
        enemyX >= this.poolX && enemyX <= this.poolX + BOOTH_POOL_WIDTH;

      if (!inPoolX) continue;

      // Determine which booth's box the enemy collided with based on Y position
      for (const [boothId, yRange] of this.boothYPositions.entries()) {
        const inBoothY = enemyY >= yRange.min && enemyY <= yRange.max;

        // Check if this booth has food (box is active)
        if (inBoothY && this.isBoothBoxActive(boothId)) {
          // Enemy collided with this booth's box
          // Consume food from the specific booth (SPEC § 2.3.7: 攤位食材 -1)
          this.boothSystem.stealFood(boothId);

          // Deactivate enemy (SPEC § 2.3.7: 敵人立即消失，不掉落食材)
          enemy.active = false;

          // Publish EnemyReachedEnd event (for statistics tracking)
          this.eventQueue.publish(EventType.EnemyReachedEnd, {
            enemyId: enemy.id,
          });

          break; // Only one collision per frame
        }
      }

      // Break outer loop if enemy was deactivated
      if (!enemy.active) break;
    }
  }

  /**
   * Cleanup resources
   */
  public destroy(): void {
    this.boothYPositions.clear();
  }

  /**
   * Get current food count (from BoothSystem - Single Source of Truth)
   */
  public getTotalFoodCount(): number {
    return this.boothSystem.getTotalFoodCount();
  }

  /**
   * Check if any box exists (derived from BoothSystem)
   */
  public isBoxActive(): boolean {
    return this.boothSystem.getTotalFoodCount() > 0;
  }

  /**
   * Check if a specific booth's box exists (derived from BoothSystem)
   */
  public isBoothBoxActive(boothId: BoothId): boolean {
    return this.boothSystem.getFoodCount(boothId) > 0;
  }

  /**
   * Reset box system for new game
   * Note: Actual reset is handled by BoothSystem.reset()
   */
  public reset(): void {
    // No internal state to reset - box active state is derived from BoothSystem
  }
}
