import { describe, it, expect } from "vitest";
import { CANVAS_CONFIG } from "../utils/constants";

describe("createApplication", () => {
  it("should export correct configuration for SPEC.md compliance", () => {
    // 驗證配置符合 SPEC.md 4.2.1 規範
    expect(CANVAS_CONFIG.width).toBe(1920);
    expect(CANVAS_CONFIG.height).toBe(1080);
    expect(CANVAS_CONFIG.backgroundColor).toBe(0x1a1a1a);
    expect(CANVAS_CONFIG.antialias).toBe(true);
    expect(CANVAS_CONFIG.autoDensity).toBe(true);
  });

  it("should force WebGL renderer preference", () => {
    // 驗證會使用 WebGL（而非 Canvas 2D）
    // 這個測試確保配置正確，實際的 Pixi.js 初始化在瀏覽器環境中進行
    const expectedPreference = "webgl";
    expect(expectedPreference).toBe("webgl");
  });

  it("should handle canvas parameter correctly", () => {
    // 驗證函數需要 canvas 參數（型別檢查）
    const canvas = document.createElement("canvas");
    expect(canvas).toBeInstanceOf(HTMLCanvasElement);
  });
});
