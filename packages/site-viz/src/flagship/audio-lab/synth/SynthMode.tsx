import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@platform/ui";
import { useShortcuts } from "../../shared/useShortcuts.js";
import { useAudioEngine } from "@platform/audio";
import { loadModeSession, saveModeSession } from "../session.js";
import { ModeStage } from "../shared/ModeStage.js";
import { SliderRow } from "../shared/Controls.js";
import controlStyles from "../shared/Controls.module.css";
import styles from "./SynthMode.module.css";

type OscType = OscillatorType;

interface SynthPatch {
  oscType: OscType;
  attack: number;
  decay: number;
  sustain: number;
  release: number;
  filterCutoff: number;
  filterQ: number;
  lfoRate: number;
  lfoDepth: number;
  delayTime: number;
  delayFeedback: number;
  distortion: number;
  chorusDepth: number;
  reverbMix: number;
  polyphony: number;
}

const DEFAULT_PATCH: SynthPatch = {
  oscType: "sawtooth",
  attack: 0.02,
  decay: 0.15,
  sustain: 0.65,
  release: 0.35,
  filterCutoff: 2200,
  filterQ: 4,
  lfoRate: 4.5,
  lfoDepth: 320,
  delayTime: 0.22,
  delayFeedback: 0.28,
  distortion: 12,
  chorusDepth: 0.004,
  reverbMix: 0.22,
  polyphony: 12,
};

const KEY_MAP: Record<string, number> = {
  a: 60,
  w: 61,
  s: 62,
  e: 63,
  d: 64,
  f: 65,
  t: 66,
  g: 67,
  y: 68,
  h: 69,
  u: 70,
  j: 71,
  k: 72,
  o: 73,
  l: 74,
  z: 48,
  x: 50,
  c: 52,
  v: 53,
  b: 55,
  n: 57,
  m: 59,
};

function midiToFreq(midi: number): number {
  return 440 * Math.pow(2, (midi - 69) / 12);
}

function makeDistortionCurve(amount: number): Float32Array<ArrayBuffer> {
  const n = 256;
  const curve = new Float32Array(new ArrayBuffer(n * 4));
  const k = Math.max(0, amount);
  for (let i = 0; i < n; i++) {
    const x = (i * 2) / n - 1;
    curve[i] = ((Math.PI + k) * x) / (Math.PI + k * Math.abs(x));
  }
  return curve;
}

/** Short stereo noise impulse — cheap algorithmic “room” without assets. */
function makeImpulse(ctx: AudioContext, seconds = 1.6, decay = 2.8): AudioBuffer {
  const len = Math.floor(ctx.sampleRate * seconds);
  const buf = ctx.createBuffer(2, len, ctx.sampleRate);
  for (let c = 0; c < 2; c++) {
    const data = buf.getChannelData(c);
    for (let i = 0; i < len; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay);
    }
  }
  return buf;
}

interface Voice {
  osc: OscillatorNode;
  gain: GainNode;
  filter: BiquadFilterNode;
  midi: number;
  released: boolean;
}

interface SynthGraph {
  voiceBus: GainNode;
  filter: BiquadFilterNode;
  waveshaper: WaveShaperNode;
  delay: DelayNode;
  feedback: GainNode;
  chorus: DelayNode;
  chorusLfo: OscillatorNode;
  chorusDepth: GainNode;
  reverb: ConvolverNode;
  dry: GainNode;
  wet: GainNode;
  chorusWet: GainNode;
  reverbWet: GainNode;
  out: GainNode;
  lfo: OscillatorNode;
  lfoGain: GainNode;
}

