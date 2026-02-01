/**
 * Audio System
 * SPEC § 2.3.9: 透過音效和音樂強化遊戲沉浸感和玩家回饋
 */

import type { ISystem } from "../core/systems/system.interface";
import { SystemPriority } from "../core/systems/system.interface";
import type { EventQueue } from "./event-queue";
import { EventType } from "./event-queue";

/**
 * Audio System
 * SPEC § 2.3.9: 管理背景音樂和音效播放
 *
 * Constraints:
 * - 背景音樂：單一循環播放檔案
 * - 音效播放：即時觸發，不阻塞遊戲進程
 * - 音量控制：所有音效和音樂可全域靜音
 * - 檔案格式：MP3（瀏覽器相容性）
 */
export class AudioSystem implements ISystem {
  public readonly name = "AudioSystem";
  public readonly priority = SystemPriority.DEFAULT;

  private eventQueue: EventQueue | null = null;

  // Audio elements
  private backgroundMusic: HTMLAudioElement | null = null;
  private soundEffects: Map<string, HTMLAudioElement[]> = new Map();

  // Mute state
  private muted = false;

  // Sound file mapping (SPEC § 2.3.9: 音效檔案映射)
  private soundMap: Record<string, string> = {
    bgm: "/src/assets/se/Leisure song.mp3",
    button: "/src/assets/se/select03.mp3",
    shoot: "/src/assets/se/shoot5.mp3",
    hit: "/src/assets/se/short_punch1.mp3",
  };

  /**
   * Set EventQueue dependency
   */
  public setEventQueue(eventQueue: EventQueue): void {
    this.eventQueue = eventQueue;
  }

  /**
   * ISystem lifecycle: initialize
   * SPEC § 2.3.9: Subscribe to audio events
   */
  public initialize(): void {
    if (!this.eventQueue) {
      console.error("AudioSystem: EventQueue not set");
      return;
    }

    // Subscribe to audio events (SPEC § 2.3.9: Event Types)
    this.eventQueue.subscribe(
      EventType.SoundEffectTriggered,
      this.onSoundEffectTriggered.bind(this),
    );

    this.eventQueue.subscribe(
      EventType.BackgroundMusicStart,
      this.onBackgroundMusicStart.bind(this),
    );
  }

  /**
   * ISystem lifecycle: update
   */
  public update(_deltaTime: number): void {
    // Audio system is event-driven, no per-frame updates needed
  }

  /**
   * ISystem lifecycle: destroy
   * SPEC § 2.3.9: Clean up audio resources
   */
  public destroy(): void {
    // Stop and cleanup background music
    if (this.backgroundMusic) {
      this.backgroundMusic.pause();
      this.backgroundMusic = null;
    }

    // Cleanup sound effects
    this.soundEffects.clear();
  }

  /**
   * Set muted state
   * SPEC § 2.3.9: 音量控制 - 所有音效和音樂可全域靜音
   */
  public setMuted(muted: boolean): void {
    this.muted = muted;

    // Update background music mute state
    if (this.backgroundMusic) {
      this.backgroundMusic.muted = muted;
    }
  }

  /**
   * Get muted state
   */
  public isMuted(): boolean {
    return this.muted;
  }

  /**
   * Handle SoundEffectTriggered event
   * SPEC § 2.3.9: Play Sound Effect
   */
  private onSoundEffectTriggered(data: { soundId: string }): void {
    this.playSoundEffect(data.soundId);
  }

  /**
   * Handle BackgroundMusicStart event
   * SPEC § 2.3.9: Play Background Music
   */
  private onBackgroundMusicStart(data: {
    musicId: string;
    loop: boolean;
  }): void {
    this.playBackgroundMusic(data.musicId, data.loop);
  }

  /**
   * Play background music
   * SPEC § 2.3.9: Behaviors - Play Background Music
   *
   * - 遊戲場景進入時開始播放
   * - 循環播放（loop = true）
   * - 遊戲暫停時音樂繼續播放
   * - 遊戲結束時音樂繼續播放（不停止）
   */
  private playBackgroundMusic(musicId: string, loop: boolean): void {
    const filePath = this.soundMap[musicId];

    if (!filePath) {
      console.error(`AudioSystem: Invalid musicId '${musicId}'`);
      return;
    }

    try {
      // Create new audio element
      const audio = new Audio(filePath);
      audio.loop = loop;
      audio.muted = this.muted;

      // Play audio (handle autoplay restrictions)
      const playPromise = audio.play();

      if (playPromise !== undefined) {
        playPromise.catch((error) => {
          // SPEC § 2.3.9: Error Scenarios - 瀏覽器限制自動播放
          console.warn(
            "AudioSystem: Autoplay blocked, will retry on user interaction",
            error,
          );
        });
      }

      this.backgroundMusic = audio;
    } catch (error) {
      // SPEC § 2.3.9: Error Scenarios - 音檔載入失敗
      console.error("AudioSystem: Failed to load background music", error);
    }
  }

  /**
   * Play sound effect
   * SPEC § 2.3.9: Behaviors - Play Sound Effect
   *
   * - 音效觸發時立即播放（非同步）
   * - 同一音效可重疊播放（不等待前一次播放完成）
   * - 音效播放失敗不影響遊戲進程
   */
  private playSoundEffect(soundId: string): void {
    const filePath = this.soundMap[soundId];

    if (!filePath) {
      console.error(`AudioSystem: Invalid soundId '${soundId}'`);
      return;
    }

    if (this.muted) {
      // Skip playing if muted, but don't error
      return;
    }

    try {
      // SPEC § 2.3.9: 同一音效可重疊播放
      // Create new audio instance for each play (allows overlapping)
      const audio = new Audio(filePath);
      audio.muted = this.muted;

      // Play audio
      const playPromise = audio.play();

      if (playPromise !== undefined) {
        playPromise.catch((error) => {
          // SPEC § 2.3.9: Error Scenarios - 音效播放失敗不影響遊戲進程
          console.warn(
            `AudioSystem: Failed to play sound effect '${soundId}'`,
            error,
          );
        });
      }

      // Store reference for cleanup (optional, helps with memory management)
      if (!this.soundEffects.has(soundId)) {
        this.soundEffects.set(soundId, []);
      }
      this.soundEffects.get(soundId)!.push(audio);

      // Cleanup finished audio to prevent memory leaks
      audio.addEventListener("ended", () => {
        const instances = this.soundEffects.get(soundId);
        if (instances) {
          const index = instances.indexOf(audio);
          if (index > -1) {
            instances.splice(index, 1);
          }
        }
      });
    } catch (error) {
      // SPEC § 2.3.9: Error Scenarios - 音效播放失敗不影響遊戲進程
      console.error(`AudioSystem: Failed to load sound effect '${soundId}'`, error);
    }
  }
}
