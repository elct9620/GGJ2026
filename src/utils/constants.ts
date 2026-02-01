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

  // Booth spacing (from ui_rough_pixelSpec.png)
  BOOTH_GAP: 23, // Vertical gap between booths, also horizontal gap from baseline
  BOOTH_TOP_MARGIN: 23, // Distance from game area top to first booth

  // Top HUD layout (from ui_rough_pixelSpec.png)
  TOP_HUD: {
    FONT_SIZE_LARGE: 50, // 剩餘敵人、分數
    FONT_SIZE_SMALL: 33, // 餓鬼人潮
    WAVE_AREA_HEIGHT: 56, // 餓鬼人潮區域高度 (512×56px)
  },

  // Bottom HUD layout (from ui_rough_pixelSpec.png)
  UPGRADE_SECTION: {
    LEFT_MARGIN: 40,
    ICON_SIZE: 88,
    ICON_GAP: 7,
  },
  SKILL_SECTION: {
    BASE_X: 550, // Start position of bulletClassBase
    LEFT_MARGIN: 68, // Gap from left edge of skill section
    BUTTON_GAP: 30, // Gap between skill buttons
    BUTTON_SIZE: 46, // keyBindTip size
    BACKGROUND_SIZE: 116, // btn_skillIcon size
    INDICATOR_SIZE: 20, // Cost indicator dot size
    KEY_TIP_ABOVE_OFFSET: 32, // Key tip positioned ABOVE skill icon by this amount
    NUMBER_LABEL_X_OFFSET: 8, // Number label horizontal offset
    NUMBER_LABEL_Y_OFFSET: 8, // Number label vertical offset
    NUMBER_LABEL_FONT_SIZE: 30,
    INDICATOR_BOTTOM_OFFSET: 8, // Indicator positioned from bottom of skill icon (inside)
    INDICATOR_GAP: 4, // Gap between cost indicators
    LABEL_FONT_SIZE: 22, // Smaller font for x10 label
  },
} as const;

/**
 * Calculate valid movement boundaries for an entity within the game area
 * Accounts for entity size (center-based positioning)
 * @param entitySize The size of the entity (width/height assumed equal)
 */
export function getEntityBounds(entitySize: number): {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
} {
  const halfSize = entitySize / 2;
  return {
    minX: LAYOUT.BASELINE_X + halfSize,
    maxX: CANVAS_WIDTH - halfSize,
    minY: LAYOUT.GAME_AREA_Y + halfSize,
    maxY: LAYOUT.GAME_AREA_Y + LAYOUT.GAME_AREA_HEIGHT - halfSize,
  };
}
