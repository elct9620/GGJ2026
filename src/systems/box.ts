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
import type { Enemy } from "../entities/enemy";
import { BoothId } from "../entities/booth";
import { Container } from "pixi.js";
import { LAYOUT } from "../utils/constants";
import { DependencyKeys } from "../core/systems/dependency-keys";

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
 * - 監聽攤位食材變化（訂閱 FoodStored/FoodConsumed）
 * - 敵人碰撞檢測（在 Booth Pool 區域 x=340~468）
 * - 碰撞時消耗食材並消滅敵人（不掉落）
 *
 * Note: totalFoodCount is now derived from BoothSystem (Single Source of Truth)
 */
export class BoxSystem extends InjectableSystem {
  public readonly name = "BoxSystem";
  public readonly priority = SystemPriority.DEFAULT;

  // Enemies reference (for collision detection)
  private enemies: Enemy[] = [];

  // Box state (SPEC § 2.3.7)
  // 3 separate boxes, one for each booth
  private boxes: Map<BoothId, boolean> = new Map();

  // Booth Pool collision area (SPEC § 2.7.2)
  // Area: x=340 to x=468, y=136 to y=904
  private readonly poolX = LAYOUT.BASELINE_X;
  private readonly poolStartY =
    LAYOUT.GAME_AREA_Y + (LAYOUT.GAME_AREA_HEIGHT - BOOTH_POOL_HEIGHT * 3) / 2;

  // Booth ID to Y position mapping (for collision detection)
  private readonly boothYPositions: Map<BoothId, { min: number; max: number }> =
    new Map();

  // Empty container (no visual elements - handled by BoothSystem)
  private container: Container = new Container();

  constructor() {
    super();
    this.declareDependency(DependencyKeys.EventQueue);
    this.declareDependency(DependencyKeys.BoothSystem);
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
    // Initialize 3 separate boxes (all inactive initially)
    this.boxes.set(BoothId.Pearl, false);
    this.boxes.set(BoothId.Tofu, false);
    this.boxes.set(BoothId.BloodCake, false);

    // Setup booth Y position ranges for collision detection
    // Pearl: booth 1 (top), Tofu: booth 2 (middle), BloodCake: booth 3 (bottom)
    const boothHeight = BOOTH_POOL_HEIGHT;
    this.boothYPositions.set(BoothId.Pearl, {
      min: this.poolStartY,
      max: this.poolStartY + boothHeight,
    });
    this.boothYPositions.set(BoothId.Tofu, {
      min: this.poolStartY + boothHeight,
      max: this.poolStartY + boothHeight * 2,
    });
    this.boothYPositions.set(BoothId.BloodCake, {
      min: this.poolStartY + boothHeight * 2,
      max: this.poolStartY + boothHeight * 3,
    });

    // Subscribe to food events (SPEC § 2.3.7)
    this.eventQueue.subscribe(
      EventType.FoodStored,
      this.onFoodStored.bind(this),
    );
    this.eventQueue.subscribe(
      EventType.FoodConsumed,
      this.onFoodConsumed.bind(this),
    );
  }

  /**
   * Update box system - check enemy collisions with booth pool area
   */
  public update(): void {
    // Check if any boxes are active
    const hasActiveBox = Array.from(this.boxes.values()).some((active) => active);
    if (!hasActiveBox) return;

    // Check enemy collisions with each booth's box (SPEC § 2.3.7)
    for (const enemy of this.enemies) {
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

        if (inBoothY && this.boxes.get(boothId)) {
          // Enemy collided with this booth's box
          // Consume food from the specific booth (SPEC § 2.3.7: 攤位食材 -1)
          this.boothSystem.stealFood(boothId);

          // Deactivate enemy (SPEC § 2.3.7: 敵人立即消失，不掉落食材)
          enemy.active = false;

          // Publish EnemyReachedEnd event (for statistics tracking)
          this.eventQueue.publish(EventType.EnemyReachedEnd, {
            enemyId: enemy.id,
          });

          // Check if this box should despawn after food consumption
          if (this.boothSystem.getFoodCount(boothId) === 0) {
            this.boxes.set(boothId, false);
          }

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
    this.enemies = [];
    this.boxes.clear();
    this.boothYPositions.clear();
  }

  /**
   * Set enemies reference for collision detection (not injectable - entity reference)
   */
  public setEnemies(enemies: Enemy[]): void {
    this.enemies = enemies;
  }

  /**
   * Get box container for rendering
   */
  public getContainer(): Container {
    return this.container;
  }

  /**
   * Get current food count (from BoothSystem - Single Source of Truth)
   */
  public getTotalFoodCount(): number {
    return this.boothSystem.getTotalFoodCount();
  }

  /**
   * Check if any box exists
   */
  public isBoxActive(): boolean {
    return Array.from(this.boxes.values()).some((active) => active);
  }

  /**
   * Check if a specific booth's box exists
   */
  public isBoothBoxActive(boothId: BoothId): boolean {
    return this.boxes.get(boothId) ?? false;
  }


  /**
   * Handle FoodStored event (SPEC § 2.3.7)
   * Event data contains boothId to know which booth received food
   */
  private onFoodStored(data?: { boothId: string; foodType: string }): void {
    if (!data) return;

    const boothId = parseInt(data.boothId, 10) as BoothId;
    // Spawn box for this booth if it has food
    if (this.boothSystem.getFoodCount(boothId) > 0) {
      this.boxes.set(boothId, true);
    }
  }

  /**
   * Handle FoodConsumed event (SPEC § 2.3.7)
   * Event data contains boothId to know which booth lost food
   */
  private onFoodConsumed(data?: { boothId: string; amount: number }): void {
    if (!data) return;

    const boothId = parseInt(data.boothId, 10) as BoothId;
    // Despawn box if this booth has no food
    if (this.boothSystem.getFoodCount(boothId) === 0) {
      this.boxes.set(boothId, false);
    }
  }

  /**
   * Reset box system for new game
   */
  public reset(): void {
    this.boxes.set(BoothId.Pearl, false);
    this.boxes.set(BoothId.Tofu, false);
    this.boxes.set(BoothId.BloodCake, false);
  }
}
