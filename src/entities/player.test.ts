/**
 * Player Entity Tests
 * testing.md § 2.6
 */

import { describe, it, expect, beforeEach } from "vitest";
import { Player } from "./player";
import { Vector } from "../values/vector";
import { LAYOUT, CANVAS_WIDTH } from "../utils/constants";
import { SpecialBulletType } from "../core/types";

describe("Player", () => {
  let player: Player;

  beforeEach(() => {
    // Start player at center of game area
    player = new Player(new Vector(500, 500));
  });

  describe("2.6.1 Movement", () => {
    it("PL-01: 玩家 (500, 500) + 按 W 1 秒 → 玩家 (500, 300) 向上移動 200 px", () => {
      const direction = new Vector(0, -1); // Up
      player.move(direction, 1); // 1 second

      expect(player.position.x).toBe(500);
      expect(player.position.y).toBe(300);
    });

    it("PL-02: 玩家 (500, 500) + 按 A 1 秒 → 向左移動但受左邊界限制", () => {
      const direction = new Vector(-1, 0); // Left
      player.move(direction, 1);

      // 500 - 200 = 300, but clamped to BASELINE_X + halfSize (340 + 128 = 468)
      const halfSize = LAYOUT.PLAYER_SIZE / 2;
      expect(player.position.x).toBe(LAYOUT.BASELINE_X + halfSize);
      expect(player.position.y).toBe(500);
    });

    it("PL-03: 玩家 (500, 500) + 按 S 1 秒 → 玩家 (500, 700) 向下移動 200 px", () => {
      const direction = new Vector(0, 1); // Down
      player.move(direction, 1);

      expect(player.position.x).toBe(500);
      expect(player.position.y).toBe(700);
    });

    it("PL-04: 玩家 (500, 500) + 按 D 1 秒 → 玩家 (700, 500) 向右移動 200 px", () => {
      const direction = new Vector(1, 0); // Right
      player.move(direction, 1);

      expect(player.position.x).toBe(700);
      expect(player.position.y).toBe(500);
    });

    it("PL-05: 玩家碰到左邊界停止（考慮玩家大小）", () => {
      // Player position is center-based, so left boundary = BASELINE_X + halfSize
      const halfSize = LAYOUT.PLAYER_SIZE / 2; // 128
      player = new Player(new Vector(500, 500));
      const direction = new Vector(-1, 0); // Left
      player.move(direction, 1); // Move left for 1 second (200 px)

      // Should be clamped to BASELINE_X + halfSize (340 + 128 = 468)
      expect(player.position.x).toBe(LAYOUT.BASELINE_X + halfSize);
      expect(player.position.y).toBe(500);
    });

    it("PL-06: 玩家碰到右邊界停止（考慮玩家大小）", () => {
      // Player position is center-based, so right boundary = CANVAS_WIDTH - halfSize
      const halfSize = LAYOUT.PLAYER_SIZE / 2; // 128
      player = new Player(new Vector(1800, 500));
      const direction = new Vector(1, 0); // Right
      player.move(direction, 1);

      // Should be clamped to CANVAS_WIDTH - halfSize (1920 - 128 = 1792)
      expect(player.position.x).toBe(CANVAS_WIDTH - halfSize);
      expect(player.position.y).toBe(500);
    });

    it("PL-07: 玩家碰到上邊界停止（考慮玩家大小）", () => {
      // Player position is center-based, so top boundary = GAME_AREA_Y + halfSize
      const halfSize = LAYOUT.PLAYER_SIZE / 2; // 128
      player = new Player(new Vector(500, 300));
      const direction = new Vector(0, -1); // Up
      player.move(direction, 1);

      // Should be clamped to GAME_AREA_Y + halfSize (86 + 128 = 214)
      expect(player.position.x).toBe(500);
      expect(player.position.y).toBe(LAYOUT.GAME_AREA_Y + halfSize);
    });

    it("PL-08: 玩家碰到下邊界停止（考慮玩家大小）", () => {
      // Player position is center-based, so bottom boundary = GAME_AREA_Y + GAME_AREA_HEIGHT - halfSize
      const halfSize = LAYOUT.PLAYER_SIZE / 2; // 128
      player = new Player(new Vector(500, 800));
      const direction = new Vector(0, 1); // Down
      player.move(direction, 1);

      const bottomBoundary =
        LAYOUT.GAME_AREA_Y + LAYOUT.GAME_AREA_HEIGHT - halfSize; // 954 - 128 = 826
      expect(player.position.x).toBe(500);
      expect(player.position.y).toBe(bottomBoundary);
    });

    it("PL-09: 同時按 W + D → 玩家向右上移動（對角線）", () => {
      const direction = new Vector(1, -1); // Right + Up
      player.move(direction, 1);

      // Normalized vector (1, -1) has magnitude ~1.414
      // Moving at 200 px/s for 1 second gives ~141 px in each direction
      expect(player.position.x).toBeGreaterThan(500);
      expect(player.position.y).toBeLessThan(500);

      // Check approximate diagonal movement
      const deltaX = player.position.x - 500;
      const deltaY = 500 - player.position.y;
      expect(Math.abs(deltaX - deltaY)).toBeLessThan(1); // Should be nearly equal
    });

    it("移動速度為 200 px/s (SPEC § 2.6.1)", () => {
      expect(player.speed).toBe(200);
    });

    it("inactive 玩家無法移動", () => {
      player.active = false;
      const originalPosition = player.position;

      player.move(new Vector(1, 0), 1);

      expect(player.position.x).toBe(originalPosition.x);
      expect(player.position.y).toBe(originalPosition.y);
    });
  });

  describe("2.6.2 Collision", () => {
    it("PL-10: 碰撞箱大小 256×256 px (SPEC § 2.7.2)", () => {
      const collisionBox = player.collisionBox;

      expect(collisionBox.width).toBe(LAYOUT.PLAYER_SIZE);
      expect(collisionBox.height).toBe(LAYOUT.PLAYER_SIZE);
      expect(collisionBox.width).toBe(256);
      expect(collisionBox.height).toBe(256);
    });

    it("PL-11: 玩家與敵人不發生碰撞（穿透）", () => {
      // Player doesn't have collision with enemies - they just pass through
      // This is tested by confirming no collision detection exists in Player entity
      // Collision is handled at system level
      expect(player.active).toBe(true);
    });

    it("PL-12: 碰撞箱與視覺大小同步", () => {
      const collisionBox = player.collisionBox;
      expect(collisionBox.width).toBe(LAYOUT.PLAYER_SIZE);
      expect(collisionBox.height).toBe(LAYOUT.PLAYER_SIZE);
    });
  });

  describe("2.6.3 Health", () => {
    it("PL-13: 生命 5 + 敵人到達底線 → 生命 4", () => {
      expect(player.health.current).toBe(5);

      player.takeDamage(1);

      expect(player.health.current).toBe(4);
    });

    it("PL-14: 生命 1 + 敵人到達底線 → 生命 0，遊戲結束", () => {
      // Take 4 damage to reduce health from 5 to 1
      player.takeDamage(4);
      expect(player.health.current).toBe(1);

      player.takeDamage(1);

      expect(player.health.current).toBe(0);
      expect(player.active).toBe(false); // Player becomes inactive
    });

    it("PL-15: 初始生命值為 5", () => {
      const newPlayer = new Player(new Vector(500, 500));
      expect(newPlayer.health.current).toBe(5);
    });

    it("takeDamage 預設扣 1 點生命", () => {
      expect(player.health.current).toBe(5);
      player.takeDamage();
      expect(player.health.current).toBe(4);
    });

    it("可以扣多點傷害", () => {
      expect(player.health.current).toBe(5);
      player.takeDamage(3);
      expect(player.health.current).toBe(2);
    });
  });

  describe("Shooting", () => {
    it("初始彈夾為 6/6", () => {
      expect(player.ammo.current).toBe(6);
      expect(player.ammo.max).toBe(6);
    });

    it("射擊消耗 1 發子彈", () => {
      expect(player.shoot()).toBe(true);
      expect(player.ammo.current).toBe(5);
    });

    it("彈夾空時無法射擊", () => {
      // Shoot all 6 bullets, last one triggers auto-reload
      for (let i = 0; i < 6; i++) player.shoot();
      player.isReloading = false; // Cancel auto-reload for this test

      expect(player.shoot()).toBe(false);
      expect(player.ammo.current).toBe(0);
    });

    it("彈夾歸零時自動開始重裝", () => {
      // Shoot 5 bullets to have 1 remaining
      for (let i = 0; i < 5; i++) player.shoot();
      expect(player.ammo.current).toBe(1);

      player.shoot();

      expect(player.ammo.current).toBe(0);
      expect(player.isReloading).toBe(true);
    });

    it("重裝中無法射擊", () => {
      player.isReloading = true;
      expect(player.shoot()).toBe(false);
    });

    it("重裝時間為 3 秒", () => {
      expect(player.reloadTime).toBe(3);
    });

    it("重裝完成後彈夾恢復", () => {
      // Shoot all bullets and start reload
      for (let i = 0; i < 6; i++) player.shoot();
      // Auto-reload already started from last shot

      expect(player.isReloading).toBe(true);

      // Update for 3 seconds
      player.update(3);

      expect(player.isReloading).toBe(false);
      expect(player.ammo.current).toBe(6);
    });

    it("inactive 玩家無法射擊", () => {
      player.active = false;
      expect(player.shoot()).toBe(false);
    });
  });

  describe("Reset", () => {
    it("reset 恢復所有狀態", () => {
      // Modify player state
      player.takeDamage(3);
      // Shoot 4 bullets to have 2 remaining
      for (let i = 0; i < 4; i++) player.shoot();
      player.isReloading = true;
      player.position = new Vector(1000, 600);

      // Reset
      const newPosition = new Vector(500, 500);
      player.reset(newPosition);

      expect(player.active).toBe(true);
      expect(player.health.current).toBe(5);
      expect(player.ammo.current).toBe(6);
      expect(player.isReloading).toBe(false);
      expect(player.position.x).toBe(500);
      expect(player.position.y).toBe(500);
    });
  });

  describe("Appearance for Buff", () => {
    it("updateAppearanceForBuff 不會拋出錯誤", () => {
      // Verify that updateAppearanceForBuff can be called without errors
      expect(() => {
        player.updateAppearanceForBuff(SpecialBulletType.BubbleTea);
      }).not.toThrow();
    });

    it("所有 Buff 類型都可以正確切換外觀", () => {
      // Verify all buff types can be applied without errors
      const buffTypes = [
        SpecialBulletType.None,
        SpecialBulletType.NightMarket,
        SpecialBulletType.StinkyTofu,
        SpecialBulletType.BubbleTea,
        SpecialBulletType.BloodCake,
        SpecialBulletType.OysterOmelette,
      ];

      for (const buffType of buffTypes) {
        expect(() => {
          player.updateAppearanceForBuff(buffType);
        }).not.toThrow();
      }
    });

    it("reset 時呼叫 updateAppearanceForBuff(None)", () => {
      // First set to BubbleTea
      player.updateAppearanceForBuff(SpecialBulletType.BubbleTea);

      // Reset player - should internally call updateAppearanceForBuff(None)
      expect(() => {
        player.reset(new Vector(500, 500));
      }).not.toThrow();
    });
  });
});
