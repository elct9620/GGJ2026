import { beforeEach, describe, expect, it, vi } from "vitest";
import { SystemManager, SystemManagerError } from "./system-manager";
import { SystemPriority } from "./system.interface";
import type { System } from "./system.interface";
import { InjectableSystem, DependencyError } from "./injectable";

// 測試輔助函式：建立 Mock 系統
function createMockSystem(
  name: string,
  priority: SystemPriority = SystemPriority.DEFAULT,
): System {
  return {
    name,
    priority,
    initialize: vi.fn(),
    update: vi.fn(),
    destroy: vi.fn(),
  };
}

// 測試用 InjectableSystem
class TestInjectableSystem extends InjectableSystem {
  public readonly name: string;
  public readonly priority = SystemPriority.DEFAULT;

  private static readonly DEP_SERVICE_A = "ServiceA";
  private static readonly DEP_SERVICE_B = "ServiceB";

  public initializeCalled = false;

  constructor(name: string, requireA = true, requireB = true) {
    super();
    this.name = name;
    if (requireA) {
      this.declareDependency(TestInjectableSystem.DEP_SERVICE_A);
    }
    if (requireB) {
      this.declareDependency(TestInjectableSystem.DEP_SERVICE_B);
    }
  }

  public getServiceA<T>(): T {
    return this.getDependency<T>(TestInjectableSystem.DEP_SERVICE_A);
  }

  public getServiceB<T>(): T {
    return this.getDependency<T>(TestInjectableSystem.DEP_SERVICE_B);
  }

  public initialize(): void {
    this.initializeCalled = true;
  }

  public update(): void {
    // No-op for testing
  }
}

