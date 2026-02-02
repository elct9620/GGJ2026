/**
 * Music Sequencer
 * 樂曲序列器：管理 10 小節循環、追蹤當前小節位置、預排程音符
 */

import { MusicSynthesizer } from "./music-synthesizer";
import {
  MUSIC_CONFIG,
  MusicVariation,
  InstrumentType,
  MAIN_MELODY,
  BASS_LINE,
  VARIATION_MELODY,
  VARIATION_BASS,
  DRUM_PATTERN,
  getBeatDuration,
  getBpmForVariation,
  type MusicVariation as MusicVariationType,
  type NoteData,
  type DrumData,
} from "./music-config";

/**
 * 排程提前量（秒）
 * 在實際播放時間之前多久排程音符
 */
const SCHEDULE_AHEAD_TIME = 0.1;

/**
 * 排程檢查間隔（毫秒）
 */
const SCHEDULE_INTERVAL = 25;

/**
 * Music Sequencer
 * 管理音樂循環、節拍追蹤、音符排程
 */
export class MusicSequencer {
  private synthesizer: MusicSynthesizer;
  private _isPlaying: boolean = false;
  private _currentBar: number = 0;
  private _currentBeat: number = 0;
  private _variation: MusicVariationType = MusicVariation.Normal;

  // 排程相關
  private schedulerInterval: ReturnType<typeof setInterval> | null = null;
  private nextNoteTime: number = 0;

  constructor(synthesizer: MusicSynthesizer) {
    this.synthesizer = synthesizer;
  }

  /**
   * 是否正在播放
   */
  public get isPlaying(): boolean {
    return this._isPlaying;
  }

  /**
   * 目前小節（0-based）
   */
  public get currentBar(): number {
    return this._currentBar;
  }

  /**
   * 目前拍子（0-based）
   */
  public get currentBeat(): number {
    return this._currentBeat;
  }

  /**
   * 目前變奏
   */
  public get variation(): MusicVariationType {
    return this._variation;
  }

  /**
   * 取得目前 BPM
   */
  public get currentBpm(): number {
    return getBpmForVariation(this._variation);
  }

  /**
   * 開始播放
   */
  public start(): void {
    if (this._isPlaying) {
      return;
    }

    if (!this.synthesizer.isInitialized) {
      console.warn("Synthesizer not initialized, cannot start sequencer");
      return;
    }

    this._isPlaying = true;
    this._currentBar = 0;
    this._currentBeat = 0;
    this.nextNoteTime = this.synthesizer.currentTime;

    // 開始排程器
    this.schedulerInterval = setInterval(() => {
      this.scheduleNotes();
    }, SCHEDULE_INTERVAL);
  }

  /**
   * 停止播放
   */
  public stop(): void {
    if (!this._isPlaying) {
      return;
    }

    this._isPlaying = false;

    if (this.schedulerInterval !== null) {
      clearInterval(this.schedulerInterval);
      this.schedulerInterval = null;
    }

    this._currentBar = 0;
    this._currentBeat = 0;
  }

  /**
   * 設定變奏
   */
  public setVariation(variation: MusicVariationType): void {
    this._variation = variation;
  }

  /**
   * 排程音符
   * 持續檢查並排程即將到來的音符
   */
  private scheduleNotes(): void {
    if (!this._isPlaying) {
      return;
    }

    const currentTime = this.synthesizer.currentTime;
    const beatDuration = getBeatDuration(this.currentBpm);

    // 排程所有在提前時間內的音符
    while (this.nextNoteTime < currentTime + SCHEDULE_AHEAD_TIME) {
      this.scheduleCurrentBeat(this.nextNoteTime, beatDuration);

      // 前進到下一拍
      this.advanceBeat();
      this.nextNoteTime += beatDuration;
    }
  }

  /**
   * 排程當前拍的音符
   */
  private scheduleCurrentBeat(time: number, beatDuration: number): void {
    const bar = this._currentBar;
    const beat = this._currentBeat;

    // 取得當前位置的旋律和低音
    const melodyNote = this.getMelodyNote(bar, beat);
    const bassNote = this.getBassNote(bar, beat);

    // 排程旋律
    if (melodyNote) {
      this.synthesizer.playNoteByName(
        melodyNote.note,
        InstrumentType.Lead,
        time,
        beatDuration * melodyNote.duration,
      );
    }

    // 排程低音
    if (bassNote) {
      this.synthesizer.playNoteByName(
        bassNote.note,
        InstrumentType.Bass,
        time,
        beatDuration * bassNote.duration,
      );
    }

    // 排程鼓點
    this.scheduleDrums(time, beat);
  }

  /**
   * 取得當前位置的旋律音符
   */
  private getMelodyNote(bar: number, beat: number): NoteData | null {
    const melody = this.getMelodyForBar(bar);
    const index = this.getBeatIndexInSection(bar, beat);

    if (index >= 0 && index < melody.length) {
      return melody[index];
    }

    return null;
  }

  /**
   * 取得當前位置的低音音符
   */
  private getBassNote(bar: number, beat: number): NoteData | null {
    const bass = this.getBassForBar(bar);
    const index = this.getBeatIndexInSection(bar, beat);

    if (index >= 0 && index < bass.length) {
      return bass[index];
    }

    return null;
  }

  /**
   * 根據小節取得旋律
   * 小節 0-3: 主旋律 A
   * 小節 4-7: 主旋律 A（重複）
   * 小節 8-9: 變奏 B
   */
  private getMelodyForBar(bar: number): NoteData[] {
    const normalizedBar = bar % MUSIC_CONFIG.barsInCycle;

    if (normalizedBar < 4) {
      return MAIN_MELODY;
    } else if (normalizedBar < 8) {
      return MAIN_MELODY;
    } else {
      return VARIATION_MELODY;
    }
  }

  /**
   * 根據小節取得低音線
   */
  private getBassForBar(bar: number): NoteData[] {
    const normalizedBar = bar % MUSIC_CONFIG.barsInCycle;

    if (normalizedBar < 4) {
      return BASS_LINE;
    } else if (normalizedBar < 8) {
      return BASS_LINE;
    } else {
      return VARIATION_BASS;
    }
  }

  /**
   * 計算拍子在當前區段中的索引
   */
  private getBeatIndexInSection(bar: number, beat: number): number {
    const normalizedBar = bar % MUSIC_CONFIG.barsInCycle;
    let barInSection: number;

    if (normalizedBar < 4) {
      barInSection = normalizedBar;
    } else if (normalizedBar < 8) {
      barInSection = normalizedBar - 4;
    } else {
      barInSection = normalizedBar - 8;
    }

    return barInSection * MUSIC_CONFIG.beatsPerBar + beat;
  }

  /**
   * 排程鼓點
   */
  private scheduleDrums(time: number, beat: number): void {
    const drums = this.getDrumsForBeat(beat);

    for (const drum of drums) {
      this.synthesizer.playDrumHit(drum.type, time);
    }
  }

  /**
   * 取得當前拍子的鼓點
   */
  private getDrumsForBeat(beat: number): DrumData[] {
    return DRUM_PATTERN.filter((drum) => drum.beat === beat);
  }

  /**
   * 前進到下一拍
   */
  private advanceBeat(): void {
    this._currentBeat++;

    if (this._currentBeat >= MUSIC_CONFIG.beatsPerBar) {
      this._currentBeat = 0;
      this._currentBar++;

      // 循環 10 小節
      if (this._currentBar >= MUSIC_CONFIG.barsInCycle) {
        this._currentBar = 0;
      }
    }
  }

  /**
   * 清理資源
   */
  public destroy(): void {
    this.stop();
  }
}
