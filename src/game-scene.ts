import { Container } from "pixi.js";
import { Player } from "./entities/player";
import { Enemy, EnemyType, FoodType } from "./entities/enemy";
import { Bullet } from "./entities/bullet";
import { Food } from "./entities/food";
import { InputSystem } from "./systems/input";
import { HUDSystem } from "./systems/hud";
import { BoothSystem } from "./systems/booth";
import { CombatSystem } from "./systems/combat";
import { SynthesisSystem } from "./systems/synthesis";
import { KillCounterSystem } from "./systems/kill-counter";
import { EventQueue, EventType } from "./systems/event-queue";
import { SystemManager } from "./core/systems/system-manager";
import { Vector } from "./values/vector";
import type { GameStats } from "./core/game-state";

/**
 * Main game scene managing all game entities and systems
 * This is a prototype implementation using basic geometric shapes
 */
export class GameScene {
  // Entities
  private player: Player;
  private enemies: Enemy[] = [];
  private bullets: Bullet[] = [];
  private foods: Food[] = [];

  // Systems
  private systemManager: SystemManager;

  // Containers for rendering
  private playerContainer: Container;
  private enemiesContainer: Container;
  private bulletsContainer: Container;
  private foodsContainer: Container;
  private boothContainer: Container;
  private uiLayer: Container;

  // Game state
  private currentWave: number = 1;
  private isWaveTransitioning: boolean = false; // Prevent multiple wave spawns

  // Game statistics (Spec: § 2.8.2)
  private stats: GameStats = {
    wavesSurvived: 0,
    enemiesDefeated: 0,
    specialBulletsUsed: 0,
  };

  // Game over callback
  private onGameOver: ((stats: GameStats) => void) | null = null;

  constructor(
    playerContainer: Container,
    enemiesContainer: Container,
    bulletsContainer: Container,
    foodsContainer: Container,
    boothContainer: Container,
    uiLayer: Container,
    onGameOver?: (stats: GameStats) => void,
  ) {
    this.playerContainer = playerContainer;
    this.enemiesContainer = enemiesContainer;
    this.bulletsContainer = bulletsContainer;
    this.foodsContainer = foodsContainer;
    this.boothContainer = boothContainer;
    this.uiLayer = uiLayer;
    this.onGameOver = onGameOver || null;

    // Initialize SystemManager and register all systems
    this.systemManager = new SystemManager();
    const eventQueue = new EventQueue();
    const inputSystem = new InputSystem();
    const boothSystem = new BoothSystem();
    const combatSystem = new CombatSystem();
    const synthesisSystem = new SynthesisSystem();
    const killCounterSystem = new KillCounterSystem();

    this.systemManager.register(eventQueue);
    this.systemManager.register(inputSystem);
    this.systemManager.register(combatSystem);
    this.systemManager.register(synthesisSystem);
    this.systemManager.register(killCounterSystem);
    this.systemManager.register(new HUDSystem());
    this.systemManager.register(boothSystem);
    this.systemManager.initialize();

    // Subscribe to WaveComplete event
    eventQueue.subscribe(
      EventType.WaveComplete,
      this.onWaveComplete.bind(this),
    );

    // Subscribe to EnemyDeath event for food drops
    eventQueue.subscribe(EventType.EnemyDeath, this.onEnemyDeath.bind(this));

    // Initialize player at center of playable area
    this.player = new Player(new Vector(960, 540)); // Center of 1920×1080
    this.playerContainer.addChild(this.player.sprite);

    // Connect Combat System with game entities
    combatSystem.setPlayer(this.player);
    combatSystem.setBullets(this.bullets);
    combatSystem.setEnemies(this.enemies);
    combatSystem.setEventQueue(eventQueue);

    // Connect Synthesis System with dependencies (SPEC § 2.3.3)
    synthesisSystem.setInputSystem(inputSystem);
    synthesisSystem.setBoothSystem(boothSystem);
    synthesisSystem.setEventQueue(eventQueue);

    // Connect Kill Counter System (SPEC § 2.3.8)
    killCounterSystem.setEventQueue(eventQueue);

    // Setup booth visualization
    this.boothContainer.addChild(boothSystem.getContainer());

    // Setup HUD
    const hudSystem = this.systemManager.get<HUDSystem>("HUDSystem");
    this.uiLayer.addChild(hudSystem.getTopHUD());
    this.uiLayer.addChild(hudSystem.getBottomHUD());

    // Spawn initial enemies for wave 1
    this.spawnWave(1);
  }

