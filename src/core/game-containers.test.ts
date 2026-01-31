import { describe, test, expect } from "vitest";
import { Container } from "pixi.js";
import { createGameContainers, attachGameContainers } from "./game-containers";

describe("GameContainers", () => {
  describe("createGameContainers", () => {
    test("creates all required containers", () => {
      const containers = createGameContainers();

      expect(containers.booth).toBeInstanceOf(Container);
      expect(containers.foodDrops).toBeInstanceOf(Container);
      expect(containers.player).toBeInstanceOf(Container);
      expect(containers.enemies).toBeInstanceOf(Container);
      expect(containers.bullets).toBeInstanceOf(Container);
    });

    test("assigns correct labels to containers", () => {
      const containers = createGameContainers();

      expect(containers.booth.label).toBe("Booth Container");
      expect(containers.foodDrops.label).toBe("Food Drops Container");
      expect(containers.player.label).toBe("Player Container");
      expect(containers.enemies.label).toBe("Enemies Container");
      expect(containers.bullets.label).toBe("Bullets Container");
    });

    test("creates new instances each time", () => {
      const containers1 = createGameContainers();
      const containers2 = createGameContainers();

      expect(containers1.booth).not.toBe(containers2.booth);
      expect(containers1.foodDrops).not.toBe(containers2.foodDrops);
      expect(containers1.player).not.toBe(containers2.player);
      expect(containers1.enemies).not.toBe(containers2.enemies);
      expect(containers1.bullets).not.toBe(containers2.bullets);
    });
  });

  describe("attachGameContainers", () => {
    test("attaches all containers to game layer", () => {
      const gameLayer = new Container();
      const containers = createGameContainers();

      attachGameContainers(gameLayer, containers);

      expect(gameLayer.children).toHaveLength(5);
      expect(gameLayer.children).toContain(containers.booth);
      expect(gameLayer.children).toContain(containers.foodDrops);
      expect(gameLayer.children).toContain(containers.player);
      expect(gameLayer.children).toContain(containers.enemies);
      expect(gameLayer.children).toContain(containers.bullets);
    });

    test("attaches containers in correct order", () => {
      const gameLayer = new Container();
      const containers = createGameContainers();

      attachGameContainers(gameLayer, containers);

      // 按照 SPEC.md § 4.2.2 的順序
      expect(gameLayer.children[0]).toBe(containers.booth);
      expect(gameLayer.children[1]).toBe(containers.foodDrops);
      expect(gameLayer.children[2]).toBe(containers.player);
      expect(gameLayer.children[3]).toBe(containers.enemies);
      expect(gameLayer.children[4]).toBe(containers.bullets);
    });
  });
});
