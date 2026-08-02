import { useCallback, useEffect, useRef, useState } from "react";
import type { ChangeEvent } from "react";
import { Button } from "@platform/ui";
import { useShortcuts } from "../../shared/useShortcuts.js";
import { useAudioEngine } from "../engine/useAudioEngine.js";
import { useAnimationFrame } from "../../shared/useAnimationFrame.js";
import { useScreenshotTarget } from "../shared/useScreenshot.js";
import { ModeStage } from "../shared/ModeStage.js";
import { SliderRow, ToggleChip } from "../shared/Controls.js";
import controlStyles from "../shared/Controls.module.css";
import stemStyles from "./StemExplorerMode.module.css";
import { computePeaks } from "../visualiser/waveformPeaks.js";
import type { PeakData } from "../visualiser/waveformPeaks.js";
import { drawSpectrumBars, drawWaveform, setupCanvas } from "../visualiser/draw.js";
import { STEM_KINDS, generateDemoStem } from "./stemSynth.js";
import type { StemKind } from "./stemSynth.js";

const STEM_LABELS: Record<StemKind, string> = {
  drums: "Drums",
  bass: "Bass",
  vocals: "Vocals",
  melody: "Melody",
  other: "Other",
};

interface StemState {
  buffer: AudioBuffer | null;
  fileName: string | null;
  muted: boolean;
  solo: boolean;
  volume: number;
}

function initialStemState(): Record<StemKind, StemState> {
  const state = {} as Record<StemKind, StemState>;
  for (const kind of STEM_KINDS) {
    state[kind] = { buffer: null, fileName: null, muted: false, solo: false, volume: 0.9 };
  }
  return state;
}

