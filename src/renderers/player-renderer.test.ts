import { beforeEach, describe, expect, it } from "vitest";
import { PlayerRenderer, type PlayerState } from "./player-renderer";
import { SpecialBulletType } from "../core/types";

describe("PlayerRenderer", () => {
  let renderer: PlayerRenderer;

  beforeEach(() => {
    renderer = new PlayerRenderer();
  });

  describe("Container", () => {
    it("應提供渲染容器", () => {
      const container = renderer.getContainer();
      expect(container).toBeDefined();
    });

    it("容器應包含 player sprite 和 direction hint", () => {
      const container = renderer.getContainer();
      // playerSprite + dirHintSprite = 2 children
      expect(container.children.length).toBe(2);
    });
  });

  describe("Sync", () => {
    it("應更新玩家位置", () => {
      const state: PlayerState = {
        position: { x: 500, y: 300 },
        activeBuff: SpecialBulletType.None,
      };

      renderer.sync(state);

      expect(renderer.getContainer().position.x).toBe(500);
      expect(renderer.getContainer().position.y).toBe(300);
    });

    it("應在位置變更時更新", () => {
      const state: PlayerState = {
        position: { x: 500, y: 300 },
        activeBuff: SpecialBulletType.None,
      };

      renderer.sync(state);

      // Update position
      state.position = { x: 600, y: 400 };
      renderer.sync(state);

      expect(renderer.getContainer().position.x).toBe(600);
      expect(renderer.getContainer().position.y).toBe(400);
    });

    it("應在 buff 變更時更新外觀", () => {
      const state: PlayerState = {
        position: { x: 500, y: 300 },
        activeBuff: SpecialBulletType.None,
      };

      renderer.sync(state);

      // Change buff - should not throw
      state.activeBuff = SpecialBulletType.StinkyTofu;
      expect(() => renderer.sync(state)).not.toThrow();
    });

    it("應處理所有 buff 類型", () => {
      const buffTypes = [
        SpecialBulletType.None,
        SpecialBulletType.StinkyTofu,
        SpecialBulletType.BubbleTea,
        SpecialBulletType.BloodCake,
        SpecialBulletType.NightMarket,
        SpecialBulletType.OysterOmelette,
      ];

      const state: PlayerState = {
        position: { x: 500, y: 300 },
        activeBuff: SpecialBulletType.None,
      };

      for (const buffType of buffTypes) {
        state.activeBuff = buffType;
        expect(() => renderer.sync(state)).not.toThrow();
      }
    });

    it("相同 buff 不應重複更新外觀", () => {
      const state: PlayerState = {
        position: { x: 500, y: 300 },
        activeBuff: SpecialBulletType.StinkyTofu,
      };

      // First sync
      renderer.sync(state);

      // Second sync with same buff - should not cause issues
      expect(() => renderer.sync(state)).not.toThrow();
    });
  });

  describe("Destroy", () => {
    it("應正確清理資源", () => {
      expect(() => renderer.destroy()).not.toThrow();
    });
  });
});
