/**
 * EventQueue System
 * SPEC § 2.3.6: 統一管理遊戲事件和延遲執行，替代散落的 setTimeout 呼叫
 */

import { SystemPriority } from "../core/systems/system.interface";
import type { ISystem } from "../core/systems/system.interface";

/**
 * Event types defined in SPEC § 2.3.6
 */
export const EventType = {
  WaveComplete: "WaveComplete",
  WaveStart: "WaveStart",
  UpgradeSelected: "UpgradeSelected",
  ReloadComplete: "ReloadComplete",
  SynthesisTriggered: "SynthesisTriggered",
  BuffExpired: "BuffExpired",
  EnemyDeath: "EnemyDeath",
  EnemyReachedEnd: "EnemyReachedEnd",
  PlayerDeath: "PlayerDeath",
  FoodStored: "FoodStored",
  FoodConsumed: "FoodConsumed",
  KillCounterConsumed: "KillCounterConsumed",
} as const;

export type EventType = (typeof EventType)[keyof typeof EventType];

/**
 * Event data structures for each event type
 */
export interface EventData {
  [EventType.WaveComplete]: { waveNumber: number };
  [EventType.WaveStart]: { waveNumber: number };
  [EventType.UpgradeSelected]: { upgradeId: string };
  [EventType.ReloadComplete]: Record<string, never>;
  [EventType.SynthesisTriggered]: { recipeId: string };
  [EventType.BuffExpired]: { buffType: string };
  [EventType.EnemyDeath]: {
    enemyId: string;
    position: { x: number; y: number };
  };
  [EventType.EnemyReachedEnd]: { enemyId: string };
  [EventType.PlayerDeath]: Record<string, never>;
  [EventType.FoodStored]: { boothId: string; foodType: string };
  [EventType.FoodConsumed]: { boothId: string; amount: number };
  [EventType.KillCounterConsumed]: { consumed: number; remaining: number };
}

/**
 * Event handler function type
 */
export type EventHandler<T extends EventType> = (data: EventData[T]) => void;

/**
 * Delayed event structure for queue management
 */
interface DelayedEvent<T extends EventType> {
  type: T;
  data: EventData[T];
  executeAt: number;
}

/**
 * EventQueue System
 * SPEC § 2.3.6: 統一管理遊戲事件和延遲執行
 *
 * Constraints:
 * - 事件按照發佈順序和延遲時間依序執行
 * - 每個事件類型可有多個訂閱者（Subscriber）
 * - 訂閱者必須提供處理函式（Handler）
 * - 支援延遲執行（Delayed Execution），單位為毫秒（ms）
 */
export class EventQueue implements ISystem {
  public readonly name = "EventQueue";
  public readonly priority = SystemPriority.EVENT_QUEUE;

  // Subscribers map: eventType -> Set of handlers
  private subscribers: Map<EventType, Set<EventHandler<EventType>>> = new Map();

  // Delayed events queue (sorted by executeAt time)
  private delayedEvents: DelayedEvent<EventType>[] = [];

  // Current time tracking (updated by SystemManager via update())
  private currentTime = 0;

  constructor() {
    // EventQueue is now managed by SystemManager, not a singleton
  }

  /**
   * ISystem lifecycle: initialize
   */
  public initialize(): void {
    // Reset state on initialization
    this.currentTime = 0;
  }

  /**
   * ISystem lifecycle: update
   * Process delayed events queue each frame
   */
  public update(deltaTime: number): void {
    this.currentTime += deltaTime * 1000; // Convert to milliseconds
    this.processQueue();
  }

  /**
   * ISystem lifecycle: destroy
   */
  public destroy(): void {
    this.clear();
  }

