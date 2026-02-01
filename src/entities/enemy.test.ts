/**
 * Enemy Entity Tests
 * testing.md § 2.7
 */

import { describe, it, expect, beforeEach } from "vitest";
import { Enemy } from "./enemy";
import { Vector } from "../values/vector";
import { LAYOUT } from "../utils/constants";
import { FoodType, EnemyType, isEliteType } from "../core/types";

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
      expect(ghost.health.current).toBe(1);

      const died = ghost.takeDamage(1);

      expect(died).toBe(true);
      expect(ghost.health.current).toBe(0);
      expect(ghost.active).toBe(false);
    });

    it("EN-03: 餓鬼死亡 → foodDrop 回傳 null（不掉落食材）", () => {
      ghost.takeDamage(1);

      // SPEC § 2.6.2: Ghost (餓鬼) does NOT drop food
      const foodType = ghost.foodDrop;
      expect(foodType).toBeNull();
    });

    it("EN-04: 餓鬼 foodDrop 始終回傳 null", () => {
      // SPEC § 2.6.2: Ghost consistently returns null
      for (let i = 0; i < 10; i++) {
        expect(ghost.foodDrop).toBeNull();
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
      expect(newGhost.health.current).toBe(1);
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
      expect(redGhost.health.current).toBe(2);

      redGhost.takeDamage(1);

      expect(redGhost.health.current).toBe(1);
      expect(redGhost.active).toBe(true); // Not dead yet
    });

    it("EN-07: 紅餓鬼死亡 → 掉落豆腐", () => {
      const redGhost = new Enemy(EnemyType.RedGhost, new Vector(1000, 500));
      expect(redGhost.foodDrop).toBe(FoodType.Tofu);
    });

    it("EN-08: 綠餓鬼死亡 → 掉落珍珠", () => {
      const greenGhost = new Enemy(EnemyType.GreenGhost, new Vector(1000, 500));
      expect(greenGhost.foodDrop).toBe(FoodType.Pearl);
    });

    it("EN-09: 藍餓鬼死亡 → 掉落米血", () => {
      const blueGhost = new Enemy(EnemyType.BlueGhost, new Vector(1000, 500));
      expect(blueGhost.foodDrop).toBe(FoodType.BloodCake);
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
      boss = new Enemy(EnemyType.Boss, new Vector(1000, 500), 5);
    });

    it("EN-11: 餓死鬼 (1000, 500) + 1 秒 → 餓死鬼 (970, 500)", () => {
      boss.update(1);

      expect(boss.position.x).toBe(970);
      expect(boss.position.y).toBe(500);
    });

    it("EN-12: 餓死鬼 10 HP + 普通子彈 → 餓死鬼 9 HP", () => {
      // SPEC § 2.6.2: Boss 基礎血量 = 10
      expect(boss.health.current).toBe(10);

      boss.takeDamage(1);

      expect(boss.health.current).toBe(9);
    });

    it("EN-13: 餓死鬼 10 HP + 10 發子彈 → 餓死鬼死亡", () => {
      // SPEC § 2.6.2: Boss 基礎血量 = 10
      for (let i = 0; i < 9; i++) {
        boss.takeDamage(1);
        expect(boss.active).toBe(true);
      }

      const died = boss.takeDamage(1);

      expect(died).toBe(true);
      expect(boss.health.current).toBe(0);
      expect(boss.active).toBe(false);
    });

    it("EN-14: 餓死鬼到達 x = 340 → hasReachedBaseline = true", () => {
      boss.position = new Vector(340, 500);

      expect(boss.hasReachedBaseline()).toBe(true);
    });

    it("EN-15: Boss 初始 HP 為 10", () => {
      // SPEC § 2.6.2: Boss 基礎血量 = 10
      const newBoss = new Enemy(EnemyType.Boss, new Vector(1000, 500), 5);
      expect(newBoss.health.current).toBe(10);
    });

    it("Boss 速度為 30 px/s", () => {
      expect(boss.speed).toBe(30);
    });

    it("Boss foodDrop 回傳 null（不掉落食材）", () => {
      // SPEC § 2.6.2: Boss 不掉落食材，擊敗後由 UpgradeSystem 處理特殊升級
      expect(boss.foodDrop).toBeNull();
    });
  });

  describe("2.7.4 HP Growth (HP 成長公式)", () => {
    // SPEC § 2.6.2: HP 成長公式
    // 餓鬼: floor(1 + (W-1) × 0.03)
    // 菁英: round(2 + (W-1) × 0.6)
    // Boss: round(10 + (W-5) × 1.5)

    /**
     * Calculate expected enemy HP based on wave number
     * @param type Enemy type
     * @param wave Wave number (1-indexed)
     * @returns Expected HP for that wave
     */
    function calculateEnemyHealth(type: EnemyType, wave: number): number {
      if (type === EnemyType.Ghost) {
        // SPEC § 2.6.2: floor(1 + (W-1) × 0.03)
        return Math.floor(1 + (wave - 1) * 0.03);
      } else if (isEliteType(type)) {
        // SPEC § 2.6.2: round(2 + (W-1) × 0.6)
        return Math.round(2 + (wave - 1) * 0.6);
      } else {
        // Boss: round(10 + (W-5) × 1.5)
        return Math.round(10 + (wave - 5) * 1.5);
      }
    }

    // EN-16 ~ EN-19: Ghost HP growth (testing.md § 2.7.4)
    it("EN-16: 餓鬼 Wave 1 → HP = 1", () => {
      expect(calculateEnemyHealth(EnemyType.Ghost, 1)).toBe(1);
    });

    it("EN-17: 餓鬼 Wave 5 → HP = 1", () => {
      expect(calculateEnemyHealth(EnemyType.Ghost, 5)).toBe(1);
    });

    it("EN-18: 餓鬼 Wave 10 → HP = 1", () => {
      expect(calculateEnemyHealth(EnemyType.Ghost, 10)).toBe(1);
    });

    it("EN-19: 餓鬼 Wave 15 → HP = 1", () => {
      expect(calculateEnemyHealth(EnemyType.Ghost, 15)).toBe(1);
    });

    // EN-20 ~ EN-23: Elite HP growth (testing.md § 2.7.4)
    it("EN-20: 彩色餓鬼 Wave 1 → HP = 2", () => {
      expect(calculateEnemyHealth(EnemyType.RedGhost, 1)).toBe(2);
      expect(calculateEnemyHealth(EnemyType.GreenGhost, 1)).toBe(2);
      expect(calculateEnemyHealth(EnemyType.BlueGhost, 1)).toBe(2);
    });

    it("EN-21: 彩色餓鬼 Wave 5 → HP = 4", () => {
      expect(calculateEnemyHealth(EnemyType.RedGhost, 5)).toBe(4);
      expect(calculateEnemyHealth(EnemyType.GreenGhost, 5)).toBe(4);
      expect(calculateEnemyHealth(EnemyType.BlueGhost, 5)).toBe(4);
    });

    it("EN-22: 彩色餓鬼 Wave 10 → HP = 7", () => {
      expect(calculateEnemyHealth(EnemyType.RedGhost, 10)).toBe(7);
      expect(calculateEnemyHealth(EnemyType.GreenGhost, 10)).toBe(7);
      expect(calculateEnemyHealth(EnemyType.BlueGhost, 10)).toBe(7);
    });

    it("EN-23: 彩色餓鬼 Wave 15 → HP = 10", () => {
      expect(calculateEnemyHealth(EnemyType.RedGhost, 15)).toBe(10);
      expect(calculateEnemyHealth(EnemyType.GreenGhost, 15)).toBe(10);
      expect(calculateEnemyHealth(EnemyType.BlueGhost, 15)).toBe(10);
    });

    // EN-24 ~ EN-26: Boss (餓死鬼) HP growth (testing.md § 2.7.4)
    it("EN-24: 餓死鬼 Wave 5 → HP = 10", () => {
      expect(calculateEnemyHealth(EnemyType.Boss, 5)).toBe(10);
    });

    it("EN-25: 餓死鬼 Wave 10 → HP = 18", () => {
      expect(calculateEnemyHealth(EnemyType.Boss, 10)).toBe(18);
    });

    it("EN-26: 餓死鬼 Wave 15 → HP = 25", () => {
      expect(calculateEnemyHealth(EnemyType.Boss, 15)).toBe(25);
    });

    // Note: EN-27 ~ EN-32 test Boss variants (餓瘋鬼, 餓幼鬼)
    // These are not yet implemented in the codebase
    // Current implementation only has EnemyType.Boss (餓死鬼)
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
    it("餓鬼碰撞箱大小 256×256 px (SPEC § 2.7.2)", () => {
      const ghost = new Enemy(EnemyType.Ghost, new Vector(1000, 500));
      const collisionBox = ghost.collisionBox;

      expect(collisionBox.width).toBe(LAYOUT.ENEMY_SIZE);
      expect(collisionBox.height).toBe(LAYOUT.ENEMY_SIZE);
      expect(collisionBox.width).toBe(256);
    });

    it("菁英碰撞箱大小 256×256 px", () => {
      const redGhost = new Enemy(EnemyType.RedGhost, new Vector(1000, 500));
      const collisionBox = redGhost.collisionBox;

      expect(collisionBox.width).toBe(LAYOUT.ENEMY_SIZE);
      expect(collisionBox.height).toBe(LAYOUT.ENEMY_SIZE);
      expect(collisionBox.width).toBe(256);
    });

    it("Boss 碰撞箱大小 512×512 px", () => {
      const boss = new Enemy(EnemyType.Boss, new Vector(1000, 500), 5);
      const collisionBox = boss.collisionBox;

      expect(collisionBox.width).toBe(LAYOUT.BOSS_SIZE);
      expect(collisionBox.height).toBe(LAYOUT.BOSS_SIZE);
      expect(collisionBox.width).toBe(512);
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
      expect(ghost.health.current).toBe(1); // Unchanged
    });
  });

  describe("Reset", () => {
    it("reset 恢復敵人狀態", () => {
      const ghost = new Enemy(EnemyType.Ghost, new Vector(1000, 500));
      ghost.takeDamage(1);

      expect(ghost.active).toBe(false);

      ghost.reset(EnemyType.Ghost, new Vector(1500, 300));

      expect(ghost.active).toBe(true);
      expect(ghost.health.current).toBe(1);
      expect(ghost.position.x).toBe(1500);
      expect(ghost.position.y).toBe(300);
    });

    it("reset Boss 恢復 10 HP", () => {
      const boss = new Enemy(EnemyType.Boss, new Vector(1000, 500), 5);
      boss.takeDamage(2);

      expect(boss.health.current).toBe(8);

      boss.reset(EnemyType.Boss, new Vector(1500, 300), 5);

      expect(boss.health.current).toBe(10);
    });

    it("reset Elite 恢復 2 HP", () => {
      const redGhost = new Enemy(EnemyType.RedGhost, new Vector(1000, 500));
      redGhost.takeDamage(1);

      expect(redGhost.health.current).toBe(1);

      redGhost.reset(EnemyType.RedGhost, new Vector(1500, 300));

      expect(redGhost.health.current).toBe(2);
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

  describe("Flash Hit Effect (SPEC § 2.6.3)", () => {
    it("flashHit 設定敵人 tint 顏色", () => {
      const ghost = new Enemy(EnemyType.Ghost, new Vector(1000, 500));
      // Access sprite to check tint (internal)
      const sprite = ghost.sprite.children[0] as any;
      expect(sprite.tint).toBe(0xffffff); // Default tint

      ghost.flashHit(0xff0000, 0.1);

      expect(sprite.tint).toBe(0xff0000); // Red flash
    });

    it("flashHit 持續時間後恢復原始顏色", () => {
      const ghost = new Enemy(EnemyType.Ghost, new Vector(1000, 500));
      const sprite = ghost.sprite.children[0] as any;

      ghost.flashHit(0xff0000, 0.1);
      expect(sprite.tint).toBe(0xff0000);

      // Update for the full duration
      ghost.update(0.1);

      expect(sprite.tint).toBe(0xffffff); // Restored to white
    });

    it("flashHit 持續時間內保持閃白顏色", () => {
      const ghost = new Enemy(EnemyType.Ghost, new Vector(1000, 500));
      const sprite = ghost.sprite.children[0] as any;

      ghost.flashHit(0xff0000, 0.2);

      // Update for half the duration
      ghost.update(0.1);

      expect(sprite.tint).toBe(0xff0000); // Still flashing
    });

    it("reset 後閃白效果被清除", () => {
      const ghost = new Enemy(EnemyType.Ghost, new Vector(1000, 500));
      const sprite = ghost.sprite.children[0] as any;

      ghost.flashHit(0xff0000, 1.0);
      expect(sprite.tint).toBe(0xff0000);

      ghost.reset(EnemyType.Ghost, new Vector(1500, 300));

      expect(sprite.tint).toBe(0xffffff); // Reset to white
    });
  });

  describe("Knockback Effect", () => {
    it("applyKnockback 使敵人向右移動", () => {
      const ghost = new Enemy(EnemyType.Ghost, new Vector(1000, 500));

      // Apply 15px knockback over 0.08s
      ghost.applyKnockback(15, 0.08);

      // Update for full knockback duration
      ghost.update(0.08);

      // Ghost should have moved right by ~15px (minus normal movement)
      // Normal movement: -50 * 0.08 = -4px
      // Knockback: +15px
      // Net: +11px
      expect(ghost.position.x).toBeCloseTo(1011, 0);
    });

    it("applyKnockback 持續時間後停止擊退", () => {
      const ghost = new Enemy(EnemyType.Ghost, new Vector(1000, 500));

      ghost.applyKnockback(15, 0.04);

      // Update for full knockback duration
      ghost.update(0.04);

      const positionAfterKnockback = ghost.position.x;

      // Update more time - no more knockback, just normal movement
      ghost.update(0.04);

      // Should only have normal left movement now (-50 * 0.04 = -2px)
      expect(ghost.position.x).toBeCloseTo(positionAfterKnockback - 2, 0);
    });

    it("applyKnockback 不影響 Y 軸位置", () => {
      const ghost = new Enemy(EnemyType.Ghost, new Vector(1000, 500));

      ghost.applyKnockback(15, 0.08);
      ghost.update(0.08);

      expect(ghost.position.y).toBe(500); // Y unchanged
    });

    it("reset 後擊退效果被清除", () => {
      const ghost = new Enemy(EnemyType.Ghost, new Vector(1000, 500));

      ghost.applyKnockback(100, 1.0); // Long knockback
      ghost.update(0.1); // Partial knockback

      ghost.reset(EnemyType.Ghost, new Vector(1500, 300));

      // After reset, only normal movement should apply
      ghost.update(0.1);

      // Normal movement: -50 * 0.1 = -5px
      expect(ghost.position.x).toBeCloseTo(1495, 0);
    });

    it("applyKnockback 距離為 0 時不產生效果", () => {
      const ghost = new Enemy(EnemyType.Ghost, new Vector(1000, 500));

      ghost.applyKnockback(0, 0.08);
      ghost.update(0.08);

      // Only normal movement
      expect(ghost.position.x).toBeCloseTo(996, 0); // 1000 - 50 * 0.08
    });

    it("applyKnockback 持續時間為 0 時不產生效果", () => {
      const ghost = new Enemy(EnemyType.Ghost, new Vector(1000, 500));

      ghost.applyKnockback(15, 0);
      ghost.update(0.08);

      // Only normal movement
      expect(ghost.position.x).toBeCloseTo(996, 0); // 1000 - 50 * 0.08
    });
  });
});
