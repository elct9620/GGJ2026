import { Container } from "pixi.js";

/**
 * GameContainers - 遊戲場景容器子結構
 *
 * 遵循 SPEC.md § 4.2.2 Scene Structure
 * - Game Layer 下的子容器結構
 * - 包含：Booth, FoodDrops, Player, Enemies, Bullets 容器
 */

export interface GameContainers {
  booth: Container;
  foodDrops: Container;
  player: Container;
  enemies: Container;
  bullets: Container;
}

/**
 * 建立遊戲場景容器子結構
 */
export function createGameContainers(): GameContainers {
  const booth = new Container();
  booth.label = "Booth Container";

  const foodDrops = new Container();
  foodDrops.label = "Food Drops Container";

  const player = new Container();
  player.label = "Player Container";

  const enemies = new Container();
  enemies.label = "Enemies Container";

  const bullets = new Container();
  bullets.label = "Bullets Container";

  return { booth, foodDrops, player, enemies, bullets };
}

/**
 * 將遊戲容器附加到 Game Layer
 */
export function attachGameContainers(
  gameLayer: Container,
  containers: GameContainers,
): void {
  // 按照 SPEC.md § 4.2.2 的順序添加
  gameLayer.addChild(containers.booth);
  gameLayer.addChild(containers.foodDrops);
  gameLayer.addChild(containers.player);
  gameLayer.addChild(containers.enemies);
  gameLayer.addChild(containers.bullets);
}
