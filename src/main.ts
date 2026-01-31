import { createApplication } from "./core/application";
import { createLayers, attachLayers } from "./core/layers";

async function main() {
  const appContainer = document.getElementById("app");

  if (!appContainer) {
    throw new Error("App container not found");
  }

  const canvas = document.createElement("canvas");
  appContainer.appendChild(canvas);

  const app = await createApplication(canvas);
  const layers = createLayers();

  attachLayers(app.stage, layers);

  console.log("Pixi.js initialized successfully");
  console.log(`Canvas: ${app.canvas.width}x${app.canvas.height}`);
  console.log(`Layers: ${app.stage.children.length}`);
}

main().catch((error) => {
  console.error("Failed to initialize game:", error);
});
