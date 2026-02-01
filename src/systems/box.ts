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
 * - 敵人碰撞檢測（在紅線 x=340 baseline）
 * - 碰撞時隨機消耗任一攤位食材並消滅敵人（不掉落）
 * - 總食材=0 時，敵人可穿過防禦線
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
    // Check if total food count > 0 (defense is active)
    const totalFood = this.boothSystem.getTotalFoodCount();
    if (totalFood === 0) return; // No defense, enemies pass through

    // Check enemy collisions at the baseline (x=340)
    for (const enemy of this.enemies) {
      if (!enemy.active) continue;

      const enemyX = enemy.position.x;

      // Check if enemy reached the baseline (collision with box defense line)
      // Allow small margin for collision detection
      const reachedBaseline =
        enemyX >= this.poolX && enemyX <= this.poolX + BOOTH_POOL_WIDTH;

      if (!reachedBaseline) continue;

      // Enemy hit the box defense line
      // Randomly consume food from any booth that has food (Issue #92)
      const consumedFromBooth = this.consumeRandomFood();

      if (consumedFromBooth !== null) {
        // Deactivate enemy (SPEC § 2.3.7: 敵人立即消失，不掉落食材)
        enemy.active = false;

        // Publish EnemyReachedEnd event (for statistics tracking)
        this.eventQueue.publish(EventType.EnemyReachedEnd, {
          enemyId: enemy.id,
        });

        // Check if the booth's box should despawn after food consumption
        if (this.boothSystem.getFoodCount(consumedFromBooth) === 0) {
          this.boxes.set(consumedFromBooth, false);
        }

        break; // Only one collision per frame
      }
    }
  }

  /**
   * Randomly consume food from any booth that has food
   * Returns the booth ID that food was consumed from, or null if no food available
   */
  private consumeRandomFood(): BoothId | null {
    // Get all booths that have food
    const boothsWithFood: BoothId[] = [];
    for (const boothId of [
      BoothId.Pearl,
      BoothId.Tofu,
      BoothId.BloodCake,
    ] as const) {
      if (this.boothSystem.getFoodCount(boothId) > 0) {
        boothsWithFood.push(boothId);
      }
    }

    if (boothsWithFood.length === 0) return null;

    // Randomly select a booth
    const randomIndex = Math.floor(Math.random() * boothsWithFood.length);
    const selectedBooth = boothsWithFood[randomIndex];

    // Consume food from the selected booth
    this.boothSystem.stealFood(selectedBooth);

    return selectedBooth;
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