describe("SystemManager", () => {
  let manager: SystemManager;

  beforeEach(() => {
    manager = new SystemManager();
  });

  describe("Register System", () => {
    it("應成功註冊系統", () => {
      const system = createMockSystem("TestSystem");

      manager.register(system);

      expect(manager.has("TestSystem")).toBe(true);
      expect(manager.count).toBe(1);
    });

    it("應拋出錯誤若系統重複註冊", () => {
      const system = createMockSystem("TestSystem");

      manager.register(system);

      expect(() => manager.register(system)).toThrow(SystemManagerError);
      expect(() => manager.register(system)).toThrow(
        'System "TestSystem" is already registered',
      );
    });

    it("應依優先級排序系統", () => {
      const hudSystem = createMockSystem("HUD", SystemPriority.HUD);
      const inputSystem = createMockSystem("Input", SystemPriority.INPUT);
      const eventSystem = createMockSystem("Event", SystemPriority.EVENT_QUEUE);

      manager.register(hudSystem);
      manager.register(inputSystem);
      manager.register(eventSystem);

      manager.initialize();

      // 驗證初始化順序（Event → Input → HUD）
      const eventCallOrder = (eventSystem.initialize as any).mock
        .invocationCallOrder[0];
      const inputCallOrder = (inputSystem.initialize as any).mock
        .invocationCallOrder[0];
      const hudCallOrder = (hudSystem.initialize as any).mock
        .invocationCallOrder[0];

      expect(eventCallOrder).toBeLessThan(inputCallOrder);
      expect(inputCallOrder).toBeLessThan(hudCallOrder);
    });

    it("已初始化後註冊系統應立即初始化", () => {
      manager.initialize();

      const system = createMockSystem("LateSystem");
      manager.register(system);

      expect(system.initialize).toHaveBeenCalledTimes(1);
    });
  });

  describe("Unregister System", () => {
    it("應成功取消註冊系統", () => {
      const system = createMockSystem("TestSystem");
      manager.register(system);

      manager.unregister("TestSystem");

      expect(manager.has("TestSystem")).toBe(false);
      expect(manager.count).toBe(0);
    });

    it("取消註冊時應呼叫 destroy", () => {
      const system = createMockSystem("TestSystem");
      manager.register(system);

      manager.unregister("TestSystem");

      expect(system.destroy).toHaveBeenCalledTimes(1);
    });

    it("應拋出錯誤若系統不存在", () => {
      expect(() => manager.unregister("NonExistent")).toThrow(
        SystemManagerError,
      );
      expect(() => manager.unregister("NonExistent")).toThrow(
        'System "NonExistent" is not registered',
      );
    });
  });

  describe("Get System", () => {
    it("應成功取得系統實例", () => {
      const system = createMockSystem("TestSystem");
      manager.register(system);

      const retrieved = manager.get("TestSystem");

      expect(retrieved).toBe(system);
    });

    it("應支援型別推斷", () => {
      const system = createMockSystem("TestSystem");
      manager.register(system);

      const retrieved = manager.get<System>("TestSystem");

      expect(retrieved.name).toBe("TestSystem");
    });

    it("應拋出錯誤若系統不存在", () => {
      expect(() => manager.get("NonExistent")).toThrow(SystemManagerError);
      expect(() => manager.get("NonExistent")).toThrow(
        'System "NonExistent" is not registered',
      );
    });
  });

  describe("Has System", () => {
    it("已註冊系統應回傳 true", () => {
      const system = createMockSystem("TestSystem");
      manager.register(system);

      expect(manager.has("TestSystem")).toBe(true);
    });

    it("未註冊系統應回傳 false", () => {
      expect(manager.has("NonExistent")).toBe(false);
    });
  });

  describe("Initialize Systems", () => {
    it("應初始化所有系統", () => {
      const system1 = createMockSystem("System1");
      const system2 = createMockSystem("System2");

      manager.register(system1);
      manager.register(system2);
      manager.initialize();

      expect(system1.initialize).toHaveBeenCalledTimes(1);
      expect(system2.initialize).toHaveBeenCalledTimes(1);
    });

    it("應依優先級順序初始化", () => {
      const lowPriority = createMockSystem("Low", SystemPriority.HUD);
      const highPriority = createMockSystem("High", SystemPriority.EVENT_QUEUE);

      manager.register(lowPriority);
      manager.register(highPriority);
      manager.initialize();

      const highCallOrder = (highPriority.initialize as any).mock
        .invocationCallOrder[0];
      const lowCallOrder = (lowPriority.initialize as any).mock
        .invocationCallOrder[0];

      expect(highCallOrder).toBeLessThan(lowCallOrder);
    });

    it("重複初始化應顯示警告", () => {
      const consoleWarnSpy = vi
        .spyOn(console, "warn")
        .mockImplementation(() => {});

      manager.initialize();
      manager.initialize();

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        "SystemManager already initialized",
      );

      consoleWarnSpy.mockRestore();
    });

    it("初始化錯誤應拋出異常", () => {
      const system = createMockSystem("ErrorSystem");
      (system.initialize as any).mockImplementation(() => {
        throw new Error("Init failed");
      });

      manager.register(system);

      expect(() => manager.initialize()).toThrow("Init failed");
    });

    it("無 initialize 方法的系統應正常運作", () => {
      const system: System = {
        name: "MinimalSystem",
        priority: SystemPriority.DEFAULT,
        update: vi.fn(),
      };

      manager.register(system);

      expect(() => manager.initialize()).not.toThrow();
    });
  });

  describe("Update Systems", () => {
    it("應更新所有系統", () => {
      const system1 = createMockSystem("System1");
      const system2 = createMockSystem("System2");

      manager.register(system1);
      manager.register(system2);
      manager.initialize();
      manager.update(0.016);

      expect(system1.update).toHaveBeenCalledTimes(1);
      expect(system1.update).toHaveBeenCalledWith(0.016);
      expect(system2.update).toHaveBeenCalledTimes(1);
      expect(system2.update).toHaveBeenCalledWith(0.016);
    });

    it("應依優先級順序更新", () => {
      const lowPriority = createMockSystem("Low", SystemPriority.HUD);
      const highPriority = createMockSystem("High", SystemPriority.EVENT_QUEUE);

      manager.register(lowPriority);
      manager.register(highPriority);
      manager.initialize();
      manager.update(0.016);

      const highCallOrder = (highPriority.update as any).mock
        .invocationCallOrder[0];
      const lowCallOrder = (lowPriority.update as any).mock
        .invocationCallOrder[0];

      expect(highCallOrder).toBeLessThan(lowCallOrder);
    });

    it("未初始化時應拋出錯誤", () => {
      const system = createMockSystem("System");
      manager.register(system);

      expect(() => manager.update(0.016)).toThrow(SystemManagerError);
      expect(() => manager.update(0.016)).toThrow(
        "SystemManager not initialized",
      );
    });

    it("系統更新錯誤應繼續執行其他系統", () => {
      const errorSystem = createMockSystem("ErrorSystem");
      const normalSystem = createMockSystem("NormalSystem");

      (errorSystem.update as any).mockImplementation(() => {
        throw new Error("Update failed");
      });

      manager.register(errorSystem);
      manager.register(normalSystem);
      manager.initialize();

      const consoleErrorSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});

      manager.update(0.016);

      expect(normalSystem.update).toHaveBeenCalled();
      expect(consoleErrorSpy).toHaveBeenCalled();

      consoleErrorSpy.mockRestore();
    });
  });

  describe("Destroy Systems", () => {
    it("應銷毀所有系統", () => {
      const system1 = createMockSystem("System1");
      const system2 = createMockSystem("System2");

      manager.register(system1);
      manager.register(system2);
      manager.initialize();
      manager.destroy();

      expect(system1.destroy).toHaveBeenCalledTimes(1);
      expect(system2.destroy).toHaveBeenCalledTimes(1);
    });

    it("應以反向優先級順序銷毀", () => {
      const lowPriority = createMockSystem("Low", SystemPriority.EVENT_QUEUE);
      const highPriority = createMockSystem("High", SystemPriority.HUD);

      manager.register(lowPriority);
      manager.register(highPriority);
      manager.initialize();
      manager.destroy();

      const highCallOrder = (highPriority.destroy as any).mock
        .invocationCallOrder[0];
      const lowCallOrder = (lowPriority.destroy as any).mock
        .invocationCallOrder[0];

      // HUD (高優先級數字) 先於 EventQueue (低優先級數字) 銷毀
      expect(highCallOrder).toBeLessThan(lowCallOrder);
    });

    it("銷毀後應清空所有系統", () => {
      const system = createMockSystem("System");
      manager.register(system);
      manager.initialize();

      manager.destroy();

      expect(manager.count).toBe(0);
      expect(manager.has("System")).toBe(false);
    });

    it("銷毀後應重置初始化狀態", () => {
      manager.initialize();
      manager.destroy();

      const system = createMockSystem("NewSystem");
      manager.register(system);

      // 未初始化時更新應拋出錯誤
      expect(() => manager.update(0.016)).toThrow(
        "SystemManager not initialized",
      );
    });

    it("銷毀錯誤應繼續清理其他系統", () => {
      const errorSystem = createMockSystem("ErrorSystem");
      const normalSystem = createMockSystem("NormalSystem");

      (errorSystem.destroy as any).mockImplementation(() => {
        throw new Error("Destroy failed");
      });

      manager.register(errorSystem);
      manager.register(normalSystem);
      manager.initialize();

      const consoleErrorSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});

      manager.destroy();

      expect(normalSystem.destroy).toHaveBeenCalled();
      expect(consoleErrorSpy).toHaveBeenCalled();

      consoleErrorSpy.mockRestore();
    });

    it("無 destroy 方法的系統應正常運作", () => {
      const system: System = {
        name: "MinimalSystem",
        priority: SystemPriority.DEFAULT,
        update: vi.fn(),
      };

      manager.register(system);
      manager.initialize();

      expect(() => manager.destroy()).not.toThrow();
    });
  });

  describe("Get System Names", () => {
    it("應回傳所有系統名稱", () => {
      const system1 = createMockSystem("System1");
      const system2 = createMockSystem("System2");

      manager.register(system1);
      manager.register(system2);

      const names = manager.getSystemNames();

      expect(names).toContain("System1");
      expect(names).toContain("System2");
      expect(names.length).toBe(2);
    });

    it("無系統時應回傳空陣列", () => {
      const names = manager.getSystemNames();

      expect(names).toEqual([]);
    });
  });

  describe("Count Property", () => {
    it("應回傳正確的系統數量", () => {
      expect(manager.count).toBe(0);

      manager.register(createMockSystem("System1"));
      expect(manager.count).toBe(1);

      manager.register(createMockSystem("System2"));
      expect(manager.count).toBe(2);

      manager.unregister("System1");
      expect(manager.count).toBe(1);
    });
  });

  describe("Dependency Injection", () => {
    it("provideDependency 應正確註冊依賴", () => {
      const service = { value: "test" };
      manager.provideDependency("ServiceA", service);

      expect(manager.hasDependency("ServiceA")).toBe(true);
      expect(manager.getDependency("ServiceA")).toBe(service);
    });

    it("hasDependency 應正確檢查依賴存在", () => {
      expect(manager.hasDependency("NonExistent")).toBe(false);

      manager.provideDependency("ServiceA", {});
      expect(manager.hasDependency("ServiceA")).toBe(true);
    });

    it("initialize 時應自動注入依賴到 InjectableSystem", () => {
      const serviceA = { name: "A" };
      const serviceB = { name: "B" };
      const system = new TestInjectableSystem("TestSystem");

      manager.provideDependency("ServiceA", serviceA);
      manager.provideDependency("ServiceB", serviceB);
      manager.register(system);
      manager.initialize();

      expect(system.getServiceA()).toBe(serviceA);
      expect(system.getServiceB()).toBe(serviceB);
    });

    it("initialize 時應驗證 InjectableSystem 的依賴", () => {
      const system = new TestInjectableSystem("TestSystem");
      manager.provideDependency("ServiceA", {}); // 只提供 A，缺少 B

      manager.register(system);

      expect(() => manager.initialize()).toThrow(DependencyError);
    });

    it("依賴驗證失敗時應 fail fast 不執行 initialize", () => {
      const system = new TestInjectableSystem("TestSystem");
      manager.provideDependency("ServiceA", {}); // 缺少 ServiceB

      manager.register(system);

      try {
        manager.initialize();
      } catch {
        // Expected to throw
      }

      expect(system.initializeCalled).toBe(false);
    });

    it("所有依賴都提供時應正常初始化", () => {
      const system = new TestInjectableSystem("TestSystem");
      manager.provideDependency("ServiceA", {});
      manager.provideDependency("ServiceB", {});

      manager.register(system);
      manager.initialize();

      expect(system.initializeCalled).toBe(true);
    });

    it("混合 System 和 InjectableSystem 應正常運作", () => {
      const regularSystem = createMockSystem("RegularSystem");
      const injectableSystem = new TestInjectableSystem("InjectableSystem");

      manager.provideDependency("ServiceA", {});
      manager.provideDependency("ServiceB", {});

      manager.register(regularSystem);
      manager.register(injectableSystem);
      manager.initialize();

      expect(regularSystem.initialize).toHaveBeenCalled();
      expect(injectableSystem.initializeCalled).toBe(true);
    });

    it("不需要依賴的 InjectableSystem 應正常初始化", () => {
      const system = new TestInjectableSystem("NoDepSystem", false, false);

      manager.register(system);
      manager.initialize();

      expect(system.initializeCalled).toBe(true);
    });

    it("destroy 應清空依賴註冊表", () => {
      manager.provideDependency("ServiceA", {});
      manager.provideDependency("ServiceB", {});
      manager.initialize();

      manager.destroy();

      expect(manager.hasDependency("ServiceA")).toBe(false);
      expect(manager.hasDependency("ServiceB")).toBe(false);
    });
  });

  describe("Performance", () => {
    it("應使用 O(1) 查找系統", () => {
      // 註冊大量系統
      for (let i = 0; i < 1000; i++) {
        manager.register(createMockSystem(`System${i}`));
      }

      const start = performance.now();
      manager.get("System500");
      const duration = performance.now() - start;

      // 查找應非常快（< 1ms）
      expect(duration).toBeLessThan(1);
    });

    it("應僅在註冊時排序一次", () => {
      const system1 = createMockSystem("System1");
      const system2 = createMockSystem("System2");

      manager.register(system1);
      manager.register(system2);
      manager.initialize();

      // 更新 100 次
      for (let i = 0; i < 100; i++) {
        manager.update(0.016);
      }

      // 每個系統應被呼叫 100 次
      expect(system1.update).toHaveBeenCalledTimes(100);
      expect(system2.update).toHaveBeenCalledTimes(100);
    });

    it("更新多個系統應保持高效能", () => {
      // 註冊 10 個系統
      for (let i = 0; i < 10; i++) {
        manager.register(createMockSystem(`System${i}`));
      }

      manager.initialize();

      const start = performance.now();

      // 更新 60 次（模擬 1 秒 @ 60 FPS）
      for (let i = 0; i < 60; i++) {
        manager.update(0.016);
      }

      const duration = performance.now() - start;

      // 60 幀應在合理時間內完成（< 100ms）
      expect(duration).toBeLessThan(100);
    });
  });
});
