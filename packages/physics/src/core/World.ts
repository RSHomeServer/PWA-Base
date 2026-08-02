import type { System } from "./System.js";
import { Profiler, nowMs } from "./profiler.js";
import { RecordingController } from "./recording.js";
import type { ParamRecord, ParamSnapshot, ParamValue, ProfileStats, Recording } from "./types.js";

export interface WorldOptions {
  /** Seconds per fixed simulation step. Defaults to 1/60. */
  fixedDt?: number;
  /** Maximum number of fixed steps a single `tick()` call may run, to avoid a
   * "spiral of death" when the host is unable to keep up. Defaults to 8. */
  maxSubsteps?: number;
}

export interface PlayRecordingOptions {
  loop?: boolean;
}

const DEFAULT_FIXED_DT = 1 / 60;
const DEFAULT_MAX_SUBSTEPS = 8;

/**
 * Renderer-agnostic, fixed-timestep simulation world. Owns the clock, the ordered
 * list of `System`s, shared parameters, recording/playback, and profiling — nothing
 * about *what* is being simulated. That lives entirely in `System` implementations.
 */
export class World {
  private _time = 0;
  private _frame = 0;
  private _paused = false;
  private _timeScale = 1;
  private _fixedDt: number;
  private readonly maxSubsteps: number;
  private accumulator = 0;

  private readonly systems: System[] = [];
  private params: ParamRecord = {};

  private readonly recorder = new RecordingController();
  private readonly profiler = new Profiler();

  constructor(options: WorldOptions = {}) {
    this._fixedDt = options.fixedDt ?? DEFAULT_FIXED_DT;
    this.maxSubsteps = options.maxSubsteps ?? DEFAULT_MAX_SUBSTEPS;
  }

  get time(): number {
    return this._time;
  }

  get frame(): number {
    return this._frame;
  }

  get paused(): boolean {
    return this._paused;
  }

  get timeScale(): number {
    return this._timeScale;
  }

  set timeScale(value: number) {
    this._timeScale = value;
  }

  get fixedDt(): number {
    return this._fixedDt;
  }

  set fixedDt(value: number) {
    if (value <= 0) {
      throw new RangeError("fixedDt must be positive");
    }
    this._fixedDt = value;
  }

  get isRecording(): boolean {
    return this.recorder.isRecording;
  }

  get isPlaying(): boolean {
    return this.recorder.isPlaying;
  }

  pause(): void {
    this._paused = true;
  }

  resume(): void {
    this._paused = false;
  }

  addSystem(system: System): void {
    if (this.systems.some((existing) => existing.id === system.id)) {
      throw new Error(`System with id "${system.id}" is already registered`);
    }
    this.systems.push(system);
    this.systems.sort((a, b) => (a.priority ?? 0) - (b.priority ?? 0));
    system.init?.(this);
  }

  removeSystem(system: System): void {
    const index = this.systems.indexOf(system);
    if (index !== -1) {
      this.systems.splice(index, 1);
      this.profiler.removeSystem(system.id);
    }
  }

  setParams(partial: Record<string, ParamValue>): void {
    Object.assign(this.params, partial);
  }

  /** Returns the live params object. Treat as read-only: mutate via `setParams()` so
   * recording/playback stay consistent. Returned by reference (zero allocation). */
  getParams(): Readonly<ParamRecord> {
    return this.params;
  }

  snapshotParams(): ParamSnapshot {
    return { params: { ...this.params } };
  }

  restoreParams(snap: ParamSnapshot): void {
    this.params = { ...snap.params };
  }

  startRecording(): void {
    this.recorder.start();
  }

  stopRecording(): Recording | null {
    return this.recorder.stop(this._fixedDt);
  }

  playRecording(rec: Recording, opts: PlayRecordingOptions = {}): void {
    this.recorder.play(rec, opts.loop ?? false);
  }

  stopPlayback(): void {
    this.recorder.stopPlayback();
  }

  /** Runs exactly one fixed step, regardless of `paused` (useful for frame-stepping
   * a paused simulation from an editor/inspector UI). */
  stepOnce(): void {
    const dt = this._fixedDt;

    const playbackParams = this.recorder.advance();
    if (playbackParams) {
      this.params = { ...playbackParams };
    }

    this.recorder.capture(this._frame, this._time, this.params);

    const stepStart = nowMs();
    for (const system of this.systems) {
      const systemStart = nowMs();
      system.step(this, dt);
      this.profiler.recordSystem(system.id, nowMs() - systemStart);
    }
    const hadFrames = this._frame > 0;
    this.profiler.recordStep(nowMs() - stepStart, hadFrames);

    this._frame += 1;
    this._time += dt;
  }

  /** Accumulates real elapsed time (scaled by `timeScale`) and runs as many fixed
   * steps as needed to catch up, capped at `maxSubsteps` per call. No-op while paused. */
  tick(realDt: number): void {
    if (this._paused) {
      return;
    }
    this.accumulator += realDt * this._timeScale;

    let steps = 0;
    while (this.accumulator >= this._fixedDt && steps < this.maxSubsteps) {
      this.stepOnce();
      this.accumulator -= this._fixedDt;
      steps += 1;
    }

    if (steps === this.maxSubsteps) {
      this.accumulator = 0;
    }
  }

  reset(): void {
    this._time = 0;
    this._frame = 0;
    this.accumulator = 0;
    this.recorder.reset();
    this.profiler.reset();
    for (const system of this.systems) {
      system.reset?.(this);
    }
  }

  profile(): ProfileStats {
    return this.profiler.snapshot(this._frame, this._time);
  }
}

export function createWorld(options?: WorldOptions): World {
  return new World(options);
}
