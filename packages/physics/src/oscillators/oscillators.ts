const TWO_PI = Math.PI * 2;

/** Sine wave: `amplitude * sin(2*pi*freq*t + phase)`. */
export function sine(t: number, freq: number, phase = 0, amplitude = 1): number {
  return amplitude * Math.sin(TWO_PI * freq * t + phase);
}

/** Band-limited-naive square wave in `[-amplitude, amplitude]`. `duty` in `(0, 1)`
 * controls the fraction of each period spent at the high level. */
export function square(t: number, freq: number, phase = 0, amplitude = 1, duty = 0.5): number {
  const cyclePos = wrapUnit(freq * t + phase / TWO_PI);
  return cyclePos < duty ? amplitude : -amplitude;
}

/** Sawtooth wave ramping linearly from `-amplitude` to `amplitude` each period. */
export function sawtooth(t: number, freq: number, phase = 0, amplitude = 1): number {
  const cyclePos = wrapUnit(freq * t + phase / TWO_PI);
  return amplitude * (2 * cyclePos - 1);
}

/** Triangle wave ramping linearly between `-amplitude` and `amplitude`. */
export function triangle(t: number, freq: number, phase = 0, amplitude = 1): number {
  const cyclePos = wrapUnit(freq * t + phase / TWO_PI);
  return amplitude * (4 * Math.abs(cyclePos - 0.5) - 1);
}

function wrapUnit(v: number): number {
  const r = v - Math.floor(v);
  return r < 0 ? r + 1 : r;
}

export type AdsrStage = "idle" | "attack" | "decay" | "sustain" | "release";

/**
 * Classic Attack/Decay/Sustain/Release envelope generator, stateful across calls so
 * it can drive per-frame amplitude for any oscillator (shared between physics-driven
 * visuals today and audio synthesis later). Times are in seconds; `sustainLevel` in `[0, 1]`.
 */
export class AdsrEnvelope {
  attack: number;
  decay: number;
  sustainLevel: number;
  release: number;

  private stage: AdsrStage = "idle";
  private stageStartTime = 0;
  private levelAtStageStart = 0;

  constructor(attack: number, decay: number, sustainLevel: number, release: number) {
    this.attack = attack;
    this.decay = decay;
    this.sustainLevel = sustainLevel;
    this.release = release;
  }

  get currentStage(): AdsrStage {
    return this.stage;
  }

  /** Begins (or restarts) the attack phase at simulation time `t`. */
  noteOn(t: number): void {
    this.stage = "attack";
    this.stageStartTime = t;
    this.levelAtStageStart = 0;
  }

  /** Begins the release phase at simulation time `t`, from whatever level it's currently at. */
  noteOff(t: number): void {
    this.levelAtStageStart = this.valueAt(t);
    this.stage = "release";
    this.stageStartTime = t;
  }

  get isActive(): boolean {
    return this.stage !== "idle";
  }

  /** Evaluates the envelope at simulation time `t`, advancing through stages as needed. */
  value(t: number): number {
    this.advanceStage(t);
    return this.valueAt(t);
  }

  private advanceStage(t: number): void {
    const elapsed = t - this.stageStartTime;
    if (this.stage === "attack" && elapsed >= this.attack) {
      this.stage = "decay";
      this.stageStartTime += this.attack;
    }
    if (this.stage === "decay" && t - this.stageStartTime >= this.decay) {
      this.stage = "sustain";
      this.stageStartTime = t;
    }
    if (this.stage === "release" && t - this.stageStartTime >= this.release) {
      this.stage = "idle";
      this.stageStartTime = t;
    }
  }

  private valueAt(t: number): number {
    const elapsed = t - this.stageStartTime;
    switch (this.stage) {
      case "idle":
        return 0;
      case "attack":
        return this.attack <= 0 ? 1 : Math.min(elapsed / this.attack, 1);
      case "decay": {
        const d = this.decay <= 0 ? 1 : Math.min(elapsed / this.decay, 1);
        return 1 + (this.sustainLevel - 1) * d;
      }
      case "sustain":
        return this.sustainLevel;
      case "release": {
        const r = this.release <= 0 ? 1 : Math.min(elapsed / this.release, 1);
        return this.levelAtStageStart * (1 - r);
      }
    }
  }
}
