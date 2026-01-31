import { describe, it, expect } from "vitest";
import { GameState, createGameStats } from "./game-state";

describe("GameState", () => {
  it("should have correct state values", () => {
    expect(GameState.START).toBe("START");
    expect(GameState.PLAYING).toBe("PLAYING");
    expect(GameState.GAME_OVER).toBe("GAME_OVER");
  });
});

describe("createGameStats", () => {
  it("should create initial game statistics with zeros", () => {
    const stats = createGameStats();

    expect(stats.wavesSurvived).toBe(0);
    expect(stats.enemiesDefeated).toBe(0);
    expect(stats.specialBulletsUsed).toBe(0);
  });

  it("should create new instance each time", () => {
    const stats1 = createGameStats();
    const stats2 = createGameStats();

    expect(stats1).not.toBe(stats2);
    expect(stats1).toEqual(stats2);
  });
});
