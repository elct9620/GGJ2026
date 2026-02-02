import { beforeEach, describe, expect, it } from "vitest";
import { FoodRenderer, type FoodState } from "./food-renderer";
import { FoodType } from "../core/types";

describe("FoodRenderer", () => {
  let renderer: FoodRenderer;

  beforeEach(() => {
    renderer = new FoodRenderer();
  });

  describe("Container", () => {
    it("應提供渲染容器", () => {
      const container = renderer.getContainer();
      expect(container).toBeDefined();
    });

    it("初始容器應為空", () => {
      const container = renderer.getContainer();
      expect(container.children.length).toBe(0);
    });
  });

  describe("Sync", () => {
    it("應為活動食材建立圖形", () => {
      const foods: FoodState[] = [
        {
          id: "1",
          position: { x: 100, y: 200 },
          type: FoodType.Pearl,
          active: true,
        },
      ];

      renderer.sync(foods);

      expect(renderer.getContainer().children.length).toBe(1);
    });

    it("應更新食材位置", () => {
      const foods: FoodState[] = [
        {
          id: "1",
          position: { x: 100, y: 200 },
          type: FoodType.Pearl,
          active: true,
        },
      ];

      renderer.sync(foods);

      const graphics = renderer.getContainer().children[0];
      expect(graphics.position.x).toBe(100);
      expect(graphics.position.y).toBe(200);

      // Update position
      foods[0].position = { x: 150, y: 250 };
      renderer.sync(foods);

      expect(graphics.position.x).toBe(150);
      expect(graphics.position.y).toBe(250);
    });

    it("應移除非活動食材的圖形", () => {
      const foods: FoodState[] = [
        {
          id: "1",
          position: { x: 100, y: 200 },
          type: FoodType.Pearl,
          active: true,
        },
      ];

      renderer.sync(foods);
      expect(renderer.getContainer().children.length).toBe(1);

      // Mark food as inactive
      foods[0].active = false;
      renderer.sync(foods);

      expect(renderer.getContainer().children.length).toBe(0);
    });

    it("應處理多個食材", () => {
      const foods: FoodState[] = [
        {
          id: "1",
          position: { x: 100, y: 200 },
          type: FoodType.Pearl,
          active: true,
        },
        {
          id: "2",
          position: { x: 200, y: 300 },
          type: FoodType.Tofu,
          active: true,
        },
        {
          id: "3",
          position: { x: 300, y: 400 },
          type: FoodType.BloodCake,
          active: true,
        },
      ];

      renderer.sync(foods);

      expect(renderer.getContainer().children.length).toBe(3);
    });

    it("應忽略非活動食材", () => {
      const foods: FoodState[] = [
        {
          id: "1",
          position: { x: 100, y: 200 },
          type: FoodType.Pearl,
          active: false,
        },
      ];

      renderer.sync(foods);

      expect(renderer.getContainer().children.length).toBe(0);
    });

    it("應正確處理空陣列", () => {
      renderer.sync([]);

      expect(renderer.getContainer().children.length).toBe(0);
    });

    it("應移除不再存在的食材圖形", () => {
      const foods: FoodState[] = [
        {
          id: "1",
          position: { x: 100, y: 200 },
          type: FoodType.Pearl,
          active: true,
        },
        {
          id: "2",
          position: { x: 200, y: 300 },
          type: FoodType.Tofu,
          active: true,
        },
      ];

      renderer.sync(foods);
      expect(renderer.getContainer().children.length).toBe(2);

      // Remove one food from array
      renderer.sync([foods[0]]);
      expect(renderer.getContainer().children.length).toBe(1);
    });
  });

  describe("Food Types", () => {
    it("應為 Pearl 類型建立圓形圖形", () => {
      const foods: FoodState[] = [
        {
          id: "1",
          position: { x: 100, y: 200 },
          type: FoodType.Pearl,
          active: true,
        },
      ];

      renderer.sync(foods);

      expect(renderer.getContainer().children.length).toBe(1);
    });

    it("應為 Tofu 類型建立方形圖形", () => {
      const foods: FoodState[] = [
        {
          id: "1",
          position: { x: 100, y: 200 },
          type: FoodType.Tofu,
          active: true,
        },
      ];

      renderer.sync(foods);

      expect(renderer.getContainer().children.length).toBe(1);
    });

    it("應為 BloodCake 類型建立菱形圖形", () => {
      const foods: FoodState[] = [
        {
          id: "1",
          position: { x: 100, y: 200 },
          type: FoodType.BloodCake,
          active: true,
        },
      ];

      renderer.sync(foods);

      expect(renderer.getContainer().children.length).toBe(1);
    });

    it("應為所有食材類型建立圖形", () => {
      const foodTypes = [FoodType.Pearl, FoodType.Tofu, FoodType.BloodCake];

      const foods: FoodState[] = foodTypes.map((type, index) => ({
        id: String(index + 1),
        position: { x: 100 * index, y: 200 },
        type,
        active: true,
      }));

      renderer.sync(foods);

      expect(renderer.getContainer().children.length).toBe(foodTypes.length);
    });
  });

  describe("Destroy", () => {
    it("應正確清理資源", () => {
      const foods: FoodState[] = [
        {
          id: "1",
          position: { x: 100, y: 200 },
          type: FoodType.Pearl,
          active: true,
        },
      ];

      renderer.sync(foods);
      expect(() => renderer.destroy()).not.toThrow();
    });

    it("空渲染器也應正確清理", () => {
      expect(() => renderer.destroy()).not.toThrow();
    });
  });
});