  /**
   * Spawn enemies for a wave
   * Spec: § 2.3.5 Wave System
   */
  private spawnWave(waveNumber: number): void {
    this.currentWave = waveNumber;

    // Enemy count = wave number × 2 (SPEC § 2.3.5)
    const enemyCount = waveNumber * 2;

    for (let i = 0; i < enemyCount; i++) {
      // Spawn enemies from right side, with vertical spacing
      const yPosition = 100 + (i * 900) / enemyCount;
      const xPosition = 1920 + 50 + i * 100; // Stagger spawn positions

      const enemy = new Enemy(
        EnemyType.Ghost,
        new Vector(xPosition, yPosition),
      );
      this.enemies.push(enemy);
      this.enemiesContainer.addChild(enemy.sprite);
    }

    // Spawn boss every 5 waves (SPEC § 2.3.5)
    if (waveNumber % 5 === 0) {
      const boss = new Enemy(EnemyType.Boss, new Vector(2000, 540));
      this.enemies.push(boss);
      this.enemiesContainer.addChild(boss.sprite);
    }

    const hudSystem = this.systemManager.get<HUDSystem>("HUDSystem");
    hudSystem.updateWave(waveNumber);
    hudSystem.updateEnemyCount(this.enemies.length);
  }

  /**
   * Main update loop
   */
  public update(deltaTime: number): void {
    // Update all systems (EventQueue will process first due to priority)
    // Combat System handles: shooting, collisions, buff management
    this.systemManager.update(deltaTime);

    this.handleInput(deltaTime);
    this.updatePlayer(deltaTime);
    this.updateEnemies(deltaTime);
    this.updateBullets(deltaTime);
    this.updateHUD();
    this.checkWaveCompletion();
    this.checkFoodCollection(); // Auto-collect dropped food
  }

  private handleInput(deltaTime: number): void {
    const inputSystem = this.systemManager.get<InputSystem>("InputSystem");
    const combatSystem = this.systemManager.get<CombatSystem>("CombatSystem");

    // Handle movement
    const moveDirection = inputSystem.getMovementDirection();
    if (moveDirection.magnitude() > 0) {
      this.player.move(moveDirection, deltaTime);
    }

    // Handle shooting (delegated to Combat System)
    if (inputSystem.isShootPressed()) {
      if (combatSystem.shoot()) {
        this.spawnBullet();
      }
    }

    // Synthesis is now handled by SynthesisSystem (SPEC § 2.3.3)
    // No manual booth interactions needed
  }

  private spawnBullet(): void {
    // Spawn bullet from player position, moving right
    const bullet = new Bullet(this.player.position, new Vector(1, 0));
    this.bullets.push(bullet);
    this.bulletsContainer.addChild(bullet.sprite);
  }

  private updatePlayer(deltaTime: number): void {
    this.player.update(deltaTime);
  }

