export interface TouchSupportInfo {
  supported: boolean;
  maxPoints: number;
}

export function readTouchSupport(): TouchSupportInfo {
  const maxPoints = navigator.maxTouchPoints ?? 0;
  return { supported: maxPoints > 0, maxPoints };
}

export function readGamepadIds(): string[] {
  const pads = navigator.getGamepads?.() ?? [];
  return Array.from(pads)
    .filter((pad): pad is Gamepad => pad !== null)
    .map((pad) => pad.id);
}

export interface AudioContextProbeResult {
  baseLatency: number | null;
  sampleRate: number | null;
}

export async function probeAudioContext(): Promise<AudioContextProbeResult> {
  const Ctx =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  if (!Ctx) {
    return { baseLatency: null, sampleRate: null };
  }
  const ctx = new Ctx();
  try {
    if (ctx.state === "suspended") {
      await ctx.resume();
    }
    return {
      baseLatency: ctx.baseLatency ?? null,
      sampleRate: ctx.sampleRate,
    };
  } finally {
    await ctx.close();
  }
}
