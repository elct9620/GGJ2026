import { Application } from "pixi.js";
import { CANVAS_CONFIG } from "../utils/constants";

export async function createApplication(
  canvas: HTMLCanvasElement,
): Promise<Application> {
  const app = new Application();
  await app.init({
    canvas,
    ...CANVAS_CONFIG,
    preference: "webgl", // 強制使用 WebGL renderer
  });
  return app;
}
