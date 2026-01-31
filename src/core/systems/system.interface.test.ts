import { describe, expect, it } from "vitest";
import { System, SystemPriority } from "./system.interface";
import type { ISystem } from "./system.interface";

describe("ISystem Interface", () => {
  describe("SystemPriority", () => {
    it("應定義正確的優先級順序", () => {
      expect(SystemPriority.EVENT_QUEUE).toBe(0);
      expect(SystemPriority.INPUT).toBe(100);
      expect(SystemPriority.BOOTH).toBe(200);
      expect(SystemPriority.COMBAT).toBe(200);
      expect(SystemPriority.SYNTHESIS).toBe(200);
      expect(SystemPriority.WAVE).toBe(200);
      expect(SystemPriority.DEFAULT).toBe(500);
      expect(SystemPriority.HUD).toBe(900);
    });

    it("EVENT_QUEUE 應優先於所有其他系統", () => {
      expect(SystemPriority.EVENT_QUEUE).toBeLessThan(SystemPriority.INPUT);
      expect(SystemPriority.EVENT_QUEUE).toBeLessThan(SystemPriority.BOOTH);
      expect(SystemPriority.EVENT_QUEUE).toBeLessThan(SystemPriority.HUD);
    });

    it("INPUT 應在遊戲邏輯系統之前", () => {
      expect(SystemPriority.INPUT).toBeLessThan(SystemPriority.BOOTH);
      expect(SystemPriority.INPUT).toBeLessThan(SystemPriority.COMBAT);
    });

    it("HUD 應在所有其他系統之後", () => {
      expect(SystemPriority.HUD).toBeGreaterThan(SystemPriority.EVENT_QUEUE);
      expect(SystemPriority.HUD).toBeGreaterThan(SystemPriority.INPUT);
      expect(SystemPriority.HUD).toBeGreaterThan(SystemPriority.BOOTH);
      expect(SystemPriority.HUD).toBeGreaterThan(SystemPriority.DEFAULT);
    });
  });

  describe("System 基底類別", () => {
    it("應提供預設優先級", () => {
      class TestSystem extends System {
        name = "Test";
        update(): void {}
      }

      const system = new TestSystem();
      expect(system.priority).toBe(SystemPriority.DEFAULT);
    });

    it("應允許覆寫優先級", () => {
      class HighPrioritySystem extends System {
        name = "HighPriority";
        readonly priority = SystemPriority.INPUT;
        update(): void {}
      }

      const system = new HighPrioritySystem();
      expect(system.priority).toBe(SystemPriority.INPUT);
    });

    it("應提供預設 initialize 方法", () => {
      class MinimalSystem extends System {
        name = "Minimal";
        update(): void {}
      }

      const system = new MinimalSystem();
      expect(system.initialize).toBeDefined();
      expect(() => system.initialize?.()).not.toThrow();
    });

    it("應提供預設 destroy 方法", () => {
      class MinimalSystem extends System {
        name = "Minimal";
        update(): void {}
      }

      const system = new MinimalSystem();
      expect(system.destroy).toBeDefined();
      expect(() => system.destroy?.()).not.toThrow();
    });

    it("應允許實作 initialize 方法", () => {
      class InitializableSystem extends System {
        name = "Initializable";
        initialized = false;

        initialize(): void {
          this.initialized = true;
        }

        update(): void {}
      }

      const system = new InitializableSystem();
      expect(system.initialized).toBe(false);
      system.initialize?.();
      expect(system.initialized).toBe(true);
    });

    it("應允許實作 destroy 方法", () => {
      class DestroyableSystem extends System {
        name = "Destroyable";
        destroyed = false;

        destroy(): void {
          this.destroyed = true;
        }

        update(): void {}
      }

      const system = new DestroyableSystem();
      expect(system.destroyed).toBe(false);
      system.destroy?.();
      expect(system.destroyed).toBe(true);
    });
  });

  describe("ISystem 介面實作範例", () => {
    it("應支援完整實作所有方法", () => {
      class FullSystem implements ISystem {
        readonly name = "Full";
        readonly priority = SystemPriority.DEFAULT;
        initialized = false;
        destroyed = false;

        initialize(): void {
          this.initialized = true;
        }

        update(_deltaTime: number): void {
          // 更新邏輯
        }

        destroy(): void {
          this.destroyed = true;
        }
      }

      const system = new FullSystem();
      expect(system.name).toBe("Full");
      expect(system.priority).toBe(SystemPriority.DEFAULT);

      system.initialize?.();
      expect(system.initialized).toBe(true);

      system.update(0.016);

      system.destroy?.();
      expect(system.destroyed).toBe(true);
    });

    it("應支援最小化實作（僅 update）", () => {
      class MinimalSystem implements ISystem {
        readonly name = "Minimal";
        readonly priority = SystemPriority.DEFAULT;

        update(_deltaTime: number): void {
          // 最小實作
        }
      }

      const system = new MinimalSystem();
      expect(system.name).toBe("Minimal");
      expect("initialize" in system).toBe(false);
      expect("destroy" in system).toBe(false);
    });
  });
});