  /**
   * Publish an event
   * SPEC § 2.3.6: 發佈事件
   *
   * @param eventType - The type of event to publish
   * @param data - Event data (optional, depends on event type)
   * @param delay - Delay in milliseconds (default 0 = immediate)
   *
   * Behaviors:
   * - 若無延遲（delay = 0 或未指定），立即通知所有訂閱者
   * - 若有延遲（delay > 0），加入延遲佇列，等待指定時間後執行
   * - 延遲時間為負數，視為立即執行（delay=0）
   */
  public publish<T extends EventType>(
    eventType: T,
    data: EventData[T],
    delay: number = 0,
  ): void {
    // Normalize negative delay to 0 (SPEC § 2.3.6 Error Scenarios)
    const normalizedDelay = Math.max(0, delay);

    if (normalizedDelay === 0) {
      // Immediate execution
      this.notifySubscribers(eventType, data);
    } else {
      // Delayed execution
      const executeAt = this.currentTime + normalizedDelay;
      const delayedEvent: DelayedEvent<T> = {
        type: eventType,
        data,
        executeAt,
      };

      // Insert into delayed queue (sorted by executeAt)
      this.insertDelayedEvent(delayedEvent);
    }
  }

  /**
   * Subscribe to an event type
   * SPEC § 2.3.6: 訂閱事件
   *
   * @param eventType - The type of event to subscribe to
   * @param handler - The handler function to call when event is published
   *
   * Behaviors:
   * - 當事件發佈時，所有訂閱者的 handler 函式被調用
   * - 訂閱者可訂閱多個事件類型
   * - 重複訂閱同一處理函式，僅保留一個訂閱（去重）
   */
  public subscribe<T extends EventType>(
    eventType: T,
    handler: EventHandler<T>,
  ): void {
    if (!this.subscribers.has(eventType)) {
      this.subscribers.set(eventType, new Set());
    }

    // Add handler to set (automatically deduplicates)
    this.subscribers.get(eventType)!.add(handler as EventHandler<EventType>);
  }

  /**
   * Unsubscribe from an event type
   * SPEC § 2.3.6: 取消訂閱
   *
   * @param eventType - The type of event to unsubscribe from
   * @param handler - The handler function to remove
   *
   * Behaviors:
   * - 取消後不再接收該事件類型的通知
   * - 處理函式不存在，無效果
   */
  public unsubscribe<T extends EventType>(
    eventType: T,
    handler: EventHandler<T>,
  ): void {
    const handlers = this.subscribers.get(eventType);
    if (handlers) {
      handlers.delete(handler as EventHandler<EventType>);
    }
  }

  /**
   * Process delayed events queue
   * SPEC § 2.3.6: 處理佇列
   *
   * Called by SystemManager via update()
   * - 每個遊戲幀（Game Loop Tick）檢查延遲佇列
   * - 若事件到達執行時間，從佇列移除並通知訂閱者
   * - 事件按照到達執行時間排序（最早到達的先執行）
   */
  private processQueue(): void {
    // Process all events that are ready to execute
    while (this.delayedEvents.length > 0) {
      const event = this.delayedEvents[0];

      if (event.executeAt <= this.currentTime) {
        // Remove from queue and notify subscribers
        this.delayedEvents.shift();
        this.notifySubscribers(event.type, event.data);
      } else {
        // Queue is sorted, so we can break early
        break;
      }
    }
  }

  /**
   * Clear all subscribers and delayed events (for testing/reset)
   */
  public clear(): void {
    this.subscribers.clear();
    this.delayedEvents = [];
  }

  /**
   * Notify all subscribers of an event
   * SPEC § 2.3.6 Error Scenarios: Handler 拋出錯誤時記錄錯誤，繼續執行其他訂閱者
   */
  private notifySubscribers<T extends EventType>(
    eventType: T,
    data: EventData[T],
  ): void {
    const handlers = this.subscribers.get(eventType);

    // No subscribers: event is discarded (SPEC § 2.3.6 Error Scenarios)
    if (!handlers || handlers.size === 0) {
      return;
    }

    // Notify all subscribers
    handlers.forEach((handler) => {
      try {
        handler(data);
      } catch (error) {
        // Log error but continue executing other subscribers
        console.error(`Error in event handler for ${eventType}:`, error);
      }
    });
  }

  /**
   * Insert delayed event into queue (sorted by executeAt)
   */
  private insertDelayedEvent<T extends EventType>(
    event: DelayedEvent<T>,
  ): void {
    // Find insertion point (binary search could be used for optimization)
    let insertIndex = this.delayedEvents.length;

    for (let i = 0; i < this.delayedEvents.length; i++) {
      if (this.delayedEvents[i].executeAt > event.executeAt) {
        insertIndex = i;
        break;
      }
    }

    this.delayedEvents.splice(insertIndex, 0, event);
  }
}
