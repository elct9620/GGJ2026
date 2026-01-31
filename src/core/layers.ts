import { Container } from "pixi.js";
import { LAYERS } from "../utils/constants";

export interface GameLayers {
  background: Container;
  game: Container;
  ui: Container;
}

export function createLayers(): GameLayers {
  const background = new Container();
  background.label = "Background Layer";
  background.zIndex = LAYERS.BACKGROUND;

  const game = new Container();
  game.label = "Game Layer";
  game.zIndex = LAYERS.GAME;

  const ui = new Container();
  ui.label = "UI Layer";
  ui.zIndex = LAYERS.UI;

  return { background, game, ui };
}

export function attachLayers(stage: Container, layers: GameLayers): void {
  stage.addChild(layers.background);
  stage.addChild(layers.game);
  stage.addChild(layers.ui);
  stage.sortableChildren = true; // 啟用 z-index 排序
}
