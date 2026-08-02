import { AdsrEnvelope, sine, square, triangle } from "@platform/physics";

/**
 * FUTURE ML INTEGRATION POINT
 * ----------------------------------------------------------------------------
 * Real stem separation (e.g. a Demucs/Spleeter-style model) would replace the
 * `generateDemoStem` calls below with a call out to a WASM model or backend
 * endpoint that takes the loaded mixdown `AudioBuffer` and returns one
 * `AudioBuffer` per source. The `StemSlot` architecture in `StemExplorerMode`
 * is deliberately source-agnostic: it only cares that each slot ends up with an
 * `AudioBuffer`, however it got there (file import, procedural demo, or a
 * future `await separateStems(mixdownBuffer)` call). Swap the generator below
 * for that call and the rest of the mode — solo/mute/volume, combined
 * visualiser, transport — needs no changes.
 */

export type StemKind = "drums" | "bass" | "vocals" | "melody" | "other";

export const STEM_KINDS: StemKind[] = ["drums", "bass", "vocals", "melody", "other"];

const MINOR_SCALE = [220, 246.94, 261.63, 293.66, 329.63, 349.23, 392, 440];

function addNote(
  L: Float32Array,
  R: Float32Array,
  sr: number,
  startTime: number,
  noteDur: number,
  freq: number,
  amp: number,
  osc: (t: number, freq: number) => number,
  env: AdsrEnvelope,
  pan = 0,
): void {
  env.noteOn(startTime);
  const tailSamples = Math.ceil(env.release * sr);
  const startSample = Math.max(0, Math.floor(startTime * sr));
  const bodyEndSample = Math.min(L.length, Math.floor((startTime + noteDur) * sr));
  const endSample = Math.min(L.length, bodyEndSample + tailSamples);
  const gainL = 1 - Math.max(0, pan);
  const gainR = 1 + Math.min(0, pan);
  let released = false;
  for (let i = startSample; i < endSample; i++) {
    const t = i / sr;
    if (!released && i >= bodyEndSample) {
      env.noteOff(t);
      released = true;
    }
    const sample = osc(t - startTime, freq) * env.value(t) * amp;
    L[i] = (L[i] ?? 0) + sample * gainL;
    R[i] = (R[i] ?? 0) + sample * gainR;
  }
}

function renderDrums(
  L: Float32Array,
  R: Float32Array,
  sr: number,
  duration: number,
  secPerBeat: number,
): void {
  const kickEnv = new AdsrEnvelope(0.001, 0.16, 0, 0.05);
  const hatEnv = new AdsrEnvelope(0.001, 0.045, 0, 0.02);
  const snareEnv = new AdsrEnvelope(0.001, 0.12, 0, 0.06);
  const step = secPerBeat / 2;
  for (let t = 0; t < duration; t += step) {
    const stepIdx = Math.round(t / step);
    if (stepIdx % 4 === 0) {
      // Exponential pitch-drop kick: analytically integrates a decaying instantaneous
      // frequency into phase, since the stateless `sine()` helper assumes a fixed freq.
      const base = 35;
      const sweep = 95;
      const k = 22;
      const pitchOsc = (localT: number) =>
        Math.sin(2 * Math.PI * (base * localT + (sweep / k) * (1 - Math.exp(-k * localT))));
      addNote(L, R, sr, t, step * 0.9, 55, 0.9, pitchOsc, kickEnv);
    }
    if (stepIdx % 4 === 2) {
      const noiseOsc = () => Math.random() * 2 - 1;
      addNote(L, R, sr, t, step * 0.7, 0, 0.5, noiseOsc, snareEnv);
    }
    if (stepIdx % 1 === 0) {
      const noiseOsc = () => Math.random() * 2 - 1;
      addNote(L, R, sr, t, step * 0.35, 0, 0.16, noiseOsc, hatEnv, stepIdx % 2 === 0 ? -0.3 : 0.3);
    }
  }
}

