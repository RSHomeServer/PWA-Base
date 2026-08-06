import { useCallback, useEffect, useRef, useState } from "react";
import type { ChangeEvent } from "react";
import { Button } from "@platform/ui";
import { useShortcuts } from "../../shared/useShortcuts.js";
import {
  FREQUENCY_BANDS,
  SimpleKWeightFilter,
  amplitudeToDb,
  bandEnergies,
  phaseCorrelation,
  rms,
  useAudioEngine,
} from "@platform/audio";
import { useAnimationFrame } from "../../shared/useAnimationFrame.js";
import { useScreenshotTarget } from "../shared/useScreenshot.js";
import { ModeStage } from "../shared/ModeStage.js";
import { SliderRow, ToggleChip } from "../shared/Controls.js";
import controlStyles from "../shared/Controls.module.css";
import { computePeaks } from "./waveformPeaks.js";
import type { PeakData } from "./waveformPeaks.js";
import {
  drawBandMeters,
  drawSpectrumBars,
  drawStereoScope,
  drawWaveform,
  pushSpectrogramColumn,
  setupCanvas,
} from "./draw.js";

const SPEED_OPTIONS = [0.5, 0.75, 1, 1.25, 1.5, 2];

function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

interface VisGraph {
  gain: GainNode;
  analyserMain: AnalyserNode;
  analyserL: AnalyserNode;
  analyserR: AnalyserNode;
}

