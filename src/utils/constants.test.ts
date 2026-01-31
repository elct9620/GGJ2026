import { describe, it, expect } from "vitest";
import { CANVAS_CONFIG, LAYERS, LAYOUT, getEntityBounds } from "./constants";

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

describe("getEntityBounds", () => {
  it("should calculate correct bounds for player size (256)", () => {
    const bounds = getEntityBounds(LAYOUT.PLAYER_SIZE);
    const halfSize = LAYOUT.PLAYER_SIZE / 2; // 128

    expect(bounds.minX).toBe(LAYOUT.BASELINE_X + halfSize); // 340 + 128 = 468
    expect(bounds.maxX).toBe(1920 - halfSize); // 1920 - 128 = 1792
    expect(bounds.minY).toBe(LAYOUT.GAME_AREA_Y + halfSize); // 86 + 128 = 214
    expect(bounds.maxY).toBe(
      LAYOUT.GAME_AREA_Y + LAYOUT.GAME_AREA_HEIGHT - halfSize,
    ); // 86 + 868 - 128 = 826
  });

  it("should calculate correct bounds for enemy size (256)", () => {
    const bounds = getEntityBounds(LAYOUT.ENEMY_SIZE);

    // Same as player since both are 256px
    expect(bounds.minX).toBe(468);
    expect(bounds.maxX).toBe(1792);
    expect(bounds.minY).toBe(214);
    expect(bounds.maxY).toBe(826);
  });

  it("should scale bounds correctly for different entity sizes", () => {
    const smallBounds = getEntityBounds(64); // 32 half size
    const largeBounds = getEntityBounds(512); // 256 half size

    // Smaller entity has more movement room
    expect(smallBounds.maxX - smallBounds.minX).toBeGreaterThan(
      largeBounds.maxX - largeBounds.minX,
    );
    expect(smallBounds.maxY - smallBounds.minY).toBeGreaterThan(
      largeBounds.maxY - largeBounds.minY,
    );
  });
});
