export const CANVAS_CONFIG = {
  width: 1920,
  height: 1080,
  backgroundColor: 0x1a1a1a,
  resolution: window.devicePixelRatio || 1,
  autoDensity: true,
  antialias: true,
} as const;

export const CANVAS_WIDTH = 1920;
export const CANVAS_HEIGHT = 1080;

export const LAYERS = {
  BACKGROUND: 0,
  GAME: 1,
  UI: 2,
} as const;

/**
 * Layout constants based on ui_rough_pixelSpec.png
 * SPEC § 2.7.2 Main Scene Layout
 */
export const LAYOUT = {
  // HUD
  TOP_HUD_HEIGHT: 86,
  BOTTOM_HUD_HEIGHT: 126,

  // Booth area
  BOOTH_AREA_WIDTH: 340,
  BOOTH_AREA_HEIGHT: 868,

  // Game area
  GAME_AREA_Y: 86,
  GAME_AREA_HEIGHT: 868,
  BASELINE_X: 340,

  // Entity sizes
  PLAYER_SIZE: 256,
  ENEMY_SIZE: 256,
  BOOTH_WIDTH: 128,
  BOOTH_HEIGHT: 256,
} as const;
