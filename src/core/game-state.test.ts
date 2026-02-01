/**
 * GameStateManager Tests
 * Tests for centralized game state management
 */

import { describe, it, expect, beforeEach } from "vitest";
import { GameStateManager, ScreenState, createGameStats } from "./game-state";
import { SpecialBulletType } from "./types";

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

    it("應以預設升級狀態初始化", () => {
      expect(gameState.upgrades.stinkyTofuDamageBonus).toBe(0);
      expect(gameState.upgrades.bubbleTeaBulletBonus).toBe(0);
      expect(gameState.upgrades.bloodCakeRangeBonus).toBe(0);
      expect(gameState.upgrades.recipeCostReduction).toBe(0);
      expect(gameState.upgrades.magazineMultiplier).toBe(1);
      expect(gameState.upgrades.killThresholdDivisor).toBe(1);
      expect(gameState.upgrades.buffDurationMultiplier).toBe(1);
      expect(gameState.upgrades.reloadTimeReduction).toBe(0);
      expect(gameState.upgrades.nightMarketChainMultiplier).toBe(1);
      expect(gameState.upgrades.nightMarketDecayReduction).toBe(0);
    });

    it("無 resource provider 時應回傳零資源", () => {
      expect(gameState.resources.pearl).toBe(0);
      expect(gameState.resources.tofu).toBe(0);
      expect(gameState.resources.bloodCake).toBe(0);
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

  describe("Wave spawn state", () => {
    it("應以空的 waveSpawn 狀態初始化", () => {
      expect(gameState.waveSpawn.enemiesToSpawn).toBe(0);
      expect(gameState.waveSpawn.spawnTimer).toBe(0);
      expect(gameState.waveSpawn.nextSpawnInterval).toBe(0);
      expect(gameState.waveSpawn.shouldSpawnBoss).toBe(false);
      expect(gameState.waveSpawn.enemiesSpawnedThisWave).toBe(0);
    });

    it("應能初始化 wave spawn 狀態", () => {
      gameState.initializeWaveSpawn(10, true);

      expect(gameState.waveSpawn.enemiesToSpawn).toBe(10);
      expect(gameState.waveSpawn.spawnTimer).toBe(0);
      expect(gameState.waveSpawn.nextSpawnInterval).toBe(0);
      expect(gameState.waveSpawn.shouldSpawnBoss).toBe(true);
      expect(gameState.waveSpawn.enemiesSpawnedThisWave).toBe(0);
    });

    it("應能更新 spawn timer", () => {
      gameState.initializeWaveSpawn(5, false);
      gameState.updateSpawnTimer(0.5);

      expect(gameState.waveSpawn.spawnTimer).toBe(0.5);
    });

    it("應能重置 spawn timer 並設定下次間隔", () => {
      gameState.initializeWaveSpawn(5, false);
      gameState.updateSpawnTimer(2.5);
      gameState.resetSpawnTimer(3.0);

      expect(gameState.waveSpawn.spawnTimer).toBe(0);
      expect(gameState.waveSpawn.nextSpawnInterval).toBe(3.0);
    });

    it("應能減少待生成敵人數並增加已生成數", () => {
      gameState.initializeWaveSpawn(5, false);
      gameState.decrementEnemiesToSpawn();

      expect(gameState.waveSpawn.enemiesToSpawn).toBe(4);
      expect(gameState.waveSpawn.enemiesSpawnedThisWave).toBe(1);
    });

    it("應能僅增加已生成敵人數", () => {
      gameState.initializeWaveSpawn(5, true);
      gameState.incrementEnemiesSpawned();

      expect(gameState.waveSpawn.enemiesToSpawn).toBe(5); // 不變
      expect(gameState.waveSpawn.enemiesSpawnedThisWave).toBe(1);
    });

    it("應能清除 boss spawn 旗標", () => {
      gameState.initializeWaveSpawn(5, true);
      gameState.clearBossSpawnFlag();

      expect(gameState.waveSpawn.shouldSpawnBoss).toBe(false);
    });

    it("應能重置 wave spawn 狀態", () => {
      gameState.initializeWaveSpawn(10, true);
      gameState.decrementEnemiesToSpawn();
      gameState.updateSpawnTimer(1.5);

      gameState.resetWaveSpawn();

      expect(gameState.waveSpawn.enemiesToSpawn).toBe(0);
      expect(gameState.waveSpawn.spawnTimer).toBe(0);
      expect(gameState.waveSpawn.shouldSpawnBoss).toBe(false);
      expect(gameState.waveSpawn.enemiesSpawnedThisWave).toBe(0);
    });

    it("reset 應重置 waveSpawn 狀態", () => {
      gameState.initializeWaveSpawn(10, true);
      gameState.decrementEnemiesToSpawn();

      gameState.reset();

      expect(gameState.waveSpawn.enemiesToSpawn).toBe(0);
      expect(gameState.waveSpawn.enemiesSpawnedThisWave).toBe(0);
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

    it("應重置升級狀態", () => {
      // 套用一些升級
      gameState.incrementStinkyTofuDamage(0.5);
      gameState.incrementBubbleTeaBullets(1);
      gameState.incrementMagazineCapacity(6);

      // 重置
      gameState.reset();

      // 驗證升級狀態歸零
      expect(gameState.upgrades.stinkyTofuDamageBonus).toBe(0);
      expect(gameState.upgrades.bubbleTeaBulletBonus).toBe(0);
      expect(gameState.upgrades.magazineMultiplier).toBe(1);
    });
  });

  describe("Upgrade state", () => {
    it("應能增加臭豆腐傷害加成（加辣）", () => {
      gameState.incrementStinkyTofuDamage(0.5);

      expect(gameState.upgrades.stinkyTofuDamageBonus).toBe(0.5);
    });

    it("應能增加珍珠奶茶子彈加成（加椰果）", () => {
      gameState.incrementBubbleTeaBullets(1);

      expect(gameState.upgrades.bubbleTeaBulletBonus).toBe(1);
    });

    it("應能增加豬血糕範圍加成（加香菜）", () => {
      gameState.incrementBloodCakeRange(100);

      expect(gameState.upgrades.bloodCakeRangeBonus).toBe(100);
    });

    it("應能增加配方消耗減少（打折）", () => {
      gameState.incrementRecipeCostReduction(1);

      expect(gameState.upgrades.recipeCostReduction).toBe(1);
    });

    it("應能增加彈匣容量（大胃王）", () => {
      gameState.incrementMagazineCapacity(6);

      expect(gameState.upgrades.magazineMultiplier).toBe(7); // 初始 1 + 6
    });

    it("應能增加擊殺閾值除數（快吃）", () => {
      gameState.incrementKillThresholdDivisor(0.1);

      expect(gameState.upgrades.killThresholdDivisor).toBe(1.1); // 初始 1 + 0.1
    });

    it("應能增加 Buff 持續時間（飢餓三十）", () => {
      gameState.incrementBuffDuration(2);

      expect(gameState.upgrades.buffDurationMultiplier).toBe(3); // 初始 1 + 2
    });

    it("應能增加換彈時間減少（好餓好餓）", () => {
      gameState.incrementReloadTimeReduction(0.5);

      expect(gameState.upgrades.reloadTimeReduction).toBe(0.5);
    });

    it("應能乘以夜市總匯連鎖倍率（總匯吃到飽）", () => {
      gameState.multiplyNightMarketChain(2);

      expect(gameState.upgrades.nightMarketChainMultiplier).toBe(2); // 初始 1 × 2
    });

    it("應能增加夜市總匯衰減減少（總匯吃到飽）", () => {
      gameState.incrementNightMarketDecayReduction(0.1);

      expect(gameState.upgrades.nightMarketDecayReduction).toBe(0.1);
    });

    it("升級效果應可堆疊", () => {
      gameState.incrementStinkyTofuDamage(0.5);
      gameState.incrementStinkyTofuDamage(0.5);

      expect(gameState.upgrades.stinkyTofuDamageBonus).toBe(1.0);
    });

    it("夜市總匯連鎖倍率應以乘法堆疊", () => {
      gameState.multiplyNightMarketChain(2);
      gameState.multiplyNightMarketChain(2);

      expect(gameState.upgrades.nightMarketChainMultiplier).toBe(4); // 1 × 2 × 2
    });
  });

  describe("Resource provider", () => {
    it("應能設定 resource provider", () => {
      const mockProvider = () => ({
        pearl: 3,
        tofu: 2,
        bloodCake: 1,
      });

      gameState.setResourceProvider(mockProvider);

      expect(gameState.resources.pearl).toBe(3);
      expect(gameState.resources.tofu).toBe(2);
      expect(gameState.resources.bloodCake).toBe(1);
    });

    it("resource provider 應反映即時資料", () => {
      let pearlCount = 0;
      const mockProvider = () => ({
        pearl: pearlCount,
        tofu: 0,
        bloodCake: 0,
      });

      gameState.setResourceProvider(mockProvider);
      expect(gameState.resources.pearl).toBe(0);

      pearlCount = 5;
      expect(gameState.resources.pearl).toBe(5);
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
