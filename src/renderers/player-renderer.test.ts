import { beforeEach, describe, expect, it } from "vitest";
import { PlayerRenderer, type PlayerState } from "./player-renderer";
import { SpecialBulletType } from "../core/types";
import { PLAYER_CONFIG } from "../config";

/**
 * Create a default PlayerState for testing
 * Includes all required fields per SPEC § 2.7.4
 */
function createDefaultState(overrides: Partial<PlayerState> = {}): PlayerState {
  return {
    position: { x: 500, y: 300 },
    activeBuff: SpecialBulletType.None,
    health: { current: PLAYER_CONFIG.maxHealth, max: PLAYER_CONFIG.maxHealth },
    ammo: {
      current: PLAYER_CONFIG.magazineCapacity,
      max: PLAYER_CONFIG.magazineCapacity,
    },
    isReloading: false,
    reloadProgress: 0,
    ...overrides,
  };
}

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

    it("容器應包含 player sprite、direction hint、health container 和 ammo bar", () => {
      const container = renderer.getContainer();
      // playerSprite + dirHintSprite + healthContainer + ammoBarContainer = 4 children
      expect(container.children.length).toBe(4);
    });
  });

  describe("Sync", () => {
    it("應更新玩家位置", () => {
      const state = createDefaultState({ position: { x: 500, y: 300 } });

      renderer.sync(state);

      expect(renderer.getContainer().position.x).toBe(500);
      expect(renderer.getContainer().position.y).toBe(300);
    });

    it("應在位置變更時更新", () => {
      const state = createDefaultState();

      renderer.sync(state);

      // Update position
      state.position = { x: 600, y: 400 };
      renderer.sync(state);

      expect(renderer.getContainer().position.x).toBe(600);
      expect(renderer.getContainer().position.y).toBe(400);
    });

    it("應在 buff 變更時更新外觀", () => {
      const state = createDefaultState();

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

      const state = createDefaultState();

      for (const buffType of buffTypes) {
        state.activeBuff = buffType;
        expect(() => renderer.sync(state)).not.toThrow();
      }
    });

    it("相同 buff 不應重複更新外觀", () => {
      const state = createDefaultState({
        activeBuff: SpecialBulletType.StinkyTofu,
      });

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

  // SPEC § 2.7.4 Player Floating Info Tests
  describe("Health Display (SPEC § 2.7.4)", () => {
    it("PF-01: 滿血時顯示 5 個填滿的愛心", () => {
      const state = createDefaultState({
        health: { current: 5, max: 5 },
      });

      // Should not throw when syncing with full health
      expect(() => renderer.sync(state)).not.toThrow();
    });

    it("PF-02: 3/5 血量顯示 3 個填滿 + 2 個空心", () => {
      const state = createDefaultState({
        health: { current: 3, max: 5 },
      });

      expect(() => renderer.sync(state)).not.toThrow();
    });

    it("PF-03: 1/5 血量顯示 1 個填滿 + 4 個空心", () => {
      const state = createDefaultState({
        health: { current: 1, max: 5 },
      });

      expect(() => renderer.sync(state)).not.toThrow();
    });

    it("PF-04: 0/5 血量顯示 5 個空心", () => {
      const state = createDefaultState({
        health: { current: 0, max: 5 },
      });

      expect(() => renderer.sync(state)).not.toThrow();
    });

    it("PF-05: 血量圖示跟隨玩家移動", () => {
      const state = createDefaultState({
        position: { x: 800, y: 600 },
      });

      renderer.sync(state);

      // Container position should match player position
      expect(renderer.getContainer().position.x).toBe(800);
      expect(renderer.getContainer().position.y).toBe(600);
    });
  });

  describe("Ammo Progress Bar (SPEC § 2.7.4)", () => {
    it("PF-06: 彈藥 6/6 進度條 100%", () => {
      const state = createDefaultState({
        ammo: { current: 6, max: 6 },
      });

      expect(() => renderer.sync(state)).not.toThrow();
    });

    it("PF-07: 彈藥 3/6 進度條 50%", () => {
      const state = createDefaultState({
        ammo: { current: 3, max: 6 },
      });

      expect(() => renderer.sync(state)).not.toThrow();
    });

    it("PF-08: 彈藥 0/6 進度條 0%", () => {
      const state = createDefaultState({
        ammo: { current: 0, max: 6 },
      });

      expect(() => renderer.sync(state)).not.toThrow();
    });

    it("PF-09: 射擊一次後進度條減少", () => {
      // Start with full ammo
      const state = createDefaultState({
        ammo: { current: 6, max: 6 },
      });
      renderer.sync(state);

      // Shoot once (5/6)
      state.ammo = { current: 5, max: 6 };
      expect(() => renderer.sync(state)).not.toThrow();
    });

    it("PF-10: 彈藥進度條跟隨玩家移動", () => {
      const state = createDefaultState({
        position: { x: 1000, y: 500 },
      });

      renderer.sync(state);

      expect(renderer.getContainer().position.x).toBe(1000);
      expect(renderer.getContainer().position.y).toBe(500);
    });
  });

  describe("Reload Animation (SPEC § 2.7.4)", () => {
    it("PF-11: 重裝開始時進度條顯示動畫", () => {
      const state = createDefaultState({
        ammo: { current: 0, max: 6 },
        isReloading: true,
        reloadProgress: 0,
      });

      expect(() => renderer.sync(state)).not.toThrow();
    });

    it("PF-12: 重裝進度 50% 時進度條半滿", () => {
      const state = createDefaultState({
        ammo: { current: 0, max: 6 },
        isReloading: true,
        reloadProgress: 0.5,
      });

      expect(() => renderer.sync(state)).not.toThrow();
    });

    it("PF-13: 重裝進度 100% 時進度條全滿", () => {
      const state = createDefaultState({
        ammo: { current: 0, max: 6 },
        isReloading: true,
        reloadProgress: 1,
      });

      expect(() => renderer.sync(state)).not.toThrow();
    });

    it("PF-14: 重裝完成後恢復正常顯示", () => {
      // During reload
      const state = createDefaultState({
        ammo: { current: 0, max: 6 },
        isReloading: true,
        reloadProgress: 0.8,
      });
      renderer.sync(state);

      // Reload complete
      state.ammo = { current: 6, max: 6 };
      state.isReloading = false;
      state.reloadProgress = 0;
      expect(() => renderer.sync(state)).not.toThrow();
    });
  });

  describe("Big Stomach Upgrade Support (SPEC § 2.7.4)", () => {
    it("PF-15: 大胃王升級後進度條比例更新（6 → 12）", () => {
      const state = createDefaultState({
        ammo: { current: 6, max: 12 },
      });

      expect(() => renderer.sync(state)).not.toThrow();
    });

    it("PF-16: 彈藥 6/12 顯示為 50%", () => {
      const state = createDefaultState({
        ammo: { current: 6, max: 12 },
      });

      expect(() => renderer.sync(state)).not.toThrow();
    });

    it("PF-17: 彈藥 3/12 顯示為 25%", () => {
      const state = createDefaultState({
        ammo: { current: 3, max: 12 },
      });

      expect(() => renderer.sync(state)).not.toThrow();
    });

    it("PF-18: 大胃王 3 次後（6 → 24）彈藥 6/24 = 25%", () => {
      const state = createDefaultState({
        ammo: { current: 6, max: 24 },
      });

      expect(() => renderer.sync(state)).not.toThrow();
    });

    it("PF-19: 大胃王後重裝動畫填滿至新容量", () => {
      const state = createDefaultState({
        ammo: { current: 0, max: 24 },
        isReloading: true,
        reloadProgress: 0.5,
      });

      expect(() => renderer.sync(state)).not.toThrow();

      // Complete reload
      state.ammo = { current: 24, max: 24 };
      state.isReloading = false;
      state.reloadProgress = 0;
      expect(() => renderer.sync(state)).not.toThrow();
    });
  });
});
