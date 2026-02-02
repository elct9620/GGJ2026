/**
 * Music Configuration
 * 音樂系統配置：BPM、拍號、音階頻率、變奏類型
 */

/**
 * 音樂變奏類型
 */
export const MusicVariation = {
  Normal: "normal", // 一般遊戲：150 BPM 爽快節奏
  Intense: "intense", // Boss 波次：+15 BPM，更激烈
  Victory: "victory", // 波次完成：稍慢但仍保持活力
} as const;

export type MusicVariation =
  (typeof MusicVariation)[keyof typeof MusicVariation];

/**
 * 音樂常數配置
 */
export const MUSIC_CONFIG = {
  // 基本設定 - 爽快殺怪風格
  baseBpm: 150,
  beatsPerBar: 4,
  barsInCycle: 10, // 4+4+2 = 10 小節循環

  // 變奏 BPM 調整
  intenseBpmBonus: 15, // Boss 戰更激烈
  victoryBpmReduction: 10, // 勝利時仍保持活力

  // 音量控制
  defaultVolume: 0.5,
  maxVolume: 1.0,
  minVolume: 0.0,

  // 樂曲結構
  mainMelodyBars: 4, // 主旋律 A (小節 1-4)
  repeatBars: 4, // 主旋律 A 重複 (小節 5-8)
  variationBars: 2, // 變奏 B (小節 9-10)
} as const;

/**
 * C 大調音階頻率對照表 (Hz)
 * 標準調音 A4 = 440Hz
 */
export const NOTE_FREQUENCIES: Record<string, number> = {
  // 低音 (Octave 3)
  C3: 130.81,
  D3: 146.83,
  E3: 164.81,
  F3: 174.61,
  G3: 196.0,
  A3: 220.0,
  B3: 246.94,

  // 中音 (Octave 4)
  C4: 261.63,
  D4: 293.66,
  E4: 329.63,
  F4: 349.23,
  G4: 392.0,
  A4: 440.0,
  B4: 493.88,

  // 高音 (Octave 5)
  C5: 523.25,
  D5: 587.33,
  E5: 659.26,
  F5: 698.46,
  G5: 783.99,
  A5: 880.0,
  B5: 987.77,

  // 休止符
  REST: 0,
} as const;

/**
 * 樂器類型
 */
export const InstrumentType = {
  Lead: "lead", // 主旋律 (Square wave)
  Bass: "bass", // 低音 (Sawtooth wave)
} as const;

export type InstrumentType =
  (typeof InstrumentType)[keyof typeof InstrumentType];

/**
 * 鼓聲類型
 */
export const DrumType = {
  Kick: "kick",
  Snare: "snare",
  HiHat: "hihat",
} as const;

export type DrumType = (typeof DrumType)[keyof typeof DrumType];

/**
 * 音符資料結構
 */
export interface NoteData {
  note: string; // 音符名稱 (e.g., "C4", "REST")
  duration: number; // 持續時間 (拍數)
}

/**
 * 鼓點資料結構
 */
export interface DrumData {
  type: DrumType;
  beat: number; // 拍子位置 (0-based)
}

/**
 * 主旋律 (4 小節，16 拍) - 爽快密集版
 * Bar 1: C5 E5 G5 E5   (高音琶音衝擊)
 * Bar 2: A5 G5 E5 C5   (快速下行)
 * Bar 3: F5 G5 A5 G5   (上升張力)
 * Bar 4: E5 D5 C5 G4   (解決回主音)
 */
export const MAIN_MELODY: NoteData[] = [
  // Bar 1 - 高音開場
  { note: "C5", duration: 1 },
  { note: "E5", duration: 1 },
  { note: "G5", duration: 1 },
  { note: "E5", duration: 1 },
  // Bar 2 - 快速下行
  { note: "A5", duration: 1 },
  { note: "G5", duration: 1 },
  { note: "E5", duration: 1 },
  { note: "C5", duration: 1 },
  // Bar 3 - 上升張力
  { note: "F5", duration: 1 },
  { note: "G5", duration: 1 },
  { note: "A5", duration: 1 },
  { note: "G5", duration: 1 },
  // Bar 4 - 解決
  { note: "E5", duration: 1 },
  { note: "D5", duration: 1 },
  { note: "C5", duration: 1 },
  { note: "G4", duration: 1 },
];