function renderBass(
  L: Float32Array,
  R: Float32Array,
  sr: number,
  duration: number,
  secPerBeat: number,
): void {
  const env = new AdsrEnvelope(0.008, 0.1, 0.55, 0.08);
  const barLen = secPerBeat * 4;
  let bar = 0;
  for (let t = 0; t < duration; t += secPerBeat) {
    const beatInBar = Math.round((t % barLen) / secPerBeat);
    const rootIdx = bar % MINOR_SCALE.length;
    const freq = MINOR_SCALE[rootIdx]! / 2 + (beatInBar === 2 ? 20 : 0);
    addNote(L, R, sr, t, secPerBeat * 0.85, freq, 0.55, (lt, f) => triangle(lt, f), env);
    if (Math.round(t / secPerBeat) % 4 === 3) bar++;
  }
}

function renderVocals(
  L: Float32Array,
  R: Float32Array,
  sr: number,
  duration: number,
  secPerBeat: number,
): void {
  const env = new AdsrEnvelope(0.3, 0.4, 0.7, 0.6);
  const phraseLen = secPerBeat * 8;
  for (let t = 0; t < duration; t += phraseLen) {
    const noteIdx = Math.floor(t / phraseLen) % MINOR_SCALE.length;
    const freq = MINOR_SCALE[noteIdx]! * 1.5;
    const vowelOsc = (lt: number, f: number) =>
      sine(lt, f, 0, 0.7) + sine(lt, f * 2.01, 0, 0.2) + sine(lt, f * 3.98, 0, 0.08);
    addNote(L, R, sr, t, phraseLen * 0.82, freq, 0.32, vowelOsc, env, -0.15);
  }
}

function renderMelody(
  L: Float32Array,
  R: Float32Array,
  sr: number,
  duration: number,
  secPerBeat: number,
): void {
  const env = new AdsrEnvelope(0.004, 0.12, 0.3, 0.1);
  const step = secPerBeat / 2;
  let i = 0;
  for (let t = 0; t < duration; t += step) {
    if (Math.random() < 0.72) {
      const idx = (i + Math.floor(Math.random() * 3)) % MINOR_SCALE.length;
      const freq = MINOR_SCALE[idx]! * 2;
      addNote(L, R, sr, t, step * 0.6, freq, 0.28, (lt, f) => square(lt, f, 0, 1, 0.35), env, 0.2);
    }
    i++;
  }
}

function renderOther(L: Float32Array, R: Float32Array, sr: number, duration: number): void {
  let stateL = 0;
  let stateR = 0;
  for (let i = 0; i < L.length; i++) {
    const t = i / sr;
    const swell = 0.5 + 0.5 * sine(t, 0.15, 0, 1);
    stateL += (Math.random() * 2 - 1 - stateL) * 0.02;
    stateR += (Math.random() * 2 - 1 - stateR) * 0.02;
    L[i] = (L[i] ?? 0) + stateL * swell * 0.18;
    R[i] = (R[i] ?? 0) + stateR * swell * 0.18;
  }
  void duration;
}

/** Synthesises a short demo "stem" buffer for the given part, entirely on the CPU (no playback needed). */
export function generateDemoStem(
  ctx: AudioContext,
  kind: StemKind,
  bars = 8,
  bpm = 96,
): AudioBuffer {
  const secPerBeat = 60 / bpm;
  const duration = bars * 4 * secPerBeat;
  const length = Math.max(1, Math.floor(duration * ctx.sampleRate));
  const buffer = ctx.createBuffer(2, length, ctx.sampleRate);
  const L = buffer.getChannelData(0);
  const R = buffer.getChannelData(1);

  switch (kind) {
    case "drums":
      renderDrums(L, R, ctx.sampleRate, duration, secPerBeat);
      break;
    case "bass":
      renderBass(L, R, ctx.sampleRate, duration, secPerBeat);
      break;
    case "vocals":
      renderVocals(L, R, ctx.sampleRate, duration, secPerBeat);
      break;
    case "melody":
      renderMelody(L, R, ctx.sampleRate, duration, secPerBeat);
      break;
    case "other":
      renderOther(L, R, ctx.sampleRate, duration);
      break;
  }

  let peak = 0;
  for (let i = 0; i < length; i++) peak = Math.max(peak, Math.abs(L[i]!), Math.abs(R[i]!));
  if (peak > 0.98) {
    const norm = 0.95 / peak;
    for (let i = 0; i < length; i++) {
      L[i] = L[i]! * norm;
      R[i] = R[i]! * norm;
    }
  }

  return buffer;
}
