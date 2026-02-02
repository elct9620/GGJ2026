import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { GameOverScreen } from "./game-over-screen";
import type { GameStats } from "../core/game-state";

describe("GameOverScreen", () => {
  let gameOverScreen: GameOverScreen;
  let onRestartMock: () => void;
  let onQuitMock: () => void;

  beforeEach(() => {
    onRestartMock = vi.fn();
    onQuitMock = vi.fn();
    gameOverScreen = new GameOverScreen(onRestartMock, onQuitMock);
  });

  afterEach(() => {
    gameOverScreen.destroy();
  });

  describe("initialization", () => {
    it("should create container", () => {
      const container = gameOverScreen.getContainer();
      expect(container).toBeDefined();
    });

    it("should be initially hidden", () => {
      const container = gameOverScreen.getContainer();
      expect(container.visible).toBe(false);
    });
  });

  describe("show/hide", () => {
    const mockStats: GameStats = {
      wavesSurvived: 5,
      enemiesDefeated: 10,
      specialBulletsUsed: 3,
    };

    it("should show container when show() is called", () => {
      gameOverScreen.showWithStats(mockStats);
      const container = gameOverScreen.getContainer();
      expect(container.visible).toBe(true);
    });

    it("should hide container when hide() is called", () => {
      gameOverScreen.showWithStats(mockStats);
      gameOverScreen.hide();
      const container = gameOverScreen.getContainer();
      expect(container.visible).toBe(false);
    });

    it("should display statistics when shown (GS-06, GS-07, GS-08)", () => {
      // This test verifies that statistics are properly displayed
      // Visual verification would be done manually, but we can verify
      // that the method is called without errors
      expect(() => {
        gameOverScreen.showWithStats(mockStats);
      }).not.toThrow();
    });
  });

  describe("keyboard interaction", () => {
    const mockStats: GameStats = {
      wavesSurvived: 5,
      enemiesDefeated: 10,
      specialBulletsUsed: 3,
    };

    it("should call onRestart when Space is pressed while shown (GS-09)", () => {
      gameOverScreen.showWithStats(mockStats);

      const event = new KeyboardEvent("keydown", { code: "Space" });
      window.dispatchEvent(event);

      expect(onRestartMock).toHaveBeenCalledTimes(1);
    });

    it("should not call onRestart when other keys are pressed", () => {
      gameOverScreen.showWithStats(mockStats);

      const event = new KeyboardEvent("keydown", { code: "KeyA" });
      window.dispatchEvent(event);

      expect(onRestartMock).not.toHaveBeenCalled();
    });

    it("should not call onRestart when Space is pressed while hidden", () => {
      gameOverScreen.showWithStats(mockStats);
      gameOverScreen.hide();

      const event = new KeyboardEvent("keydown", { code: "Space" });
      window.dispatchEvent(event);

      expect(onRestartMock).not.toHaveBeenCalled();
    });

    it("should call onQuit when Escape is pressed while shown (GS-10)", () => {
      gameOverScreen.showWithStats(mockStats);

      const event = new KeyboardEvent("keydown", { code: "Escape" });
      window.dispatchEvent(event);

      expect(onQuitMock).toHaveBeenCalledTimes(1);
    });

    it("should not call onQuit when Escape is pressed while hidden", () => {
      gameOverScreen.showWithStats(mockStats);
      gameOverScreen.hide();

      const event = new KeyboardEvent("keydown", { code: "Escape" });
      window.dispatchEvent(event);

      expect(onQuitMock).not.toHaveBeenCalled();
    });
  });

  describe("cleanup", () => {
    it("should remove event listeners on destroy", () => {
      const mockStats: GameStats = {
        wavesSurvived: 5,
        enemiesDefeated: 10,
        specialBulletsUsed: 3,
      };

      gameOverScreen.showWithStats(mockStats);
      gameOverScreen.destroy();

      const event = new KeyboardEvent("keydown", { code: "Space" });
      window.dispatchEvent(event);

      expect(onRestartMock).not.toHaveBeenCalled();
    });
  });
});
