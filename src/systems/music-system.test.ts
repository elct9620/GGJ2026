import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { MusicSystem } from "./music-system";
import { EventQueue, EventType } from "./event-queue";
import { DependencyKeys } from "../core/systems/dependency-keys";
import { MusicVariation, MUSIC_CONFIG } from "../audio/music-config";

describe("MusicSystem", () => {
  let musicSystem: MusicSystem;
  let eventQueue: EventQueue;

  beforeEach(() => {
    vi.useFakeTimers();
    eventQueue = new EventQueue();
    eventQueue.initialize();

    musicSystem = new MusicSystem();
    musicSystem.inject(DependencyKeys.EventQueue, eventQueue);
    musicSystem.initialize();
  });

  afterEach(() => {
    musicSystem.destroy();
    vi.useRealTimers();
  });

  describe("initialization", () => {
    it("should not be playing after initialization", () => {
      expect(musicSystem.isPlaying).toBe(false);
      expect(musicSystem.isStarted).toBe(false);
    });

    it("should have default volume", () => {
      expect(musicSystem.getVolume()).toBe(MUSIC_CONFIG.defaultVolume);
    });

    it("should have Normal variation by default", () => {
      expect(musicSystem.currentVariation).toBe(MusicVariation.Normal);
    });
  });

  describe("playback control", () => {
    it("should start playing when start() is called", () => {
      const result = musicSystem.start();

      expect(result).toBe(true);
      expect(musicSystem.isStarted).toBe(true);
      expect(musicSystem.isPlaying).toBe(true);
    });

    it("should stop playing when stop() is called", () => {
      musicSystem.start();
      musicSystem.stop();

      expect(musicSystem.isStarted).toBe(false);
      expect(musicSystem.isPlaying).toBe(false);
    });

    it("should return true if already started", () => {
      musicSystem.start();
      const result = musicSystem.start();

      expect(result).toBe(true);
    });

    it("should toggle playback with togglePlayback()", () => {
      musicSystem.start();
      expect(musicSystem.isPlaying).toBe(true);

      musicSystem.togglePlayback();
      expect(musicSystem.isPlaying).toBe(false);

      musicSystem.togglePlayback();
      expect(musicSystem.isPlaying).toBe(true);
    });
  });

  describe("volume control", () => {
    it("should set volume correctly", () => {
      musicSystem.setVolume(0.7);
      expect(musicSystem.getVolume()).toBe(0.7);
    });

    it("should clamp volume to 0-1 range", () => {
      musicSystem.setVolume(-0.5);
      expect(musicSystem.getVolume()).toBe(0);

      musicSystem.setVolume(1.5);
      expect(musicSystem.getVolume()).toBe(1);
    });
  });

  describe("variation switching via events", () => {
    it("should switch to Normal variation on regular WaveStart", () => {
      musicSystem.start();
      musicSystem.setVariation(MusicVariation.Intense);

      eventQueue.publish(EventType.WaveStart, { waveNumber: 3 });
      eventQueue.update(0);

      expect(musicSystem.currentVariation).toBe(MusicVariation.Normal);
    });

    it("should switch to Intense variation on Boss wave (every 5 waves)", () => {
      musicSystem.start();

      eventQueue.publish(EventType.WaveStart, { waveNumber: 5 });
      eventQueue.update(0);

      expect(musicSystem.currentVariation).toBe(MusicVariation.Intense);
    });

    it("should switch to Intense on wave 10", () => {
      musicSystem.start();

      eventQueue.publish(EventType.WaveStart, { waveNumber: 10 });
      eventQueue.update(0);

      expect(musicSystem.currentVariation).toBe(MusicVariation.Intense);
    });

    it("should switch to Victory variation on WaveComplete", () => {
      musicSystem.start();

      eventQueue.publish(EventType.WaveComplete, { waveNumber: 1 });
      eventQueue.update(0);

      expect(musicSystem.currentVariation).toBe(MusicVariation.Victory);
    });

    it("should stop music on PlayerDeath", () => {
      musicSystem.start();
      expect(musicSystem.isPlaying).toBe(true);

      eventQueue.publish(EventType.PlayerDeath, {});
      eventQueue.update(0);

      expect(musicSystem.isPlaying).toBe(false);
    });
  });

  describe("BPM variations", () => {
    it("should have base BPM (150) for Normal variation", () => {
      musicSystem.setVariation(MusicVariation.Normal);
      expect(musicSystem.currentBpm).toBe(150);
    });

    it("should have increased BPM (165) for Intense variation", () => {
      musicSystem.setVariation(MusicVariation.Intense);
      expect(musicSystem.currentBpm).toBe(165); // 150 + 15
    });

    it("should have decreased BPM (140) for Victory variation", () => {
      musicSystem.setVariation(MusicVariation.Victory);
      expect(musicSystem.currentBpm).toBe(140); // 150 - 10
    });
  });

  describe("reset", () => {
    it("should reset to initial state", () => {
      musicSystem.start();
      musicSystem.setVolume(0.3);
      musicSystem.setVariation(MusicVariation.Intense);

      musicSystem.reset();

      expect(musicSystem.isStarted).toBe(false);
      expect(musicSystem.isPlaying).toBe(false);
      expect(musicSystem.currentVariation).toBe(MusicVariation.Normal);
      expect(musicSystem.getVolume()).toBe(MUSIC_CONFIG.defaultVolume);
    });
  });

  describe("System interface", () => {
    it("should have correct name", () => {
      expect(musicSystem.name).toBe("MusicSystem");
    });

    it("should not require per-frame update", () => {
      // update() should be a no-op
      expect(() => musicSystem.update(16)).not.toThrow();
    });
  });
});
