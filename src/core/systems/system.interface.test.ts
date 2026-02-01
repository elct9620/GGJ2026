import { describe, expect, it } from "vitest";
import { SystemPriority } from "./system.interface";
import type { System } from "./system.interface";

describe("System Interface", () => {
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

  describe("System 介面實作範例", () => {
    it("應支援完整實作所有方法", () => {
      class FullSystem implements System {
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
      class MinimalSystem implements System {
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
