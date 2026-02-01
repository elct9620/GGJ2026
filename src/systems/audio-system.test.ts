/**
 * Audio System Tests (SPEC § 2.3.9, testing.md § 2.11)
 * 音效系統測試案例
 *
 * 測試涵蓋：
 * - 初始化與預載入（AS-01 to AS-04）
 * - 音量控制（AS-05 to AS-08）
 * - 音效播放（AS-09 to AS-12）
 * - 不重疊播放（AS-13 to AS-15）
 * - 錯誤處理（AS-16 to AS-19）
 * - 生命週期管理（AS-20 to AS-23）
 * - EventQueue 整合（AS-24 to AS-26）
 */

import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { AudioSystem, SoundId } from "./audio-system";
import { EventQueue, EventType } from "./event-queue";
import { SystemManager } from "../core/systems/system-manager";

describe("AudioSystem", () => {
  let audioSystem: AudioSystem;
  let eventQueue: EventQueue;
  let systemManager: SystemManager;

  // Mock HTMLAudioElement
  const createMockAudio = () => {
    const audio = {
      volume: 1.0,
      currentTime: 0,
      paused: true,
      play: vi.fn().mockResolvedValue(undefined),
      pause: vi.fn(),
      load: vi.fn(),
      addEventListener: vi.fn((event, handler) => {
        if (event === "canplaythrough") {
          // Simulate successful load
          setTimeout(() => handler(), 0);
        }
      }),
      removeEventListener: vi.fn(),
    };
    return audio as unknown as HTMLAudioElement;
  };

  let originalAudio: typeof Audio;

  beforeEach(() => {
    // Save original Audio
    originalAudio = (globalThis as typeof globalThis & { Audio: typeof Audio })
      .Audio;

    // Mock Audio constructor - must be a proper constructor function
    (globalThis as typeof globalThis & { Audio: typeof Audio }).Audio = vi.fn(
      function (this: HTMLAudioElement) {
        return createMockAudio();
      },
    ) as unknown as typeof Audio;

    // Create systems with proper dependency injection
    systemManager = new SystemManager();
    eventQueue = new EventQueue();
    audioSystem = new AudioSystem();

    systemManager.register(eventQueue);
    systemManager.register(audioSystem);

    systemManager.provideDependency("EventQueue", eventQueue);

    systemManager.initialize();
  });

  afterEach(() => {
    // Restore original Audio
    (globalThis as typeof globalThis & { Audio: typeof Audio }).Audio =
      originalAudio;

    systemManager.destroy();
  });

  describe("Initialization", () => {
    it("應該成功初始化音效系統 (AS-01)", () => {
      expect(audioSystem.name).toBe("AudioSystem");
    });

    it("應該在背景預載入所有音效 (AS-02, AS-03)", async () => {
      // Wait for preload to complete
      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(audioSystem.isLoaded()).toBe(true);
    });
  });

  describe("Volume Control", () => {
    it("應該設定音量在有效範圍內 (0.0 - 1.0) (AS-05)", () => {
      audioSystem.setVolume(0.5);
      expect(audioSystem.getVolume()).toBe(0.5);
    });

    it("應該限制音量不超過 1.0 (AS-06)", () => {
      audioSystem.setVolume(1.5);
      expect(audioSystem.getVolume()).toBe(1.0);
    });

    it("應該限制音量不低於 0.0 (AS-07)", () => {
      audioSystem.setVolume(-0.5);
      expect(audioSystem.getVolume()).toBe(0.0);
    });

    it("應該更新所有音效的音量 (AS-08)", async () => {
      // Wait for preload
      await new Promise((resolve) => setTimeout(resolve, 50));

      audioSystem.setVolume(0.7);

      const sounds = audioSystem["sounds"];
      sounds.forEach((audio) => {
        expect(audio.volume).toBe(0.7);
      });
    });
  });

  describe("Sound Playback", () => {
    beforeEach(async () => {
      // Wait for preload
      await new Promise((resolve) => setTimeout(resolve, 50));
    });

    it("應該播放子彈發射音效當 BulletFired 事件發布時 (AS-09)", () => {
      const playSpy = vi.spyOn(
        audioSystem["sounds"].get(SoundId.PlayerShoot)!,
        "play",
      );

      eventQueue.publish(EventType.BulletFired, {});

      expect(playSpy).toHaveBeenCalled();
    });

    it("應該播放敵人被擊中音效當 EnemyHit 事件發布時 (AS-10)", () => {
      const playSpy = vi.spyOn(
        audioSystem["sounds"].get(SoundId.EnemyHit)!,
        "play",
      );

      eventQueue.publish(EventType.EnemyHit, {});

      expect(playSpy).toHaveBeenCalled();
    });

    it("應該播放按鈕點擊音效當 ButtonClicked 事件發布時 (AS-11)", () => {
      const playSpy = vi.spyOn(
        audioSystem["sounds"].get(SoundId.ButtonClick)!,
        "play",
      );

      eventQueue.publish(EventType.ButtonClicked, {});

      expect(playSpy).toHaveBeenCalled();
    });
  });

  describe("Non-overlapping Playback", () => {
    beforeEach(async () => {
      await new Promise((resolve) => setTimeout(resolve, 50));
    });

    it("應該停止前一個實例再播放新的音效 (AS-13)", () => {
      const audio = audioSystem["sounds"].get(SoundId.PlayerShoot)!;
      const pauseSpy = vi.spyOn(audio, "pause");

      // First play
      eventQueue.publish(EventType.BulletFired, {});

      // Mark as currently playing
      audioSystem["currentlyPlaying"].set(SoundId.PlayerShoot, audio);

      // Second play (should stop first instance)
      eventQueue.publish(EventType.BulletFired, {});

      expect(pauseSpy).toHaveBeenCalled();
      expect(audio.currentTime).toBe(0);
    });

    it("應該允許不同音效同時播放 (AS-14)", () => {
      const shootAudio = audioSystem["sounds"].get(SoundId.PlayerShoot)!;
      const hitAudio = audioSystem["sounds"].get(SoundId.EnemyHit)!;

      const shootPlaySpy = vi.spyOn(shootAudio, "play");
      const hitPlaySpy = vi.spyOn(hitAudio, "play");

      eventQueue.publish(EventType.BulletFired, {});
      eventQueue.publish(EventType.EnemyHit, {});

      expect(shootPlaySpy).toHaveBeenCalled();
      expect(hitPlaySpy).toHaveBeenCalled();
    });
  });

  describe("Error Handling", () => {
    it("應該靜默失敗當音效載入失敗時 (AS-16, AS-17)", async () => {
      // Create new system with failing Audio mock
      systemManager.destroy();
      systemManager = new SystemManager();
      eventQueue = new EventQueue();

      // Mock Audio to fail loading
      (globalThis as typeof globalThis & { Audio: typeof Audio }).Audio = vi.fn(
        function (this: HTMLAudioElement) {
          const audio = createMockAudio();
          audio.addEventListener = vi.fn((event, handler) => {
            if (event === "error") {
              setTimeout(() => handler(new Event("error")), 0);
            }
          });
          return audio as unknown as HTMLAudioElement;
        },
      ) as unknown as typeof Audio;

      const consoleWarnSpy = vi
        .spyOn(console, "warn")
        .mockImplementation(() => {});

      const newAudioSystem = new AudioSystem();
      systemManager.register(eventQueue);
      systemManager.register(newAudioSystem);
      systemManager.provideDependency("EventQueue", eventQueue);
      systemManager.initialize();

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(consoleWarnSpy).toHaveBeenCalled();
      expect(newAudioSystem.isLoaded()).toBe(false);

      consoleWarnSpy.mockRestore();
    });

    it("應該靜默失敗當播放被瀏覽器阻擋時 (AS-18)", async () => {
      await new Promise((resolve) => setTimeout(resolve, 50));

      // Mock play() to reject (autoplay policy)
      const audio = audioSystem["sounds"].get(SoundId.PlayerShoot)!;
      audio.play = vi.fn().mockRejectedValue(new Error("Autoplay blocked"));

      const consoleWarnSpy = vi
        .spyOn(console, "warn")
        .mockImplementation(() => {});

      eventQueue.publish(EventType.BulletFired, {});

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(consoleWarnSpy).toHaveBeenCalled();

      consoleWarnSpy.mockRestore();
    });

    it("應該不拋出錯誤當音效尚未載入時嘗試播放 (AS-04, AS-19)", () => {
      // Create new system without waiting for preload
      systemManager.destroy();
      systemManager = new SystemManager();
      eventQueue = new EventQueue();
      const newAudioSystem = new AudioSystem();

      systemManager.register(eventQueue);
      systemManager.register(newAudioSystem);
      systemManager.provideDependency("EventQueue", eventQueue);
      systemManager.initialize();

      // Immediately try to play before preload completes
      expect(() => {
        eventQueue.publish(EventType.BulletFired, {});
      }).not.toThrow();
    });
  });

  describe("Lifecycle", () => {
    it("應該清理所有資源當 destroy 被呼叫時 (AS-20, AS-21, AS-22)", async () => {
      await new Promise((resolve) => setTimeout(resolve, 50));

      // Simulate playing audio
      eventQueue.publish(EventType.BulletFired, {});

      audioSystem.destroy();

      expect(audioSystem["currentlyPlaying"].size).toBe(0);
      expect(audioSystem["sounds"].size).toBe(0);
      expect(audioSystem.isLoaded()).toBe(false);
    });

    it("應該暫停所有播放中的音效當 destroy 被呼叫時 (AS-23)", async () => {
      await new Promise((resolve) => setTimeout(resolve, 50));

      const audio = audioSystem["sounds"].get(SoundId.PlayerShoot)!;
      audioSystem["currentlyPlaying"].set(SoundId.PlayerShoot, audio);

      const pauseSpy = vi.spyOn(audio, "pause");

      audioSystem.destroy();

      expect(pauseSpy).toHaveBeenCalled();
    });
  });

  describe("Integration with EventQueue", () => {
    it("應該正確回應多個連續事件 (AS-12, AS-24)", async () => {
      await new Promise((resolve) => setTimeout(resolve, 50));

      const shootAudio = audioSystem["sounds"].get(SoundId.PlayerShoot)!;
      const hitAudio = audioSystem["sounds"].get(SoundId.EnemyHit)!;
      const clickAudio = audioSystem["sounds"].get(SoundId.ButtonClick)!;

      const shootPlaySpy = vi.spyOn(shootAudio, "play");
      const hitPlaySpy = vi.spyOn(hitAudio, "play");
      const clickPlaySpy = vi.spyOn(clickAudio, "play");

      // Publish multiple events
      eventQueue.publish(EventType.BulletFired, {});
      eventQueue.publish(EventType.EnemyHit, {});
      eventQueue.publish(EventType.ButtonClicked, {});

      expect(shootPlaySpy).toHaveBeenCalled();
      expect(hitPlaySpy).toHaveBeenCalled();
      expect(clickPlaySpy).toHaveBeenCalled();
    });

    it("應該不受其他事件影響 (AS-25)", () => {
      // Publish unrelated event
      expect(() => {
        eventQueue.publish(EventType.WaveStart, { waveNumber: 1 });
      }).not.toThrow();
    });
  });

  describe("Preload Status", () => {
    it("應該回報預載入狀態 (AS-02, AS-03, AS-26)", async () => {
      // Before preload completes
      expect(audioSystem.isLoaded()).toBe(false);

      // After preload completes
      await new Promise((resolve) => setTimeout(resolve, 50));
      expect(audioSystem.isLoaded()).toBe(true);
    });
  });
});
