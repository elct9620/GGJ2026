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
import { AudioSystem } from "./audio-system";
import { EventQueue, EventType } from "./event-queue";
import { SystemManager } from "../core/systems/system-manager";

// Sound paths from Vite imports (these are the actual paths used internally)
import playerShootSound from "../assets/se/shoot5.mp3";
import enemyHitSound from "../assets/se/short_punch1.mp3";
import buttonClickSound from "../assets/se/select03.mp3";

describe("AudioSystem", () => {
  let audioSystem: AudioSystem;
  let eventQueue: EventQueue;
  let systemManager: SystemManager;

  // Track created mock audios for behavior verification
  type MockAudio = ReturnType<typeof createMockAudio>;
  let createdAudios: MockAudio[];

  // Mock HTMLAudioElement
  const createMockAudio = (path: string) => {
    const audio = {
      src: path,
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
    return audio;
  };

  // Helper to find audio by path
  const findAudioByPath = (path: string): MockAudio | undefined => {
    return createdAudios.find((audio) => audio.src === path);
  };

  let originalAudio: typeof Audio;

  beforeEach(() => {
    // Reset tracked audios
    createdAudios = [];

    // Save original Audio
    originalAudio = (globalThis as typeof globalThis & { Audio: typeof Audio })
      .Audio;

    // Mock Audio constructor - track created instances for behavior verification
    (globalThis as typeof globalThis & { Audio: typeof Audio }).Audio = vi.fn(
      function (this: HTMLAudioElement, path: string) {
        const audio = createMockAudio(path);
        createdAudios.push(audio);
        return audio;
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

      // Verify Audio constructor was called for each sound (3 sounds defined)
      expect(createdAudios.length).toBe(3);
      // Verify load() was called on each audio element
      createdAudios.forEach((audio) => {
        expect(audio.load).toHaveBeenCalled();
      });
    });
  });

  describe("Volume Control", () => {
    it("應該更新所有音效的音量 (AS-05, AS-08)", async () => {
      // Wait for preload
      await new Promise((resolve) => setTimeout(resolve, 50));

      audioSystem.setVolume(0.5);

      // Verify all audio elements have updated volume
      createdAudios.forEach((audio) => {
        expect(audio.volume).toBe(0.5);
      });
    });

    it("應該限制音量不超過 1.0 (AS-06)", async () => {
      await new Promise((resolve) => setTimeout(resolve, 50));

      audioSystem.setVolume(1.5);

      // Verify volume is clamped to 1.0
      createdAudios.forEach((audio) => {
        expect(audio.volume).toBe(1.0);
      });
    });

    it("應該限制音量不低於 0.0 (AS-07)", async () => {
      await new Promise((resolve) => setTimeout(resolve, 50));

      audioSystem.setVolume(-0.5);

      // Verify volume is clamped to 0.0
      createdAudios.forEach((audio) => {
        expect(audio.volume).toBe(0.0);
      });
    });
  });

  describe("Sound Playback", () => {
    beforeEach(async () => {
      // Wait for preload
      await new Promise((resolve) => setTimeout(resolve, 50));
    });

    it("應該播放子彈發射音效當 BulletFired 事件發布時 (AS-09)", () => {
      const shootAudio = findAudioByPath(playerShootSound)!;

      eventQueue.publish(EventType.BulletFired, {});

      expect(shootAudio.play).toHaveBeenCalled();
    });

    it("應該播放敵人被擊中音效當 EnemyHit 事件發布時 (AS-10)", () => {
      const hitAudio = findAudioByPath(enemyHitSound)!;

      eventQueue.publish(EventType.EnemyHit, {});

      expect(hitAudio.play).toHaveBeenCalled();
    });

    it("應該播放按鈕點擊音效當 ButtonClicked 事件發布時 (AS-11)", () => {
      const clickAudio = findAudioByPath(buttonClickSound)!;

      eventQueue.publish(EventType.ButtonClicked, {});

      expect(clickAudio.play).toHaveBeenCalled();
    });
  });

  describe("Non-overlapping Playback", () => {
    beforeEach(async () => {
      await new Promise((resolve) => setTimeout(resolve, 50));
    });

    it("應該停止前一個實例再播放新的音效 (AS-13)", async () => {
      const shootAudio = findAudioByPath(playerShootSound)!;

      // First play
      eventQueue.publish(EventType.BulletFired, {});

      // Wait for play promise to resolve and currentlyPlaying to be set
      await new Promise((resolve) => setTimeout(resolve, 10));

      // Second play (should stop first instance)
      eventQueue.publish(EventType.BulletFired, {});

      expect(shootAudio.pause).toHaveBeenCalled();
      expect(shootAudio.currentTime).toBe(0);
    });

    it("應該允許不同音效同時播放 (AS-14)", () => {
      const shootAudio = findAudioByPath(playerShootSound)!;
      const hitAudio = findAudioByPath(enemyHitSound)!;

      eventQueue.publish(EventType.BulletFired, {});
      eventQueue.publish(EventType.EnemyHit, {});

      expect(shootAudio.play).toHaveBeenCalled();
      expect(hitAudio.play).toHaveBeenCalled();
    });
  });

  describe("Error Handling", () => {
    it("應該靜默失敗當音效載入失敗時 (AS-16, AS-17)", async () => {
      // Create new system with failing Audio mock
      systemManager.destroy();
      systemManager = new SystemManager();
      eventQueue = new EventQueue();
      createdAudios = [];

      // Mock Audio to fail loading
      (globalThis as typeof globalThis & { Audio: typeof Audio }).Audio = vi.fn(
        function (this: HTMLAudioElement, path: string) {
          const audio = createMockAudio(path);
          audio.addEventListener = vi.fn((event, handler) => {
            if (event === "error") {
              setTimeout(() => handler(new Event("error")), 0);
            }
          });
          createdAudios.push(audio);
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

      // Verify error was logged (silent failure)
      expect(consoleWarnSpy).toHaveBeenCalled();

      consoleWarnSpy.mockRestore();
    });

    it("應該靜默失敗當播放被瀏覽器阻擋時 (AS-18)", async () => {
      await new Promise((resolve) => setTimeout(resolve, 50));

      // Mock play() to reject (autoplay policy)
      const shootAudio = findAudioByPath(playerShootSound)!;
      shootAudio.play = vi
        .fn()
        .mockRejectedValue(new Error("Autoplay blocked"));

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
    it("應該暫停所有播放中的音效當 destroy 被呼叫時 (AS-20, AS-21, AS-22, AS-23)", async () => {
      await new Promise((resolve) => setTimeout(resolve, 50));

      // Trigger play to set currentlyPlaying
      eventQueue.publish(EventType.BulletFired, {});

      // Wait for play promise to resolve
      await new Promise((resolve) => setTimeout(resolve, 10));

      const shootAudio = findAudioByPath(playerShootSound)!;
      shootAudio.pause.mockClear(); // Clear previous calls

      audioSystem.destroy();

      // Verify pause was called during cleanup
      expect(shootAudio.pause).toHaveBeenCalled();
    });
  });

  describe("Integration with EventQueue", () => {
    it("應該正確回應多個連續事件 (AS-12, AS-24)", async () => {
      await new Promise((resolve) => setTimeout(resolve, 50));

      const shootAudio = findAudioByPath(playerShootSound)!;
      const hitAudio = findAudioByPath(enemyHitSound)!;
      const clickAudio = findAudioByPath(buttonClickSound)!;

      // Publish multiple events
      eventQueue.publish(EventType.BulletFired, {});
      eventQueue.publish(EventType.EnemyHit, {});
      eventQueue.publish(EventType.ButtonClicked, {});

      expect(shootAudio.play).toHaveBeenCalled();
      expect(hitAudio.play).toHaveBeenCalled();
      expect(clickAudio.play).toHaveBeenCalled();
    });

    it("應該不受其他事件影響 (AS-25)", () => {
      // Publish unrelated event
      expect(() => {
        eventQueue.publish(EventType.WaveStart, { waveNumber: 1 });
      }).not.toThrow();
    });
  });
});
