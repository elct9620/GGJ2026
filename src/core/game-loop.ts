import { Ticker } from "pixi.js";

/**
 * GameLoop - 遊戲主循環系統
 *
 * 遵循 SPEC.md § 4.2.1 Application Setup
 * - 目標幀率：60 FPS
 * - 使用 Pixi.js Ticker 管理更新循環
 * - 提供 deltaTime 和 totalTime 計算
 */

export type UpdateCallback = (deltaTime: number, totalTime: number) => void;

export class GameLoop {
  private ticker: Ticker;
  private updateCallback: UpdateCallback | null = null;
  private totalTime: number = 0;
  private isRunning: boolean = false;
  private isPaused: boolean = false;
  private ownsTicker: boolean;

  constructor(ticker?: Ticker) {
    if (ticker) {
      this.ticker = ticker;
      this.ownsTicker = false;
    } else {
      this.ticker = new Ticker();
      this.ownsTicker = true;
    }
    this.ticker.maxFPS = 60; // 目標 60 FPS
  }

  /**
   * 設定每幀更新回調函數
   */
  setUpdateCallback(callback: UpdateCallback): void {
    this.updateCallback = callback;
  }

  /**
   * 啟動遊戲循環
   */
  start(): void {
    if (this.isRunning) {
      return;
    }

    this.isRunning = true;
    this.isPaused = false;

    this.ticker.add(this.onUpdate, this);
    this.ticker.start();
  }

  /**
   * 停止遊戲循環
   */
  stop(): void {
    if (!this.isRunning) {
      return;
    }

    this.isRunning = false;
    this.isPaused = false;

    this.ticker.remove(this.onUpdate, this);
    this.ticker.stop();

    // 重置總時間
    this.totalTime = 0;
  }

  /**
   * 暫停遊戲循環
   */
  pause(): void {
    if (!this.isRunning || this.isPaused) {
      return;
    }

    this.isPaused = true;
    this.ticker.stop();
  }

  /**
   * 恢復遊戲循環
   */
  resume(): void {
    if (!this.isRunning || !this.isPaused) {
      return;
    }

    this.isPaused = false;
    this.ticker.start();
  }

  /**
   * 獲取當前狀態
   */
  getState(): {
    isRunning: boolean;
    isPaused: boolean;
    totalTime: number;
    fps: number;
  } {
    return {
      isRunning: this.isRunning,
      isPaused: this.isPaused,
      totalTime: this.totalTime,
      fps: this.ticker.FPS,
    };
  }

  /**
   * Ticker 更新回調
   */
  private onUpdate(ticker: Ticker): void {
    if (this.isPaused) {
      return;
    }

    // deltaTime 以秒為單位（Pixi.js Ticker.deltaMS 為毫秒）
    // 使用 elapsedMS 作為後備（測試環境下 deltaMS 可能為 0）
    const deltaMS = ticker.deltaMS || ticker.elapsedMS || 16.67; // 預設 ~60 FPS
    const deltaTime = deltaMS / 1000;
    this.totalTime += deltaTime;

    if (this.updateCallback) {
      this.updateCallback(deltaTime, this.totalTime);
    }
  }

  /**
   * 清理資源
   */
  destroy(): void {
    this.stop();
    this.updateCallback = null;
    // 只銷毀自己建立的 ticker
    if (this.ownsTicker && this.ticker) {
      try {
        this.ticker.destroy();
      } catch (e) {
        // Ticker 可能已被銷毀，忽略錯誤
      }
    }
  }
}
