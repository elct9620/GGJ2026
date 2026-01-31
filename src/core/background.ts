import { Sprite } from "pixi.js";
import { getTexture, AssetKeys } from "./assets";

/**
 * Create background sprite for the game
 * Spec: § 2.7.2 Main Scene Layout
 */
export function createBackground(): Sprite {
  const background = new Sprite(getTexture(AssetKeys.background));

  // Ensure background fills the entire canvas (1920×1080)
  background.width = 1920;
  background.height = 1080;
  background.position.set(0, 0);

  return background;
}