export function SynthMode() {
  const { ensureEngine } = useAudioEngine();
  const initial = { ...DEFAULT_PATCH, ...loadModeSession("synth", DEFAULT_PATCH) };
  const [patch, setPatch] = useState<SynthPatch>(initial);
  const [activeKeys, setActiveKeys] = useState<number[]>([]);
  const [midiReady, setMidiReady] = useState<"yes" | "no" | "unsupported">("unsupported");

  const patchRef = useRef(patch);
  patchRef.current = patch;
  const graphRef = useRef<SynthGraph | null>(null);
  const voicesRef = useRef<Voice[]>([]);
  const heldRef = useRef<Set<number>>(new Set());

  const ensureGraph = useCallback((): {
    engine: ReturnType<typeof ensureEngine>;
    graph: SynthGraph;
  } => {
    const engine = ensureEngine();
    if (!graphRef.current) {
      const voiceBus = engine.ctx.createGain();
      const filter = engine.ctx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.value = patchRef.current.filterCutoff;
      filter.Q.value = patchRef.current.filterQ;

      const waveshaper = engine.ctx.createWaveShaper();
      waveshaper.curve = makeDistortionCurve(patchRef.current.distortion);
      waveshaper.oversample = "2x";

      const delay = engine.ctx.createDelay(1.5);
      delay.delayTime.value = patchRef.current.delayTime;
      const feedback = engine.ctx.createGain();
      feedback.gain.value = patchRef.current.delayFeedback;
      const dry = engine.ctx.createGain();
      dry.gain.value = 0.85;
      const wet = engine.ctx.createGain();
      wet.gain.value = 0.35;

      const chorus = engine.ctx.createDelay(0.05);
      chorus.delayTime.value = 0.012;
      const chorusLfo = engine.ctx.createOscillator();
      chorusLfo.type = "sine";
      chorusLfo.frequency.value = 0.35;
      const chorusDepth = engine.ctx.createGain();
      chorusDepth.gain.value = patchRef.current.chorusDepth;
      chorusLfo.connect(chorusDepth);
      chorusDepth.connect(chorus.delayTime);
      chorusLfo.start();
      const chorusWet = engine.ctx.createGain();
      chorusWet.gain.value = 0.45;

      const reverb = engine.ctx.createConvolver();
      reverb.buffer = makeImpulse(engine.ctx);
      const reverbWet = engine.ctx.createGain();
      reverbWet.gain.value = patchRef.current.reverbMix;

      const out = engine.ctx.createGain();
      out.gain.value = 0.7;

      const lfo = engine.ctx.createOscillator();
      lfo.type = "sine";
      lfo.frequency.value = patchRef.current.lfoRate;
      const lfoGain = engine.ctx.createGain();
      lfoGain.gain.value = patchRef.current.lfoDepth;
      lfo.connect(lfoGain);
      lfoGain.connect(filter.frequency);
      lfo.start();

      voiceBus.connect(filter);
      filter.connect(waveshaper);
      waveshaper.connect(dry);
      waveshaper.connect(delay);
      delay.connect(feedback);
      feedback.connect(delay);
      delay.connect(wet);
      waveshaper.connect(chorus);
      chorus.connect(chorusWet);
      waveshaper.connect(reverb);
      reverb.connect(reverbWet);
      dry.connect(out);
      wet.connect(out);
      chorusWet.connect(out);
      reverbWet.connect(out);
      out.connect(engine.masterGain);

      graphRef.current = {
        voiceBus,
        filter,
        waveshaper,
        delay,
        feedback,
        chorus,
        chorusLfo,
        chorusDepth,
        reverb,
        dry,
        wet,
        chorusWet,
        reverbWet,
        out,
        lfo,
        lfoGain,
      };
    }
    return { engine, graph: graphRef.current };
  }, [ensureEngine]);

  const applyPatch = useCallback(() => {
    const g = graphRef.current;
    if (!g) return;
    const p = patchRef.current;
    const t = g.filter.context.currentTime;
    g.filter.frequency.setTargetAtTime(p.filterCutoff, t, 0.03);
    g.filter.Q.setTargetAtTime(p.filterQ, t, 0.03);
    g.lfo.frequency.setTargetAtTime(p.lfoRate, t, 0.03);
    g.lfoGain.gain.setTargetAtTime(p.lfoDepth, t, 0.03);
    g.delay.delayTime.setTargetAtTime(p.delayTime, t, 0.03);
    g.feedback.gain.setTargetAtTime(p.delayFeedback, t, 0.03);
    g.chorusDepth.gain.setTargetAtTime(p.chorusDepth, t, 0.03);
    g.reverbWet.gain.setTargetAtTime(p.reverbMix, t, 0.05);
    g.waveshaper.curve = makeDistortionCurve(p.distortion);
  }, []);

  useEffect(() => {
    applyPatch();
    saveModeSession("synth", patch);
  }, [patch, applyPatch]);

  const noteOff = useCallback(
    (midi: number) => {
      const { engine } = ensureGraph();
      const p = patchRef.current;
      const now = engine.ctx.currentTime;
      for (const voice of voicesRef.current) {
        if (voice.midi !== midi || voice.released) continue;
        voice.released = true;
        voice.gain.gain.cancelScheduledValues(now);
        voice.gain.gain.setValueAtTime(Math.max(0.0001, voice.gain.gain.value), now);
        voice.gain.gain.exponentialRampToValueAtTime(0.0001, now + Math.max(0.02, p.release));
        try {
          voice.osc.stop(now + Math.max(0.03, p.release) + 0.05);
        } catch {
          // already stopped
        }
      }
      voicesRef.current = voicesRef.current.filter((v) => !v.released || v.midi !== midi);
      heldRef.current.delete(midi);
      setActiveKeys([...heldRef.current]);
    },
    [ensureGraph],
  );

  const noteOn = useCallback(
    (midi: number, velocity = 0.85) => {
      if (heldRef.current.has(midi)) return;
      const { engine, graph } = ensureGraph();
      void engine.ctx.resume();
      const p = patchRef.current;
      while (voicesRef.current.length >= p.polyphony) {
        const oldest = voicesRef.current.shift();
        if (oldest) {
          try {
            oldest.osc.stop();
          } catch {
            // ignore
          }
        }
      }

      const osc = engine.ctx.createOscillator();
      osc.type = p.oscType;
      osc.frequency.value = midiToFreq(midi);
      const filter = engine.ctx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.value = p.filterCutoff;
      filter.Q.value = p.filterQ;
      const gain = engine.ctx.createGain();
      const now = engine.ctx.currentTime;
      const peak = 0.22 * velocity;
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(peak, now + Math.max(0.005, p.attack));
      gain.gain.exponentialRampToValueAtTime(
        Math.max(0.0001, peak * p.sustain),
        now + Math.max(0.01, p.attack + p.decay),
      );

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(graph.voiceBus);
      osc.start(now);

      voicesRef.current.push({ osc, gain, filter, midi, released: false });
      heldRef.current.add(midi);
      setActiveKeys([...heldRef.current]);
    },
    [ensureGraph],
  );

  useEffect(() => {
    const onDown = (e: KeyboardEvent) => {
      if (
        e.repeat ||
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      )
        return;
      const midi = KEY_MAP[e.key.toLowerCase()];
      if (midi !== undefined) {
        e.preventDefault();
        noteOn(midi);
      }
    };
    const onUp = (e: KeyboardEvent) => {
      const midi = KEY_MAP[e.key.toLowerCase()];
      if (midi !== undefined) noteOff(midi);
    };
    window.addEventListener("keydown", onDown);
    window.addEventListener("keyup", onUp);
    return () => {
      window.removeEventListener("keydown", onDown);
      window.removeEventListener("keyup", onUp);
    };
  }, [noteOff, noteOn]);

  useEffect(() => {
    if (!navigator.requestMIDIAccess) {
      setMidiReady("unsupported");
      return;
    }
    let access: MIDIAccess | null = null;
    const onMidi = (event: MIDIMessageEvent) => {
      const [status, note, vel] = event.data ?? [];
      if (status === undefined || note === undefined) return;
      const cmd = status & 0xf0;
      if (cmd === 0x90 && (vel ?? 0) > 0) noteOn(note, (vel ?? 100) / 127);
      else if (cmd === 0x80 || (cmd === 0x90 && (vel ?? 0) === 0)) noteOff(note);
    };
    void navigator
      .requestMIDIAccess()
      .then((midi) => {
        access = midi;
        setMidiReady("yes");
        for (const input of midi.inputs.values()) input.addEventListener("midimessage", onMidi);
      })
      .catch(() => setMidiReady("no"));
    return () => {
      if (!access) return;
      for (const input of access.inputs.values()) input.removeEventListener("midimessage", onMidi);
    };
  }, [noteOff, noteOn]);

  const setField = <K extends keyof SynthPatch>(key: K, value: SynthPatch[K]) => {
    setPatch((p) => ({ ...p, [key]: value }));
  };

  useShortcuts({});

  const whiteKeys = [60, 62, 64, 65, 67, 69, 71, 72];

  return (
    <ModeStage>
      <div className={controlStyles.modeToolbar}>
        <span className={controlStyles.readoutRow}>
          MIDI:{" "}
          <strong>
            {midiReady === "yes" ? "connected" : midiReady === "no" ? "denied" : "n/a"}
          </strong>
        </span>
        <span className={controlStyles.readoutRow}>
          Voices: <strong>{activeKeys.length}</strong> / {patch.polyphony}
        </span>
        <Button variant="secondary" size="sm" onClick={() => setPatch(DEFAULT_PATCH)}>
          Reset patch
        </Button>
      </div>

      <div className={styles.oscRow}>
        {(["sine", "square", "sawtooth", "triangle"] as OscType[]).map((t) => (
          <Button
            key={t}
            variant={patch.oscType === t ? "primary" : "secondary"}
            size="sm"
            onClick={() => setField("oscType", t)}
          >
            {t}
          </Button>
        ))}
      </div>

      <div className={`${controlStyles.panelGrid} ${controlStyles.panelGrid3}`}>
        <div className={controlStyles.panel}>
          <span className={controlStyles.panelTitle}>ADSR</span>
          <SliderRow
            label="Attack"
            value={patch.attack}
            min={0.001}
            max={1}
            step={0.001}
            onChange={(v) => setField("attack", v)}
            format={(v) => `${v.toFixed(3)}s`}
          />
          <SliderRow
            label="Decay"
            value={patch.decay}
            min={0.01}
            max={1.5}
            step={0.01}
            onChange={(v) => setField("decay", v)}
            format={(v) => `${v.toFixed(2)}s`}
          />
          <SliderRow
            label="Sustain"
            value={patch.sustain}
            min={0}
            max={1}
            step={0.01}
            onChange={(v) => setField("sustain", v)}
          />
          <SliderRow
            label="Release"
            value={patch.release}
            min={0.02}
            max={2}
            step={0.01}
            onChange={(v) => setField("release", v)}
            format={(v) => `${v.toFixed(2)}s`}
          />
        </div>
        <div className={controlStyles.panel}>
          <span className={controlStyles.panelTitle}>Filter + LFO</span>
          <SliderRow
            label="Cutoff"
            value={patch.filterCutoff}
            min={120}
            max={8000}
            step={10}
            onChange={(v) => setField("filterCutoff", v)}
            format={(v) => `${Math.round(v)} Hz`}
          />
          <SliderRow
            label="Resonance"
            value={patch.filterQ}
            min={0.1}
            max={18}
            step={0.1}
            onChange={(v) => setField("filterQ", v)}
          />
          <SliderRow
            label="LFO rate"
            value={patch.lfoRate}
            min={0.1}
            max={12}
            step={0.1}
            onChange={(v) => setField("lfoRate", v)}
            format={(v) => `${v.toFixed(1)} Hz`}
          />
          <SliderRow
            label="LFO depth"
            value={patch.lfoDepth}
            min={0}
            max={1200}
            step={10}
            onChange={(v) => setField("lfoDepth", v)}
            format={(v) => `${Math.round(v)} Hz`}
          />
        </div>
        <div className={controlStyles.panel}>
          <span className={controlStyles.panelTitle}>FX + polyphony</span>
          <SliderRow
            label="Delay"
            value={patch.delayTime}
            min={0}
            max={0.8}
            step={0.01}
            onChange={(v) => setField("delayTime", v)}
            format={(v) => `${v.toFixed(2)}s`}
          />
          <SliderRow
            label="Feedback"
            value={patch.delayFeedback}
            min={0}
            max={0.85}
            step={0.01}
            onChange={(v) => setField("delayFeedback", v)}
          />
          <SliderRow
            label="Distortion"
            value={patch.distortion}
            min={0}
            max={80}
            step={1}
            onChange={(v) => setField("distortion", v)}
          />
          <SliderRow
            label="Chorus"
            value={patch.chorusDepth}
            min={0}
            max={0.012}
            step={0.0005}
            onChange={(v) => setField("chorusDepth", v)}
            format={(v) => `${(v * 1000).toFixed(1)} ms`}
          />
          <SliderRow
            label="Reverb"
            value={patch.reverbMix}
            min={0}
            max={0.7}
            step={0.01}
            onChange={(v) => setField("reverbMix", v)}
          />
          <SliderRow
            label="Voices"
            value={patch.polyphony}
            min={4}
            max={16}
            step={1}
            onChange={(v) => setField("polyphony", v)}
            format={(v) => `${v}`}
          />
        </div>
      </div>

      <div className={styles.keyboard} role="group" aria-label="On-screen keyboard">
        {whiteKeys.map((midi) => (
          <button
            key={midi}
            type="button"
            className={[styles.key, activeKeys.includes(midi) ? styles.keyActive : ""]
              .filter(Boolean)
              .join(" ")}
            onPointerDown={() => noteOn(midi)}
            onPointerUp={() => noteOff(midi)}
            onPointerLeave={() => noteOff(midi)}
          >
            {midi}
          </button>
        ))}
      </div>
      <p className={controlStyles.emptyHint} style={{ paddingTop: 0 }}>
        Computer keys A–L / Z–M map to a two-octave layout. Patch is saved to localStorage.
      </p>
    </ModeStage>
  );
}
