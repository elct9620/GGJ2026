import type { ISystem } from "./system.interface";

export class SystemManagerError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SystemManagerError";
  }
}

/**
 * 系統管理器
 * 負責系統的註冊、生命週期管理、優先級排程
 */
export class SystemManager {
  // 快速查找：O(1) 查詢系統
  private systems: Map<string, ISystem> = new Map();

  // 優先級排序：註冊時排序一次，避免每幀排序
  private sortedSystems: ISystem[] = [];

  // 初始化狀態
  private initialized = false;

  /**
   * 註冊系統
   * @throws SystemManagerError 若系統名稱重複
   */
  public register(system: ISystem): void {
    if (this.systems.has(system.name)) {
      throw new SystemManagerError(
        `System "${system.name}" is already registered`,
      );
    }

    this.systems.set(system.name, system);

    // 重新排序（優先級數字越小越早執行）
    this.sortedSystems = Array.from(this.systems.values()).sort(
      (a, b) => a.priority - b.priority,
    );

    // 若已初始化，立即初始化新系統
    if (this.initialized) {
      system.initialize?.();
    }
  }

  /**
   * 取消註冊系統
   * @throws SystemManagerError 若系統不存在
   */
  public unregister(systemName: string): void {
    const system = this.systems.get(systemName);
    if (!system) {
      throw new SystemManagerError(`System "${systemName}" is not registered`);
    }

    system.destroy?.();
    this.systems.delete(systemName);
    this.sortedSystems = this.sortedSystems.filter(
      (s) => s.name !== systemName,
    );
  }

  /**
   * 取得系統實例
   * @throws SystemManagerError 若系統不存在
   */
  public get<T extends ISystem>(systemName: string): T {
    const system = this.systems.get(systemName);
    if (!system) {
      throw new SystemManagerError(`System "${systemName}" is not registered`);
    }
    return system as T;
  }

  /**
   * 檢查系統是否已註冊
   */
  public has(systemName: string): boolean {
    return this.systems.has(systemName);
  }

  /**
   * 初始化所有系統（依優先級順序）
   */
  public initialize(): void {
    if (this.initialized) {
      console.warn("SystemManager already initialized");
      return;
    }

    for (const system of this.sortedSystems) {
      try {
        system.initialize?.();
      } catch (error) {
        console.error(`Error initializing system "${system.name}":`, error);
        throw error; // Fail fast
      }
    }

    this.initialized = true;
  }

  /**
   * 更新所有系統（依優先級順序）
   * @throws SystemManagerError 若未初始化
   */
  public update(deltaTime: number): void {
    if (!this.initialized) {
      throw new SystemManagerError(
        "SystemManager not initialized. Call initialize() first.",
      );
    }

    for (const system of this.sortedSystems) {
      try {
        system.update(deltaTime);
      } catch (error) {
        console.error(`Error updating system "${system.name}":`, error);
        // 繼續執行其他系統（優雅降級）
      }
    }
  }

  /**
   * 銷毀所有系統（反向優先級順序）
   */
  public destroy(): void {
    // 反向銷毀（HUD 先於 Input）
    for (let i = this.sortedSystems.length - 1; i >= 0; i--) {
      const system = this.sortedSystems[i];
      try {
        system.destroy?.();
      } catch (error) {
        console.error(`Error destroying system "${system.name}":`, error);
        // 繼續清理其他系統
      }
    }

    this.systems.clear();
    this.sortedSystems = [];
    this.initialized = false;
  }

  /**
   * 取得所有系統名稱
   */
  public getSystemNames(): string[] {
    return Array.from(this.systems.keys());
  }

  /**
   * 取得已註冊系統數量
   */
  public get count(): number {
    return this.systems.size;
  }
}
