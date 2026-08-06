import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@platform/ui";
import { useShortcuts } from "../../shared/useShortcuts.js";
import { useAudioEngine } from "@platform/audio";
import { loadModeSession, saveModeSession } from "../session.js";
import { ModeStage } from "../shared/ModeStage.js";
import { SliderRow, ToggleChip } from "../shared/Controls.js";
import controlStyles from "../shared/Controls.module.css";
import styles from "./DrumMachineMode.module.css";
import {
  DRUM_LABELS,
  DRUM_VOICES,
  createDrumBank,
  triggerDrum,
  type DrumVoice,
} from "./drumSamples.js";

type Pattern = Record<DrumVoice, boolean[]>;

interface DrumSession {
  steps: number;
  bpm: number;
  swing: number;
  pattern: Pattern;
  muted: Record<DrumVoice, boolean>;
  solo: Record<DrumVoice, boolean>;
  volume: Record<DrumVoice, number>;
}

function emptyPattern(steps: number): Pattern {
  const p = {} as Pattern;
  for (const v of DRUM_VOICES) p[v] = Array.from({ length: steps }, () => false);
  return p;
}

function defaultPattern(steps: number): Pattern {
  const p = emptyPattern(steps);
  for (let i = 0; i < steps; i++) {
    if (i % 4 === 0) p.kick[i] = true;
    if (i % 4 === 2) p.snare[i] = true;
    if (i % 2 === 1) p.hat[i] = true;
    if (i === 6 || i === 14) p.clap[i] = true;
    if (i === 10) p.tom[i] = true;
  }
  return p;
}

function defaultMuted(): Record<DrumVoice, boolean> {
  return { kick: false, snare: false, hat: false, clap: false, tom: false };
}

function defaultVolume(): Record<DrumVoice, number> {
  return { kick: 1, snare: 0.85, hat: 0.55, clap: 0.7, tom: 0.75 };
}

function defaultSession(): DrumSession {
  return {
    steps: 16,
    bpm: 120,
    swing: 0.12,
    pattern: defaultPattern(16),
    muted: defaultMuted(),
    solo: defaultMuted(),
    volume: defaultVolume(),
  };
}

function clonePattern(p: Pattern): Pattern {
  const next = {} as Pattern;
  for (const v of DRUM_VOICES) next[v] = [...p[v]];
  return next;
}

function resizePattern(p: Pattern, steps: number): Pattern {
  const next = {} as Pattern;
  for (const v of DRUM_VOICES) {
    const row = [...p[v]];
    while (row.length < steps) row.push(false);
    next[v] = row.slice(0, steps);
  }
  return next;
}

