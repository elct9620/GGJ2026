import { createApplication } from "./core/application";
import { createLayers, attachLayers } from "./core/layers";
import {
  createGameContainers,
  attachGameContainers,
} from "./core/game-containers";
import { GameLoop } from "./core/game-loop";

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

  // 建立遊戲容器子結構
  const gameContainers = createGameContainers();
  attachGameContainers(layers.game, gameContainers);

  // 初始化遊戲主循環
  const gameLoop = new GameLoop(app.ticker);

  gameLoop.setUpdateCallback((_deltaTime, _totalTime) => {
    // 預留系統更新邏輯接口
    // 未來將在此處調用各系統的 update 方法
    // console.log(`Update: deltaTime=${_deltaTime.toFixed(3)}s, totalTime=${_totalTime.toFixed(2)}s`);
  });

  // 啟動遊戲循環
  gameLoop.start();

  console.log("Game initialized successfully");
  console.log(`Canvas: ${app.canvas.width}x${app.canvas.height}`);
  console.log(`Layers: ${app.stage.children.length}`);
  console.log(
    `Game Containers: ${layers.game.children.length} (Booth, FoodDrops, Player, Enemies, Bullets)`
  );
  console.log("Game loop started - Target: 60 FPS");
}

main().catch((error) => {
  console.error("Failed to initialize game:", error);
});