function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function StemExplorerMode() {
  const { ensureEngine, peekEngine } = useAudioEngine();
  const [stems, setStems] = useState<Record<StemKind, StemState>>(initialStemState);
  const [playing, setPlaying] = useState(false);
  const [loop, setLoop] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [peaksByKind, setPeaksByKind] = useState<Partial<Record<StemKind, PeakData>>>({});

  const stemsRef = useRef(stems);
  stemsRef.current = stems;
  const loopRef = useRef(loop);
  loopRef.current = loop;
  const playingRef = useRef(playing);
  playingRef.current = playing;

  const gainNodesRef = useRef<Partial<Record<StemKind, GainNode>>>({});
  const sourcesRef = useRef<Partial<Record<StemKind, AudioBufferSourceNode>>>({});
  const busRef = useRef<{ bus: GainNode; analyser: AnalyserNode } | null>(null);
  const offsetRef = useRef(0);
  const startCtxTimeRef = useRef(0);
  const freqScratchRef = useRef(new Uint8Array(new ArrayBuffer(1024)));

  const combinedCanvasRef = useRef<HTMLCanvasElement>(null);
  const waveformRefs = useRef<Partial<Record<StemKind, HTMLCanvasElement | null>>>({});

  useScreenshotTarget(combinedCanvasRef);

  const duration = STEM_KINDS.reduce((max, k) => Math.max(max, stems[k].buffer?.duration ?? 0), 0);
  const durationRef = useRef(duration);
  durationRef.current = duration;

  const ensureBus = useCallback(() => {
    const engine = ensureEngine();
    if (!busRef.current) {
      const bus = engine.ctx.createGain();
      const analyser = engine.ctx.createAnalyser();
      analyser.fftSize = 2048;
      bus.connect(analyser);
      analyser.connect(engine.masterGain);
      busRef.current = { bus, analyser };
    }
    return busRef.current;
  }, [ensureEngine]);

  const ensureStemGain = useCallback(
    (kind: StemKind): GainNode => {
      const engine = ensureEngine();
      const { bus } = ensureBus();
      let node = gainNodesRef.current[kind];
      if (!node) {
        node = engine.ctx.createGain();
        node.connect(bus);
        gainNodesRef.current[kind] = node;
      }
      return node;
    },
    [ensureBus, ensureEngine],
  );

  const applyGains = useCallback(() => {
    const engine = peekEngine();
    if (!engine) return;
    const state = stemsRef.current;
    const anySolo = STEM_KINDS.some((k) => state[k].solo);
    for (const kind of STEM_KINDS) {
      const node = gainNodesRef.current[kind];
      if (!node) continue;
      const s = state[kind];
      const effectiveMute = s.muted || (anySolo && !s.solo);
      node.gain.setTargetAtTime(effectiveMute ? 0 : s.volume, engine.ctx.currentTime, 0.02);
    }
  }, [peekEngine]);

  useEffect(() => {
    applyGains();
  }, [stems, applyGains]);

  const stopAllSources = useCallback(
    (persistPosition: boolean) => {
      const engine = peekEngine();
      if (persistPosition && engine) {
        const elapsed = engine.ctx.currentTime - startCtxTimeRef.current;
        const dur = Math.max(durationRef.current, 0.001);
        offsetRef.current = (((offsetRef.current + elapsed) % dur) + dur) % dur;
      }
      for (const kind of STEM_KINDS) {
        const src = sourcesRef.current[kind];
        if (src) {
          src.onended = null;
          try {
            src.stop();
          } catch {
            // already stopped
          }
          src.disconnect();
        }
        sourcesRef.current[kind] = undefined;
      }
    },
    [peekEngine],
  );

  const startPlayback = useCallback(() => {
    if (durationRef.current <= 0) return;
    const engine = ensureEngine();
    ensureBus();
    stopAllSources(false);
    const startOffset =
      ((offsetRef.current % durationRef.current) + durationRef.current) % durationRef.current;
    for (const kind of STEM_KINDS) {
      const buffer = stemsRef.current[kind].buffer;
      if (!buffer) continue;
      const gainNode = ensureStemGain(kind);
      const source = engine.ctx.createBufferSource();
      source.buffer = buffer;
      source.loop = loopRef.current;
      source.connect(gainNode);
      source.start(0, Math.min(startOffset, buffer.duration - 0.001));
      sourcesRef.current[kind] = source;
    }
    startCtxTimeRef.current = engine.ctx.currentTime;
    applyGains();
    setPlaying(true);
  }, [applyGains, ensureBus, ensureEngine, ensureStemGain, stopAllSources]);

  const pause = useCallback(() => {
    stopAllSources(true);
    setPlaying(false);
  }, [stopAllSources]);

  const togglePlay = useCallback(() => {
    if (playingRef.current) pause();
    else startPlayback();
  }, [pause, startPlayback]);

  const getPlayheadSeconds = useCallback((): number => {
    const engine = peekEngine();
    const dur = durationRef.current;
    if (!engine || !playingRef.current || dur <= 0) return offsetRef.current;
    const elapsed = engine.ctx.currentTime - startCtxTimeRef.current;
    const pos = offsetRef.current + elapsed;
    return loopRef.current ? ((pos % dur) + dur) % dur : Math.min(pos, dur);
  }, [peekEngine]);

  const seek = useCallback(
    (t: number) => {
      const wasPlaying = playingRef.current;
      stopAllSources(false);
      offsetRef.current = Math.max(0, Math.min(t, durationRef.current));
      setCurrentTime(offsetRef.current);
      if (wasPlaying) startPlayback();
    },
    [startPlayback, stopAllSources],
  );

  const handleStemFile = useCallback(
    (kind: StemKind) => async (event: ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;
      const engine = ensureEngine();
      const arrayBuffer = await file.arrayBuffer();
      const decoded = await engine.ctx.decodeAudioData(arrayBuffer);
      setStems((prev) => ({
        ...prev,
        [kind]: { ...prev[kind], buffer: decoded, fileName: file.name },
      }));
      setPeaksByKind((prev) => ({ ...prev, [kind]: computePeaks(decoded, 300) }));
      event.target.value = "";
    },
    [ensureEngine],
  );

  const generateOne = useCallback(
    (kind: StemKind) => {
      const engine = ensureEngine();
      const buffer = generateDemoStem(engine.ctx, kind);
      setStems((prev) => ({
        ...prev,
        [kind]: { ...prev[kind], buffer, fileName: `demo-${kind}.wav` },
      }));
      setPeaksByKind((prev) => ({ ...prev, [kind]: computePeaks(buffer, 300) }));
    },
    [ensureEngine],
  );

  const generateAllDemo = useCallback(() => {
    for (const kind of STEM_KINDS) {
      if (!stemsRef.current[kind].buffer) generateOne(kind);
    }
  }, [generateOne]);

  const setStemField = useCallback(
    <K extends keyof StemState>(kind: StemKind, field: K, value: StemState[K]) => {
      setStems((prev) => ({ ...prev, [kind]: { ...prev[kind], [field]: value } }));
    },
    [],
  );

  useShortcuts({
    " ": togglePlay,
    g: generateAllDemo,
  });

  useEffect(() => {
    for (const kind of STEM_KINDS) {
      const canvas = waveformRefs.current[kind];
      const peaks = peaksByKind[kind];
      if (!canvas) continue;
      const ctx = setupCanvas(canvas, 260, 42);
      drawWaveform(ctx, 260, 42, peaks ?? null, 0);
    }
  }, [peaksByKind]);

  const lastTimeUpdateRef = useRef(0);

  useAnimationFrame(() => {
    const busInfo = busRef.current;
    if (busInfo && combinedCanvasRef.current) {
      if (freqScratchRef.current.length !== busInfo.analyser.frequencyBinCount) {
        freqScratchRef.current = new Uint8Array(
          new ArrayBuffer(busInfo.analyser.frequencyBinCount),
        );
      }
      busInfo.analyser.getByteFrequencyData(freqScratchRef.current);
      const ctx = setupCanvas(combinedCanvasRef.current, 900, 160);
      drawSpectrumBars(ctx, 900, 160, freqScratchRef.current);
    }
    if (playingRef.current) {
      const now = performance.now();
      if (now - lastTimeUpdateRef.current > 120) {
        lastTimeUpdateRef.current = now;
        setCurrentTime(getPlayheadSeconds());
      }
    }
  }, true);

  return (
    <ModeStage>
      <div className={controlStyles.modeToolbar}>
        <Button variant="primary" size="sm" onClick={togglePlay} disabled={duration <= 0}>
          {playing ? "❚❚ Pause" : "▶ Play all"}
        </Button>
        <ToggleChip active={loop} onClick={() => setLoop((v) => !v)} title="Loop">
          ↻ Loop
        </ToggleChip>
        <Button variant="secondary" size="sm" onClick={generateAllDemo}>
          🎛 Generate demo stems
        </Button>
        <span className={controlStyles.readoutRow}>
          {formatTime(currentTime)} / {formatTime(duration)}
        </span>
      </div>

      <input
        type="range"
        min={0}
        max={Math.max(duration, 0.01)}
        step={0.01}
        value={Math.min(currentTime, duration)}
        onChange={(event) => seek(Number(event.target.value))}
        disabled={duration <= 0}
        aria-label="Seek all stems"
      />

      <p className={controlStyles.emptyHint} style={{ padding: 0, textAlign: "left" }}>
        Load separate stem files into each slot, or generate procedural demo stems to explore the
        architecture. A real separation model (Demucs/Spleeter-style) would fill these same slots
        from one mixdown file — see the code comment in <code>stemSynth.ts</code> for the intended
        integration point.
      </p>

      <div className={stemStyles.stemList}>
        {STEM_KINDS.map((kind) => {
          const s = stems[kind];
          return (
            <div key={kind} className={stemStyles.stemRow}>
              <div className={stemStyles.stemLabel}>
                <span className={stemStyles.stemLabelName}>{STEM_LABELS[kind]}</span>
                <span className={stemStyles.stemLabelFile}>{s.fileName ?? "empty"}</span>
              </div>

              <div className={stemStyles.stemActions}>
                <label className={controlStyles.fileLabel}>
                  📂 Load
                  <input
                    type="file"
                    accept="audio/*"
                    className={controlStyles.hiddenFileInput}
                    onChange={(event) => void handleStemFile(kind)(event)}
                  />
                </label>
                <Button variant="secondary" size="sm" onClick={() => generateOne(kind)}>
                  Demo
                </Button>
                <ToggleChip
                  active={s.muted}
                  onClick={() => setStemField(kind, "muted", !s.muted)}
                  tone="danger"
                  title="Mute"
                >
                  M
                </ToggleChip>
                <ToggleChip
                  active={s.solo}
                  onClick={() => setStemField(kind, "solo", !s.solo)}
                  tone="warning"
                  title="Solo"
                >
                  S
                </ToggleChip>
              </div>

              <canvas
                ref={(el) => {
                  waveformRefs.current[kind] = el;
                }}
                className={stemStyles.stemWaveform}
              />

              <SliderRow
                label="Vol"
                value={s.volume}
                min={0}
                max={1.3}
                step={0.01}
                onChange={(v) => setStemField(kind, "volume", v)}
                format={(v) => `${Math.round(v * 100)}%`}
              />
            </div>
          );
        })}
      </div>

      <div className={controlStyles.panel}>
        <span className={controlStyles.panelTitle}>Combined spectrum</span>
        <canvas
          ref={combinedCanvasRef}
          className={controlStyles.canvasBlock}
          style={{ aspectRatio: "900 / 160" }}
        />
      </div>
    </ModeStage>
  );
}
