import type { System } from "./system.interface";
import { isInjectableSystem } from "./injectable";

export class SystemManagerError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SystemManagerError";
  }
}

/**
 * 系統管理器
 * 負責系統的註冊、生命週期管理、優先級排程
 * 支援依賴注入（InjectableSystem）
 */
export class SystemManager {
  // 快速查找：O(1) 查詢系統
  private systems: Map<string, System> = new Map();

  // 優先級排序：註冊時排序一次，避免每幀排序
  private sortedSystems: System[] = [];

  // 初始化狀態
  private initialized = false;

  // 依賴註冊表（供 InjectableSystem 使用）
  private dependencyRegistry: Map<string, unknown> = new Map();

  /**
   * 註冊系統
   * @throws SystemManagerError 若系統名稱重複
   */
  public register(system: System): void {
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
  public get<T extends System>(systemName: string): T {
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
   * 提供依賴（供 InjectableSystem 注入）
   * @param key 依賴的唯一識別符
   * @param dependency 依賴實例
   */
  public provideDependency<T>(key: string, dependency: T): void {
    this.dependencyRegistry.set(key, dependency);
  }

  /**
   * 取得已提供的依賴
   */
  public getDependency<T>(key: string): T | undefined {
    return this.dependencyRegistry.get(key) as T | undefined;
  }

  /**
   * 檢查依賴是否已提供
   */
  public hasDependency(key: string): boolean {
    return this.dependencyRegistry.has(key);
  }

  /**
   * 初始化所有系統（依優先級順序）
   * 1. 注入依賴到所有 InjectableSystem
   * 2. 驗證所有 InjectableSystem 的依賴
   * 3. 呼叫各系統的 initialize()
   */
  public initialize(): void {
    if (this.initialized) {
      console.warn("SystemManager already initialized");
      return;
    }

    // 1. 注入依賴到所有 InjectableSystem
    for (const system of this.sortedSystems) {
      if (isInjectableSystem(system)) {
        for (const [key, dep] of this.dependencyRegistry) {
          system.inject(key, dep);
        }
      }
    }

    // 2. 驗證所有 InjectableSystem 的依賴
    for (const system of this.sortedSystems) {
      if (isInjectableSystem(system)) {
        try {
          system.validateDependencies();
        } catch (error) {
          console.error(
            `Dependency validation failed for system "${system.name}":`,
            error,
          );
          throw error; // Fail fast
        }
      }
    }

    // 3. 初始化各系統
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
    this.dependencyRegistry.clear();
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
