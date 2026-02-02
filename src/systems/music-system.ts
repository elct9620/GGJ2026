/**
 * Music System
 * 背景音樂系統：整合 WebAudioAPI 合成音樂、事件驅動變奏切換
 *
 * Requirements:
 * - 使用 WebAudioAPI 合成程式化背景音樂
 * - 夜市主題的歡樂大調
 * - 10 小節循環結構（4+4+2）
 * - 三種遊戲狀態變奏（Normal/Intense/Victory）
 * - 事件驅動變奏切換（WaveStart/WaveComplete/PlayerDeath）
 * - 延遲初始化（瀏覽器 autoplay 政策）
 */

import { SystemPriority } from "../core/systems/system.interface";
import { InjectableSystem } from "../core/systems/injectable";
import type { EventQueue } from "./event-queue";
import { EventType } from "./event-queue";
import { DependencyKeys } from "../core/systems/dependency-keys";
import { MusicSynthesizer } from "../audio/music-synthesizer";
import { MusicSequencer } from "../audio/music-sequencer";
import { MusicVariation, MUSIC_CONFIG } from "../audio/music-config";

/**
 * Music System
 * 管理背景音樂播放、變奏切換
 */
export class MusicSystem extends InjectableSystem {
  public readonly name = "MusicSystem";
  public readonly priority = SystemPriority.DEFAULT;

  private synthesizer: MusicSynthesizer;
  private sequencer: MusicSequencer;
  private _isStarted: boolean = false;

  constructor() {
    super();
    this.declareDependency(DependencyKeys.EventQueue, true);

    this.synthesizer = new MusicSynthesizer();
    this.sequencer = new MusicSequencer(this.synthesizer);
  }

  /**
   * Get EventQueue dependency
   */
  private get eventQueue(): EventQueue {
    return this.getDependency<EventQueue>(DependencyKeys.EventQueue);
  }

  /**
   * 是否已開始播放
   */
  public get isStarted(): boolean {
    return this._isStarted;
  }

  /**
   * 是否正在播放
   */
  public get isPlaying(): boolean {
    return this.sequencer.isPlaying;
  }

  /**
   * 目前變奏
   */
  public get currentVariation(): string {
    return this.sequencer.variation;
  }

  /**
   * 目前 BPM
   */
  public get currentBpm(): number {
    return this.sequencer.currentBpm;
  }

  /**
   * System lifecycle: initialize
   * 訂閱事件（不立即開始播放，等待使用者互動）
   */
  public initialize(): void {
    this.subscribeToEvents();
  }

  /**
   * System lifecycle: update
   * 音樂系統為事件驅動 + 內部排程器，不需要每幀更新
   */
  public update(_deltaTime: number): void {
    // No per-frame update needed
  }

  /**
   * System lifecycle: destroy
   */
  public destroy(): void {
    this.stop();
    this.sequencer.destroy();
    this.synthesizer.destroy();
  }

  /**
   * 訂閱遊戲事件
   */
  private subscribeToEvents(): void {
    // 訂閱 WaveStart：切換 Normal 或 Intense 變奏
    this.eventQueue.subscribe(EventType.WaveStart, (data) => {
      this.onWaveStart(data.waveNumber);
    });

    // 訂閱 WaveComplete：切換 Victory 變奏
    this.eventQueue.subscribe(EventType.WaveComplete, () => {
      this.onWaveComplete();
    });

    // 訂閱 PlayerDeath：停止音樂
    this.eventQueue.subscribe(EventType.PlayerDeath, () => {
      this.onPlayerDeath();
    });
  }

  /**
   * 處理 WaveStart 事件
   * Boss 波次（每 5 波）使用 Intense 變奏
   */
  private onWaveStart(waveNumber: number): void {
    const isBossWave = waveNumber % 5 === 0;
    const variation = isBossWave
      ? MusicVariation.Intense
      : MusicVariation.Normal;

    this.sequencer.setVariation(variation);
  }

  /**
   * 處理 WaveComplete 事件
   * 切換到 Victory 變奏
   */
  private onWaveComplete(): void {
    this.sequencer.setVariation(MusicVariation.Victory);
  }

  /**
   * 處理 PlayerDeath 事件
   * 停止音樂
   */
  private onPlayerDeath(): void {
    this.stop();
  }

  /**
   * 開始播放音樂
   * 必須在使用者互動後呼叫（瀏覽器 autoplay 政策）
   *
   * @returns 是否成功開始播放
   */
  public start(): boolean {
    if (this._isStarted) {
      return true;
    }

    // 初始化合成器（延遲初始化）
    if (!this.synthesizer.initialize()) {
      console.warn("Failed to initialize music synthesizer");
      return false;
    }

    // 恢復 AudioContext（若被暫停）
    this.synthesizer.resume();

    // 開始序列器
    this.sequencer.start();
    this._isStarted = true;

    return true;
  }

  /**
   * 停止播放音樂
   */
  public stop(): void {
    this.sequencer.stop();
    this._isStarted = false;
  }

  /**
   * 暫停/繼續播放
   */
  public togglePlayback(): void {
    if (this.sequencer.isPlaying) {
      this.sequencer.stop();
    } else if (this._isStarted) {
      this.synthesizer.resume();
      this.sequencer.start();
    }
  }

  /**
   * 設定音量（0.0 - 1.0）
   */
  public setVolume(volume: number): void {
    this.synthesizer.setVolume(volume);
  }

  /**
   * 取得目前音量
   */
  public getVolume(): number {
    return this.synthesizer.getVolume();
  }

  /**
   * 手動設定變奏（用於測試或特殊情況）
   */
  public setVariation(
    variation: (typeof MusicVariation)[keyof typeof MusicVariation],
  ): void {
    this.sequencer.setVariation(variation);
  }

  /**
   * 重置音樂系統
   */
  public reset(): void {
    this.stop();
    this.sequencer.setVariation(MusicVariation.Normal);
    this.synthesizer.setVolume(MUSIC_CONFIG.defaultVolume);
  }
}