export function DrumMachineMode() {
  const { ensureEngine } = useAudioEngine();
  const initial = loadModeSession("drums", defaultSession());
  const [steps, setSteps] = useState(initial.steps);
  const [bpm, setBpm] = useState(initial.bpm);
  const [swing, setSwing] = useState(initial.swing);
  const [pattern, setPattern] = useState(initial.pattern);
  const [muted, setMuted] = useState(initial.muted);
  const [solo, setSolo] = useState(initial.solo);
  const [volume, setVolume] = useState(initial.volume);
  const [playing, setPlaying] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  const patternRef = useRef(pattern);
  const mutedRef = useRef(muted);
  const soloRef = useRef(solo);
  const volumeRef = useRef(volume);
  const stepsRef = useRef(steps);
  const bpmRef = useRef(bpm);
  const swingRef = useRef(swing);
  const playingRef = useRef(playing);
  patternRef.current = pattern;
  mutedRef.current = muted;
  soloRef.current = solo;
  volumeRef.current = volume;
  stepsRef.current = steps;
  bpmRef.current = bpm;
  swingRef.current = swing;
  playingRef.current = playing;

  const bankRef = useRef<ReturnType<typeof createDrumBank> | null>(null);
  const busRef = useRef<GainNode | null>(null);
  const timerRef = useRef<number | null>(null);
  const nextNoteTimeRef = useRef(0);
  const stepIndexRef = useRef(0);
  const clipboardRef = useRef<Pattern | null>(null);
  const undoStackRef = useRef<Pattern[]>([]);
  const redoStackRef = useRef<Pattern[]>([]);

  const ensureBank = useCallback(() => {
    const engine = ensureEngine();
    if (!bankRef.current) bankRef.current = createDrumBank(engine.ctx);
    if (!busRef.current) {
      busRef.current = engine.ctx.createGain();
      busRef.current.connect(engine.masterGain);
    }
    return { engine, bank: bankRef.current, bus: busRef.current };
  }, [ensureEngine]);

  const pushUndo = useCallback((p: Pattern) => {
    undoStackRef.current.push(clonePattern(p));
    if (undoStackRef.current.length > 40) undoStackRef.current.shift();
    redoStackRef.current = [];
  }, []);

  const toggleCell = useCallback(
    (voice: DrumVoice, step: number) => {
      pushUndo(patternRef.current);
      setPattern((prev) => {
        const next = clonePattern(prev);
        next[voice][step] = !next[voice][step];
        return next;
      });
    },
    [pushUndo],
  );

  const scheduleStep = useCallback(
    (step: number, when: number) => {
      const { engine, bank, bus } = ensureBank();
      const anySolo = DRUM_VOICES.some((v) => soloRef.current[v]);
      for (const voice of DRUM_VOICES) {
        if (!patternRef.current[voice][step]) continue;
        const mutedNow = mutedRef.current[voice] || (anySolo && !soloRef.current[voice]);
        if (mutedNow) continue;
        triggerDrum(engine.ctx, bus, bank[voice], when, volumeRef.current[voice]);
      }
    },
    [ensureBank],
  );

  const schedulerTick = useCallback(() => {
    const { engine } = ensureBank();
    const lookAhead = 0.12;
    const secPerBeat = 60 / bpmRef.current;
    const stepDur = secPerBeat / 4;
    while (nextNoteTimeRef.current < engine.ctx.currentTime + lookAhead) {
      const step = stepIndexRef.current % stepsRef.current;
      let when = nextNoteTimeRef.current;
      if (step % 2 === 1) when += stepDur * swingRef.current;
      scheduleStep(step, when);
      setCurrentStep(step);
      nextNoteTimeRef.current += stepDur;
      stepIndexRef.current = (step + 1) % stepsRef.current;
    }
    timerRef.current = window.setTimeout(schedulerTick, 25);
  }, [ensureBank, scheduleStep]);

  const stopScheduler = useCallback(() => {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const startScheduler = useCallback(() => {
    const { engine } = ensureBank();
    void engine.ctx.resume();
    nextNoteTimeRef.current = engine.ctx.currentTime + 0.05;
    stopScheduler();
    schedulerTick();
  }, [ensureBank, schedulerTick, stopScheduler]);

  const togglePlay = useCallback(() => {
    setPlaying((p) => {
      const next = !p;
      playingRef.current = next;
      if (next) startScheduler();
      else stopScheduler();
      return next;
    });
  }, [startScheduler, stopScheduler]);

  useEffect(() => () => stopScheduler(), [stopScheduler]);

  useEffect(() => {
    saveModeSession("drums", {
      steps,
      bpm,
      swing,
      pattern,
      muted,
      solo,
      volume,
    } satisfies DrumSession);
  }, [steps, bpm, swing, pattern, muted, solo, volume]);

  const handleStepsChange = useCallback(
    (n: number) => {
      pushUndo(patternRef.current);
      setSteps(n);
      setPattern((p) => resizePattern(p, n));
      stepIndexRef.current = 0;
    },
    [pushUndo],
  );

  const clearPattern = useCallback(() => {
    pushUndo(patternRef.current);
    setPattern(emptyPattern(stepsRef.current));
  }, [pushUndo]);

  const copyPattern = useCallback(() => {
    clipboardRef.current = clonePattern(patternRef.current);
  }, []);

  const pastePattern = useCallback(() => {
    if (!clipboardRef.current) return;
    pushUndo(patternRef.current);
    setPattern(resizePattern(clipboardRef.current, stepsRef.current));
  }, [pushUndo]);

  const undo = useCallback(() => {
    const prev = undoStackRef.current.pop();
    if (!prev) return;
    redoStackRef.current.push(clonePattern(patternRef.current));
    setPattern(prev);
  }, []);

  const redo = useCallback(() => {
    const next = redoStackRef.current.pop();
    if (!next) return;
    undoStackRef.current.push(clonePattern(patternRef.current));
    setPattern(next);
  }, []);

  useShortcuts({
    " ": togglePlay,
    c: copyPattern,
    v: pastePattern,
    z: undo,
    y: redo,
    "1": () => setMuted((m) => ({ ...m, kick: !m.kick })),
    "2": () => setMuted((m) => ({ ...m, snare: !m.snare })),
    "3": () => setMuted((m) => ({ ...m, hat: !m.hat })),
    "4": () => setMuted((m) => ({ ...m, clap: !m.clap })),
    "5": () => setMuted((m) => ({ ...m, tom: !m.tom })),
  });

  return (
    <ModeStage>
      <div className={controlStyles.modeToolbar}>
        <Button variant="primary" size="sm" onClick={togglePlay}>
          {playing ? "❚❚ Stop" : "▶ Play"}
        </Button>
        <Button variant="secondary" size="sm" onClick={clearPattern}>
          Clear
        </Button>
        <Button variant="secondary" size="sm" onClick={copyPattern}>
          Copy
        </Button>
        <Button variant="secondary" size="sm" onClick={pastePattern}>
          Paste
        </Button>
        <Button variant="secondary" size="sm" onClick={undo}>
          Undo
        </Button>
        <Button variant="secondary" size="sm" onClick={redo}>
          Redo
        </Button>
        <div className={controlStyles.modeToolbarGroup}>
          {[8, 16, 24, 32].map((n) => (
            <Button
              key={n}
              variant={steps === n ? "primary" : "secondary"}
              size="sm"
              onClick={() => handleStepsChange(n)}
            >
              {n}
            </Button>
          ))}
        </div>
      </div>

      <div className={`${controlStyles.panelGrid} ${controlStyles.panelGrid2}`}>
        <SliderRow
          label="Tempo"
          value={bpm}
          min={60}
          max={180}
          step={1}
          onChange={setBpm}
          format={(v) => `${v} BPM`}
        />
        <SliderRow
          label="Swing"
          value={swing}
          min={0}
          max={0.4}
          step={0.01}
          onChange={setSwing}
          format={(v) => `${Math.round(v * 100)}%`}
        />
      </div>

      <div className={styles.grid}>
        {DRUM_VOICES.map((voice) => (
          <div key={voice} className={styles.track}>
            <div className={styles.trackMeta}>
              <span className={styles.trackName}>{DRUM_LABELS[voice]}</span>
              <ToggleChip
                active={muted[voice]}
                onClick={() => setMuted((m) => ({ ...m, [voice]: !m[voice] }))}
                tone="danger"
              >
                M
              </ToggleChip>
              <ToggleChip
                active={solo[voice]}
                onClick={() => setSolo((s) => ({ ...s, [voice]: !s[voice] }))}
                tone="warning"
              >
                S
              </ToggleChip>
              <SliderRow
                label="Vol"
                value={volume[voice]}
                min={0}
                max={1.2}
                step={0.01}
                onChange={(v) => setVolume((prev) => ({ ...prev, [voice]: v }))}
                format={(v) => `${Math.round(v * 100)}%`}
              />
            </div>
            <div
              className={styles.steps}
              style={{ gridTemplateColumns: `repeat(${steps}, minmax(0, 1fr))` }}
            >
              {pattern[voice].map((on, i) => (
                <button
                  key={i}
                  type="button"
                  className={[
                    styles.step,
                    on ? styles.stepOn : "",
                    i === currentStep && playing ? styles.stepPlayhead : "",
                    i % 4 === 0 ? styles.stepBeat : "",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                  onClick={() => toggleCell(voice, i)}
                  aria-label={`${DRUM_LABELS[voice]} step ${i + 1}`}
                  aria-pressed={on}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </ModeStage>
  );
}