export function VisualiserMode() {
  const { ensureEngine, peekEngine } = useAudioEngine();

  const graphRef = useRef<VisGraph | null>(null);
  const sourceRef = useRef<AudioBufferSourceNode | null>(null);
  const audioBufferRef = useRef<AudioBuffer | null>(null);
  const offsetRef = useRef(0);
  const startCtxTimeRef = useRef(0);
  const speedRef = useRef(1);
  const loopRef = useRef(true);
  const kFilterRef = useRef<SimpleKWeightFilter | null>(null);
  const spectroCtxRef = useRef<CanvasRenderingContext2D | null>(null);

  const waveformCanvasRef = useRef<HTMLCanvasElement>(null);
  const spectrumCanvasRef = useRef<HTMLCanvasElement>(null);
  const spectrogramCanvasRef = useRef<HTMLCanvasElement>(null);
  const stereoCanvasRef = useRef<HTMLCanvasElement>(null);
  const bandsCanvasRef = useRef<HTMLCanvasElement>(null);
  const readoutRef = useRef<HTMLDivElement>(null);

  const [fileName, setFileName] = useState<string | null>(null);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [loop, setLoop] = useState(true);
  const [speed, setSpeed] = useState(1);
  const [volume, setVolume] = useState(0.9);
  const [peaks, setPeaks] = useState<PeakData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useScreenshotTarget(waveformCanvasRef);

  const buildGraph = useCallback((): VisGraph => {
    const engine = ensureEngine();
    if (!graphRef.current) {
      const gain = engine.ctx.createGain();
      gain.gain.value = volume;
      const analyserMain = engine.ctx.createAnalyser();
      analyserMain.fftSize = 2048;
      analyserMain.smoothingTimeConstant = 0.75;
      const splitter = engine.ctx.createChannelSplitter(2);
      const analyserL = engine.ctx.createAnalyser();
      analyserL.fftSize = 1024;
      const analyserR = engine.ctx.createAnalyser();
      analyserR.fftSize = 1024;

      gain.connect(analyserMain);
      analyserMain.connect(engine.masterGain);
      gain.connect(splitter);
      splitter.connect(analyserL, 0);
      splitter.connect(analyserR, 1);

      graphRef.current = { gain, analyserMain, analyserL, analyserR };
      kFilterRef.current = new SimpleKWeightFilter(engine.ctx.sampleRate);
    }
    return graphRef.current;
  }, [ensureEngine, volume]);

  const getPlayheadSeconds = useCallback((): number => {
    const buffer = audioBufferRef.current;
    if (!buffer) return 0;
    const engine = peekEngine();
    if (!sourceRef.current || !engine) return offsetRef.current;
    const elapsed = (engine.ctx.currentTime - startCtxTimeRef.current) * speedRef.current;
    const pos = offsetRef.current + elapsed;
    return loopRef.current
      ? ((pos % buffer.duration) + buffer.duration) % buffer.duration
      : Math.min(pos, buffer.duration);
  }, [peekEngine]);

  const stopSource = useCallback(
    (persistPosition: boolean) => {
      if (persistPosition) {
        offsetRef.current = getPlayheadSeconds();
      }
      if (sourceRef.current) {
        sourceRef.current.onended = null;
        try {
          sourceRef.current.stop();
        } catch {
          // already stopped
        }
        sourceRef.current.disconnect();
        sourceRef.current = null;
      }
    },
    [getPlayheadSeconds],
  );

  const startPlayback = useCallback(() => {
    const buffer = audioBufferRef.current;
    if (!buffer) return;
    const engine = ensureEngine();
    const graph = buildGraph();
    stopSource(false);
    const source = engine.ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = loopRef.current;
    source.playbackRate.value = speedRef.current;
    source.connect(graph.gain);
    const startOffset = ((offsetRef.current % buffer.duration) + buffer.duration) % buffer.duration;
    source.start(0, startOffset);
    source.onended = () => {
      if (!loopRef.current) {
        setPlaying(false);
        offsetRef.current = 0;
        setCurrentTime(0);
      }
    };
    sourceRef.current = source;
    startCtxTimeRef.current = engine.ctx.currentTime;
    setPlaying(true);
  }, [buildGraph, ensureEngine, stopSource]);

  const pause = useCallback(() => {
    stopSource(true);
    setPlaying(false);
  }, [stopSource]);

  const togglePlay = useCallback(() => {
    if (playing) {
      pause();
    } else {
      startPlayback();
    }
  }, [pause, playing, startPlayback]);

  const seek = useCallback(
    (t: number) => {
      const wasPlaying = playing;
      stopSource(false);
      const buffer = audioBufferRef.current;
      offsetRef.current = buffer ? Math.max(0, Math.min(t, buffer.duration)) : 0;
      setCurrentTime(offsetRef.current);
      if (wasPlaying) startPlayback();
    },
    [playing, startPlayback, stopSource],
  );

  const handleSpeedChange = useCallback(
    (next: number) => {
      const wasPlaying = playing;
      if (wasPlaying) stopSource(true);
      speedRef.current = next;
      setSpeed(next);
      if (wasPlaying) startPlayback();
    },
    [playing, startPlayback, stopSource],
  );

  const handleLoopToggle = useCallback(() => {
    loopRef.current = !loopRef.current;
    setLoop(loopRef.current);
    if (sourceRef.current) sourceRef.current.loop = loopRef.current;
  }, []);

  useEffect(() => {
    if (graphRef.current) {
      graphRef.current.gain.gain.setTargetAtTime(volume, peekEngine()?.ctx.currentTime ?? 0, 0.02);
    }
  }, [volume, peekEngine]);

  const handleFile = useCallback(
    async (event: ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;
      setError(null);
      try {
        const engine = ensureEngine();
        const arrayBuffer = await file.arrayBuffer();
        const decoded = await engine.ctx.decodeAudioData(arrayBuffer);
        stopSource(false);
        audioBufferRef.current = decoded;
        offsetRef.current = 0;
        setCurrentTime(0);
        setDuration(decoded.duration);
        setPeaks(computePeaks(decoded, 900));
        setFileName(file.name);
      } catch {
        setError("Couldn't decode that file — try a WAV, MP3, or OGG.");
      }
      event.target.value = "";
    },
    [ensureEngine, stopSource],
  );

  const leftScratch = useRef(new Float32Array(new ArrayBuffer(1024 * 4)));
  const rightScratch = useRef(new Float32Array(new ArrayBuffer(1024 * 4)));
  const freqScratch = useRef(new Uint8Array(new ArrayBuffer(1024)));
  const timeScratch = useRef(new Float32Array(new ArrayBuffer(2048 * 4)));

  useAnimationFrame(() => {
    const graph = graphRef.current;
    const wCanvas = waveformCanvasRef.current;
    const sCanvas = spectrumCanvasRef.current;
    const stCanvas = stereoCanvasRef.current;
    const bCanvas = bandsCanvasRef.current;
    const spCanvas = spectrogramCanvasRef.current;

    if (wCanvas) {
      const ctx = setupCanvas(wCanvas, 1100, 150);
      const progress = duration > 0 ? getPlayheadSeconds() / duration : 0;
      drawWaveform(ctx, 1100, 150, peaks, progress);
    }

    if (!graph) return;

    const analyserMain = graph.analyserMain;
    if (freqScratch.current.length !== analyserMain.frequencyBinCount) {
      freqScratch.current = new Uint8Array(new ArrayBuffer(analyserMain.frequencyBinCount));
    }
    analyserMain.getByteFrequencyData(freqScratch.current);

    if (timeScratch.current.length !== analyserMain.fftSize) {
      timeScratch.current = new Float32Array(new ArrayBuffer(analyserMain.fftSize * 4));
    }
    analyserMain.getFloatTimeDomainData(timeScratch.current);

    if (sCanvas) {
      const ctx = setupCanvas(sCanvas, 700, 150);
      drawSpectrumBars(ctx, 700, 150, freqScratch.current);
    }

    if (spCanvas) {
      if (!spectroCtxRef.current) {
        spectroCtxRef.current = setupCanvas(spCanvas, 400, 150, 1);
      }
      pushSpectrogramColumn(spectroCtxRef.current, 400, 150, freqScratch.current);
    }

    if (graph.analyserL.fftSize !== leftScratch.current.length) {
      leftScratch.current = new Float32Array(new ArrayBuffer(graph.analyserL.fftSize * 4));
      rightScratch.current = new Float32Array(new ArrayBuffer(graph.analyserR.fftSize * 4));
    }
    graph.analyserL.getFloatTimeDomainData(leftScratch.current);
    graph.analyserR.getFloatTimeDomainData(rightScratch.current);

    if (stCanvas) {
      const ctx = setupCanvas(stCanvas, 220, 220);
      drawStereoScope(ctx, 220, 220, leftScratch.current, rightScratch.current);
    }

    const engine = peekEngine();
    if (bCanvas && engine) {
      const bands = bandEnergies(freqScratch.current, engine.ctx.sampleRate);
      const ctx = setupCanvas(bCanvas, 460, 150);
      drawBandMeters(
        ctx,
        460,
        150,
        bands,
        FREQUENCY_BANDS.map((b) => b.label),
      );
    }

    const level = rms(timeScratch.current);
    const peakSample = timeScratch.current.reduce((m, v) => Math.max(m, Math.abs(v)), 0);
    const weighted = kFilterRef.current
      ? kFilterRef.current.process(timeScratch.current.slice())
      : timeScratch.current;
    const lufsish = amplitudeToDb(rms(weighted)) - 0.691;
    const correlation = phaseCorrelation(leftScratch.current, rightScratch.current);

    if (readoutRef.current) {
      const pos = getPlayheadSeconds();
      setCurrentTimeThrottled(pos, setCurrentTime);
      readoutRef.current.innerHTML =
        `<span>RMS <strong>${amplitudeToDb(level).toFixed(1)} dB</strong></span>` +
        `<span>Peak <strong>${amplitudeToDb(peakSample).toFixed(1)} dB</strong></span>` +
        `<span>LUFS-ish <strong>${Number.isFinite(lufsish) ? lufsish.toFixed(1) : "-inf"} dB</strong></span>` +
        `<span>Phase corr. <strong>${correlation.toFixed(2)}</strong></span>` +
        `<span>Sample rate <strong>${engine ? engine.ctx.sampleRate : "-"} Hz</strong></span>`;
    }
  }, true);

  // Coalesce the seek-bar's React state update to a low-ish rate so scrubbing stays smooth.
  const lastTimeUpdateRef = useRef(0);
  function setCurrentTimeThrottled(pos: number, setter: (v: number) => void) {
    const now = performance.now();
    if (now - lastTimeUpdateRef.current > 120) {
      lastTimeUpdateRef.current = now;
      setter(pos);
    }
  }

  useShortcuts({
    " ": togglePlay,
    l: handleLoopToggle,
  });

  return (
    <ModeStage>
      <div className={controlStyles.modeToolbar}>
        <label className={controlStyles.fileLabel}>
          📂 {fileName ?? "Load audio file"}
          <input
            type="file"
            accept="audio/*"
            className={controlStyles.hiddenFileInput}
            onChange={(event) => void handleFile(event)}
          />
        </label>
        <Button variant="primary" size="sm" onClick={togglePlay} disabled={!audioBufferRef.current}>
          {playing ? "❚❚ Pause" : "▶ Play"}
        </Button>
        <ToggleChip active={loop} onClick={handleLoopToggle} title="Loop playback">
          ↻ Loop
        </ToggleChip>
        <div className={controlStyles.modeToolbarGroup}>
          <span>Speed</span>
          {SPEED_OPTIONS.map((option) => (
            <Button
              key={option}
              variant={option === speed ? "primary" : "secondary"}
              size="sm"
              onClick={() => handleSpeedChange(option)}
            >
              {option}×
            </Button>
          ))}
        </div>
        <div className={controlStyles.modeToolbarGroup} style={{ minWidth: "10rem" }}>
          <SliderRow
            label="Volume"
            value={volume}
            min={0}
            max={1.5}
            step={0.01}
            onChange={setVolume}
            format={(v) => `${Math.round(v * 100)}%`}
          />
        </div>
      </div>

      {error ? <p role="alert">{error}</p> : null}

      <div className={controlStyles.modeToolbarGroup} style={{ width: "100%" }}>
        <span style={{ fontFamily: "var(--font-family-mono)", fontSize: "var(--font-size-xs)" }}>
          {formatTime(currentTime)}
        </span>
        <input
          type="range"
          min={0}
          max={Math.max(duration, 0.01)}
          step={0.01}
          value={Math.min(currentTime, duration)}
          onChange={(event) => seek(Number(event.target.value))}
          style={{ flex: 1 }}
          disabled={!audioBufferRef.current}
          aria-label="Seek"
        />
        <span style={{ fontFamily: "var(--font-family-mono)", fontSize: "var(--font-size-xs)" }}>
          {formatTime(duration)}
        </span>
      </div>

      {!fileName ? (
        <p className={controlStyles.emptyHint}>
          Load a WAV, MP3, or OGG file to see it come alive below.
        </p>
      ) : null}

      <div className={controlStyles.panel}>
        <span className={controlStyles.panelTitle}>Waveform</span>
        <canvas
          ref={waveformCanvasRef}
          className={controlStyles.canvasBlock}
          style={{ aspectRatio: "1100 / 150" }}
        />
      </div>

      <div className={`${controlStyles.panelGrid} ${controlStyles.panelGrid2}`}>
        <div className={controlStyles.panel}>
          <span className={controlStyles.panelTitle}>Spectrum (FFT)</span>
          <canvas
            ref={spectrumCanvasRef}
            className={controlStyles.canvasBlock}
            style={{ aspectRatio: "700 / 150" }}
          />
        </div>
        <div className={controlStyles.panel}>
          <span className={controlStyles.panelTitle}>Spectrogram (scrolling)</span>
          <canvas
            ref={spectrogramCanvasRef}
            className={controlStyles.canvasBlock}
            style={{ aspectRatio: "400 / 150" }}
          />
        </div>
      </div>

      <div className={`${controlStyles.panelGrid} ${controlStyles.panelGrid2}`}>
        <div className={controlStyles.panel}>
          <span className={controlStyles.panelTitle}>Stereo image (Lissajous)</span>
          <canvas
            ref={stereoCanvasRef}
            className={controlStyles.canvasBlock}
            style={{ aspectRatio: "1 / 1", maxWidth: "220px" }}
          />
        </div>
        <div className={controlStyles.panel}>
          <span className={controlStyles.panelTitle}>Frequency energy bands</span>
          <canvas
            ref={bandsCanvasRef}
            className={controlStyles.canvasBlock}
            style={{ aspectRatio: "460 / 150" }}
          />
        </div>
      </div>

      <div className={controlStyles.panel}>
        <span className={controlStyles.panelTitle}>Live readouts</span>
        <div ref={readoutRef} className={controlStyles.readoutRow} />
      </div>
    </ModeStage>
  );
}
