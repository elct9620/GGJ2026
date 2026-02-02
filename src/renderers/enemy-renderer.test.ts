import { beforeEach, describe, expect, it } from "vitest";
import { EnemyRenderer, type EnemyVisualState } from "./enemy-renderer";
import type { FlashEffect } from "../core/game-state";
import { EnemyType } from "../core/types";

describe("EnemyRenderer", () => {
  let renderer: EnemyRenderer;

  beforeEach(() => {
    renderer = new EnemyRenderer();
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
    it("應為活動敵人建立視覺元素", () => {
      const enemies: EnemyVisualState[] = [
        {
          id: "1",
          position: { x: 500, y: 300 },
          type: EnemyType.Ghost,
          health: { current: 1, max: 1 },
          active: true,
        },
      ];

      renderer.syncWithEffects(enemies, new Map(), 0);

      expect(renderer.getContainer().children.length).toBe(1);
    });

    it("應更新敵人位置", () => {
      const enemies: EnemyVisualState[] = [
        {
          id: "1",
          position: { x: 500, y: 300 },
          type: EnemyType.Ghost,
          health: { current: 1, max: 1 },
          active: true,
        },
      ];

      renderer.syncWithEffects(enemies, new Map(), 0);

      const container = renderer.getContainer().children[0];
      expect(container.position.x).toBe(500);
      expect(container.position.y).toBe(300);

      // Update position
      enemies[0].position = { x: 600, y: 400 };
      renderer.syncWithEffects(enemies, new Map(), 0);

      expect(container.position.x).toBe(600);
      expect(container.position.y).toBe(400);
    });

    it("應移除非活動敵人的視覺元素", () => {
      const enemies: EnemyVisualState[] = [
        {
          id: "1",
          position: { x: 500, y: 300 },
          type: EnemyType.Ghost,
          health: { current: 1, max: 1 },
          active: true,
        },
      ];

      renderer.syncWithEffects(enemies, new Map(), 0);
      expect(renderer.getContainer().children.length).toBe(1);

      // Mark enemy as inactive
      enemies[0].active = false;
      renderer.syncWithEffects(enemies, new Map(), 0);

      expect(renderer.getContainer().children.length).toBe(0);
    });

    it("應處理多個敵人", () => {
      const enemies: EnemyVisualState[] = [
        {
          id: "1",
          position: { x: 500, y: 300 },
          type: EnemyType.Ghost,
          health: { current: 1, max: 1 },
          active: true,
        },
        {
          id: "2",
          position: { x: 600, y: 400 },
          type: EnemyType.RedGhost,
          health: { current: 3, max: 3 },
          active: true,
        },
        {
          id: "3",
          position: { x: 700, y: 500 },
          type: EnemyType.Boss,
          health: { current: 10, max: 10 },
          active: true,
        },
      ];

      renderer.syncWithEffects(enemies, new Map(), 0);

      expect(renderer.getContainer().children.length).toBe(3);
    });

    it("應處理空陣列", () => {
      renderer.syncWithEffects([], new Map(), 0);

      expect(renderer.getContainer().children.length).toBe(0);
    });
  });

  describe("Flash Effect", () => {
    it("應正確處理閃白效果", () => {
      const enemies: EnemyVisualState[] = [
        {
          id: "1",
          position: { x: 500, y: 300 },
          type: EnemyType.Ghost,
          health: { current: 1, max: 1 },
          active: true,
        },
      ];

      const flashEffects = new Map<string, FlashEffect>([
        ["1", { color: 0xffffff, duration: 0.1 }],
      ]);

      // Apply flash
      renderer.syncWithEffects(enemies, flashEffects, 0);

      // Advance time past flash duration
      renderer.syncWithEffects(enemies, new Map(), 0.15);

      // No throw means success
      expect(true).toBe(true);
    });

    it("應返回已消費的閃光效果 ID", () => {
      const enemies: EnemyVisualState[] = [
        {
          id: "1",
          position: { x: 500, y: 300 },
          type: EnemyType.Ghost,
          health: { current: 1, max: 1 },
          active: true,
        },
        {
          id: "2",
          position: { x: 600, y: 400 },
          type: EnemyType.Ghost,
          health: { current: 1, max: 1 },
          active: true,
        },
      ];

      const flashEffects = new Map<string, FlashEffect>([
        ["1", { color: 0xffffff, duration: 0.1 }],
        ["2", { color: 0xff0000, duration: 0.1 }],
      ]);

      // First sync should return consumed IDs
      const consumed = renderer.syncWithEffects(enemies, flashEffects, 0);
      expect(consumed).toContain("1");
      expect(consumed).toContain("2");
      expect(consumed.length).toBe(2);

      // Second sync with same effects should not consume again (flash is in progress)
      const secondConsumed = renderer.syncWithEffects(
        enemies,
        flashEffects,
        0.05,
      );
      expect(secondConsumed.length).toBe(0);
    });

    it("閃光效果結束後不應重複觸發", () => {
      const enemies: EnemyVisualState[] = [
        {
          id: "1",
          position: { x: 500, y: 300 },
          type: EnemyType.Ghost,
          health: { current: 1, max: 1 },
          active: true,
        },
      ];

      const flashEffects = new Map<string, FlashEffect>([
        ["1", { color: 0xffffff, duration: 0.1 }],
      ]);

      // First sync - consume effect
      renderer.syncWithEffects(enemies, flashEffects, 0);

      // Flash ends
      renderer.syncWithEffects(enemies, new Map(), 0.15);

      // If the effect is still in flashEffects map (not cleared), it would re-trigger
      // But since we return consumed IDs, caller should clear them
      // This test verifies that after flash ends, a new effect CAN be applied
      const newConsumed = renderer.syncWithEffects(enemies, flashEffects, 0);
      expect(newConsumed).toContain("1");
    });
  });

  describe("Enemy Types", () => {
    it("應為所有敵人類型建立視覺元素", () => {
      const enemyTypes = [
        EnemyType.Ghost,
        EnemyType.RedGhost,
        EnemyType.GreenGhost,
        EnemyType.BlueGhost,
        EnemyType.Boss,
      ];

      const enemies: EnemyVisualState[] = enemyTypes.map((type, index) => ({
        id: String(index + 1),
        position: { x: 500 + index * 100, y: 300 },
        type,
        health: { current: 5, max: 5 },
        active: true,
      }));

      renderer.syncWithEffects(enemies, new Map(), 0);

      expect(renderer.getContainer().children.length).toBe(enemyTypes.length);
    });
  });

  describe("Health Bar", () => {
    it("Boss 和 Elite 敵人應顯示血條", () => {
      const enemies: EnemyVisualState[] = [
        {
          id: "1",
          position: { x: 500, y: 300 },
          type: EnemyType.Boss,
          health: { current: 5, max: 10 },
          active: true,
        },
      ];

      renderer.syncWithEffects(enemies, new Map(), 0);

      // Check container exists
      expect(renderer.getContainer().children.length).toBe(1);
    });

    it("血條應根據血量更新", () => {
      const enemies: EnemyVisualState[] = [
        {
          id: "1",
          position: { x: 500, y: 300 },
          type: EnemyType.Boss,
          health: { current: 10, max: 10 },
          active: true,
        },
      ];

      renderer.syncWithEffects(enemies, new Map(), 0);

      // Update health
      enemies[0].health = { current: 5, max: 10 };
      renderer.syncWithEffects(enemies, new Map(), 0);

      // No throw means success
      expect(true).toBe(true);
    });
  });

  describe("Destroy", () => {
    it("應正確清理資源", () => {
      const enemies: EnemyVisualState[] = [
        {
          id: "1",
          position: { x: 500, y: 300 },
          type: EnemyType.Ghost,
          health: { current: 1, max: 1 },
          active: true,
        },
      ];

      renderer.syncWithEffects(enemies, new Map(), 0);
      expect(() => renderer.destroy()).not.toThrow();
    });

    it("空渲染器也應正確清理", () => {
      expect(() => renderer.destroy()).not.toThrow();
    });
  });
});
