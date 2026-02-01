/**
 * Enemy Entity Tests
 * testing.md § 2.7
 */

import { describe, it, expect, beforeEach } from "vitest";
import { Enemy, EnemyType, isEliteType } from "./enemy";
import { Vector } from "../values/vector";
import { LAYOUT } from "../utils/constants";
import { FoodType } from "./booth";

describe("Enemy", () => {
  describe("2.7.1 Ghost (餓鬼) - 小怪", () => {
    let ghost: Enemy;

    beforeEach(() => {
      ghost = new Enemy(EnemyType.Ghost, new Vector(1000, 500));
    });

    it("EN-01: 餓鬼 (1000, 500) + 1 秒 → 餓鬼 (950, 500) 向左移動 50 px", () => {
      ghost.update(1); // 1 second

      expect(ghost.position.x).toBe(950);
      expect(ghost.position.y).toBe(500);
    });

    it("EN-02: 餓鬼 1 HP + 普通子彈擊中 → 餓鬼死亡", () => {
      expect(ghost.health).toBe(1);

      const died = ghost.takeDamage(1);

      expect(died).toBe(true);
      expect(ghost.health).toBe(0);
      expect(ghost.active).toBe(false);
    });

    it("EN-03: 餓鬼死亡 → dropFood 回傳 null（不掉落食材）", () => {
      ghost.takeDamage(1);

      // SPEC § 2.6.2: Ghost (餓鬼) does NOT drop food
      const foodType = ghost.dropFood();
      expect(foodType).toBeNull();
    });

    it("EN-04: 餓鬼 dropFood 始終回傳 null", () => {
      // SPEC § 2.6.2: Ghost consistently returns null
      for (let i = 0; i < 10; i++) {
        expect(ghost.dropFood()).toBeNull();
      }
    });

    it("EN-05: 餓鬼到達 x = 340 → hasReachedBaseline = true", () => {
      ghost.position = new Vector(340, 500);

      expect(ghost.hasReachedBaseline()).toBe(true);
    });

    it("餓鬼速度為 50 px/s", () => {
      expect(ghost.speed).toBe(50);
    });

    it("餓鬼初始 HP 為 1", () => {
      const newGhost = new Enemy(EnemyType.Ghost, new Vector(1000, 500));
      expect(newGhost.health).toBe(1);
    });
  });

  describe("2.7.2 Elite (菁英敵人) - 彩色餓鬼", () => {
    it("isEliteType helper 正確識別菁英敵人", () => {
      expect(isEliteType(EnemyType.Ghost)).toBe(false);
      expect(isEliteType(EnemyType.Boss)).toBe(false);
      expect(isEliteType(EnemyType.RedGhost)).toBe(true);
      expect(isEliteType(EnemyType.GreenGhost)).toBe(true);
      expect(isEliteType(EnemyType.BlueGhost)).toBe(true);
    });

    it("EN-06: 紅餓鬼 2 HP + 1 發普通子彈 → 紅餓鬼 1 HP", () => {
      // SPEC § 2.6.2: Elite 基礎血量 = 2
      const redGhost = new Enemy(EnemyType.RedGhost, new Vector(1000, 500));
      expect(redGhost.health).toBe(2);

      redGhost.takeDamage(1);

      expect(redGhost.health).toBe(1);
      expect(redGhost.active).toBe(true); // Not dead yet
    });

    it("EN-07: 紅餓鬼死亡 → 掉落豆腐", () => {
      const redGhost = new Enemy(EnemyType.RedGhost, new Vector(1000, 500));
      expect(redGhost.dropFood()).toBe(FoodType.Tofu);
    });

    it("EN-08: 綠餓鬼死亡 → 掉落珍珠", () => {
      const greenGhost = new Enemy(EnemyType.GreenGhost, new Vector(1000, 500));
      expect(greenGhost.dropFood()).toBe(FoodType.Pearl);
    });

    it("EN-09: 藍餓鬼死亡 → 掉落米血", () => {
      const blueGhost = new Enemy(EnemyType.BlueGhost, new Vector(1000, 500));
      expect(blueGhost.dropFood()).toBe(FoodType.BloodCake);
    });

    it("EN-10: 菁英敵人速度為 40 px/s", () => {
      const redGhost = new Enemy(EnemyType.RedGhost, new Vector(1000, 500));
      expect(redGhost.speed).toBe(40);

      redGhost.update(1);
      expect(redGhost.position.x).toBe(960); // 1000 - 40 = 960
    });

    it("菁英敵人 2 HP + 2 發子彈 → 死亡", () => {
      const greenGhost = new Enemy(EnemyType.GreenGhost, new Vector(1000, 500));

      greenGhost.takeDamage(1);
      expect(greenGhost.active).toBe(true);

      const died = greenGhost.takeDamage(1);
      expect(died).toBe(true);
      expect(greenGhost.active).toBe(false);
    });
  });

  describe("2.7.3 Boss (餓死鬼)", () => {
    let boss: Enemy;

    beforeEach(() => {
      // SPEC § 2.3.5: Boss 首次出現在 Wave 5
      boss = new Enemy(EnemyType.Boss, new Vector(1000, 500), 5);
    });

    it("EN-11: 餓死鬼 (1000, 500) + 1 秒 → 餓死鬼 (970, 500)", () => {
      boss.update(1);

      expect(boss.position.x).toBe(970);
      expect(boss.position.y).toBe(500);
    });

    it("EN-12: 餓死鬼 10 HP + 普通子彈 → 餓死鬼 9 HP", () => {
      // SPEC § 2.6.2: Boss Wave 5 基礎血量 = 10
      expect(boss.health).toBe(10);

      boss.takeDamage(1);

      expect(boss.health).toBe(9);
    });

    it("EN-13: 餓死鬼 10 HP + 10 發子彈 → 餓死鬼死亡", () => {
      // SPEC § 2.6.2: Boss Wave 5 基礎血量 = 10
      for (let i = 0; i < 9; i++) {
        boss.takeDamage(1);
        expect(boss.active).toBe(true);
      }

      const died = boss.takeDamage(1);

      expect(died).toBe(true);
      expect(boss.health).toBe(0);
      expect(boss.active).toBe(false);
    });

    it("EN-14: 餓死鬼到達 x = 340 → hasReachedBaseline = true", () => {
      boss.position = new Vector(340, 500);

      expect(boss.hasReachedBaseline()).toBe(true);
    });

    it("EN-15: Boss Wave 5 初始 HP 為 10", () => {
      // SPEC § 2.6.2: Boss Wave 5 血量 = round(10 + 0 × 1.5) = 10
      const newBoss = new Enemy(EnemyType.Boss, new Vector(1000, 500), 5);
      expect(newBoss.health).toBe(10);
    });

    it("Boss 速度為 30 px/s", () => {
      expect(boss.speed).toBe(30);
    });

    it("Boss dropFood 回傳 null（不掉落食材）", () => {
      // SPEC § 2.6.2: Boss 不掉落食材，擊敗後由 UpgradeSystem 處理特殊升級
      expect(boss.dropFood()).toBeNull();
    });
  });

  describe("2.7.4 HP Growth (HP 成長公式)", () => {
    // SPEC § 2.6.2: HP scales with wave number

    describe("Ghost HP Scaling - floor(1 + (W-1) × 0.03)", () => {
      it("EN-16: 餓鬼 Wave 1 → HP = 1", () => {
        const ghost = new Enemy(EnemyType.Ghost, new Vector(1000, 500), 1);
        expect(ghost.health).toBe(1);
      });

      it("EN-17: 餓鬼 Wave 5 → HP = 1", () => {
        // floor(1 + 4 × 0.03) = floor(1.12) = 1
        const ghost = new Enemy(EnemyType.Ghost, new Vector(1000, 500), 5);
        expect(ghost.health).toBe(1);
      });

      it("EN-18: 餓鬼 Wave 10 → HP = 1", () => {
        // floor(1 + 9 × 0.03) = floor(1.27) = 1
        const ghost = new Enemy(EnemyType.Ghost, new Vector(1000, 500), 10);
        expect(ghost.health).toBe(1);
      });

      it("EN-19: 餓鬼 Wave 15 → HP = 1", () => {
        // floor(1 + 14 × 0.03) = floor(1.42) = 1
        const ghost = new Enemy(EnemyType.Ghost, new Vector(1000, 500), 15);
        expect(ghost.health).toBe(1);
      });

      it("無波次參數預設為 Wave 1", () => {
        const ghost = new Enemy(EnemyType.Ghost, new Vector(1000, 500));
        expect(ghost.health).toBe(1);
      });
    });

    describe("Elite HP Scaling - round(2 + (W-1) × 0.6)", () => {
      it("EN-20: 菁英 Wave 1 → HP = 2", () => {
        const elite = new Enemy(EnemyType.RedGhost, new Vector(1000, 500), 1);
        expect(elite.health).toBe(2);
      });

      it("EN-21: 菁英 Wave 5 → HP = 4", () => {
        // round(2 + 4 × 0.6) = round(4.4) = 4
        const elite = new Enemy(EnemyType.RedGhost, new Vector(1000, 500), 5);
        expect(elite.health).toBe(4);
      });

      it("EN-22: 菁英 Wave 10 → HP = 7", () => {
        // round(2 + 9 × 0.6) = round(7.4) = 7
        const elite = new Enemy(
          EnemyType.GreenGhost,
          new Vector(1000, 500),
          10,
        );
        expect(elite.health).toBe(7);
      });

      it("EN-23: 菁英 Wave 15 → HP = 10", () => {
        // round(2 + 14 × 0.6) = round(10.4) = 10
        const elite = new Enemy(EnemyType.BlueGhost, new Vector(1000, 500), 15);
        expect(elite.health).toBe(10);
      });

      it("無波次參數預設為 Wave 1", () => {
        const elite = new Enemy(EnemyType.RedGhost, new Vector(1000, 500));
        expect(elite.health).toBe(2);
      });
    });

    describe("Boss HP Scaling - round(10 + (W-5) × 1.5)", () => {
      it("EN-24: Boss Wave 5 → HP = 10", () => {
        // round(10 + 0 × 1.5) = 10
        const boss = new Enemy(EnemyType.Boss, new Vector(1000, 500), 5);
        expect(boss.health).toBe(10);
      });

      it("EN-25: Boss Wave 10 → HP = 18", () => {
        // round(10 + 5 × 1.5) = round(17.5) = 18
        const boss = new Enemy(EnemyType.Boss, new Vector(1000, 500), 10);
        expect(boss.health).toBe(18);
      });

      it("EN-26: Boss Wave 15 → HP = 25", () => {
        // round(10 + 10 × 1.5) = round(25) = 25
        const boss = new Enemy(EnemyType.Boss, new Vector(1000, 500), 15);
        expect(boss.health).toBe(25);
      });

      it("無波次參數預設為 Wave 1（Boss HP = 4）", () => {
        // round(10 + (1-5) × 1.5) = round(10 - 6) = 4
        const boss = new Enemy(EnemyType.Boss, new Vector(1000, 500));
        expect(boss.health).toBe(4);
      });
    });
  });

  describe("2.7.5 Boss Types", () => {
    it("EN-31: 餓死鬼 → 直走，速度 0.3", () => {
      const boss = new Enemy(EnemyType.Boss, new Vector(1000, 500));

      expect(boss.speed).toBe(30); // 0.3 × 100 = 30 px/s

      // Update and verify movement is only horizontal
      boss.update(1);

      expect(boss.position.x).toBe(970);
      expect(boss.position.y).toBe(500); // Y unchanged - straight line
    });

    it("EN-32 ~ EN-33: Boss 類型區分（僅實作餓死鬼）", () => {
      // Current implementation only has one Boss type
      const boss = new Enemy(EnemyType.Boss, new Vector(1000, 500));
      expect(boss.type).toBe(EnemyType.Boss);
    });
  });

  describe("2.7.6 Booth Interaction", () => {
    // Note: Booth stealing is handled at system level, not entity level
    // These tests document expected entity behavior

    it("EN-34 ~ EN-36: 敵人觸碰攤位後繼續移動", () => {
      const ghost = new Enemy(EnemyType.Ghost, new Vector(500, 500));

      // Enemy continues moving regardless of booth position
      ghost.update(1);

      expect(ghost.position.x).toBe(450);
      expect(ghost.active).toBe(true);
    });
  });

  describe("Collision", () => {
    it("碰撞箱大小 256×256 px (SPEC § 2.7.2)", () => {
      const ghost = new Enemy(EnemyType.Ghost, new Vector(1000, 500));
      const collisionBox = ghost.collisionBox;

      expect(collisionBox.width).toBe(LAYOUT.ENEMY_SIZE);
      expect(collisionBox.height).toBe(LAYOUT.ENEMY_SIZE);
      expect(collisionBox.width).toBe(256);
    });
  });

  describe("Active State", () => {
    it("inactive 敵人無法移動", () => {
      const ghost = new Enemy(EnemyType.Ghost, new Vector(1000, 500));
      ghost.active = false;

      ghost.update(1);

      expect(ghost.position.x).toBe(1000); // Unchanged
    });

    it("inactive 敵人無法受傷", () => {
      const ghost = new Enemy(EnemyType.Ghost, new Vector(1000, 500));
      ghost.active = false;

      const died = ghost.takeDamage(1);

      expect(died).toBe(false);
      expect(ghost.health).toBe(1); // Unchanged
    });
  });

  describe("Reset", () => {
    it("reset 恢復敵人狀態", () => {
      const ghost = new Enemy(EnemyType.Ghost, new Vector(1000, 500));
      ghost.takeDamage(1);

      expect(ghost.active).toBe(false);

      ghost.reset(EnemyType.Ghost, new Vector(1500, 300));

      expect(ghost.active).toBe(true);
      expect(ghost.health).toBe(1);
      expect(ghost.position.x).toBe(1500);
      expect(ghost.position.y).toBe(300);
    });

    it("reset Boss Wave 5 恢復 10 HP", () => {
      const boss = new Enemy(EnemyType.Boss, new Vector(1000, 500), 5);
      boss.takeDamage(2);

      expect(boss.health).toBe(8);

      boss.reset(EnemyType.Boss, new Vector(1500, 300), 5);

      expect(boss.health).toBe(10);
    });

    it("reset Elite Wave 1 恢復 2 HP", () => {
      const redGhost = new Enemy(EnemyType.RedGhost, new Vector(1000, 500));
      redGhost.takeDamage(1);

      expect(redGhost.health).toBe(1);

      redGhost.reset(EnemyType.RedGhost, new Vector(1500, 300), 1);

      expect(redGhost.health).toBe(2);
    });

    it("reset Elite Wave 10 恢復 7 HP", () => {
      const redGhost = new Enemy(EnemyType.RedGhost, new Vector(1000, 500), 10);
      redGhost.takeDamage(1);

      expect(redGhost.health).toBe(6);

      redGhost.reset(EnemyType.RedGhost, new Vector(1500, 300), 10);

      expect(redGhost.health).toBe(7);
    });

    it("reset Boss Wave 10 恢復 18 HP", () => {
      const boss = new Enemy(EnemyType.Boss, new Vector(1000, 500), 10);
      boss.takeDamage(5);

      expect(boss.health).toBe(13);

      boss.reset(EnemyType.Boss, new Vector(1500, 300), 10);

      expect(boss.health).toBe(18);
    });
  });

  describe("Baseline Detection", () => {
    it("x > 340 → hasReachedBaseline = false", () => {
      const ghost = new Enemy(EnemyType.Ghost, new Vector(500, 500));
      expect(ghost.hasReachedBaseline()).toBe(false);
    });

    it("x = 340 → hasReachedBaseline = true", () => {
      const ghost = new Enemy(EnemyType.Ghost, new Vector(340, 500));
      expect(ghost.hasReachedBaseline()).toBe(true);
    });

    it("x < 340 → hasReachedBaseline = true", () => {
      const ghost = new Enemy(EnemyType.Ghost, new Vector(300, 500));
      expect(ghost.hasReachedBaseline()).toBe(true);
    });
  });
});
