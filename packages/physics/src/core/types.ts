/** The subset of value types simulation parameters may hold. Kept JSON-serializable
 * on purpose so recordings/snapshots can be persisted or sent over the wire. */
export type ParamValue = number | boolean | string;

export type ParamRecord = Record<string, ParamValue>;

/** An immutable copy of a world's parameters at a point in time. */
export interface ParamSnapshot {
  readonly params: ParamRecord;
}

/** One recorded frame: the parameter state that was active while stepping it. */
export interface RecordingFrame {
  readonly frame: number;
  readonly time: number;
  readonly params: ParamRecord;
}

/** A full parameter-automation recording, replayable deterministically via `World.playRecording`. */
export interface Recording {
  readonly fixedDt: number;
  readonly frames: readonly RecordingFrame[];
}

export interface SystemProfile {
  lastMs: number;
  avgMs: number;
  calls: number;
}

export interface ProfileStats {
  frame: number;
  time: number;
  lastStepMs: number;
  avgStepMs: number;
  systems: Record<string, SystemProfile>;
}
