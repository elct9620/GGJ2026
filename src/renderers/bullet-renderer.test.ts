import { beforeEach, describe, expect, it } from "vitest";
import { BulletRenderer, type BulletState } from "./bullet-renderer";
import { SpecialBulletType } from "../core/types";

describe("BulletRenderer", () => {
  let renderer: BulletRenderer;

  beforeEach(() => {
    renderer = new BulletRenderer();
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
    it("應為活動子彈建立圖形", () => {
      const bullets: BulletState[] = [
        {
          id: "1",
          position: { x: 100, y: 200 },
          type: SpecialBulletType.None,
          active: true,
        },
      ];

      renderer.sync(bullets);

      expect(renderer.getContainer().children.length).toBe(1);
    });

    it("應更新子彈位置", () => {
      const bullets: BulletState[] = [
        {
          id: "1",
          position: { x: 100, y: 200 },
          type: SpecialBulletType.None,
          active: true,
        },
      ];

      renderer.sync(bullets);

      const graphics = renderer.getContainer().children[0];
      expect(graphics.position.x).toBe(100);
      expect(graphics.position.y).toBe(200);

      // Update position
      bullets[0].position = { x: 150, y: 250 };
      renderer.sync(bullets);

      expect(graphics.position.x).toBe(150);
      expect(graphics.position.y).toBe(250);
    });

    it("應移除非活動子彈的圖形", () => {
      const bullets: BulletState[] = [
        {
          id: "1",
          position: { x: 100, y: 200 },
          type: SpecialBulletType.None,
          active: true,
        },
      ];

      renderer.sync(bullets);
      expect(renderer.getContainer().children.length).toBe(1);

      // Mark bullet as inactive
      bullets[0].active = false;
      renderer.sync(bullets);

      expect(renderer.getContainer().children.length).toBe(0);
    });

    it("應處理多個子彈", () => {
      const bullets: BulletState[] = [
        {
          id: "1",
          position: { x: 100, y: 200 },
          type: SpecialBulletType.None,
          active: true,
        },
        {
          id: "2",
          position: { x: 200, y: 300 },
          type: SpecialBulletType.StinkyTofu,
          active: true,
        },
        {
          id: "3",
          position: { x: 300, y: 400 },
          type: SpecialBulletType.BloodCake,
          active: true,
        },
      ];

      renderer.sync(bullets);

      expect(renderer.getContainer().children.length).toBe(3);
    });

    it("應忽略非活動子彈", () => {
      const bullets: BulletState[] = [
        {
          id: "1",
          position: { x: 100, y: 200 },
          type: SpecialBulletType.None,
          active: false,
        },
      ];

      renderer.sync(bullets);

      expect(renderer.getContainer().children.length).toBe(0);
    });

    it("應正確處理空陣列", () => {
      renderer.sync([]);

      expect(renderer.getContainer().children.length).toBe(0);
    });

    it("應移除不再存在的子彈圖形", () => {
      const bullets: BulletState[] = [
        {
          id: "1",
          position: { x: 100, y: 200 },
          type: SpecialBulletType.None,
          active: true,
        },
        {
          id: "2",
          position: { x: 200, y: 300 },
          type: SpecialBulletType.None,
          active: true,
        },
      ];

      renderer.sync(bullets);
      expect(renderer.getContainer().children.length).toBe(2);

      // Remove one bullet from array
      renderer.sync([bullets[0]]);
      expect(renderer.getContainer().children.length).toBe(1);
    });
  });

  describe("Bullet Types", () => {
    it("應為不同子彈類型建立圖形", () => {
      const bulletTypes = [
        SpecialBulletType.None,
        SpecialBulletType.StinkyTofu,
        SpecialBulletType.BubbleTea,
        SpecialBulletType.BloodCake,
        SpecialBulletType.NightMarket,
        SpecialBulletType.OysterOmelette,
      ];

      const bullets: BulletState[] = bulletTypes.map((type, index) => ({
        id: String(index + 1),
        position: { x: 100 * index, y: 200 },
        type,
        active: true,
      }));

      renderer.sync(bullets);

      expect(renderer.getContainer().children.length).toBe(bulletTypes.length);
    });
  });

  describe("Destroy", () => {
    it("應正確清理資源", () => {
      const bullets: BulletState[] = [
        {
          id: "1",
          position: { x: 100, y: 200 },
          type: SpecialBulletType.None,
          active: true,
        },
      ];

      renderer.sync(bullets);
      expect(() => renderer.destroy()).not.toThrow();
    });

    it("空渲染器也應正確清理", () => {
      expect(() => renderer.destroy()).not.toThrow();
    });
  });
});
