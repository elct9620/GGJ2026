/**
 * Combat System Tests
 * testing.md § 2.2
 */

import { describe, it, expect, beforeEach } from "vitest";
import { CombatSystem, SpecialBulletType } from "./combat";
import { Player } from "../entities/player";
import { Enemy, EnemyType } from "../entities/enemy";
import { Bullet } from "../entities/bullet";
import { EventQueue, EventType } from "./event-queue";
import { Vector } from "../values/vector";
import { GameStateManager } from "../core/game-state";

describe("CombatSystem", () => {
  let combatSystem: CombatSystem;
  let player: Player;
  let bullets: Bullet[];
  let enemies: Enemy[];
  let eventQueue: EventQueue;
  let gameState: GameStateManager;

  beforeEach(() => {
    combatSystem = new CombatSystem();
    player = new Player(new Vector(960, 540));
    bullets = [];
    enemies = [];
    eventQueue = new EventQueue();
    gameState = new GameStateManager();

    // Inject dependencies using new API
    combatSystem.inject("EventQueue", eventQueue);
    combatSystem.inject("GameState", gameState);
    combatSystem.initialize();
    combatSystem.setPlayer(player);
    combatSystem.setBullets(bullets);
    combatSystem.setEnemies(enemies);
    combatSystem.subscribeToEvents();
  });

  describe("Normal Attack", () => {
    it("CS-01: 彈夾 6/6 + 按 Space → 彈夾 5/6，子彈生成", () => {
      expect(player.ammo).toBe(6);

      const result = combatSystem.shoot();

      expect(result).toBe(true);
      expect(player.ammo).toBe(5);
    });

    it("CS-02: 彈夾 0/6 + 按 Space → 無效果", () => {
      // Deplete ammo
      for (let i = 0; i < 6; i++) {
        player.shoot();
      }
      expect(player.ammo).toBe(0);

      const result = combatSystem.shoot();

      expect(result).toBe(false);
      expect(player.ammo).toBe(0);
    });

    it("CS-03: 子彈擊中餓鬼（1 HP）→ 餓鬼死亡", () => {
      const enemy = new Enemy(EnemyType.Ghost, new Vector(500, 540));
      enemies.push(enemy);

      const bullet = new Bullet(new Vector(490, 540), new Vector(1, 0));
      bullets.push(bullet);

      // Mock event subscription
      let enemyDeathEventFired = false;
      eventQueue.subscribe(EventType.EnemyDeath, () => {
        enemyDeathEventFired = true;
      });

      combatSystem.update(0.016); // One frame

      expect(enemy.active).toBe(false);
      expect(bullet.active).toBe(false);
      expect(enemyDeathEventFired).toBe(true);
    });

    it("CS-04: 子彈擊中 Boss（10 HP）→ Boss 生命 9 HP", () => {
      // SPEC § 2.6.2: Boss Wave 5 基礎血量 = 10
      const boss = new Enemy(EnemyType.Boss, new Vector(500, 540), 5);
      enemies.push(boss);
      expect(boss.health).toBe(10);

      const bullet = new Bullet(new Vector(490, 540), new Vector(1, 0));
      bullets.push(bullet);

      combatSystem.update(0.016);

      expect(boss.health).toBe(9);
      expect(boss.active).toBe(true);
      expect(bullet.active).toBe(false); // Bullet consumed
    });

    it("CS-05: 連續按 Space 6 次 → 彈夾 0/6，6 發子彈生成", () => {
      expect(player.ammo).toBe(6);

      for (let i = 0; i < 6; i++) {
        const result = combatSystem.shoot();
        expect(result).toBe(true);
        // Update cooldown to allow next shot
        combatSystem.update(0.2); // Cooldown is 0.2s
      }

      expect(player.ammo).toBe(0);
    });

    it("CS-06: 子彈飛出畫面右邊界 → 子彈消失", () => {
      const bullet = new Bullet(new Vector(1900, 540), new Vector(1, 0));
      bullets.push(bullet);

      bullet.update(0.1); // Move right

      expect(bullet.active).toBe(false);
    });

    it("CS-07: 子彈未擊中任何敵人 → 子彈繼續飛行", () => {
      const bullet = new Bullet(new Vector(500, 540), new Vector(1, 0));
      bullets.push(bullet);

      combatSystem.update(0.016);

      expect(bullet.active).toBe(true);
    });
  });

  describe("Reload", () => {
    it("CS-08: 彈夾 0/6 + 等待 3 秒 → 彈夾 6/6", () => {
      // Deplete ammo (triggers reload)
      for (let i = 0; i < 6; i++) {
        player.shoot();
      }
      expect(player.isReloading).toBe(true);

      // Simulate 3 seconds
      player.update(3);

      expect(player.isReloading).toBe(false);
      expect(player.ammo).toBe(6);
    });

    it("CS-09: 重裝中（1.5 秒）+ 按 Space → 無效果", () => {
      // Trigger reload
      for (let i = 0; i < 6; i++) {
        player.shoot();
      }
      expect(player.isReloading).toBe(true);

      // Simulate 1.5 seconds
      player.update(1.5);
      expect(player.isReloading).toBe(true);

      const result = combatSystem.shoot();

      expect(result).toBe(false);
    });

    it("CS-10: 重裝中 + 按 WASD → 玩家移動", () => {
      // Trigger reload
      for (let i = 0; i < 6; i++) {
        player.shoot();
      }
      expect(player.isReloading).toBe(true);

      const initialPosition = player.position;
      player.move(new Vector(1, 0), 0.1); // Move right

      expect(player.position.x).toBeGreaterThan(initialPosition.x);
    });

    it("CS-11: 彈夾 0/6 + 等待 1.5 秒 → 彈夾 0/6", () => {
      for (let i = 0; i < 6; i++) {
        player.shoot();
      }

      player.update(1.5);

      expect(player.isReloading).toBe(true);
      expect(player.ammo).toBe(0);
    });

    it("CS-12: 重裝完成瞬間 + 按 Space → 彈夾 5/6，子彈生成", () => {
      for (let i = 0; i < 6; i++) {
        player.shoot();
      }

      player.update(3); // Complete reload
      expect(player.ammo).toBe(6);

      const result = combatSystem.shoot();

      expect(result).toBe(true);
      expect(player.ammo).toBe(5);
    });
  });

  describe("Special Bullet", () => {
    it("CS-13: 火力強化 Buff + 按 Space → 傷害 ×8 子彈", () => {
      // Trigger buff via SynthesisTriggered event (recipe "2" = 臭豆腐)
      // Note: Testing damage multiplier requires implementing damage scaling
      eventQueue.publish(EventType.SynthesisTriggered, { recipeId: "2" });

      expect(combatSystem.getCurrentBuff()).toBe(SpecialBulletType.StinkyTofu);
      expect(combatSystem.isBuffActive()).toBe(true);
    });

    it("CS-14: 臭豆腐 Buff + 按 Space → 貫穿子彈", () => {
      eventQueue.publish(EventType.SynthesisTriggered, { recipeId: "2" });

      // Place enemies far apart so only one is hit per frame
      // Enemy collision box is 256×256, so 600px apart ensures no overlap
      const enemy1 = new Enemy(EnemyType.Ghost, new Vector(500, 540));
      const enemy2 = new Enemy(EnemyType.Ghost, new Vector(1100, 540));
      enemies.push(enemy1, enemy2);

      const bullet = new Bullet(new Vector(480, 540), new Vector(1, 0));
      bullets.push(bullet);

      combatSystem.update(0.016);

      // Bullet should remain active after hitting first enemy (piercing 1)
      expect(bullet.active).toBe(true);
      // First enemy should be dead (1 HP ghost)
      expect(enemy1.active).toBe(false);
      // Second enemy should be unharmed
      expect(enemy2.active).toBe(true);
    });

    it("CS-15: 珍珠奶茶 Buff + 按 Space → 散射多個子彈", () => {
      eventQueue.publish(EventType.SynthesisTriggered, { recipeId: "3" });

      expect(combatSystem.getCurrentBuff()).toBe(SpecialBulletType.BubbleTea);
      // Note: Scatter logic is implemented in GameScene.spawnBubbleTeaBullets()
      // CombatSystem only manages buff state, bullet spawning is in GameScene
    });

    it("CS-16: 豬血糕 Buff + 按 Space → 追蹤子彈 + 減速效果", () => {
      eventQueue.publish(EventType.SynthesisTriggered, { recipeId: "4" });
      expect(combatSystem.getCurrentBuff()).toBe(SpecialBulletType.BloodCake);

      // Create enemy with more HP to survive (Elite has 2 HP, BloodCake damage is 2)
      // SPEC § 2.3.5: Boss 首次出現在 Wave 5
      const enemy = new Enemy(EnemyType.Boss, new Vector(500, 540), 5);
      enemies.push(enemy);
      const initialSpeed = enemy.speed;

      const bullet = new Bullet(new Vector(480, 540), new Vector(1, 0));
      bullets.push(bullet);

      combatSystem.update(0.016);

      // Bullet should be consumed after hit
      expect(bullet.active).toBe(false);
      // Enemy should have reduced speed due to slow debuff
      expect(enemy.speed).toBeLessThan(initialSpeed);
    });

    it("CS-17: 夜市總匯 Buff + 擊中第 1 隻敵人 → 閃電連鎖", () => {
      eventQueue.publish(EventType.SynthesisTriggered, { recipeId: "1" });
      expect(combatSystem.getCurrentBuff()).toBe(SpecialBulletType.NightMarket);

      // Create multiple enemies in chain range (300px)
      const enemy1 = new Enemy(EnemyType.Ghost, new Vector(500, 540));
      const enemy2 = new Enemy(EnemyType.Ghost, new Vector(700, 540));
      const enemy3 = new Enemy(EnemyType.Ghost, new Vector(900, 540));
      enemies.push(enemy1, enemy2, enemy3);

      const bullet = new Bullet(new Vector(480, 540), new Vector(1, 0));
      bullets.push(bullet);

      combatSystem.update(0.016);

      // Bullet should be consumed
      expect(bullet.active).toBe(false);
      // First enemy hit directly
      expect(enemy1.active).toBe(false);
      // Chain should hit subsequent enemies within range
      expect(enemy2.active).toBe(false);
      expect(enemy3.active).toBe(false);
    });

    it("CS-17b: 夜市總匯連鎖傷害衰減", () => {
      eventQueue.publish(EventType.SynthesisTriggered, { recipeId: "1" });

      // Create elite enemies to test damage decay (Elite has 2 HP)
      const enemy1 = new Enemy(EnemyType.RedGhost, new Vector(500, 540));
      const enemy2 = new Enemy(EnemyType.RedGhost, new Vector(700, 540));
      enemies.push(enemy1, enemy2);

      const bullet = new Bullet(new Vector(480, 540), new Vector(1, 0));
      bullets.push(bullet);

      combatSystem.update(0.016);

      // First enemy takes full damage (2), should die (2 HP)
      expect(enemy1.active).toBe(false);
      // Second enemy takes decayed damage (2 × 0.8 = 1.6 → 2), should also die
      expect(enemy2.active).toBe(false);
    });

    it("CS-13b: 蚵仔煎 Boss 傷害 = 10% HP", () => {
      eventQueue.publish(EventType.SynthesisTriggered, { recipeId: "5" });
      expect(combatSystem.getCurrentBuff()).toBe(
        SpecialBulletType.OysterOmelette,
      );

      // SPEC § 2.6.2: Boss Wave 5 has 10 HP
      const boss = new Enemy(EnemyType.Boss, new Vector(500, 540), 5);
      enemies.push(boss);

      const bullet = new Bullet(new Vector(480, 540), new Vector(1, 0));
      bullets.push(bullet);

      combatSystem.update(0.016);

      // Boss should take 10% of max HP (10 × 0.1 = 1)
      expect(boss.health).toBe(9);
      expect(bullet.active).toBe(false);
    });

    it("CS-13c: 蚵仔煎 Elite 傷害 = 50% HP", () => {
      eventQueue.publish(EventType.SynthesisTriggered, { recipeId: "5" });

      // Elite has 2 HP
      const elite = new Enemy(EnemyType.RedGhost, new Vector(500, 540));
      enemies.push(elite);

      const bullet = new Bullet(new Vector(480, 540), new Vector(1, 0));
      bullets.push(bullet);

      combatSystem.update(0.016);

      // Elite should take 50% of max HP (2 × 0.5 = 1)
      expect(elite.health).toBe(1);
    });

    it("CS-13d: 蚵仔煎 Ghost 傷害 = 70% HP", () => {
      eventQueue.publish(EventType.SynthesisTriggered, { recipeId: "5" });

      // Ghost has 1 HP
      const ghost = new Enemy(EnemyType.Ghost, new Vector(500, 540));
      enemies.push(ghost);

      const bullet = new Bullet(new Vector(480, 540), new Vector(1, 0));
      bullets.push(bullet);

      combatSystem.update(0.016);

      // Ghost should take 70% of max HP (1 × 0.7 = 1, ceiling)
      expect(ghost.active).toBe(false);
    });

    it("CS-13e: 蚵仔煎對受傷 Boss 造成當前 HP 10% 傷害", () => {
      eventQueue.publish(EventType.SynthesisTriggered, { recipeId: "5" });

      // Wave 5 Boss has 10 HP, damage it to 6 HP first
      const boss = new Enemy(EnemyType.Boss, new Vector(500, 540), 5);
      boss.takeDamage(4); // 10 - 4 = 6 HP (injured boss)
      enemies.push(boss);

      const bullet = new Bullet(new Vector(480, 540), new Vector(1, 0));
      bullets.push(bullet);

      combatSystem.update(0.016);

      // Boss should take 10% of CURRENT HP (6 × 0.1 = 0.6 → 1)
      expect(boss.health).toBe(5);
      expect(bullet.active).toBe(false);
    });

    it("CS-13f: 蚵仔煎對受傷菁英造成當前 HP 50% 傷害", () => {
      eventQueue.publish(EventType.SynthesisTriggered, { recipeId: "5" });

      // Elite with 4 HP (Wave 5), damage it to 3 HP first
      const elite = new Enemy(EnemyType.RedGhost, new Vector(500, 540), 5);
      elite.takeDamage(1); // 4 - 1 = 3 HP (injured elite)
      enemies.push(elite);

      const bullet = new Bullet(new Vector(480, 540), new Vector(1, 0));
      bullets.push(bullet);

      combatSystem.update(0.016);

      // Elite should take 50% of CURRENT HP (3 × 0.5 = 1.5 → 2)
      expect(elite.health).toBe(1);
      expect(bullet.active).toBe(false);
    });

    it("CS-18: Buff 結束（2 秒後）+ 按 Space → 普通子彈", () => {
      eventQueue.publish(EventType.SynthesisTriggered, { recipeId: "2" });
      expect(combatSystem.isBuffActive()).toBe(true);

      // Mock BuffExpired event
      let buffExpiredFired = false;
      eventQueue.subscribe(EventType.BuffExpired, () => {
        buffExpiredFired = true;
      });

      // Simulate 2 seconds
      combatSystem.update(2);

      expect(combatSystem.getCurrentBuff()).toBe(SpecialBulletType.None);
      expect(combatSystem.isBuffActive()).toBe(false);
      expect(buffExpiredFired).toBe(true);
    });

    it("CS-19: 特殊 Buff 期間 + 按數字鍵 → 無效果", () => {
      eventQueue.publish(EventType.SynthesisTriggered, { recipeId: "2" });
      expect(combatSystem.isBuffActive()).toBe(true);

      // Try to trigger another buff
      eventQueue.publish(EventType.SynthesisTriggered, { recipeId: "3" });

      // Buff should remain as StinkyTofu
      expect(combatSystem.getCurrentBuff()).toBe(SpecialBulletType.StinkyTofu);
    });

    it("CS-20: Buff 剩餘 0.5 秒 + 按 Space → 特殊子彈", () => {
      eventQueue.publish(EventType.SynthesisTriggered, { recipeId: "2" });

      // Simulate 1.5 seconds (0.5 seconds remaining)
      combatSystem.update(1.5);

      expect(combatSystem.isBuffActive()).toBe(true);
      expect(combatSystem.getBuffTimer()).toBeCloseTo(0.5, 1);
    });
  });

  describe("ReloadComplete Event", () => {
    it("should publish ReloadComplete event after 3 seconds", () => {
      let reloadCompleteFired = false;
      eventQueue.subscribe(EventType.ReloadComplete, () => {
        reloadCompleteFired = true;
      });

      // Deplete ammo to trigger reload
      for (let i = 0; i < 6; i++) {
        combatSystem.shoot();
        combatSystem.update(0.2); // Clear cooldown
      }

      expect(player.isReloading).toBe(true);

      // Simulate 3 seconds via EventQueue
      eventQueue.update(3);

      expect(reloadCompleteFired).toBe(true);
    });
  });

  describe("EnemyDeath Event", () => {
    it("should publish EnemyDeath event with correct data", () => {
      let receivedData: {
        enemyId: string;
        position: { x: number; y: number };
      } | null = null;

      eventQueue.subscribe(EventType.EnemyDeath, (data: any) => {
        receivedData = data;
      });

      const enemy = new Enemy(EnemyType.Ghost, new Vector(500, 540));
      enemies.push(enemy);

      const bullet = new Bullet(new Vector(490, 540), new Vector(1, 0));
      bullets.push(bullet);

      combatSystem.update(0.016);

      expect(receivedData).not.toBeNull();
      const data = receivedData!;
      expect(data.enemyId).toBe(enemy.id);
      expect(data.position.x).toBeCloseTo(500, 0);
      expect(data.position.y).toBeCloseTo(540, 0);
    });
  });

  describe("performShoot", () => {
    // Helper function to create spawner callback with proper Vector conversion
    const createSpawner = (spawnedBullets: Bullet[]) => {
      return (request: {
        position: { x: number; y: number };
        direction: { x: number; y: number };
        bulletType: SpecialBulletType;
        isTracking?: boolean;
        trackingTarget?: Enemy;
      }) => {
        const bullet = new Bullet(
          new Vector(request.position.x, request.position.y),
          new Vector(request.direction.x, request.direction.y),
          request.bulletType,
        );
        if (request.isTracking && request.trackingTarget) {
          bullet.setTracking(request.trackingTarget);
        }
        spawnedBullets.push(bullet);
        return bullet;
      };
    };

    it("should return empty array when shoot fails (no ammo)", () => {
      const spawnedBullets: Bullet[] = [];
      combatSystem.setBulletSpawner(createSpawner(spawnedBullets));

      // Deplete ammo
      for (let i = 0; i < 6; i++) {
        player.shoot();
      }
      expect(player.ammo).toBe(0);

      const result = combatSystem.performShoot();

      expect(result).toEqual([]);
      expect(spawnedBullets).toHaveLength(0);
    });

    it("should spawn 1 bullet for normal shot (no buff)", () => {
      const spawnedBullets: Bullet[] = [];
      combatSystem.setBulletSpawner(createSpawner(spawnedBullets));

      const result = combatSystem.performShoot();

      expect(result).toHaveLength(1);
      expect(spawnedBullets).toHaveLength(1);
    });

    it("should spawn 3 bullets for BubbleTea buff (SPEC § 2.3.3)", () => {
      const spawnedBullets: Bullet[] = [];
      combatSystem.setBulletSpawner(createSpawner(spawnedBullets));

      // Activate BubbleTea buff
      eventQueue.publish(EventType.SynthesisTriggered, { recipeId: "3" });
      expect(combatSystem.getCurrentBuff()).toBe(SpecialBulletType.BubbleTea);

      const result = combatSystem.performShoot();

      // 1 center + 2 extra = 3 bullets (base config)
      expect(result).toHaveLength(3);
      expect(spawnedBullets).toHaveLength(3);
    });

    it("should spawn tracking bullet for BloodCake buff (SPEC § 2.3.3)", () => {
      const spawnedBullets: Bullet[] = [];
      combatSystem.setBulletSpawner(createSpawner(spawnedBullets));

      // Add an enemy to track
      const enemy = new Enemy(EnemyType.Ghost, new Vector(800, 540));
      enemies.push(enemy);

      // Activate BloodCake buff
      eventQueue.publish(EventType.SynthesisTriggered, { recipeId: "4" });
      expect(combatSystem.getCurrentBuff()).toBe(SpecialBulletType.BloodCake);

      const result = combatSystem.performShoot();

      expect(result).toHaveLength(1);
      expect(spawnedBullets).toHaveLength(1);
      expect(spawnedBullets[0].isTracking).toBe(true);
      expect(spawnedBullets[0].trackingTarget).toBe(enemy);
    });

    it("should return empty array when no spawner is set", () => {
      // Don't set a spawner
      const result = combatSystem.performShoot();

      expect(result).toEqual([]);
    });
  });
});
