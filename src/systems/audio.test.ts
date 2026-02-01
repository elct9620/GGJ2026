/**
 * Audio System Tests
 * Test cases from docs/testing.md § 2.12
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { AudioSystem } from "./audio";
import { EventQueue, EventType } from "./event-queue";

describe("AudioSystem", () => {
  let audioSystem: AudioSystem;
  let eventQueue: EventQueue;

  // Mock HTMLAudioElement
  const mockAudio = {
    play: vi.fn().mockResolvedValue(undefined),
    pause: vi.fn(),
    addEventListener: vi.fn(),
    loop: false,
    volume: 1,
    currentTime: 0,
    paused: true,
  };

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock Audio constructor
    global.Audio = vi.fn(() => mockAudio as unknown as HTMLAudioElement);

    audioSystem = new AudioSystem();
    eventQueue = new EventQueue();
    audioSystem.setEventQueue(eventQueue);
    audioSystem.initialize();
  });

  describe("§ 2.12.1 Background Music", () => {
    it("AU-01: should play background music when entering game scene", () => {
      // Act
      eventQueue.publish(EventType.GameSceneEnter, {});

      // Assert
      expect(global.Audio).toHaveBeenCalledWith(
        "src/assets/se/Leisure song.mp3",
      );
      expect(mockAudio.play).toHaveBeenCalled();
    });

    it("AU-02: should set background music to loop", () => {
      // Act
      eventQueue.publish(EventType.GameSceneEnter, {});

      // Assert
      expect(mockAudio.loop).toBe(true);
    });

    it("AU-03: should set background music volume to 0.5", () => {
      // Act
      eventQueue.publish(EventType.GameSceneEnter, {});

      // Assert
      expect(mockAudio.volume).toBe(0.5);
    });

    it("AU-04: should not play duplicate background music", () => {
      // Arrange
      mockAudio.paused = false;

      // Act
      eventQueue.publish(EventType.GameSceneEnter, {});
      eventQueue.publish(EventType.GameSceneEnter, {});

      // Assert
      expect(global.Audio).toHaveBeenCalledTimes(1);
    });

    it("AU-06: should handle missing background music file gracefully", () => {
      // Arrange
      const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation();
      global.Audio = vi.fn(() => {
        throw new Error("File not found");
      });

      // Act
      eventQueue.publish(EventType.GameSceneEnter, {});

      // Assert
      expect(consoleErrorSpy).toHaveBeenCalled();
      consoleErrorSpy.mockRestore();
    });
  });

  describe("§ 2.12.2 Button Click Sound", () => {
    it("AU-07: should play button click sound when button is clicked", () => {
      // Act
      eventQueue.publish(EventType.ButtonClick, { buttonId: "test-button" });

      // Assert
      expect(global.Audio).toHaveBeenCalledWith("src/assets/se/select03.mp3");
      expect(mockAudio.play).toHaveBeenCalled();
    });

    it("AU-08: should play button sound when synthesis succeeds", () => {
      // Act
      eventQueue.publish(EventType.SynthesisTriggered, { recipeId: "1" });

      // Assert
      expect(global.Audio).toHaveBeenCalledWith("src/assets/se/select03.mp3");
      expect(mockAudio.play).toHaveBeenCalled();
    });

    it("AU-09: should play button sound when upgrade is selected", () => {
      // Act
      eventQueue.publish(EventType.UpgradeSelected, { upgradeId: "test" });

      // Assert
      expect(global.Audio).toHaveBeenCalledWith("src/assets/se/select03.mp3");
      expect(mockAudio.play).toHaveBeenCalled();
    });

    it("AU-10: should allow overlapping button click sounds", () => {
      // Act
      eventQueue.publish(EventType.ButtonClick, { buttonId: "button1" });
      eventQueue.publish(EventType.ButtonClick, { buttonId: "button2" });

      // Assert
      expect(global.Audio).toHaveBeenCalledTimes(2);
      expect(mockAudio.play).toHaveBeenCalledTimes(2);
    });

    it("AU-11: should handle missing button sound file gracefully", () => {
      // Arrange
      const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation();
      global.Audio = vi.fn(() => {
        throw new Error("File not found");
      });

      // Act
      eventQueue.publish(EventType.ButtonClick, { buttonId: "test" });

      // Assert
      expect(consoleErrorSpy).toHaveBeenCalled();
      consoleErrorSpy.mockRestore();
    });
  });

  describe("§ 2.12.3 Player Shoot Sound", () => {
    it("AU-12: should play shoot sound when player fires bullet", () => {
      // Act
      eventQueue.publish(EventType.PlayerShoot, {});

      // Assert
      expect(global.Audio).toHaveBeenCalledWith("src/assets/se/shoot5.mp3");
      expect(mockAudio.play).toHaveBeenCalled();
    });

    it("AU-13: should allow overlapping shoot sounds", () => {
      // Act
      eventQueue.publish(EventType.PlayerShoot, {});
      eventQueue.publish(EventType.PlayerShoot, {});

      // Assert
      expect(global.Audio).toHaveBeenCalledTimes(2);
      expect(mockAudio.play).toHaveBeenCalledTimes(2);
    });

    it("AU-16: should handle missing shoot sound file gracefully", () => {
      // Arrange
      const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation();
      global.Audio = vi.fn(() => {
        throw new Error("File not found");
      });

      // Act
      eventQueue.publish(EventType.PlayerShoot, {});

      // Assert
      expect(consoleErrorSpy).toHaveBeenCalled();
      consoleErrorSpy.mockRestore();
    });
  });

  describe("§ 2.12.4 Enemy Hit Sound", () => {
    it("AU-17: should play hit sound when bullet hits enemy", () => {
      // Act
      eventQueue.publish(EventType.EnemyHit, { enemyId: "enemy1" });

      // Assert
      expect(global.Audio).toHaveBeenCalledWith(
        "src/assets/se/short_punch1.mp3",
      );
      expect(mockAudio.play).toHaveBeenCalled();
    });

    it("AU-18: should allow overlapping hit sounds", () => {
      // Act
      eventQueue.publish(EventType.EnemyHit, { enemyId: "enemy1" });
      eventQueue.publish(EventType.EnemyHit, { enemyId: "enemy2" });

      // Assert
      expect(global.Audio).toHaveBeenCalledTimes(2);
      expect(mockAudio.play).toHaveBeenCalledTimes(2);
    });

    it("AU-19: should play hit sound for each penetrating hit", () => {
      // Act - Simulate piercing bullet hitting 3 enemies
      eventQueue.publish(EventType.EnemyHit, { enemyId: "enemy1" });
      eventQueue.publish(EventType.EnemyHit, { enemyId: "enemy2" });
      eventQueue.publish(EventType.EnemyHit, { enemyId: "enemy3" });

      // Assert
      expect(global.Audio).toHaveBeenCalledTimes(3);
      expect(mockAudio.play).toHaveBeenCalledTimes(3);
    });

    it("AU-20: should play hit sound for each chained hit", () => {
      // Act - Simulate chain lightning hitting 5 enemies
      for (let i = 1; i <= 5; i++) {
        eventQueue.publish(EventType.EnemyHit, { enemyId: `enemy${i}` });
      }

      // Assert
      expect(global.Audio).toHaveBeenCalledTimes(5);
      expect(mockAudio.play).toHaveBeenCalledTimes(5);
    });

    it("AU-22: should handle missing hit sound file gracefully", () => {
      // Arrange
      const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation();
      global.Audio = vi.fn(() => {
        throw new Error("File not found");
      });

      // Act
      eventQueue.publish(EventType.EnemyHit, { enemyId: "enemy1" });

      // Assert
      expect(consoleErrorSpy).toHaveBeenCalled();
      consoleErrorSpy.mockRestore();
    });
  });

  describe("§ 2.12.5 Event Integration", () => {
    it("AU-23: should subscribe to PlayerShoot event", () => {
      // Act
      eventQueue.publish(EventType.PlayerShoot, {});

      // Assert
      expect(mockAudio.play).toHaveBeenCalled();
    });

    it("AU-24: should subscribe to EnemyHit event", () => {
      // Act
      eventQueue.publish(EventType.EnemyHit, { enemyId: "enemy1" });

      // Assert
      expect(mockAudio.play).toHaveBeenCalled();
    });

    it("AU-25: should subscribe to ButtonClick event", () => {
      // Act
      eventQueue.publish(EventType.ButtonClick, { buttonId: "test" });

      // Assert
      expect(mockAudio.play).toHaveBeenCalled();
    });

    it("AU-26: should subscribe to SynthesisTriggered event", () => {
      // Act
      eventQueue.publish(EventType.SynthesisTriggered, { recipeId: "1" });

      // Assert
      expect(mockAudio.play).toHaveBeenCalled();
    });

    it("AU-27: should subscribe to UpgradeSelected event", () => {
      // Act
      eventQueue.publish(EventType.UpgradeSelected, { upgradeId: "test" });

      // Assert
      expect(mockAudio.play).toHaveBeenCalled();
    });

    it("AU-28: should subscribe to GameSceneEnter event", () => {
      // Act
      eventQueue.publish(EventType.GameSceneEnter, {});

      // Assert
      expect(mockAudio.play).toHaveBeenCalled();
    });
  });

  describe("Lifecycle", () => {
    it("should throw error if EventQueue is not set before initialize", () => {
      // Arrange
      const newAudioSystem = new AudioSystem();

      // Act & Assert
      expect(() => newAudioSystem.initialize()).toThrow(
        "AudioSystem requires EventQueue dependency",
      );
    });

    it("should stop background music on destroy", () => {
      // Arrange
      eventQueue.publish(EventType.GameSceneEnter, {});
      mockAudio.paused = false;

      // Act
      audioSystem.destroy();

      // Assert
      expect(mockAudio.pause).toHaveBeenCalled();
      expect(mockAudio.currentTime).toBe(0);
    });
  });
});
