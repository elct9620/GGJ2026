/**
 * Music Synthesizer
 * WebAudioAPI 合成引擎：音符播放、鼓聲合成、ADSR 包絡線
 */

import {
  NOTE_FREQUENCIES,
  InstrumentType,
  DrumType,
  type InstrumentType as InstrumentTypeValue,
  type DrumType as DrumTypeValue,
} from "./music-config";

/**
 * ADSR 包絡線配置
 */
interface ADSRConfig {
  attack: number; // 起音時間（秒）
  decay: number; // 衰減時間（秒）
  sustain: number; // 持續音量（0-1）
  release: number; // 釋放時間（秒）
}

/**
 * 各樂器的 ADSR 配置
 */
const INSTRUMENT_ADSR: Record<InstrumentTypeValue, ADSRConfig> = {
  [InstrumentType.Lead]: {
    attack: 0.01,
    decay: 0.1,
    sustain: 0.6,
    release: 0.2,
  },
  [InstrumentType.Bass]: {
    attack: 0.02,
    decay: 0.15,
    sustain: 0.5,
    release: 0.15,
  },
};

/**
 * 各樂器的波形類型
 */
const INSTRUMENT_WAVEFORM: Record<InstrumentTypeValue, OscillatorType> = {
  [InstrumentType.Lead]: "square",
  [InstrumentType.Bass]: "sawtooth",
};

/**
 * 各樂器的基礎音量
 */
const INSTRUMENT_VOLUME: Record<InstrumentTypeValue, number> = {
  [InstrumentType.Lead]: 0.3,
  [InstrumentType.Bass]: 0.4,
};

/**
 * 鼓聲音量配置
 */
const DRUM_VOLUME: Record<DrumTypeValue, number> = {
  [DrumType.Kick]: 0.5,
  [DrumType.Snare]: 0.4,
  [DrumType.HiHat]: 0.15,
};

/**
 * Music Synthesizer
 * 使用 WebAudioAPI 合成音樂
 */
export class MusicSynthesizer {
  private audioContext: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private _volume: number = 0.5;
  private _isInitialized: boolean = false;

  /**
   * 是否已初始化
   */
  public get isInitialized(): boolean {
    return this._isInitialized;
  }

  /**
   * 取得當前時間（用於排程）
   */
  public get currentTime(): number {
    return this.audioContext?.currentTime ?? 0;
  }

  /**
   * 延遲初始化 AudioContext
   * 必須在使用者互動後呼叫（瀏覽器 autoplay 政策）
   */
  public initialize(): boolean {
    if (this._isInitialized) {
      return true;
    }

    try {
      // 建立 AudioContext（支援 Safari 的 webkitAudioContext）
      const AudioContextClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext;

      if (!AudioContextClass) {
        console.warn("WebAudioAPI not supported");
        return false;
      }

      this.audioContext = new AudioContextClass();
      this.masterGain = this.audioContext.createGain();
      this.masterGain.gain.value = this._volume;
      this.masterGain.connect(this.audioContext.destination);

      this._isInitialized = true;
      return true;
    } catch (error) {
      console.warn("Failed to initialize AudioContext:", error);
      return false;
    }
  }

  /**
   * 恢復 AudioContext（若被暫停）
   */
  public async resume(): Promise<void> {
    if (this.audioContext && this.audioContext.state === "suspended") {
      try {
        await this.audioContext.resume();
      } catch (error) {
        console.warn("Failed to resume AudioContext:", error);
      }
    }
  }

  /**
   * 播放音符（帶 ADSR 包絡線）
   *
   * @param frequency 頻率 (Hz)，0 表示休止符
   * @param instrument 樂器類型
   * @param startTime 開始時間（AudioContext.currentTime）
   * @param duration 持續時間（秒）
   */
  public playNote(
    frequency: number,
    instrument: InstrumentTypeValue,
    startTime: number,
    duration: number,
  ): void {
    if (!this.audioContext || !this.masterGain) {
      return;
    }

    // 休止符：不播放
    if (frequency <= 0) {
      return;
    }

    const adsr = INSTRUMENT_ADSR[instrument];
    const waveform = INSTRUMENT_WAVEFORM[instrument];
    const baseVolume = INSTRUMENT_VOLUME[instrument];

    // 建立振盪器
    const oscillator = this.audioContext.createOscillator();
    oscillator.type = waveform;
    oscillator.frequency.value = frequency;

    // 建立音量包絡線（Gain Node）
    const envelope = this.audioContext.createGain();
    envelope.gain.setValueAtTime(0, startTime);

    // ADSR 包絡線
    const peakTime = startTime + adsr.attack;
    const sustainTime = peakTime + adsr.decay;
    const releaseTime = startTime + duration;

    // Attack: 0 -> 1
    envelope.gain.linearRampToValueAtTime(baseVolume, peakTime);

    // Decay: 1 -> sustain
    envelope.gain.linearRampToValueAtTime(
      baseVolume * adsr.sustain,
      sustainTime,
    );

    // Sustain: 維持 sustain 音量直到 release
    envelope.gain.setValueAtTime(baseVolume * adsr.sustain, releaseTime);

    // Release: sustain -> 0
    envelope.gain.linearRampToValueAtTime(0, releaseTime + adsr.release);

    // 連接音頻節點
    oscillator.connect(envelope);
    envelope.connect(this.masterGain);

    // 排程開始與停止
    oscillator.start(startTime);
    oscillator.stop(releaseTime + adsr.release);
  }

