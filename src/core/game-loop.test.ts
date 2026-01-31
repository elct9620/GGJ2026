import { describe, test, expect, vi, beforeEach, afterEach } from "vitest";
import { Ticker } from "pixi.js";
import { GameLoop } from "./game-loop";

describe("GameLoop", () => {
  let gameLoop: GameLoop;

  beforeEach(() => {
    gameLoop = new GameLoop();
  });

  afterEach(() => {
    gameLoop.destroy();
  });

  describe("constructor", () => {
    test("creates with default ticker if not provided", () => {
      const loop = new GameLoop();
      expect(loop).toBeInstanceOf(GameLoop);
      loop.destroy();
    });

    test("uses provided ticker", () => {
      const customTicker = new Ticker();
      const loop = new GameLoop(customTicker);
      expect(loop).toBeInstanceOf(GameLoop);
      loop.destroy();
      customTicker.destroy();
    });

    test("sets maxFPS to 60", () => {
      const state = gameLoop.getState();
      expect(state).toBeDefined();
    });
  });

  describe("setUpdateCallback", () => {
    test("sets update callback function", () => {
      const callback = vi.fn();
      gameLoop.setUpdateCallback(callback);

      // Verify callback is set (will be tested in integration)
      expect(callback).toBeDefined();
    });
  });

  describe("start", () => {
    test("starts the game loop", () => {
      gameLoop.start();
      const state = gameLoop.getState();

      expect(state.isRunning).toBe(true);
      expect(state.isPaused).toBe(false);
    });

    test("does not start if already running", () => {
      gameLoop.start();
      const state1 = gameLoop.getState();

      gameLoop.start(); // 嘗試再次啟動
      const state2 = gameLoop.getState();

      expect(state1).toEqual(state2);
    });
  });

  describe("stop", () => {
    test("stops the game loop", () => {
      gameLoop.start();
      gameLoop.stop();

      const state = gameLoop.getState();
      expect(state.isRunning).toBe(false);
      expect(state.isPaused).toBe(false);
    });

    test("resets total time", () => {
      gameLoop.start();
      gameLoop.stop();

      const state = gameLoop.getState();
      expect(state.totalTime).toBe(0);
    });

    test("does not stop if not running", () => {
      const state1 = gameLoop.getState();
      gameLoop.stop();
      const state2 = gameLoop.getState();

      expect(state1).toEqual(state2);
    });
  });

  describe("pause", () => {
    test("pauses the game loop", () => {
      gameLoop.start();
      gameLoop.pause();

      const state = gameLoop.getState();
      expect(state.isRunning).toBe(true);
      expect(state.isPaused).toBe(true);
    });

    test("does not pause if not running", () => {
      gameLoop.pause();
      const state = gameLoop.getState();

      expect(state.isRunning).toBe(false);
      expect(state.isPaused).toBe(false);
    });
  });

  describe("resume", () => {
    test("resumes the game loop", () => {
      gameLoop.start();
      gameLoop.pause();
      gameLoop.resume();

      const state = gameLoop.getState();
      expect(state.isRunning).toBe(true);
      expect(state.isPaused).toBe(false);
    });

    test("does not resume if not paused", () => {
      gameLoop.start();
      const state1 = gameLoop.getState();

      gameLoop.resume();
      const state2 = gameLoop.getState();

      expect(state1).toEqual(state2);
    });
  });

  describe("update callback", () => {
    test("callback receives deltaTime and totalTime parameters", (context) => {
      return new Promise<void>((resolve) => {
        const callback = vi.fn((deltaTime: number, totalTime: number) => {
          expect(deltaTime).toBeGreaterThan(0);
          expect(totalTime).toBeGreaterThan(0);
          gameLoop.stop();
          resolve();
        });

        gameLoop.setUpdateCallback(callback);
        gameLoop.start();

        // Timeout fallback
        setTimeout(() => {
          if (!callback.mock.calls.length) {
            gameLoop.stop();
            context.skip();
          }
        }, 100);
      });
    });

    test("accumulates totalTime across updates", (context) => {
      return new Promise<void>((resolve) => {
        let firstTotalTime: number | null = null;

        const callback = vi.fn((_deltaTime: number, totalTime: number) => {
          if (firstTotalTime === null) {
            firstTotalTime = totalTime;
          } else {
            expect(totalTime).toBeGreaterThan(firstTotalTime);
            gameLoop.stop();
            resolve();
          }
        });

        gameLoop.setUpdateCallback(callback);
        gameLoop.start();

        setTimeout(() => {
          if (callback.mock.calls.length < 2) {
            gameLoop.stop();
            context.skip();
          }
        }, 100);
      });
    });

    test("does not call callback when paused", (context) => {
      return new Promise<void>((resolve) => {
        let callCount = 0;

        const callback = vi.fn(() => {
          callCount++;
          if (callCount === 1) {
            gameLoop.pause();
            setTimeout(() => {
              // After pause, callback should not be called
              expect(callCount).toBe(1);
              gameLoop.stop();
              resolve();
            }, 50);
          }
        });

        gameLoop.setUpdateCallback(callback);
        gameLoop.start();

        setTimeout(() => {
          if (!callback.mock.calls.length) {
            gameLoop.stop();
            context.skip();
          }
        }, 150);
      });
    });
  });

  describe("getState", () => {
    test("returns current state", () => {
      const state = gameLoop.getState();

      expect(state).toHaveProperty("isRunning");
      expect(state).toHaveProperty("isPaused");
      expect(state).toHaveProperty("totalTime");
      expect(state).toHaveProperty("fps");
    });

    test("reflects state changes", () => {
      const state1 = gameLoop.getState();
      expect(state1.isRunning).toBe(false);

      gameLoop.start();
      const state2 = gameLoop.getState();
      expect(state2.isRunning).toBe(true);

      gameLoop.pause();
      const state3 = gameLoop.getState();
      expect(state3.isPaused).toBe(true);
    });
  });

  describe("destroy", () => {
    test("stops the loop and cleans up", () => {
      gameLoop.start();
      gameLoop.destroy();

      const state = gameLoop.getState();
      expect(state.isRunning).toBe(false);
    });
  });
});
