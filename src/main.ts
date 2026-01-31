import { createApplication } from "./core/application";
import { createLayers, attachLayers } from "./core/layers";
import {
  createGameContainers,
  attachGameContainers,
} from "./core/game-containers";
import { GameLoop } from "./core/game-loop";
import { GameScene } from "./game-scene";
import { createBackground } from "./core/background";

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

  // 初始化遊戲場景 (遊戲原型)
  const gameScene = new GameScene(
    gameContainers.player,
    gameContainers.enemies,
    gameContainers.bullets,
    gameContainers.foodDrops,
    gameContainers.booth,
    layers.ui,
  );

  // 初始化遊戲主循環
  const gameLoop = new GameLoop(app.ticker);

  gameLoop.setUpdateCallback((deltaTime, _totalTime) => {
    // 更新遊戲場景
    gameScene.update(deltaTime);
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
  console.log("Controls:");
  console.log("  WASD - Move player");
  console.log("  Space - Shoot");
  console.log("  1/2/3 - Retrieve food from booths");
}

main().catch((error) => {
  console.error("Failed to initialize game:", error);
});
