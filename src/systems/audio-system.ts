/**
 * Audio System (SPEC § 2.3.9)
 * 音效系統：管理遊戲音效播放、音量控制、預載入
 *
 * Requirements:
 * - 預載入所有音效（遊戲啟動時，背景非阻塞載入）
 * - 不重疊播放音效（每個音效 ID 同時只播放一個實例）
 * - 音量控制（0.0 - 1.0，自動限制範圍）
 * - 事件驅動播放（訂閱 BulletFired, EnemyHit, ButtonClicked 事件）
 * - 靜默錯誤處理（音效載入失敗不阻擋遊戲進行）
 */

import { SystemPriority } from "../core/systems/system.interface";
import { InjectableSystem } from "../core/systems/injectable";
import type { EventQueue } from "./event-queue";
import { EventType } from "./event-queue";
import { DependencyKeys } from "../core/systems/dependency-keys";

// Import audio files using Vite's static import
import buttonClickSound from "../assets/se/select03.mp3";
import enemyHitSound from "../assets/se/short_punch1.mp3";
import playerShootSound from "../assets/se/shoot5.mp3";

/**
 * 音效 ID 定義
 */
export const SoundId = {
  ButtonClick: "button_click",
  EnemyHit: "enemy_hit",
  PlayerShoot: "player_shoot",
} as const;

export type SoundId = (typeof SoundId)[keyof typeof SoundId];

/**
 * 音效檔案路徑映射（使用 Vite 靜態匯入）
 */
const SOUND_PATHS: Record<SoundId, string> = {
  [SoundId.ButtonClick]: buttonClickSound,
  [SoundId.EnemyHit]: enemyHitSound,
  [SoundId.PlayerShoot]: playerShootSound,
};

/**
 * Audio System (SPEC § 2.3.9)
 * 負責音效播放、音量控制、預載入
 *
 * 事件驅動架構，不需要每幀更新
 * 音效載入失敗靜默處理，不阻擋遊戲進行
 */
export class AudioSystem extends InjectableSystem {
  public readonly name = "AudioSystem";
  public readonly priority = SystemPriority.DEFAULT;

  // 音效緩存（預載入的 HTMLAudioElement）
  private sounds: Map<SoundId, HTMLAudioElement> = new Map();

  // 當前播放中的音效實例（用於不重疊播放）
  private currentlyPlaying: Map<SoundId, HTMLAudioElement> = new Map();

  // 音量控制（0.0 - 1.0）
  private _volume: number = 1.0;

  constructor() {
    super();
    this.declareDependency(DependencyKeys.EventQueue, true); // Required dependency
  }

  /**
   * Get EventQueue dependency
   */
  private get eventQueue(): EventQueue {
    return this.getDependency<EventQueue>(DependencyKeys.EventQueue);
  }

  /**
   * System lifecycle: initialize
   * 訂閱事件並開始預載入音效（非阻塞）
   */
  public initialize(): void {
    // 訂閱事件
    this.subscribeToEvents();

    // 開始預載入音效（非阻塞，背景執行）
    this.preloadSounds();
  }

  /**
   * System lifecycle: update
   * AudioSystem 為事件驅動，不需要每幀更新
   */
  public update(_deltaTime: number): void {
    // No per-frame update needed
  }

  /**
   * System lifecycle: destroy
   */
  public destroy(): void {
    // 停止所有播放中的音效
    this.currentlyPlaying.forEach((audio) => {
      audio.pause();
      audio.currentTime = 0;
    });
    this.currentlyPlaying.clear();

    // 清空音效緩存
    this.sounds.clear();
  }

  /**
   * 訂閱遊戲事件
   */
  private subscribeToEvents(): void {
    this.eventQueue.subscribe(
      EventType.BulletFired,
      this.onBulletFired.bind(this),
    );
    this.eventQueue.subscribe(EventType.EnemyHit, this.onEnemyHit.bind(this));
    this.eventQueue.subscribe(
      EventType.ButtonClicked,
      this.onButtonClicked.bind(this),
    );
  }

  /**
   * 預載入所有音效（非阻塞）
   */
  private preloadSounds(): void {
    const loadPromises: Promise<void>[] = [];

    for (const [soundId, path] of Object.entries(SOUND_PATHS)) {
      const promise = this.loadSound(soundId as SoundId, path);
      loadPromises.push(promise);
    }

    // 背景執行，不阻塞初始化
    Promise.all(loadPromises).catch((error) => {
      // 靜默失敗：音效載入失敗不阻擋遊戲
      console.warn("Audio preload failed (game continues):", error);
    });
  }

  /**
   * 載入單一音效檔案
   */
  private loadSound(soundId: SoundId, path: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const audio = new Audio(path);
      audio.volume = this._volume;

      audio.addEventListener(
        "canplaythrough",
        () => {
          this.sounds.set(soundId, audio);
          resolve();
        },
        { once: true },
      );

      audio.addEventListener(
        "error",
        (e) => {
          console.warn(`Failed to load sound: ${soundId} (${path})`, e);
          reject(e);
        },
        { once: true },
      );

      // 開始載入
      audio.load();
    });
  }

  /**
   * 播放音效（不重疊播放，SPEC § 2.3.9）
   * 若該音效已在播放中，停止前一個實例再播放新的
   * 不同音效 ID 可同時播放
   */
  private playSound(soundId: SoundId): void {
    // 若音效尚未載入，靜默失敗
    if (!this.sounds.has(soundId)) {
      return;
    }

    // 若該音效正在播放，停止前一個實例
    const currentInstance = this.currentlyPlaying.get(soundId);
    if (currentInstance) {
      currentInstance.pause();
      currentInstance.currentTime = 0;
    }

    // 播放新實例
    const audio = this.sounds.get(soundId)!;
    audio.currentTime = 0;
    audio.volume = this._volume;

    // 使用 Promise 處理 play() 可能的錯誤（瀏覽器 autoplay policy）
    const playPromise = audio.play();
    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          // 播放成功，記錄當前播放實例
          this.currentlyPlaying.set(soundId, audio);
        })
        .catch((error) => {
          // 靜默失敗：播放失敗不阻擋遊戲（可能是 autoplay policy）
          console.warn(`Failed to play sound: ${soundId}`, error);
        });
    }

    // 播放結束後移除記錄
    audio.addEventListener(
      "ended",
      () => {
        if (this.currentlyPlaying.get(soundId) === audio) {
          this.currentlyPlaying.delete(soundId);
        }
      },
      { once: true },
    );
  }

  /**
   * 設定音量（0.0 - 1.0）
   */
  public setVolume(volume: number): void {
    // 限制範圍 0.0 - 1.0
    this._volume = Math.max(0, Math.min(1, volume));

    // 更新所有音效的音量
    this.sounds.forEach((audio) => {
      audio.volume = this._volume;
    });

    // 更新當前播放中的音效音量
    this.currentlyPlaying.forEach((audio) => {
      audio.volume = this._volume;
    });
  }

  /**
   * 事件處理：子彈發射
   */
  private onBulletFired(): void {
    this.playSound(SoundId.PlayerShoot);
  }

  /**
   * 事件處理：敵人被擊中
   */
  private onEnemyHit(): void {
    this.playSound(SoundId.EnemyHit);
  }

  /**
   * 事件處理：按鈕點擊
   */
  private onButtonClicked(): void {
    this.playSound(SoundId.ButtonClick);
  }
}
