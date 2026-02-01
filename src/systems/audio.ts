/**
 * Audio System
 * SPEC § 2.3.9: 透過背景音樂和音效提升遊戲沉浸感和玩家反饋
 */

import { SystemPriority } from "../core/systems/system.interface";
import type { ISystem } from "../core/systems/system.interface";
import type { EventQueue } from "./event-queue";
import { EventType } from "./event-queue";

/**
 * Audio file paths mapped to game events
 * SPEC § 2.3.9: Audio File Mapping
 */
const AUDIO_FILES = {
  backgroundMusic: "src/assets/se/Leisure song.mp3",
  buttonClick: "src/assets/se/select03.mp3",
  playerShoot: "src/assets/se/shoot5.mp3",
  enemyHit: "src/assets/se/short_punch1.mp3",
} as const;

/**
 * Audio System
 * SPEC § 2.3.9: 管理背景音樂和音效播放的系統，透過事件驅動觸發音效
 *
 * Constraints:
 * - 背景音樂循環播放（遊戲場景進入時自動開始）
 * - 音效可重疊播放（同一音效可同時播放多個實例）
 * - 音效觸發為事件驅動（透過 EventQueue 發佈事件）
 */
export class AudioSystem implements ISystem {
  public readonly name = "AudioSystem";
  public readonly priority = SystemPriority.DEFAULT;

  private eventQueue: EventQueue | null = null;
  private backgroundMusic: HTMLAudioElement | null = null;
  private soundEffects: Map<string, HTMLAudioElement[]> = new Map();

  constructor() {}

  /**
   * Set EventQueue dependency
   * Must be called before initialize()
   */
  public setEventQueue(eventQueue: EventQueue): void {
    this.eventQueue = eventQueue;
  }

  /**
   * ISystem lifecycle: initialize
   * Subscribe to audio-related events
   */
  public initialize(): void {
    if (!this.eventQueue) {
      throw new Error("AudioSystem requires EventQueue dependency");
    }

    // Subscribe to audio events (SPEC § 2.3.9)
    this.eventQueue.subscribe(
      EventType.GameSceneEnter,
      this.onGameSceneEnter.bind(this),
    );
    this.eventQueue.subscribe(
      EventType.PlayerShoot,
      this.onPlayerShoot.bind(this),
    );
    this.eventQueue.subscribe(EventType.EnemyHit, this.onEnemyHit.bind(this));
    this.eventQueue.subscribe(
      EventType.ButtonClick,
      this.onButtonClick.bind(this),
    );
    this.eventQueue.subscribe(
      EventType.SynthesisTriggered,
      this.onSynthesisTriggered.bind(this),
    );
    this.eventQueue.subscribe(
      EventType.UpgradeSelected,
      this.onUpgradeSelected.bind(this),
    );
  }

  /**
   * ISystem lifecycle: update
   * No per-frame logic needed for audio
   */
  public update(_deltaTime: number): void {
    // Audio playback is event-driven, no per-frame updates needed
  }

  /**
   * ISystem lifecycle: destroy
   * Stop all audio and clean up resources
   */
  public destroy(): void {
    this.stopBackgroundMusic();
    this.soundEffects.clear();

    if (this.eventQueue) {
      this.eventQueue.unsubscribe(
        EventType.GameSceneEnter,
        this.onGameSceneEnter.bind(this),
      );
      this.eventQueue.unsubscribe(
        EventType.PlayerShoot,
        this.onPlayerShoot.bind(this),
      );
      this.eventQueue.unsubscribe(
        EventType.EnemyHit,
        this.onEnemyHit.bind(this),
      );
      this.eventQueue.unsubscribe(
        EventType.ButtonClick,
        this.onButtonClick.bind(this),
      );
      this.eventQueue.unsubscribe(
        EventType.SynthesisTriggered,
        this.onSynthesisTriggered.bind(this),
      );
      this.eventQueue.unsubscribe(
        EventType.UpgradeSelected,
        this.onUpgradeSelected.bind(this),
      );
    }
  }