  /**
   * 使用音符名稱播放音符
   *
   * @param note 音符名稱 (e.g., "C4", "REST")
   * @param instrument 樂器類型
   * @param startTime 開始時間
   * @param duration 持續時間（秒）
   */
  public playNoteByName(
    note: string,
    instrument: InstrumentTypeValue,
    startTime: number,
    duration: number,
  ): void {
    const frequency = NOTE_FREQUENCIES[note] ?? 0;
    this.playNote(frequency, instrument, startTime, duration);
  }

  /**
   * 播放鼓聲
   *
   * @param type 鼓聲類型
   * @param startTime 開始時間
   */
  public playDrumHit(type: DrumTypeValue, startTime: number): void {
    if (!this.audioContext || !this.masterGain) {
      return;
    }

    const volume = DRUM_VOLUME[type];

    switch (type) {
      case DrumType.Kick:
        this.playKick(startTime, volume);
        break;
      case DrumType.Snare:
        this.playSnare(startTime, volume);
        break;
      case DrumType.HiHat:
        this.playHiHat(startTime, volume);
        break;
    }
  }

  /**
   * 播放 Kick 鼓聲
   * 使用低頻正弦波 + 頻率下降
   */
  private playKick(startTime: number, volume: number): void {
    if (!this.audioContext || !this.masterGain) return;

    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();

    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(150, startTime);
    oscillator.frequency.exponentialRampToValueAtTime(50, startTime + 0.1);

    gainNode.gain.setValueAtTime(volume, startTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + 0.3);

    oscillator.connect(gainNode);
    gainNode.connect(this.masterGain);

    oscillator.start(startTime);
    oscillator.stop(startTime + 0.3);
  }

  /**
   * 播放 Snare 鼓聲
   * 使用白噪音 + 三角波混合
   */
  private playSnare(startTime: number, volume: number): void {
    if (!this.audioContext || !this.masterGain) return;

    // 噪音部分
    const noiseBuffer = this.createNoiseBuffer(0.2);
    const noiseSource = this.audioContext.createBufferSource();
    noiseSource.buffer = noiseBuffer;

    const noiseGain = this.audioContext.createGain();
    noiseGain.gain.setValueAtTime(volume * 0.6, startTime);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.15);

    // 高通濾波器（讓 snare 更清脆）
    const highpass = this.audioContext.createBiquadFilter();
    highpass.type = "highpass";
    highpass.frequency.value = 1000;

    noiseSource.connect(highpass);
    highpass.connect(noiseGain);
    noiseGain.connect(this.masterGain);

    noiseSource.start(startTime);
    noiseSource.stop(startTime + 0.2);

    // 音調部分（三角波）
    const oscillator = this.audioContext.createOscillator();
    oscillator.type = "triangle";
    oscillator.frequency.value = 180;

    const oscGain = this.audioContext.createGain();
    oscGain.gain.setValueAtTime(volume * 0.4, startTime);
    oscGain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.08);

    oscillator.connect(oscGain);
    oscGain.connect(this.masterGain);

    oscillator.start(startTime);
    oscillator.stop(startTime + 0.1);
  }

  /**
   * 播放 Hi-Hat 鼓聲
   * 使用高頻白噪音
   */
  private playHiHat(startTime: number, volume: number): void {
    if (!this.audioContext || !this.masterGain) return;

    const noiseBuffer = this.createNoiseBuffer(0.05);
    const noiseSource = this.audioContext.createBufferSource();
    noiseSource.buffer = noiseBuffer;

    const noiseGain = this.audioContext.createGain();
    noiseGain.gain.setValueAtTime(volume, startTime);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.03);

    // 高通濾波器（讓 hi-hat 更尖銳）
    const highpass = this.audioContext.createBiquadFilter();
    highpass.type = "highpass";
    highpass.frequency.value = 7000;

    noiseSource.connect(highpass);
    highpass.connect(noiseGain);
    noiseGain.connect(this.masterGain);

    noiseSource.start(startTime);
    noiseSource.stop(startTime + 0.05);
  }

  /**
   * 建立白噪音緩衝區
   */
  private createNoiseBuffer(duration: number): AudioBuffer {
    if (!this.audioContext) {
      throw new Error("AudioContext not initialized");
    }

    const sampleRate = this.audioContext.sampleRate;
    const bufferSize = Math.ceil(sampleRate * duration);
    const buffer = this.audioContext.createBuffer(1, bufferSize, sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    return buffer;
  }

  /**
   * 設定音量（0.0 - 1.0）
   */
  public setVolume(volume: number): void {
    this._volume = Math.max(0, Math.min(1, volume));

    if (this.masterGain) {
      this.masterGain.gain.value = this._volume;
    }
  }

  /**
   * 取得目前音量
   */
  public getVolume(): number {
    return this._volume;
  }

  /**
   * 清理資源
   */
  public destroy(): void {
    if (this.audioContext) {
      this.audioContext.close().catch(() => {
        // 忽略關閉錯誤
      });
      this.audioContext = null;
      this.masterGain = null;
      this._isInitialized = false;
    }
  }
}
