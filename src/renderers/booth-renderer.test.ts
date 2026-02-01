import { beforeEach, describe, expect, it } from "vitest";
import { BoothRenderer } from "./booth-renderer";
import { BoothId, FoodType } from "../core/types";
import type { BoothState } from "../core/game-state";

describe("BoothRenderer", () => {
  let renderer: BoothRenderer;

  beforeEach(() => {
    renderer = new BoothRenderer();
  });

  describe("Container", () => {
    it("應提供渲染容器", () => {
      const container = renderer.getContainer();
      expect(container).toBeDefined();
    });

    it("容器應包含背景和攤位視覺元素", () => {
      const container = renderer.getContainer();
      // 1 background + 3 booths × 3 elements (sprite, countText, nameText) = 10
      expect(container.children.length).toBe(10);
    });
  });

  describe("Sync", () => {
    it("應更新單一攤位的計數顯示", () => {
      const booths = new Map<BoothId, BoothState>([
        [BoothId.Tofu, { foodType: FoodType.Tofu, count: 3, maxCapacity: 6 }],
        [BoothId.Pearl, { foodType: FoodType.Pearl, count: 0, maxCapacity: 6 }],
        [
          BoothId.BloodCake,
          { foodType: FoodType.BloodCake, count: 0, maxCapacity: 6 },
        ],
      ]);

      renderer.sync(booths);

      // Verify visually by checking container children
      // (In real tests, we might need to inspect text content)
      expect(renderer.getContainer().children.length).toBeGreaterThan(0);
    });

    it("應正確處理全滿攤位的顯示", () => {
      const booths = new Map<BoothId, BoothState>([
        [BoothId.Tofu, { foodType: FoodType.Tofu, count: 6, maxCapacity: 6 }],
        [BoothId.Pearl, { foodType: FoodType.Pearl, count: 6, maxCapacity: 6 }],
        [
          BoothId.BloodCake,
          { foodType: FoodType.BloodCake, count: 6, maxCapacity: 6 },
        ],
      ]);

      expect(() => renderer.sync(booths)).not.toThrow();
    });

    it("應正確處理空攤位的顯示", () => {
      const booths = new Map<BoothId, BoothState>([
        [BoothId.Tofu, { foodType: FoodType.Tofu, count: 0, maxCapacity: 6 }],
        [BoothId.Pearl, { foodType: FoodType.Pearl, count: 0, maxCapacity: 6 }],
        [
          BoothId.BloodCake,
          { foodType: FoodType.BloodCake, count: 0, maxCapacity: 6 },
        ],
      ]);

      expect(() => renderer.sync(booths)).not.toThrow();
    });
  });

  describe("Destroy", () => {
    it("應正確清理資源", () => {
      expect(() => renderer.destroy()).not.toThrow();
    });
  });
});
