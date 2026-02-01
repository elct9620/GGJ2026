/**
 * 系統執行優先級（數字越小越早執行）
 * 定義系統在遊戲循環中的執行順序
 */
export const SystemPriority = {
  EVENT_QUEUE: 0, // 事件處理（必須最先執行）
  INPUT: 100, // 輸入收集（在遊戲邏輯前）
  COMBAT: 200, // 戰鬥系統
  BOOTH: 200, // 攤位系統
  SYNTHESIS: 200, // 合成系統
  WAVE: 200, // 波次系統
  HUD: 900, // UI 渲染（必須最後執行）
  DEFAULT: 500, // 自訂系統預設優先級
} as const;

export type SystemPriority =
  (typeof SystemPriority)[keyof typeof SystemPriority];

/**
 * 系統生命週期介面
 * 所有遊戲系統應實作此介面
 */
export interface System {
  /** 系統唯一識別名稱 */
  readonly name: string;

  /** 系統執行優先級（數字越小越早） */
  readonly priority: SystemPriority;

  /** 初始化系統資源（註冊時呼叫） */
  initialize?(): void;

  /** 每幀更新系統狀態 */
  update(deltaTime: number): void;

  /** 清理系統資源（取消註冊時呼叫） */
  destroy?(): void;
}

/**
 * @deprecated Use System instead
 */
export type ISystem = System;