  private updateEnemies(deltaTime: number): void {
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const enemy = this.enemies[i];

      if (!enemy.active) {
        // Remove inactive enemies
        this.enemiesContainer.removeChild(enemy.sprite);
        this.enemies.splice(i, 1);
        continue;
      }

      enemy.update(deltaTime);

      // Check if enemy reached baseline (SPEC § 2.8.2)
      if (enemy.hasReachedBaseline()) {
        this.player.takeDamage(1);
        enemy.active = false;
        this.enemiesContainer.removeChild(enemy.sprite);
        this.enemies.splice(i, 1);
      }
    }
  }

  private updateBullets(deltaTime: number): void {
    for (let i = this.bullets.length - 1; i >= 0; i--) {
      const bullet = this.bullets[i];

      if (!bullet.active) {
        this.bulletsContainer.removeChild(bullet.sprite);
        this.bullets.splice(i, 1);
        continue;
      }

      bullet.update(deltaTime);
    }
  }

  /**
   * Check and collect dropped food (auto-collect)
   * SPEC § 2.3.1: Food is automatically stored in booth
   */
  private checkFoodCollection(): void {
    for (let i = this.foods.length - 1; i >= 0; i--) {
      const food = this.foods[i];

      if (!food.active) {
        this.foodsContainer.removeChild(food.sprite);
        this.foods.splice(i, 1);
        continue;
      }

      // Auto-store food in booth (SPEC § 2.3.1)
      const boothSystem = this.systemManager.get<BoothSystem>("BoothSystem");
      boothSystem.storeFood(food.type);
      food.active = false;
      this.foodsContainer.removeChild(food.sprite);
      this.foods.splice(i, 1);
    }
  }

  /**
   * Handle EnemyDeath event (SPEC § 2.3.6)
   * Drop food when enemy dies
   */
  private onEnemyDeath(data: {
    enemyId: string;
    position: { x: number; y: number };
  }): void {
    // Find the enemy that died
    const enemy = this.enemies.find((e) => e.id === data.enemyId);
    if (!enemy) return;

    // Drop food at enemy position
    const foodType = enemy.dropFood();
    this.spawnFood(foodType, new Vector(data.position.x, data.position.y));

    // Track statistics (Spec: § 2.8.2)
    this.stats.enemiesDefeated++;
  }

  private spawnFood(type: FoodType, position: Vector): void {
    const food = new Food(type, position);
    this.foods.push(food);
    this.foodsContainer.addChild(food.sprite);
  }

  private updateHUD(): void {
    const hudSystem = this.systemManager.get<HUDSystem>("HUDSystem");
    hudSystem.updateEnemyCount(this.enemies.length);
    hudSystem.updateHealthDisplay(this.player.health);
    hudSystem.updateAmmo(this.player.ammo, this.player.maxAmmo);
    // Synthesis slot removed - Buff display handled by Combat/HUD systems
    hudSystem.updateReload(this.player.isReloading, this.player.reloadTimer);
  }

  private checkWaveCompletion(): void {
    // Check if all enemies are defeated
    // SPEC § 2.3.5: Wave progression should happen once per wave completion
    if (
      this.enemies.length === 0 &&
      this.player.health > 0 &&
      !this.isWaveTransitioning
    ) {
      // Set flag to prevent multiple wave spawns
      this.isWaveTransitioning = true;

      // Update statistics - track waves survived (Spec: § 2.8.2)
      this.stats.wavesSurvived = this.currentWave;

      // Publish WaveComplete event with delay (SPEC § 2.3.6)
      // TODO: Replace with upgrade system (SPEC § 2.3.4)
      const eventQueue = this.systemManager.get<EventQueue>("EventQueue");
      eventQueue.publish(
        EventType.WaveComplete,
        { waveNumber: this.currentWave },
        2000,
      );
    }

    // Check game over (Spec: § 2.8.2)
    if (this.player.health <= 0 && this.onGameOver) {
      this.onGameOver(this.stats);
    }
  }

  /**
   * Handle wave completion event
   * SPEC § 2.3.6: Event handler for WaveComplete
   */
  private onWaveComplete(data: { waveNumber: number }): void {
    this.spawnWave(data.waveNumber + 1);
    this.isWaveTransitioning = false;
  }

  /**
   * Reset game scene for restart
   * Clears all entities and resets to wave 1
   */
  public reset(): void {
    // Clear all entities
    this.enemies.forEach((enemy) => {
      this.enemiesContainer.removeChild(enemy.sprite);
    });
    this.bullets.forEach((bullet) => {
      this.bulletsContainer.removeChild(bullet.sprite);
    });
    this.foods.forEach((food) => {
      this.foodsContainer.removeChild(food.sprite);
    });

    this.enemies = [];
    this.bullets = [];
    this.foods = [];

    // Reset player
    this.playerContainer.removeChild(this.player.sprite);
    this.player = new Player(new Vector(960, 540));
    this.playerContainer.addChild(this.player.sprite);

    // Reset booth system
    const boothSystem = this.systemManager.get<BoothSystem>("BoothSystem");
    boothSystem.reset();

    // Reset game state
    this.currentWave = 1;
    this.isWaveTransitioning = false;

    // Reset statistics
    this.stats = {
      wavesSurvived: 0,
      enemiesDefeated: 0,
      specialBulletsUsed: 0,
    };

    // Spawn initial wave
    this.spawnWave(1);
  }
}
