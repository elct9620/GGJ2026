/**
 * GameStateManager Tests
 * Tests for centralized game state management
 */

import { describe, it, expect, beforeEach } from "vitest";
import {
  GameStateManager,
  ScreenState,
  GameState,
  createGameStats,
} from "./game-state";
import { SpecialBulletType } from "../values/special-bullet";

describe("GameState (deprecated alias)", () => {
  it("should have correct state values", () => {
    expect(GameState.START).toBe("START");
    expect(GameState.PLAYING).toBe("PLAYING");
    expect(GameState.GAME_OVER).toBe("GAME_OVER");
  });
});

describe("ScreenState", () => {
  it("should have correct state values", () => {
    expect(ScreenState.START).toBe("START");
    expect(ScreenState.PLAYING).toBe("PLAYING");
    expect(ScreenState.GAME_OVER).toBe("GAME_OVER");
  });
});

describe("GameStateManager", () => {
  let gameState: GameStateManager;

  beforeEach(() => {
    gameState = new GameStateManager();
  });

  describe("初始化", () => {
    it("應以 START 畫面狀態初始化", () => {
      expect(gameState.screen).toBe(ScreenState.START);
    });

    it("應以空的 wave 狀態初始化", () => {
      expect(gameState.wave.currentWave).toBe(0);
      expect(gameState.wave.isActive).toBe(false);
      expect(gameState.wave.enemiesRemaining).toBe(0);
    });

    it("應以無 buff 的 combat 狀態初始化", () => {
      expect(gameState.combat.currentBuff).toBe(SpecialBulletType.None);
      expect(gameState.combat.buffTimeRemaining).toBe(0);
    });

    it("應以零擊殺數初始化", () => {
      expect(gameState.kills).toBe(0);
    });

    it("應以零統計數據初始化", () => {
      expect(gameState.stats.wavesSurvived).toBe(0);
      expect(gameState.stats.enemiesDefeated).toBe(0);
      expect(gameState.stats.specialBulletsUsed).toBe(0);
    });
  });

  describe("Screen state", () => {
    it("應能設定畫面狀態", () => {
      gameState.setScreen(ScreenState.PLAYING);
      expect(gameState.screen).toBe(ScreenState.PLAYING);

      gameState.setScreen(ScreenState.GAME_OVER);
      expect(gameState.screen).toBe(ScreenState.GAME_OVER);
    });
  });

  describe("Wave state", () => {
    it("應能開始新回合", () => {
      gameState.startWave(1, 10);

      expect(gameState.wave.currentWave).toBe(1);
      expect(gameState.wave.isActive).toBe(true);
      expect(gameState.wave.enemiesRemaining).toBe(10);
    });

    it("應能完成回合", () => {
      gameState.startWave(1, 2);
      gameState.completeWave();

      expect(gameState.wave.isActive).toBe(false);
    });

    it("應能減少剩餘敵人數", () => {
      gameState.startWave(1, 5);
      gameState.decrementEnemiesRemaining();

      expect(gameState.wave.enemiesRemaining).toBe(4);
    });

    it("剩餘敵人數不應小於零", () => {
      gameState.startWave(1, 1);
      gameState.decrementEnemiesRemaining();
      gameState.decrementEnemiesRemaining();

      expect(gameState.wave.enemiesRemaining).toBe(0);
    });

    it("應能部分更新 wave 狀態", () => {
      gameState.setWave({ currentWave: 5 });

      expect(gameState.wave.currentWave).toBe(5);
      expect(gameState.wave.isActive).toBe(false); // 保留原值
    });
  });

  describe("Combat state", () => {
    it("應能啟動 buff", () => {
      gameState.activateBuff(SpecialBulletType.StinkyTofu, 2.0);

      expect(gameState.combat.currentBuff).toBe(SpecialBulletType.StinkyTofu);
      expect(gameState.combat.buffTimeRemaining).toBe(2.0);
    });

    it("應能更新 buff 計時器", () => {
      gameState.activateBuff(SpecialBulletType.BubbleTea, 2.0);
      const expired = gameState.updateBuffTimer(0.5);

      expect(expired).toBe(false);
      expect(gameState.combat.buffTimeRemaining).toBe(1.5);
    });

    it("buff 過期時應回傳 true 並清除 buff", () => {
      gameState.activateBuff(SpecialBulletType.BloodCake, 1.0);
      const expired = gameState.updateBuffTimer(1.5);

      expect(expired).toBe(true);
      expect(gameState.combat.currentBuff).toBe(SpecialBulletType.None);
      expect(gameState.combat.buffTimeRemaining).toBe(0);
    });

    it("無 buff 時更新計時器不應有副作用", () => {
      const expired = gameState.updateBuffTimer(0.5);

      expect(expired).toBe(false);
      expect(gameState.combat.currentBuff).toBe(SpecialBulletType.None);
    });

    it("應能清除 buff", () => {
      gameState.activateBuff(SpecialBulletType.NightMarket, 2.0);
      gameState.clearBuff();

      expect(gameState.combat.currentBuff).toBe(SpecialBulletType.None);
      expect(gameState.combat.buffTimeRemaining).toBe(0);
    });

    it("應能部分更新 combat 狀態", () => {
      gameState.setCombat({ buffTimeRemaining: 1.5 });

      expect(gameState.combat.buffTimeRemaining).toBe(1.5);
      expect(gameState.combat.currentBuff).toBe(SpecialBulletType.None); // 保留原值
    });
  });

  describe("Kill counter", () => {
    it("應能增加擊殺數", () => {
      gameState.incrementKills();
      gameState.incrementKills();

      expect(gameState.kills).toBe(2);
    });

    it("消耗擊殺數成功時應回傳 true", () => {
      for (let i = 0; i < 20; i++) {
        gameState.incrementKills();
      }

      const result = gameState.consumeKills(20);

      expect(result).toBe(true);
      expect(gameState.kills).toBe(0);
    });

    it("擊殺數不足時消耗應回傳 false", () => {
      gameState.incrementKills();

      const result = gameState.consumeKills(20);

      expect(result).toBe(false);
      expect(gameState.kills).toBe(1); // 未消耗
    });
  });

  describe("Stats", () => {
    it("應能增加敵人擊敗數", () => {
      gameState.incrementEnemiesDefeated();
      gameState.incrementEnemiesDefeated();

      expect(gameState.stats.enemiesDefeated).toBe(2);
    });

    it("應能增加特殊子彈使用數", () => {
      gameState.incrementSpecialBulletsUsed();

      expect(gameState.stats.specialBulletsUsed).toBe(1);
    });

    it("應能設定存活回合數", () => {
      gameState.setWavesSurvived(10);

      expect(gameState.stats.wavesSurvived).toBe(10);
    });
  });

  describe("Reset", () => {
    it("應重置所有狀態", () => {
      // 設定各種狀態
      gameState.setScreen(ScreenState.PLAYING);
      gameState.startWave(5, 10);
      gameState.activateBuff(SpecialBulletType.StinkyTofu, 2.0);
      for (let i = 0; i < 15; i++) {
        gameState.incrementKills();
      }
      gameState.incrementEnemiesDefeated();
      gameState.setWavesSurvived(4);

      // 重置
      gameState.reset();

      // 驗證
      expect(gameState.screen).toBe(ScreenState.START);
      expect(gameState.wave.currentWave).toBe(0);
      expect(gameState.wave.isActive).toBe(false);
      expect(gameState.combat.currentBuff).toBe(SpecialBulletType.None);
      expect(gameState.kills).toBe(0);
      expect(gameState.stats.wavesSurvived).toBe(0);
      expect(gameState.stats.enemiesDefeated).toBe(0);
    });
  });
});

describe("createGameStats", () => {
  it("should create initial game statistics with zeros", () => {
    const stats = createGameStats();

    expect(stats.wavesSurvived).toBe(0);
    expect(stats.enemiesDefeated).toBe(0);
    expect(stats.specialBulletsUsed).toBe(0);
  });

  it("should create new instance each time", () => {
    const stats1 = createGameStats();
    const stats2 = createGameStats();

    expect(stats1).not.toBe(stats2);
    expect(stats1).toEqual(stats2);
  });
});
