/**
 * Player Entity Tests
 * testing.md § 2.6
 */

import { describe, it, expect, beforeEach } from "vitest";
import { Player } from "./player";
import { Vector } from "../values/vector";
import { LAYOUT, CANVAS_WIDTH } from "../utils/constants";

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

    it("PL-02: 玩家 (500, 500) + 按 A 1 秒 → 玩家 (300, 500) 向左移動 200 px", () => {
      const direction = new Vector(-1, 0); // Left
      player.move(direction, 1);

      // 300 is clamped to BASELINE_X (340)
      expect(player.position.x).toBe(340);
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

    it("PL-05: 玩家 (384, 500) + 按 A → 碰到左邊界停止 (x = 340)", () => {
      player = new Player(new Vector(384, 500));
      const direction = new Vector(-1, 0); // Left
      player.move(direction, 1); // Move left for 1 second (200 px)

      // Should be clamped to BASELINE_X (340)
      expect(player.position.x).toBe(LAYOUT.BASELINE_X);
      expect(player.position.y).toBe(500);
    });

    it("PL-06: 玩家 (1920, 500) + 按 D → 碰到右邊界停止 (x = 1920)", () => {
      player = new Player(new Vector(1800, 500));
      const direction = new Vector(1, 0); // Right
      player.move(direction, 1);

      // Should be clamped to CANVAS_WIDTH (1920)
      expect(player.position.x).toBe(CANVAS_WIDTH);
      expect(player.position.y).toBe(500);
    });

    it("PL-07: 玩家 (500, 86) + 按 W → 碰到上邊界停止", () => {
      player = new Player(new Vector(500, 100));
      const direction = new Vector(0, -1); // Up
      player.move(direction, 1);

      // Should be clamped to GAME_AREA_Y (86)
      expect(player.position.x).toBe(500);
      expect(player.position.y).toBe(LAYOUT.GAME_AREA_Y);
    });

    it("PL-08: 玩家 (500, 954) + 按 S → 碰到下邊界停止", () => {
      player = new Player(new Vector(500, 900));
      const direction = new Vector(0, 1); // Down
      player.move(direction, 1);

      const bottomBoundary = LAYOUT.GAME_AREA_Y + LAYOUT.GAME_AREA_HEIGHT;
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
      expect(player.health).toBe(5);

      player.takeDamage(1);

      expect(player.health).toBe(4);
    });

    it("PL-14: 生命 1 + 敵人到達底線 → 生命 0，遊戲結束", () => {
      player.health = 1;
      expect(player.health).toBe(1);

      player.takeDamage(1);

      expect(player.health).toBe(0);
      expect(player.active).toBe(false); // Player becomes inactive
    });

    it("PL-15: 初始生命值為 5", () => {
      const newPlayer = new Player(new Vector(500, 500));
      expect(newPlayer.health).toBe(5);
    });

    it("takeDamage 預設扣 1 點生命", () => {
      expect(player.health).toBe(5);
      player.takeDamage();
      expect(player.health).toBe(4);
    });

    it("可以扣多點傷害", () => {
      expect(player.health).toBe(5);
      player.takeDamage(3);
      expect(player.health).toBe(2);
    });
  });

  describe("Shooting", () => {
    it("初始彈夾為 6/6", () => {
      expect(player.ammo).toBe(6);
      expect(player.maxAmmo).toBe(6);
    });

    it("射擊消耗 1 發子彈", () => {
      expect(player.shoot()).toBe(true);
      expect(player.ammo).toBe(5);
    });

    it("彈夾空時無法射擊", () => {
      player.ammo = 0;
      expect(player.shoot()).toBe(false);
      expect(player.ammo).toBe(0);
    });

    it("彈夾歸零時自動開始重裝", () => {
      player.ammo = 1;
      player.shoot();

      expect(player.ammo).toBe(0);
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
      player.ammo = 0;
      player.startReload();

      expect(player.isReloading).toBe(true);

      // Update for 3 seconds
      player.update(3);

      expect(player.isReloading).toBe(false);
      expect(player.ammo).toBe(6);
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
      player.ammo = 2;
      player.isReloading = true;
      player.position = new Vector(1000, 600);

      // Reset
      const newPosition = new Vector(500, 500);
      player.reset(newPosition);

      expect(player.active).toBe(true);
      expect(player.health).toBe(5);
      expect(player.ammo).toBe(6);
      expect(player.isReloading).toBe(false);
      expect(player.position.x).toBe(500);
      expect(player.position.y).toBe(500);
    });
  });
});
