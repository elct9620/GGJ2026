import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { StartScreen } from "./start-screen";

describe("StartScreen", () => {
  let startScreen: StartScreen;
  let onStartMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    onStartMock = vi.fn();
    startScreen = new StartScreen(onStartMock);
  });

  afterEach(() => {
    startScreen.destroy();
  });

  describe("initialization", () => {
    it("should create container", () => {
      const container = startScreen.getContainer();
      expect(container).toBeDefined();
    });

    it("should be initially hidden", () => {
      const container = startScreen.getContainer();
      expect(container.visible).toBe(false);
    });
  });

  describe("show/hide", () => {
    it("should show container when show() is called", () => {
      startScreen.show();
      const container = startScreen.getContainer();
      expect(container.visible).toBe(true);
    });

    it("should hide container when hide() is called", () => {
      startScreen.show();
      startScreen.hide();
      const container = startScreen.getContainer();
      expect(container.visible).toBe(false);
    });
  });

  describe("keyboard interaction", () => {
    it("should call onStart when Space is pressed while shown", () => {
      startScreen.show();

      const event = new KeyboardEvent("keydown", { code: "Space" });
      window.dispatchEvent(event);

      expect(onStartMock).toHaveBeenCalledTimes(1);
    });

    it("should not call onStart when other keys are pressed", () => {
      startScreen.show();

      const event = new KeyboardEvent("keydown", { code: "KeyA" });
      window.dispatchEvent(event);

      expect(onStartMock).not.toHaveBeenCalled();
    });

    it("should not call onStart when Space is pressed while hidden", () => {
      startScreen.show();
      startScreen.hide();

      const event = new KeyboardEvent("keydown", { code: "Space" });
      window.dispatchEvent(event);

      expect(onStartMock).not.toHaveBeenCalled();
    });
  });

  describe("cleanup", () => {
    it("should remove event listeners on destroy", () => {
      startScreen.show();
      startScreen.destroy();

      const event = new KeyboardEvent("keydown", { code: "Space" });
      window.dispatchEvent(event);

      expect(onStartMock).not.toHaveBeenCalled();
    });
  });
});
