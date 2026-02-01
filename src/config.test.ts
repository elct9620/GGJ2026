/**
 * Game Balance Configuration Tests
 * 驗證 config.ts 的配置值符合 SPEC 規格
 */

import { describe, it, expect } from "vitest";
import {
  PLAYER_CONFIG,
  ENEMY_CONFIG,
  BULLET_CONFIG,
  COMBAT_CONFIG,
  WAVE_CONFIG,
  BOOTH_CONFIG,
  KILL_COUNTER_CONFIG,
  RECIPE_CONFIG,
  UPGRADE_CONFIG,
} from "./config";

describe("Game Balance Config", () => {
  describe("PLAYER_CONFIG", () => {
    it("玩家血量應為 5 (SPEC § 2.6.1)", () => {
      expect(PLAYER_CONFIG.maxHealth).toBe(5);
    });

    it("玩家速度應為 200 px/s (SPEC § 2.6.1)", () => {
      expect(PLAYER_CONFIG.speed).toBe(200);
    });

    it("彈夾容量應為 6 (SPEC § 2.3.2)", () => {
      expect(PLAYER_CONFIG.magazineCapacity).toBe(6);
    });

    it("重裝時間應為 3 秒 (SPEC § 2.3.2)", () => {
      expect(PLAYER_CONFIG.reloadTime).toBe(3);
    });
  });

  describe("ENEMY_CONFIG", () => {
    it("餓鬼血量應為 1 (SPEC § 2.6.2)", () => {
      expect(ENEMY_CONFIG.ghost.health).toBe(1);
    });

    it("餓鬼速度應為 50 px/s (SPEC § 2.6.2)", () => {
      expect(ENEMY_CONFIG.ghost.speed).toBe(50);
    });

    it("Boss 血量應為 10 (SPEC § 2.6.2)", () => {
      expect(ENEMY_CONFIG.boss.health).toBe(10);
    });

    it("Boss 速度應為 30 px/s (SPEC § 2.6.2)", () => {
      expect(ENEMY_CONFIG.boss.speed).toBe(30);
    });

    it("敵人生成位置應為 x=1950 (SPEC § 2.3.5)", () => {
      expect(ENEMY_CONFIG.spawnX).toBe(1950);
    });
  });

  describe("BULLET_CONFIG", () => {
    it("子彈速度應為 400 px/s (SPEC § 2.6.3)", () => {
      expect(BULLET_CONFIG.speed).toBe(400);
    });

    it("普通子彈傷害應為 1 (SPEC § 2.6.3)", () => {
      expect(BULLET_CONFIG.normalDamage).toBe(1);
    });

    it("子彈碰撞箱應為 8 px (SPEC § 2.6.3)", () => {
      expect(BULLET_CONFIG.collisionSize).toBe(8);
    });

    it("子彈視覺大小應為 16 px（較大便於辨識）", () => {
      expect(BULLET_CONFIG.visualSize).toBe(16);
    });

    it("應定義各類型子彈顏色", () => {
      expect(BULLET_CONFIG.colors).toBeDefined();
      expect(BULLET_CONFIG.colors.normal).toBe(0xf1c40f);
      expect(BULLET_CONFIG.colors.nightMarket).toBe(0x9b59b6);
      expect(BULLET_CONFIG.colors.stinkyTofu).toBe(0x27ae60);
      expect(BULLET_CONFIG.colors.bubbleTea).toBe(0x8b4513);
      expect(BULLET_CONFIG.colors.bloodCake).toBe(0xe74c3c);
      expect(BULLET_CONFIG.colors.oysterOmelette).toBe(0xe67e22);
    });
  });

  describe("COMBAT_CONFIG", () => {
    it("射擊冷卻應為 0.2 秒 (SPEC § 2.3.2)", () => {
      expect(COMBAT_CONFIG.shootCooldown).toBe(0.2);
    });

    it("Buff 持續時間應為 2 秒 (SPEC § 2.3.2)", () => {
      expect(COMBAT_CONFIG.buffDuration).toBe(2);
    });

    it("重裝延遲應為 3000 毫秒 (SPEC § 2.3.2)", () => {
      expect(COMBAT_CONFIG.reloadDelayMs).toBe(3000);
    });
  });

  describe("WAVE_CONFIG", () => {
    it("Boss 應每 5 波出現 (SPEC § 2.3.5)", () => {
      expect(WAVE_CONFIG.bossWaveInterval).toBe(5);
    });

    it("敵人數量倍率應為 2 (SPEC § 2.3.5)", () => {
      expect(WAVE_CONFIG.enemyMultiplier).toBe(2);
    });

    it("生成機率總和應為 100%", () => {
      const totalProbability =
        WAVE_CONFIG.spawnProbability.ghost +
        WAVE_CONFIG.spawnProbability.redGhost +
        WAVE_CONFIG.spawnProbability.greenGhost +
        WAVE_CONFIG.spawnProbability.blueGhost;
      expect(totalProbability).toBeCloseTo(1.0);
    });
  });

  describe("BOOTH_CONFIG", () => {
    it("每個攤位最大儲存量應為 6 (SPEC § 2.3.1)", () => {
      expect(BOOTH_CONFIG.maxStorage).toBe(6);
    });

    it("敵人偷取數量應為 1 (SPEC § 2.3.1)", () => {
      expect(BOOTH_CONFIG.stealAmount).toBe(1);
    });
  });

  describe("KILL_COUNTER_CONFIG", () => {
    it("蚵仔煎門檻應為 20 (SPEC § 2.3.8)", () => {
      expect(KILL_COUNTER_CONFIG.oysterOmeletThreshold).toBe(20);
    });
  });

  describe("RECIPE_CONFIG", () => {
    it("夜市總匯消耗應為 豆腐1/珍珠1/米血1 (SPEC § 2.3.3)", () => {
      expect(RECIPE_CONFIG.nightMarket.pearl).toBe(1);
      expect(RECIPE_CONFIG.nightMarket.tofu).toBe(1);
      expect(RECIPE_CONFIG.nightMarket.bloodCake).toBe(1);
    });

    it("臭豆腐消耗應為 豆腐3 (SPEC § 2.3.3)", () => {
      expect(RECIPE_CONFIG.stinkyTofu.tofu).toBe(3);
    });

    it("珍珠奶茶消耗應為 珍珠3 (SPEC § 2.3.3)", () => {
      expect(RECIPE_CONFIG.bubbleTea.pearl).toBe(3);
    });

    it("珍珠奶茶額外子彈數應為 2 (三向散射 = 中心 + 左 + 右) (SPEC § 2.3.3)", () => {
      expect(RECIPE_CONFIG.bubbleTea.extraBullets).toBe(2);
    });

    it("豬血糕消耗應為 米血3 (SPEC § 2.3.3)", () => {
      expect(RECIPE_CONFIG.bloodCake.bloodCake).toBe(3);
    });

    it("豬血糕追蹤範圍應為 600px (SPEC § 2.6.3.5)", () => {
      expect(RECIPE_CONFIG.bloodCake.trackingRange).toBe(600);
    });

    it("蚵仔煎百分比傷害應正確 (SPEC § 2.3.3)", () => {
      expect(RECIPE_CONFIG.oysterOmelet.bossDamagePercent).toBe(0.1);
      expect(RECIPE_CONFIG.oysterOmelet.eliteDamagePercent).toBe(0.5);
      expect(RECIPE_CONFIG.oysterOmelet.ghostDamagePercent).toBe(0.7);
    });
  });

  describe("UPGRADE_CONFIG", () => {
    it("加辣應加 0.5 傷害 (SPEC § 2.3.4)", () => {
      expect(UPGRADE_CONFIG.normal.spicy.damageBonus).toBe(0.5);
    });

    it("加椰果應加 1 子彈 (SPEC § 2.3.4)", () => {
      expect(UPGRADE_CONFIG.normal.coconut.bulletBonus).toBe(1);
    });

    it("加香菜應加 100px 追蹤範圍 (SPEC § 2.3.4)", () => {
      expect(UPGRADE_CONFIG.normal.cilantro.rangeBonus).toBe(100);
    });

    it("大胃王應加 6 彈夾容量 (SPEC § 2.3.4)", () => {
      expect(UPGRADE_CONFIG.boss.bigEater.magazineBonus).toBe(6);
    });

    it("飢餓三十應加 2 秒 Buff 時長 (SPEC § 2.3.4)", () => {
      expect(UPGRADE_CONFIG.boss.hunger30.durationBonus).toBe(2);
    });

    it("升級選項數量應為 2 (SPEC § 2.3.4)", () => {
      expect(UPGRADE_CONFIG.optionsCount).toBe(2);
    });
  });
});
