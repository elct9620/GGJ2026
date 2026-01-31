import { Container } from "pixi.js";
import { Player } from "./entities/player";
import { Enemy, EnemyType, FoodType } from "./entities/enemy";
import { Bullet } from "./entities/bullet";
import { Food } from "./entities/food";
import { InputSystem } from "./systems/input";
import { HUDSystem } from "./systems/hud";
import { BoothSystem } from "./systems/booth";
import { Vector } from "./values/vector";
import { GameStats } from "./core/game-state";

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
  private inputSystem: InputSystem;
  private hudSystem: HUDSystem;
  private boothSystem: BoothSystem;

  // Containers for rendering
  private playerContainer: Container;
  private enemiesContainer: Container;
  private bulletsContainer: Container;
  private foodsContainer: Container;
  private boothContainer: Container;
  private uiLayer: Container;

  // Game state
  private currentWave: number = 1;
  private synthesisSlot: FoodType[] = [];
  private shootCooldown: number = 0;
  private readonly shootCooldownTime: number = 0.2; // 200ms between shots
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

    // Initialize systems
    this.inputSystem = new InputSystem();
    this.hudSystem = new HUDSystem();
    this.boothSystem = new BoothSystem();

    // Initialize player at center of playable area
    this.player = new Player(new Vector(960, 540)); // Center of 1920×1080
    this.playerContainer.addChild(this.player.sprite);

    // Setup booth visualization
    this.boothContainer.addChild(this.boothSystem.getContainer());

    // Setup HUD
    this.uiLayer.addChild(this.hudSystem.getTopHUD());
    this.uiLayer.addChild(this.hudSystem.getBottomHUD());

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

    this.hudSystem.updateWave(waveNumber);
    this.hudSystem.updateEnemyCount(this.enemies.length);
  }

  /**
   * Main update loop
   */
  public update(deltaTime: number): void {
    this.handleInput(deltaTime);
    this.updatePlayer(deltaTime);
    this.updateEnemies(deltaTime);
    this.updateBullets(deltaTime);
    this.checkCollisions();
    this.updateHUD();
    this.checkWaveCompletion();
  }

  private handleInput(deltaTime: number): void {
    // Handle movement
    const moveDirection = this.inputSystem.getMovementDirection();
    if (moveDirection.magnitude() > 0) {
      this.player.move(moveDirection, deltaTime);
    }

    // Handle shooting
    this.shootCooldown = Math.max(0, this.shootCooldown - deltaTime);

    if (this.inputSystem.isShootPressed() && this.shootCooldown <= 0) {
      if (this.player.shoot()) {
        this.spawnBullet();
        this.shootCooldown = this.shootCooldownTime;
      }
    }

    // Handle booth interactions
    const boothKey = this.inputSystem.getBoothKeyPressed();
    if (boothKey !== null && this.synthesisSlot.length < 3) {
      const food = this.boothSystem.retrieveFood(boothKey);
      if (food !== null) {
        this.synthesisSlot.push(food);

        // Auto-synthesis when slot is full (SPEC § 2.3.3)
        if (this.synthesisSlot.length === 3) {
          this.performSynthesis();
        }
      }
    }
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

  private checkCollisions(): void {
    // Check bullet-enemy collisions
    for (const bullet of this.bullets) {
      if (!bullet.active) continue;

      for (const enemy of this.enemies) {
        if (!enemy.active) continue;

        // Simple distance-based collision
        const distance = bullet.position.distance(enemy.position);
        if (distance < 20) {
          // Hit!
          const died = enemy.takeDamage(bullet.damage);

          if (died) {
            // Enemy died, drop food
            const foodType = enemy.dropFood();
            this.spawnFood(foodType, enemy.position);

            // Track statistics (Spec: § 2.8.2)
            this.stats.enemiesDefeated++;
          }

          // Bullet is consumed (not piercing in prototype)
          bullet.active = false;
          break;
        }
      }
    }

    // Check food collection (auto-collect when dropped)
    for (let i = this.foods.length - 1; i >= 0; i--) {
      const food = this.foods[i];

      if (!food.active) {
        this.foodsContainer.removeChild(food.sprite);
        this.foods.splice(i, 1);
        continue;
      }

      // Auto-store food in booth (SPEC § 2.3.1)
      this.boothSystem.storeFood(food.type);
      food.active = false;
      this.foodsContainer.removeChild(food.sprite);
      this.foods.splice(i, 1);
    }
  }

  private spawnFood(type: FoodType, position: Vector): void {
    const food = new Food(type, position);
    this.foods.push(food);
    this.foodsContainer.addChild(food.sprite);
  }

  private performSynthesis(): void {
    // In prototype, just clear the synthesis slot
    // Full synthesis system will be implemented later
    console.log("Synthesis performed:", this.synthesisSlot);
    this.synthesisSlot = [];
  }

  private updateHUD(): void {
    this.hudSystem.updateEnemyCount(this.enemies.length);
    this.hudSystem.updateHealthDisplay(this.player.health);
    this.hudSystem.updateAmmo(this.player.ammo, this.player.maxAmmo);
    this.hudSystem.updateSynthesis(this.synthesisSlot.length);
    this.hudSystem.updateReload(
      this.player.isReloading,
      this.player.reloadTimer,
    );
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

      // Wait a moment before spawning next wave
      // TODO: Replace with upgrade system (SPEC § 2.3.4)
      setTimeout(() => {
        this.spawnWave(this.currentWave + 1);
        this.isWaveTransitioning = false;
      }, 2000);
    }

    // Check game over (Spec: § 2.8.2)
    if (this.player.health <= 0 && this.onGameOver) {
      this.onGameOver(this.stats);
    }
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
    this.boothSystem.reset();

    // Reset game state
    this.currentWave = 1;
    this.synthesisSlot = [];
    this.shootCooldown = 0;
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
