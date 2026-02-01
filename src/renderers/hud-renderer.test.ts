import { beforeEach, describe, expect, it } from "vitest";
import { HUDRenderer, type HUDData, type RecipeStatus } from "./hud-renderer";

describe("HUDRenderer", () => {
  let renderer: HUDRenderer;

  beforeEach(() => {
    renderer = new HUDRenderer();
  });

  describe("Container", () => {
    it("應提供 top HUD container", () => {
      const topHUD = renderer.getTopHUD();
      expect(topHUD).toBeDefined();
      expect(topHUD.children.length).toBeGreaterThan(0);
    });

    it("應提供 bottom HUD container", () => {
      const bottomHUD = renderer.getBottomHUD();
      expect(bottomHUD).toBeDefined();
      expect(bottomHUD.children.length).toBeGreaterThan(0);
    });
  });

  describe("Sync", () => {
    it("應更新所有 HUD 元素", () => {
      const data: HUDData = {
        wave: 3,
        totalEnemies: 6,
        enemyCount: 4,
        score: 500,
        recipes: [],
      };

      expect(() => renderer.sync(data)).not.toThrow();
    });

    it("應更新配方可用性指示器", () => {
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

      const data: HUDData = {
        wave: 1,
        totalEnemies: 2,
        enemyCount: 2,
        score: 0,
        recipes,
      };

      expect(() => renderer.sync(data)).not.toThrow();
    });

    it("應正確處理空配方陣列", () => {
      const data: HUDData = {
        wave: 1,
        totalEnemies: 2,
        enemyCount: 0,
        score: 100,
        recipes: [],
      };

      expect(() => renderer.sync(data)).not.toThrow();
    });

    it("應正確處理高分數和高波次", () => {
      const data: HUDData = {
        wave: 99,
        totalEnemies: 198,
        enemyCount: 50,
        score: 99999,
        recipes: [],
      };

      expect(() => renderer.sync(data)).not.toThrow();
    });
  });

  describe("Destroy", () => {
    it("應正確清理資源", () => {
      expect(() => renderer.destroy()).not.toThrow();
    });
  });
});
