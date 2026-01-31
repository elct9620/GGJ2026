/**
 * Box System
 * SPEC § 2.3.7: 寶箱防禦系統,與攤位食材數量同步
 */

import type { ISystem } from "../core/systems/system.interface";
import { SystemPriority } from "../core/systems/system.interface";
import type { EventQueue } from "./event-queue";
import { EventType } from "./event-queue";
import type { Enemy } from "../entities/enemy";
import { Graphics } from "pixi.js";
import { LAYOUT } from "../utils/constants";

/**
 * Box System
 * SPEC § 2.3.7: 寶箱防禦系統
 *
 * Responsibilities:
 * - 監聽攤位食材變化（訂閱 FoodStored/FoodConsumed）
 * - 寶箱生成/消失邏輯（x=384, y=攤位中心）
 * - 敵人碰撞檢測（優先於攤位偷取）
 * - 同步耐久度顯示（耐久度 = 攤位食材總數）
 */
export class BoxSystem implements ISystem {
  public readonly name = "BoxSystem";
  public readonly priority = SystemPriority.DEFAULT;

  // Event queue reference
  private eventQueue: EventQueue | null = null;

  // Enemies reference (for collision detection)
  private enemies: Enemy[] = [];

  // Box state (SPEC § 2.3.7)
  private totalFoodCount = 0;
  private boxExists = false;

  // Box position (SPEC § 2.7.2: x=340 baseline, y=center of game area)
  private readonly boxX = LAYOUT.BASELINE_X;
  private readonly boxY = LAYOUT.GAME_AREA_Y + LAYOUT.GAME_AREA_HEIGHT / 2;
  private readonly boxWidth = 40;
  private readonly boxHeight = 40;

  // Visual representation
  private boxSprite: Graphics | null = null;
  private container: Graphics = new Graphics();

  /**
   * Initialize box system
   */
  public initialize(): void {
    this.totalFoodCount = 0;
    this.boxExists = false;

    // Subscribe to food events (SPEC § 2.3.7)
    if (this.eventQueue) {
      this.eventQueue.subscribe(
        EventType.FoodStored,
        this.onFoodStored.bind(this),
      );
      this.eventQueue.subscribe(
        EventType.FoodConsumed,
        this.onFoodConsumed.bind(this),
      );
    }
  }

  /**
   * Update box system - check enemy collisions
   */
  public update(): void {
    if (!this.boxExists || !this.eventQueue) return;

    // Check enemy collisions with box (SPEC § 2.3.7)
    for (const enemy of this.enemies) {
      if (!enemy.active) continue;

      const dx = enemy.position.x - this.boxX;
      const dy = enemy.position.y - this.boxY;
      const distance = Math.sqrt(dx * dx + dy * dy);

      // Collision threshold (box radius + enemy radius)
      const collisionDistance = this.boxWidth / 2 + 20; // Enemy approx 20px radius

      if (distance < collisionDistance) {
        // Consume 1 food from booth
        this.totalFoodCount = Math.max(0, this.totalFoodCount - 1);

        // Deactivate enemy (SPEC § 2.3.7: 不掉落食材)
        enemy.active = false;

        // Publish BoxBlocked event (for statistics tracking)
        this.eventQueue.publish(EventType.EnemyReachedEnd, {
          enemyId: enemy.id,
        });

        // Update box state
        if (this.totalFoodCount === 0) {
          this.despawnBox();
        } else {
          this.updateBoxVisual();
        }

        break; // Only one collision per frame
      }
    }
  }

  /**
   * Cleanup resources
   */
  public destroy(): void {
    this.eventQueue = null;
    this.enemies = [];
    this.despawnBox();
  }

  /**
   * Set EventQueue reference
   */
  public setEventQueue(eventQueue: EventQueue): void {
    this.eventQueue = eventQueue;
  }

  /**
   * Set enemies reference for collision detection
   */
  public setEnemies(enemies: Enemy[]): void {
    this.enemies = enemies;
  }

  /**
   * Get box container for rendering
   */
  public getContainer(): Graphics {
    return this.container;
  }

  /**
   * Get current food count
   */
  public getTotalFoodCount(): number {
    return this.totalFoodCount;
  }

  /**
   * Check if box exists
   */
  public isBoxActive(): boolean {
    return this.boxExists;
  }

  /**
   * Handle FoodStored event (SPEC § 2.3.7)
   */
  private onFoodStored(): void {
    this.totalFoodCount++;

    if (!this.boxExists) {
      this.spawnBox();
    } else {
      this.updateBoxVisual();
    }
  }

  /**
   * Handle FoodConsumed event (SPEC § 2.3.7)
   */
  private onFoodConsumed(): void {
    this.totalFoodCount = Math.max(0, this.totalFoodCount - 1);

    if (this.totalFoodCount === 0) {
      this.despawnBox();
    } else {
      this.updateBoxVisual();
    }
  }

  /**
   * Spawn box at booth entrance (SPEC § 2.3.7)
   */
  private spawnBox(): void {
    if (this.boxExists) return;

    this.boxExists = true;
    this.boxSprite = new Graphics();
    this.updateBoxVisual();
    this.container.addChild(this.boxSprite);
  }

  /**
   * Despawn box when food count reaches zero (SPEC § 2.3.7)
   */
  private despawnBox(): void {
    if (!this.boxExists || !this.boxSprite) return;

    this.boxExists = false;
    this.container.removeChild(this.boxSprite);
    this.boxSprite = null;
  }

  /**
   * Update box visual with durability indicator
   */
  private updateBoxVisual(): void {
    if (!this.boxSprite) return;

    this.boxSprite.clear();

    // Draw box (brown rectangle)
    this.boxSprite.rect(
      this.boxX - this.boxWidth / 2,
      this.boxY - this.boxHeight / 2,
      this.boxWidth,
      this.boxHeight,
    );
    this.boxSprite.fill({ color: 0x8b4513 });

    // Draw durability text
    // (For simplicity, using a colored overlay - full text rendering requires pixi.js Text)
    const durabilityRatio = this.totalFoodCount / 18; // Max 18 food (6+6+6)
    const healthBarWidth = this.boxWidth * durabilityRatio;

    this.boxSprite.rect(
      this.boxX - this.boxWidth / 2,
      this.boxY - this.boxHeight / 2 - 5,
      healthBarWidth,
      3,
    );
    this.boxSprite.fill({ color: 0x00ff00 });
  }

  /**
   * Reset box system for new game
   */
  public reset(): void {
    this.totalFoodCount = 0;
    this.despawnBox();
  }
}