  /**
   * Start background music
   * SPEC § 2.3.9: 遊戲場景進入時自動播放，循環播放
   */
  private playBackgroundMusic(): void {
    // Avoid duplicate instances (SPEC § 2.3.9 Error Scenarios)
    if (this.backgroundMusic && !this.backgroundMusic.paused) {
      return;
    }

    try {
      this.backgroundMusic = new Audio(AUDIO_FILES.backgroundMusic);
      this.backgroundMusic.loop = true;
      this.backgroundMusic.volume = 0.5;
      this.backgroundMusic
        .play()
        .catch((error) => console.error("Background music play error:", error));
    } catch (error) {
      // SPEC § 2.3.9 Error Scenarios: 記錄錯誤，繼續遊戲
      console.error("Failed to load background music:", error);
    }
  }

  /**
   * Stop background music
   */
  private stopBackgroundMusic(): void {
    if (this.backgroundMusic) {
      this.backgroundMusic.pause();
      this.backgroundMusic.currentTime = 0;
      this.backgroundMusic = null;
    }
  }

  /**
   * Play sound effect
   * SPEC § 2.3.9: 音效可重疊播放
   *
   * @param filePath - Path to sound effect file
   * @param soundKey - Key to track sound instances
   */
  private playSoundEffect(filePath: string, soundKey: string): void {
    try {
      const sound = new Audio(filePath);
      sound.volume = 0.7;

      // Track sound instance for cleanup
      if (!this.soundEffects.has(soundKey)) {
        this.soundEffects.set(soundKey, []);
      }
      this.soundEffects.get(soundKey)!.push(sound);

      // Clean up after playback
      sound.addEventListener("ended", () => {
        const sounds = this.soundEffects.get(soundKey);
        if (sounds) {
          const index = sounds.indexOf(sound);
          if (index > -1) {
            sounds.splice(index, 1);
          }
        }
      });

      sound
        .play()
        .catch((error) =>
          console.error(`Sound effect play error (${soundKey}):`, error),
        );
    } catch (error) {
      // SPEC § 2.3.9 Error Scenarios: 記錄錯誤，繼續遊戲
      console.error(`Failed to load sound effect (${soundKey}):`, error);
    }
  }

  /**
   * Event handler: GameSceneEnter
   * SPEC § 2.3.9: 遊戲場景進入時開始背景音樂
   */
  private onGameSceneEnter(): void {
    this.playBackgroundMusic();
  }

  /**
   * Event handler: PlayerShoot
   * SPEC § 2.3.9: 玩家發射子彈時播放射擊音效
   */
  private onPlayerShoot(): void {
    this.playSoundEffect(AUDIO_FILES.playerShoot, "shoot");
  }

  /**
   * Event handler: EnemyHit
   * SPEC § 2.3.9: 子彈擊中敵人時播放受擊音效
   */
  private onEnemyHit(): void {
    this.playSoundEffect(AUDIO_FILES.enemyHit, "hit");
  }

  /**
   * Event handler: ButtonClick
   * SPEC § 2.3.9: UI 按鈕點擊時播放按鈕音效
   */
  private onButtonClick(): void {
    this.playSoundEffect(AUDIO_FILES.buttonClick, "button");
  }

  /**
   * Event handler: SynthesisTriggered
   * SPEC § 2.3.9: 合成成功時播放按鈕音效
   */
  private onSynthesisTriggered(): void {
    this.playSoundEffect(AUDIO_FILES.buttonClick, "button");
  }

  /**
   * Event handler: UpgradeSelected
   * SPEC § 2.3.9: 升級選擇時播放按鈕音效
   */
  private onUpgradeSelected(): void {
    this.playSoundEffect(AUDIO_FILES.buttonClick, "button");
  }
}
