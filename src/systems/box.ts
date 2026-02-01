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
  // Note: totalFoodCount removed - now derived from BoothSystem
  private boxExists = false;

  // Booth Pool collision area (SPEC § 2.7.2)
  // Area: x=340 to x=468, y=136 to y=904
  private readonly poolX = LAYOUT.BASELINE_X;
  private readonly poolStartY =
    LAYOUT.GAME_AREA_Y + (LAYOUT.GAME_AREA_HEIGHT - BOOTH_POOL_HEIGHT * 3) / 2;

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
    this.boxExists = false;

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
    if (!this.boxExists) return;

    // Check enemy collisions with booth pool area (SPEC § 2.3.7)
    // Pool area: x from poolX to poolX + BOOTH_POOL_WIDTH
    //            y from poolStartY to poolStartY + BOOTH_POOL_HEIGHT * 3
    for (const enemy of this.enemies) {
      if (!enemy.active) continue;

      const enemyX = enemy.position.x;
      const enemyY = enemy.position.y;

      // Check if enemy is within booth pool area (AABB collision)
      const inPoolX =
        enemyX >= this.poolX && enemyX <= this.poolX + BOOTH_POOL_WIDTH;
      const inPoolY =
        enemyY >= this.poolStartY &&
        enemyY <= this.poolStartY + BOOTH_POOL_HEIGHT * 3;

      if (inPoolX && inPoolY) {
        // Consume food from booth (SPEC § 2.3.7: 攤位食材 -1)
        this.consumeBoothFood();

        // Deactivate enemy (SPEC § 2.3.7: 敵人立即消失，不掉落食材)
        enemy.active = false;

        // Publish EnemyReachedEnd event (for statistics tracking)
        this.eventQueue.publish(EventType.EnemyReachedEnd, {
          enemyId: enemy.id,
        });

        // Check if box should despawn after food consumption
        if (this.getTotalFoodCount() === 0) {
          this.boxExists = false;
        }

        break; // Only one collision per frame
      }
    }
  }

  /**
   * Cleanup resources
   */
  public destroy(): void {
    this.enemies = [];
    this.boxExists = false;
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
   * Check if box exists
   */
  public isBoxActive(): boolean {
    return this.boxExists;
  }

  /**
   * Consume food from booth when enemy collides with box
   * SPEC § 2.3.7: 攤位食材 -1
   * Randomly selects a booth with food to steal from
   */
  private consumeBoothFood(): void {
    // Find all booths with food
    const boothsWithFood: BoothId[] = [];
    for (const boothId of [BoothId.Pearl, BoothId.Tofu, BoothId.BloodCake]) {
      if (this.boothSystem.getFoodCount(boothId) > 0) {
        boothsWithFood.push(boothId);
      }
    }

    // If no booths have food, box shouldn't exist
    if (boothsWithFood.length === 0) {
      return;
    }

    // Randomly select a booth with food to steal from
    const randomIndex = Math.floor(Math.random() * boothsWithFood.length);
    const targetBooth = boothsWithFood[randomIndex];

    // Steal food from selected booth
    this.boothSystem.stealFood(targetBooth);
  }

  /**
   * Handle FoodStored event (SPEC § 2.3.7)
   */
  private onFoodStored(): void {
    if (!this.boxExists) {
      this.spawnBox();
    }
  }

  /**
   * Handle FoodConsumed event (SPEC § 2.3.7)
   */
  private onFoodConsumed(): void {
    if (this.getTotalFoodCount() === 0) {
      this.boxExists = false;
    }
  }

  /**
   * Activate booth pool defense (SPEC § 2.3.7)
   * Called when first food is stored
   */
  private spawnBox(): void {
    if (this.boxExists) return;
    this.boxExists = true;
  }

  /**
   * Reset box system for new game
   */
  public reset(): void {
    this.boxExists = false;
  }
}
