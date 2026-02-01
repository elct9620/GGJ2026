/**
 * Kill Counter System
 * SPEC § 2.3.8: 追踪玩家擊殺敵人數量，蚵仔煎消耗擊殺數
 */

import { InjectableSystem } from "../core/systems/injectable";
import { SystemPriority } from "../core/systems/system.interface";
import type { EventQueue } from "./event-queue";
import { EventType } from "./event-queue";
import { KILL_COUNTER_CONFIG } from "../config";
import { DependencyKeys } from "../core/systems/dependency-keys";
import type { GameStateManager } from "../core/game-state";

/**
 * Kill Counter System
 * SPEC § 2.3.8: 追踪玩家擊殺敵人數量，蚵仔煎消耗擊殺數
 *
 * Responsibilities:
 * - 訂閱 EnemyDeath 事件（僅限子彈擊殺）
 * - 累積擊殺計數（全局，不重置）
 * - 提供蚵仔煎消耗機制（消耗 20 擊殺數）
 * - 提供 UI 顯示用的進度資訊
 *
 * State Management:
 * - Kill count is stored in GameStateManager
 * - This system handles event subscription and provides convenience methods
 */
export class KillCounterSystem extends InjectableSystem {
  public readonly name = "KillCounterSystem";
  public readonly priority = SystemPriority.DEFAULT;

  // Configuration
  private readonly consumeThreshold = KILL_COUNTER_CONFIG.oysterOmeletThreshold;

  constructor() {
    super();
    this.declareDependency(DependencyKeys.EventQueue);
    this.declareDependency(DependencyKeys.GameState);
  }

  /**
   * Get EventQueue dependency
   */
  private get eventQueue(): EventQueue {
    return this.getDependency<EventQueue>(DependencyKeys.EventQueue);
  }

  /**
   * Get GameStateManager dependency
   */
  private get gameState(): GameStateManager {
    return this.getDependency<GameStateManager>(DependencyKeys.GameState);
  }

  /**
   * Initialize kill counter system
   */
  public initialize(): void {
    // Kill count is initialized by GameStateManager

    // Subscribe to EnemyDeath event (SPEC § 2.3.8)
    this.eventQueue.subscribe(
      EventType.EnemyDeath,
      this.onEnemyDeath.bind(this),
    );
  }

  /**
   * Update kill counter system
   * No per-frame logic needed
   */
  public update(): void {
    // No per-frame update needed
  }

  /**
   * Cleanup resources
   */
  public destroy(): void {
    // Dependencies are managed by InjectableSystem
  }

  /**
   * Get current kill count
   */
  public getKillCount(): number {
    return this.gameState.kills;
  }

  /**
   * Get consume threshold
   */
  public getConsumeThreshold(): number {
    return this.consumeThreshold;
  }

  /**
   * Check if can consume (enough kills for oyster omelet)
   * SPEC § 2.3.8: 需要 20 擊殺數才能使用蚵仔煎
   */
  public canConsume(): boolean {
    return this.gameState.kills >= this.consumeThreshold;
  }

  /**
   * Consume kill count for oyster omelet
   * SPEC § 2.3.8: 蚵仔煎消耗 20 個擊殺數
   * @returns true if consumption successful, false if not enough kills
   */
  public consume(): boolean {
    if (!this.canConsume()) {
      return false;
    }

    const consumed = this.gameState.consumeKills(this.consumeThreshold);
    if (!consumed) {
      return false;
    }

    // Publish consumption event
    this.eventQueue.publish(EventType.KillCounterConsumed, {
      consumed: this.consumeThreshold,
      remaining: this.gameState.kills,
    });

    return true;
  }

  /**
   * Get progress string for UI (e.g., "7/20")
   */
  public getProgressString(): string {
    return `${this.gameState.kills}/${this.consumeThreshold}`;
  }

  /**
   * Handle EnemyDeath event (SPEC § 2.3.8)
   * Only count kills from bullet hits, not from box blocking
   */
  private onEnemyDeath(): void {
    this.gameState.incrementKills();
  }
}
