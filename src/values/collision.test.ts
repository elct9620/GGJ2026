import { describe, it, expect } from "vitest";
import { checkAABBCollision } from "./collision";
import type { CollisionBox } from "./collision";

describe("checkAABBCollision", () => {
  const createBox = (width: number, height: number): CollisionBox => ({
    width,
    height,
  });

  describe("基本碰撞檢測", () => {
    it("完全重疊的物體應該碰撞", () => {
      const pos = { x: 100, y: 100 };
      const box = createBox(50, 50);

      expect(checkAABBCollision(pos, box, pos, box)).toBe(true);
    });

    it("部分重疊的物體應該碰撞", () => {
      const posA = { x: 100, y: 100 };
      const posB = { x: 120, y: 100 };
      const box = createBox(50, 50);

      expect(checkAABBCollision(posA, box, posB, box)).toBe(true);
    });

    it("剛好接觸邊緣的物體不應該碰撞（開區間）", () => {
      const posA = { x: 100, y: 100 };
      const posB = { x: 150, y: 100 }; // 邊緣剛好接觸
      const box = createBox(50, 50);

      expect(checkAABBCollision(posA, box, posB, box)).toBe(false);
    });

    it("完全分離的物體不應該碰撞", () => {
      const posA = { x: 100, y: 100 };
      const posB = { x: 200, y: 100 };
      const box = createBox(50, 50);

      expect(checkAABBCollision(posA, box, posB, box)).toBe(false);
    });
  });

  describe("不同大小的碰撞箱", () => {
    it("大箱子包含小箱子應該碰撞", () => {
      const posA = { x: 100, y: 100 };
      const boxA = createBox(100, 100);
      const posB = { x: 100, y: 100 };
      const boxB = createBox(20, 20);

      expect(checkAABBCollision(posA, boxA, posB, boxB)).toBe(true);
    });

    it("子彈 vs 敵人碰撞（8×8 vs 256×256）", () => {
      // 子彈位於敵人內部
      const bulletPos = { x: 500, y: 300 };
      const bulletBox = createBox(8, 8);
      const enemyPos = { x: 500, y: 300 };
      const enemyBox = createBox(256, 256);

      expect(checkAABBCollision(bulletPos, bulletBox, enemyPos, enemyBox)).toBe(
        true,
      );
    });

    it("子彈 vs 敵人碰撞（接近邊緣）", () => {
      // 子彈在敵人邊緣
      // 碰撞範圍：|dx| < (8 + 256) / 2 = 132
      const bulletPos = { x: 500, y: 300 };
      const bulletBox = createBox(8, 8);
      const enemyPos = { x: 500 + 131, y: 300 }; // 剛好在範圍內
      const enemyBox = createBox(256, 256);

      expect(checkAABBCollision(bulletPos, bulletBox, enemyPos, enemyBox)).toBe(
        true,
      );
    });

    it("子彈 vs 敵人不碰撞（超出範圍）", () => {
      // 碰撞範圍：|dx| < (8 + 256) / 2 = 132
      const bulletPos = { x: 500, y: 300 };
      const bulletBox = createBox(8, 8);
      const enemyPos = { x: 500 + 133, y: 300 }; // 超出範圍
      const enemyBox = createBox(256, 256);

      expect(checkAABBCollision(bulletPos, bulletBox, enemyPos, enemyBox)).toBe(
        false,
      );
    });
  });

  describe("對角線碰撞", () => {
    it("對角線方向部分重疊應該碰撞", () => {
      const posA = { x: 100, y: 100 };
      const posB = { x: 120, y: 120 };
      const box = createBox(50, 50);

      expect(checkAABBCollision(posA, box, posB, box)).toBe(true);
    });

    it("對角線方向完全分離不應該碰撞", () => {
      const posA = { x: 100, y: 100 };
      const posB = { x: 200, y: 200 };
      const box = createBox(50, 50);

      expect(checkAABBCollision(posA, box, posB, box)).toBe(false);
    });
  });

  describe("非正方形碰撞箱", () => {
    it("長方形碰撞箱水平重疊", () => {
      const posA = { x: 100, y: 100 };
      const boxA = createBox(100, 20);
      const posB = { x: 150, y: 100 };
      const boxB = createBox(100, 20);

      expect(checkAABBCollision(posA, boxA, posB, boxB)).toBe(true);
    });

    it("長方形碰撞箱垂直錯開不碰撞", () => {
      const posA = { x: 100, y: 100 };
      const boxA = createBox(100, 20);
      const posB = { x: 100, y: 150 };
      const boxB = createBox(100, 20);

      expect(checkAABBCollision(posA, boxA, posB, boxB)).toBe(false);
    });
  });
});
