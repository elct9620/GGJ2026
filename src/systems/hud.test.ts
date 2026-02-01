import { beforeEach, describe, expect, it } from "vitest";
import { HUDSystem, type RecipeStatus } from "./hud";
import { SystemPriority } from "../core/systems/system.interface";

describe("HUDSystem", () => {
  let hudSystem: HUDSystem;

  beforeEach(() => {
    hudSystem = new HUDSystem();
  });

  describe("System Interface", () => {
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

    it("updateScore 應更新分數顯示", () => {
      expect(() => hudSystem.updateScore(1000)).not.toThrow();
    });

    it("updateRecipeAvailability 應更新配方可用性指示器", () => {
      const recipes: RecipeStatus[] = [
        {
          key: "1",
          name: "夜市總匯",
          available: true,
          requirements: [
            { type: 2, collected: true },
            { type: 3, collected: true },
            { type: 1, collected: true },
          ],
        },
        {
          key: "2",
          name: "臭豆腐",
          available: true,
          requirements: [
            { type: 3, collected: true },
            { type: 3, collected: true },
            { type: 3, collected: true },
          ],
        },
        {
          key: "3",
          name: "珍珠奶茶",
          available: false,
          requirements: [
            { type: 2, collected: true },
            { type: 2, collected: false },
            { type: 2, collected: false },
          ],
        },
        {
          key: "4",
          name: "豬血糕",
          available: true,
          requirements: [
            { type: 1, collected: true },
            { type: 1, collected: true },
            { type: 1, collected: true },
          ],
        },
        {
          key: "5",
          name: "蚵仔煎",
          available: false,
          requirements: [{ type: 3, collected: false }],
        },
      ];
      expect(() => hudSystem.updateRecipeAvailability(recipes)).not.toThrow();
    });
  });
});
