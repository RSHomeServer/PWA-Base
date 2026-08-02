/** Procedural drum one-shots — no external sample assets required. */

function noiseBurst(ctx: AudioContext, seconds: number, decay = 12): AudioBuffer {
  const n = Math.max(1, Math.floor(seconds * ctx.sampleRate));
  const buf = ctx.createBuffer(1, n, ctx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < n; i++) {
    const t = i / ctx.sampleRate;
    data[i] = (Math.random() * 2 - 1) * Math.exp(-t * decay);
  }
  return buf;
}

function kickBuffer(ctx: AudioContext): AudioBuffer {
  const seconds = 0.35;
  const n = Math.floor(seconds * ctx.sampleRate);
  const buf = ctx.createBuffer(1, n, ctx.sampleRate);
  const data = buf.getChannelData(0);
  const k = 28;
  const base = 38;
  const sweep = 110;
  for (let i = 0; i < n; i++) {
    const t = i / ctx.sampleRate;
    const phase = 2 * Math.PI * (base * t + (sweep / k) * (1 - Math.exp(-k * t)));
    data[i] = Math.sin(phase) * Math.exp(-t * 9);
  }
  return buf;
}

function tomBuffer(ctx: AudioContext, freq = 140): AudioBuffer {
  const seconds = 0.28;
  const n = Math.floor(seconds * ctx.sampleRate);
  const buf = ctx.createBuffer(1, n, ctx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < n; i++) {
    const t = i / ctx.sampleRate;
    data[i] = Math.sin(2 * Math.PI * freq * Math.exp(-t * 4) * t) * Math.exp(-t * 8);
  }
  return buf;
}

export type DrumVoice = "kick" | "snare" | "hat" | "clap" | "tom";

export const DRUM_VOICES: DrumVoice[] = ["kick", "snare", "hat", "clap", "tom"];

export const DRUM_LABELS: Record<DrumVoice, string> = {
  kick: "Kick",
  snare: "Snare",
  hat: "Hat",
  clap: "Clap",
  tom: "Tom",
};

export function createDrumBank(ctx: AudioContext): Record<DrumVoice, AudioBuffer> {
  return {
    kick: kickBuffer(ctx),
    snare: noiseBurst(ctx, 0.22, 18),
    hat: noiseBurst(ctx, 0.08, 55),
    clap: noiseBurst(ctx, 0.18, 28),
    tom: tomBuffer(ctx, 150),
  };
}

export function triggerDrum(
  ctx: AudioContext,
  dest: AudioNode,
  buffer: AudioBuffer,
  when: number,
  gain = 1,
): void {
  const src = ctx.createBufferSource();
  src.buffer = buffer;
  const g = ctx.createGain();
  g.gain.value = gain;
  src.connect(g);
  g.connect(dest);
  src.start(when);
}
