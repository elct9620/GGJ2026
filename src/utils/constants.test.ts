import { describe, it, expect } from "vitest";
import { CANVAS_CONFIG, LAYERS } from "./constants";

describe("CANVAS_CONFIG", () => {
  it("should match SPEC.md 4.2.1 requirements", () => {
    expect(CANVAS_CONFIG.width).toBe(1920);
    expect(CANVAS_CONFIG.height).toBe(1080);
    expect(CANVAS_CONFIG.backgroundColor).toBe(0x1a1a1a);
    expect(CANVAS_CONFIG.antialias).toBe(true);
    expect(CANVAS_CONFIG.autoDensity).toBe(true);
  });
});

describe("LAYERS", () => {
  it("should have correct z-index values", () => {
    expect(LAYERS.BACKGROUND).toBe(0);
    expect(LAYERS.GAME).toBe(1);
    expect(LAYERS.UI).toBe(2);
  });
});
