import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { BaseScreen } from "./base-screen";

/**
 * Concrete implementation for testing BaseScreen
 */
class TestScreen extends BaseScreen {
  public keyPressHandler: ((event: KeyboardEvent) => void) | null = null;

  constructor() {
    super();
  }

  /**
   * Allow tests to set a custom key handler
   */
  public setKeyPressHandler(handler: (event: KeyboardEvent) => void): void {
    this.keyPressHandler = handler;
  }

  protected override handleKeyPress(event: KeyboardEvent): void {
    if (this.keyPressHandler) {
      this.keyPressHandler(event);
    }
  }
}

describe("BaseScreen", () => {
  let testScreen: TestScreen;

  beforeEach(() => {
    testScreen = new TestScreen();
  });

  afterEach(() => {
    testScreen.destroy();
  });

  describe("initialization", () => {
    it("should create container", () => {
      const container = testScreen.getContainer();
      expect(container).toBeDefined();
    });

    it("should be initially hidden", () => {
      const container = testScreen.getContainer();
      expect(container.visible).toBe(false);
    });
  });

  describe("show/hide", () => {
    it("should show container when show() is called", () => {
      testScreen.show();
      const container = testScreen.getContainer();
      expect(container.visible).toBe(true);
    });

    it("should hide container when hide() is called", () => {
      testScreen.show();
      testScreen.hide();
      const container = testScreen.getContainer();
      expect(container.visible).toBe(false);
    });
  });

  describe("keyboard listening", () => {
    it("should start listening when show() is called", () => {
      const mockHandler = vi.fn();
      testScreen.setKeyPressHandler(mockHandler);
      testScreen.show();

      const event = new KeyboardEvent("keydown", { code: "Space" });
      window.dispatchEvent(event);

      expect(mockHandler).toHaveBeenCalledTimes(1);
    });

    it("should stop listening when hide() is called", () => {
      const mockHandler = vi.fn();
      testScreen.setKeyPressHandler(mockHandler);
      testScreen.show();
      testScreen.hide();

      const event = new KeyboardEvent("keydown", { code: "Space" });
      window.dispatchEvent(event);

      expect(mockHandler).not.toHaveBeenCalled();
    });

    it("should not add duplicate listeners on multiple show() calls", () => {
      const mockHandler = vi.fn();
      testScreen.setKeyPressHandler(mockHandler);
      testScreen.show();
      testScreen.show();

      const event = new KeyboardEvent("keydown", { code: "Space" });
      window.dispatchEvent(event);

      expect(mockHandler).toHaveBeenCalledTimes(1);
    });
  });

  describe("cleanup", () => {
    it("should remove event listeners on destroy", () => {
      const mockHandler = vi.fn();
      testScreen.setKeyPressHandler(mockHandler);
      testScreen.show();
      testScreen.destroy();

      const event = new KeyboardEvent("keydown", { code: "Space" });
      window.dispatchEvent(event);

      expect(mockHandler).not.toHaveBeenCalled();
    });
  });
});