/**
 * 低音線 (4 小節) - 強力跳動版
 * Bar 1: C3 C3 G3 C3   (根音跳動)
 * Bar 2: A3 A3 E3 A3   (Am 和弦跳動)
 * Bar 3: F3 F3 C3 F3   (F 和弦跳動)
 * Bar 4: G3 G3 D3 G3   (G 和弦導回)
 */
export const BASS_LINE: NoteData[] = [
  // Bar 1 - 根音跳動
  { note: "C3", duration: 1 },
  { note: "C3", duration: 1 },
  { note: "G3", duration: 1 },
  { note: "C3", duration: 1 },
  // Bar 2 - Am 跳動
  { note: "A3", duration: 1 },
  { note: "A3", duration: 1 },
  { note: "E3", duration: 1 },
  { note: "A3", duration: 1 },
  // Bar 3 - F 跳動
  { note: "F3", duration: 1 },
  { note: "F3", duration: 1 },
  { note: "C3", duration: 1 },
  { note: "F3", duration: 1 },
  // Bar 4 - G 導回
  { note: "G3", duration: 1 },
  { note: "G3", duration: 1 },
  { note: "D3", duration: 1 },
  { note: "G3", duration: 1 },
];

/**
 * 變奏旋律 (2 小節，8 拍) - 爆發版
 * Bar 1: G5 A5 G5 E5   (高音跳躍)
 * Bar 2: C5 D5 E5 G5   (上行衝刺)
 */
export const VARIATION_MELODY: NoteData[] = [
  // Bar 1 - 高音跳躍
  { note: "G5", duration: 1 },
  { note: "A5", duration: 1 },
  { note: "G5", duration: 1 },
  { note: "E5", duration: 1 },
  // Bar 2 - 上行衝刺
  { note: "C5", duration: 1 },
  { note: "D5", duration: 1 },
  { note: "E5", duration: 1 },
  { note: "G5", duration: 1 },
];

/**
 * 變奏低音線 (2 小節) - 強力版
 */
export const VARIATION_BASS: NoteData[] = [
  // Bar 1 - 跳動
  { note: "C3", duration: 1 },
  { note: "G3", duration: 1 },
  { note: "A3", duration: 1 },
  { note: "E3", duration: 1 },
  // Bar 2 - 導回
  { note: "F3", duration: 1 },
  { note: "C3", duration: 1 },
  { note: "G3", duration: 1 },
  { note: "G3", duration: 1 },
];

/**
 * 爽快 4/4 拍鼓點 (每小節) - 強化節奏版
 * Beat: 1   2   3   4
 * Kick: X   X   X   X   (每拍都有 kick)
 * Snare:    X       X   (2, 4 拍)
 * HiHat:X   X   X   X   (每拍)
 */
export const DRUM_PATTERN: DrumData[] = [
  // Beat 0
  { type: DrumType.Kick, beat: 0 },
  { type: DrumType.HiHat, beat: 0 },
  // Beat 1
  { type: DrumType.Kick, beat: 1 },
  { type: DrumType.Snare, beat: 1 },
  { type: DrumType.HiHat, beat: 1 },
  // Beat 2
  { type: DrumType.Kick, beat: 2 },
  { type: DrumType.HiHat, beat: 2 },
  // Beat 3
  { type: DrumType.Kick, beat: 3 },
  { type: DrumType.Snare, beat: 3 },
  { type: DrumType.HiHat, beat: 3 },
];

/**
 * 根據 BPM 計算每拍的持續時間（秒）
 */
export function getBeatDuration(bpm: number): number {
  return 60 / bpm;
}

/**
 * 根據變奏類型取得 BPM
 */
export function getBpmForVariation(variation: MusicVariation): number {
  switch (variation) {
    case MusicVariation.Intense:
      return MUSIC_CONFIG.baseBpm + MUSIC_CONFIG.intenseBpmBonus;
    case MusicVariation.Victory:
      return MUSIC_CONFIG.baseBpm - MUSIC_CONFIG.victoryBpmReduction;
    case MusicVariation.Normal:
    default:
      return MUSIC_CONFIG.baseBpm;
  }
}
