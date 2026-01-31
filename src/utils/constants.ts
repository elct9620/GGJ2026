export const CANVAS_CONFIG = {
  width: 1920,
  height: 1080,
  backgroundColor: 0x1a1a1a,
  resolution: window.devicePixelRatio || 1,
  autoDensity: true,
  antialias: true,
} as const;

export const LAYERS = {
  BACKGROUND: 0,
  GAME: 1,
  UI: 2,
} as const;
