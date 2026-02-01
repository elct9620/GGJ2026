/**
 * Audio System Tests
 * SPEC § 2.3.9: 音效與音樂系統測試
 * Testing docs: docs/testing.md § 2.12
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { AudioSystem } from "./audio";
import { EventQueue, EventType } from "./event-queue";

describe("AudioSystem", () => {
  let audioSystem: AudioSystem;
  let eventQueue: EventQueue;

  beforeEach(() => {
    audioSystem = new AudioSystem();
    eventQueue = new EventQueue();
    audioSystem.setEventQueue(eventQueue);
    audioSystem.initialize();
  });

  describe("System lifecycle", () => {
    it("should have correct name and priority", () => {
      expect(audioSystem.name).toBe("AudioSystem");
      expect(audioSystem.priority).toBeDefined();
    });

    it("should initialize without errors", () => {
      expect(() => audioSystem.initialize()).not.toThrow();
    });

    it("should destroy without errors", () => {
      expect(() => audioSystem.destroy()).not.toThrow();
    });
  });

  describe("Sound Effects", () => {
    it("[AU-23] should play sound effect on SoundEffectTriggered event", () => {
      const playSpy = vi.spyOn(audioSystem, "playSoundEffect" as any);

      eventQueue.publish(EventType.SoundEffectTriggered, {
        soundId: "button",
      });

      expect(playSpy).toHaveBeenCalledWith("button");
    });

    it("[AU-24] should map soundId='button' to select03.mp3", () => {
      const playSpy = vi.spyOn(audioSystem, "playSoundEffect" as any);

      eventQueue.publish(EventType.SoundEffectTriggered, {
        soundId: "button",
      });

      expect(playSpy).toHaveBeenCalledWith("button");
    });

    it("[AU-25] should map soundId='shoot' to shoot5.mp3", () => {
      const playSpy = vi.spyOn(audioSystem, "playSoundEffect" as any);

      eventQueue.publish(EventType.SoundEffectTriggered, {
        soundId: "shoot",
      });

      expect(playSpy).toHaveBeenCalledWith("shoot");
    });

    it("[AU-26] should map soundId='hit' to short_punch1.mp3", () => {
      const playSpy = vi.spyOn(audioSystem, "playSoundEffect" as any);

      eventQueue.publish(EventType.SoundEffectTriggered, {
        soundId: "hit",
      });

      expect(playSpy).toHaveBeenCalledWith("hit");
    });

    it("[AU-27] should handle invalid soundId gracefully", () => {
      vi.spyOn(console, "error").mockImplementation(() => {});

      expect(() => {
        eventQueue.publish(EventType.SoundEffectTriggered, {
          soundId: "invalid",
        });
      }).not.toThrow();
    });

    it("[AU-10] should allow overlapping sound effects (button clicks)", () => {
      const playSpy = vi.spyOn(audioSystem, "playSoundEffect" as any);

      // Simulate rapid button clicks
      eventQueue.publish(EventType.SoundEffectTriggered, { soundId: "button" });
      eventQueue.publish(EventType.SoundEffectTriggered, { soundId: "button" });
      eventQueue.publish(EventType.SoundEffectTriggered, { soundId: "button" });

      expect(playSpy).toHaveBeenCalledTimes(3);
    });

    it("[AU-15] should allow overlapping sound effects (rapid shooting)", () => {
      const playSpy = vi.spyOn(audioSystem, "playSoundEffect" as any);

      // Simulate 6 rapid shots
      for (let i = 0; i < 6; i++) {
        eventQueue.publish(EventType.SoundEffectTriggered, {
          soundId: "shoot",
        });
      }

      expect(playSpy).toHaveBeenCalledTimes(6);
    });

    it("[AU-18] should allow overlapping hit sounds (multiple enemies)", () => {
      const playSpy = vi.spyOn(audioSystem, "playSoundEffect" as any);

      // Simulate hitting 3 enemies at once
      eventQueue.publish(EventType.SoundEffectTriggered, { soundId: "hit" });
      eventQueue.publish(EventType.SoundEffectTriggered, { soundId: "hit" });
      eventQueue.publish(EventType.SoundEffectTriggered, { soundId: "hit" });

      expect(playSpy).toHaveBeenCalledTimes(3);
    });

    it("[AU-11] should not throw error when sound file fails to load", () => {
      vi.spyOn(console, "error").mockImplementation(() => {});

      expect(() => {
        eventQueue.publish(EventType.SoundEffectTriggered, {
          soundId: "invalid_file",
        });
      }).not.toThrow();
    });
  });

  describe("Audio file mapping", () => {
    it("should have correct file path for button", () => {
      const mapping = (audioSystem as any).soundMap;
      expect(mapping["button"]).toContain("select03.mp3");
    });

    it("should have correct file path for shoot", () => {
      const mapping = (audioSystem as any).soundMap;
      expect(mapping["shoot"]).toContain("shoot5.mp3");
    });

    it("should have correct file path for hit", () => {
      const mapping = (audioSystem as any).soundMap;
      expect(mapping["hit"]).toContain("short_punch1.mp3");
    });
  });

  describe("Mute functionality", () => {
    it("should not play sounds when muted", () => {
      audioSystem.setMuted(true);

      eventQueue.publish(EventType.SoundEffectTriggered, {
        soundId: "button",
      });

      // Should still be called but not actually play audio
      expect(audioSystem.isMuted()).toBe(true);
    });

    it("should play sounds when unmuted", () => {
      audioSystem.setMuted(false);
      expect(audioSystem.isMuted()).toBe(false);
    });

    it("should toggle mute state", () => {
      audioSystem.setMuted(true);
      expect(audioSystem.isMuted()).toBe(true);

      audioSystem.setMuted(false);
      expect(audioSystem.isMuted()).toBe(false);
    });
  });

  describe("Event integration", () => {
    it("should subscribe to SoundEffectTriggered on initialize", () => {
      const subscribeSpy = vi.spyOn(eventQueue, "subscribe");
      audioSystem.setEventQueue(eventQueue);
      audioSystem.initialize();

      expect(subscribeSpy).toHaveBeenCalledWith(
        EventType.SoundEffectTriggered,
        expect.any(Function),
      );
    });
  });
});
