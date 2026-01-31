import { describe, it, expect } from "vitest";
import { Container } from "pixi.js";
import { createLayers, attachLayers } from "./layers";

describe("createLayers", () => {
  it("should create 3 containers with correct z-indexes", () => {
    const layers = createLayers();

    expect(layers.background.zIndex).toBe(0);
    expect(layers.game.zIndex).toBe(1);
    expect(layers.ui.zIndex).toBe(2);
  });

  it("should set descriptive labels", () => {
    const layers = createLayers();

    expect(layers.background.label).toBe("Background Layer");
    expect(layers.game.label).toBe("Game Layer");
    expect(layers.ui.label).toBe("UI Layer");
  });
});

describe("attachLayers", () => {
  it("should add all layers to stage", () => {
    const stage = new Container();
    const layers = createLayers();

    attachLayers(stage, layers);

    expect(stage.children).toHaveLength(3);
    expect(stage.children).toContain(layers.background);
    expect(stage.children).toContain(layers.game);
    expect(stage.children).toContain(layers.ui);
  });

  it("should enable sortableChildren", () => {
    const stage = new Container();
    const layers = createLayers();

    attachLayers(stage, layers);

    expect(stage.sortableChildren).toBe(true);
  });
});
