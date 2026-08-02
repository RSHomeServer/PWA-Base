import type { ParamRecord, Recording, RecordingFrame } from "./types.js";

/**
 * Records/replays *parameter automation* over time rather than raw simulation state.
 * This keeps recording generic across every future simulation: because every system
 * reads its tunables through `World.getParams()`, capturing the parameter timeline is
 * sufficient to deterministically reproduce a run (given the same systems + seed).
 */
export class RecordingController {
  private recordingFrames: RecordingFrame[] | null = null;
  private playback: Recording | null = null;
  private playbackIndex = 0;
  private playbackLoop = false;

  get isRecording(): boolean {
    return this.recordingFrames !== null;
  }

  get isPlaying(): boolean {
    return this.playback !== null;
  }

  start(): void {
    this.recordingFrames = [];
  }

  /** Captures one frame. No-op if not currently recording. */
  capture(frame: number, time: number, params: ParamRecord): void {
    if (!this.recordingFrames) {
      return;
    }
    this.recordingFrames.push({ frame, time, params: { ...params } });
  }

  stop(fixedDt: number): Recording | null {
    if (!this.recordingFrames) {
      return null;
    }
    const recording: Recording = { fixedDt, frames: this.recordingFrames };
    this.recordingFrames = null;
    return recording;
  }

  play(recording: Recording, loop: boolean): void {
    this.playback = recording;
    this.playbackIndex = 0;
    this.playbackLoop = loop;
  }

  stopPlayback(): void {
    this.playback = null;
    this.playbackIndex = 0;
  }

  /** Returns the params to apply for the current playback frame and advances the
   * cursor, or `null` if playback finished (and isn't looping). */
  advance(): ParamRecord | null {
    if (!this.playback) {
      return null;
    }
    const { frames } = this.playback;
    if (frames.length === 0) {
      this.stopPlayback();
      return null;
    }
    if (this.playbackIndex >= frames.length) {
      if (!this.playbackLoop) {
        this.stopPlayback();
        return null;
      }
      this.playbackIndex = 0;
    }
    const params = frames[this.playbackIndex]!.params;
    this.playbackIndex += 1;
    return params;
  }

  reset(): void {
    this.recordingFrames = null;
    this.playback = null;
    this.playbackIndex = 0;
    this.playbackLoop = false;
  }
}
