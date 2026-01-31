import { createApplication } from "./core/application";
import { createLayers, attachLayers } from "./core/layers";
import {
  createGameContainers,
  attachGameContainers,
} from "./core/game-containers";
import { GameLoop } from "./core/game-loop";
import { GameScene } from "./game-scene";
import { createBackground } from "./core/background";
import { GameState, GameStats } from "./core/game-state";
import { StartScreen } from "./screens/start-screen";
import { GameOverScreen } from "./screens/game-over-screen";

async function main() {
  const appContainer = document.getElementById("app");

  if (!appContainer) {
    throw new Error("App container not found");
  }

  const canvas = document.createElement("canvas");
  appContainer.appendChild(canvas);

  // 初始化 Pixi.js Application
  const app = await createApplication(canvas);

  // 建立三層場景結構
  const layers = createLayers();
  attachLayers(app.stage, layers);

  // 添加背景
  const background = createBackground();
  layers.background.addChild(background);

  // 建立遊戲容器子結構
  const gameContainers = createGameContainers();
  attachGameContainers(layers.game, gameContainers);

  // Game state management (Spec: § 2.4.2, § 2.8.2)
  let currentState = GameState.START;
  let gameScene: GameScene | null = null;

  // Create screens
  const startScreen = new StartScreen(() => {
    // Start game callback
    currentState = GameState.PLAYING;
    startScreen.hide();

    // Initialize game scene
    if (!gameScene) {
      gameScene = new GameScene(
        gameContainers.player,
        gameContainers.enemies,
        gameContainers.bullets,
        gameContainers.foodDrops,
        gameContainers.booth,
        layers.ui,
        (stats: GameStats) => {
          // Game over callback
          currentState = GameState.GAME_OVER;
          gameOverScreen.show(stats);
        },
      );
    } else {
      gameScene.reset();
    }
  });

  const gameOverScreen = new GameOverScreen(() => {
    // Restart game callback
    currentState = GameState.START;
    gameOverScreen.hide();
    startScreen.show();
  });

  // Add screens to UI layer
  layers.ui.addChild(startScreen.getContainer());
  layers.ui.addChild(gameOverScreen.getContainer());

  // Show start screen initially (Spec: § 2.4.2)
  startScreen.show();
  gameOverScreen.hide();

  // 初始化遊戲主循環
  const gameLoop = new GameLoop(app.ticker);

  gameLoop.setUpdateCallback((deltaTime, _totalTime) => {
    // Only update game scene when in PLAYING state
    if (currentState === GameState.PLAYING && gameScene) {
      gameScene.update(deltaTime);
    }
  });

  // 啟動遊戲循環
  gameLoop.start();

  console.log("Game prototype initialized successfully");
  console.log(`Canvas: ${app.canvas.width}x${app.canvas.height}`);
  console.log(`Layers: ${app.stage.children.length}`);
  console.log(
    `Game Containers: ${layers.game.children.length} (Booth, FoodDrops, Player, Enemies, Bullets)`,
  );
  console.log("Game loop started - Target: 60 FPS");
  console.log("Game state: START - showing start screen");
  console.log("Controls:");
  console.log("  WASD - Move player");
  console.log("  Space - Shoot");
  console.log("  1/2/3 - Retrieve food from booths");
}

main().catch((error) => {
  console.error("Failed to initialize game:", error);
});
