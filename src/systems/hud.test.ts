import { beforeEach, describe, expect, it } from "vitest";
import { HUDSystem } from "./hud";
import { SystemPriority } from "../core/systems/system.interface";

describe("HUDSystem", () => {
  let hudSystem: HUDSystem;

  beforeEach(() => {
    hudSystem = new HUDSystem();
  });

  describe("ISystem Interface", () => {
    it("應有正確的 name", () => {
      expect(hudSystem.name).toBe("HUDSystem");
    });

    it("應有正確的 priority", () => {
      expect(hudSystem.priority).toBe(SystemPriority.HUD);
    });

    it("initialize 應可被呼叫", () => {
      expect(() => hudSystem.initialize()).not.toThrow();
    });

    it("update 應可被呼叫（無操作）", () => {
      expect(() => hudSystem.update(0.016)).not.toThrow();
    });

    it("destroy 應清理資源", () => {
      expect(() => hudSystem.destroy()).not.toThrow();
    });
  });

  describe("HUD Containers", () => {
    it("應提供 top HUD container", () => {
      const topHUD = hudSystem.getTopHUD();
      expect(topHUD).toBeDefined();
      expect(topHUD.children.length).toBeGreaterThan(0);
    });

    it("應提供 bottom HUD container", () => {
      const bottomHUD = hudSystem.getBottomHUD();
      expect(bottomHUD).toBeDefined();
      expect(bottomHUD.children.length).toBeGreaterThan(0);
    });
  });

  describe("Update Methods", () => {
    it("updateWave 應更新波次顯示", () => {
      expect(() => hudSystem.updateWave(5)).not.toThrow();
    });

    it("updateEnemyCount 應更新敵人數量", () => {
      expect(() => hudSystem.updateEnemyCount(10)).not.toThrow();
    });

    it("updateHealthDisplay 應更新血量顯示", () => {
      expect(() => hudSystem.updateHealthDisplay(3)).not.toThrow();
    });

    it("updateAmmo 應更新彈藥顯示", () => {
      expect(() => hudSystem.updateAmmo(4, 6)).not.toThrow();
    });

    it("updateSynthesis 應更新合成槽顯示", () => {
      expect(() => hudSystem.updateSynthesis(2)).not.toThrow();
    });

    it("updateReload 應更新重裝狀態", () => {
      expect(() => hudSystem.updateReload(true, 2.5)).not.toThrow();
      expect(() => hudSystem.updateReload(false)).not.toThrow();
    });
  });
});
