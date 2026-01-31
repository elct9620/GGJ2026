/**
 * Kill Counter System
 * SPEC § 2.3.8: 追踪玩家擊殺敵人數量，解鎖蚵仔煎特殊子彈
 */

import type { ISystem } from "../core/systems/system.interface";
import { SystemPriority } from "../core/systems/system.interface";
import type { EventQueue } from "./event-queue";
import { EventType } from "./event-queue";

/**
 * Kill Counter System
 * SPEC § 2.3.8: 追踪玩家擊殺敵人數量
 *
 * Responsibilities:
 * - 訂閱 EnemyDeath 事件（僅限子彈擊殺）
 * - 累積擊殺計數（全局，不重置）
 * - 達到門檻時發佈 KillCounterUnlocked 事件
 * - 提供 UI 顯示用的進度資訊
 */
export class KillCounterSystem implements ISystem {
  public readonly name = "KillCounterSystem";
  public readonly priority = SystemPriority.DEFAULT;

  // Event queue reference
  private eventQueue: EventQueue | null = null;

  // Kill counter state (SPEC § 2.3.8)
  private killCount = 0;
  private readonly unlockThreshold = 10;
  private isUnlocked = false;

  /**
   * Initialize kill counter system
   */
  public initialize(): void {
    this.killCount = 0;
    this.isUnlocked = false;

    // Subscribe to EnemyDeath event (SPEC § 2.3.8)
    if (this.eventQueue) {
      this.eventQueue.subscribe(
        EventType.EnemyDeath,
        this.onEnemyDeath.bind(this),
      );
    }
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
    this.eventQueue = null;
  }

  /**
   * Set EventQueue reference
   */
  public setEventQueue(eventQueue: EventQueue): void {
    this.eventQueue = eventQueue;
  }

  /**
   * Get current kill count
   */
  public getKillCount(): number {
    return this.killCount;
  }

  /**
   * Get unlock threshold
   */
  public getUnlockThreshold(): number {
    return this.unlockThreshold;
  }

  /**
   * Check if unlocked
   */
  public isOysterOmeletteUnlocked(): boolean {
    return this.isUnlocked;
  }

  /**
   * Get progress string for UI (e.g., "7/10" or "已解鎖")
   */
  public getProgressString(): string {
    if (this.isUnlocked) {
      return "已解鎖";
    }
    return `${this.killCount}/${this.unlockThreshold}`;
  }

  /**
   * Handle EnemyDeath event (SPEC § 2.3.8)
   * Only count kills from bullet hits, not from box blocking
   */
  private onEnemyDeath(): void {
    // Increment kill count (SPEC § 2.3.8)
    // Note: Box System will need to use a different event or flag
    // to distinguish box kills from bullet kills
    this.killCount++;

    // Check if unlock threshold reached
    if (!this.isUnlocked && this.killCount >= this.unlockThreshold) {
      this.isUnlocked = true;

      // Publish KillCounterUnlocked event (SPEC § 2.3.6)
      if (this.eventQueue) {
        this.eventQueue.publish(EventType.KillCounterUnlocked, {});
      }
    }
  }

  /**
   * Reset kill counter (for new game)
   */
  public reset(): void {
    this.killCount = 0;
    this.isUnlocked = false;
  }
}
