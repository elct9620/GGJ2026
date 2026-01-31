/**
 * Entity - 遊戲物件基礎類別
 *
 * 遵循 SPEC.md § 2.5 Entity Architecture
 * - 所有遊戲物件（Player、Ghost、Boss、Bullet、Food）繼承此類別
 * - 提供唯一 ID（自增整數轉字串）
 * - 支援物件池管理（active 狀態）
 */

let nextEntityId = 1;

export abstract class Entity {
  public readonly id: string;
  public active: boolean = true;

  constructor() {
    this.id = String(nextEntityId++);
  }

  /**
   * 啟用實體（從物件池取出時調用）
   */
  activate(): void {
    this.active = true;
  }

  /**
   * 停用實體（返回物件池時調用）
   */
  deactivate(): void {
    this.active = false;
  }
}

/**
 * 重置 ID 計數器（僅用於測試）
 * @internal
 */
export function resetEntityIdCounter(): void {
  nextEntityId = 1;
}
