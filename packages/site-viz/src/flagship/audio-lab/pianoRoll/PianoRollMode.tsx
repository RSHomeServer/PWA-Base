import { useCallback, useEffect, useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import { Button } from "@platform/ui";
import { useShortcuts } from "../../shared/useShortcuts.js";
import { useAudioEngine } from "../engine/useAudioEngine.js";
import { loadModeSession, saveModeSession } from "../session.js";
import { ModeStage } from "../shared/ModeStage.js";
import { SliderRow, ToggleChip } from "../shared/Controls.js";
import controlStyles from "../shared/Controls.module.css";
import styles from "./PianoRollMode.module.css";
import { downloadMidi, parseMidiNotes, type MidiNote } from "./midi.js";

const TRACK_COLORS = ["#2dd4bf", "#60a5fa", "#f472b6", "#fbbf24"];
const NOTE_RANGE = { lo: 48, hi: 84 }; // C3–C6
const BEATS = 16;

interface RollSession {
  notes: MidiNote[];
  bpm: number;
  snap: number;
  loop: boolean;
  track: number;
  velocity: number;
}

function defaultSession(): RollSession {
  return {
    notes: [
      { pitch: 60, start: 0, duration: 1, velocity: 0.85, track: 0 },
      { pitch: 64, start: 1, duration: 1, velocity: 0.8, track: 0 },
      { pitch: 67, start: 2, duration: 1, velocity: 0.8, track: 0 },
      { pitch: 72, start: 3, duration: 2, velocity: 0.9, track: 1 },
    ],
    bpm: 110,
    snap: 0.25,
    loop: true,
    track: 0,
    velocity: 0.85,
  };
}

function midiToFreq(midi: number): number {
  return 440 * Math.pow(2, (midi - 69) / 12);
}

function snapValue(v: number, snap: number): number {
  return Math.round(v / snap) * snap;
}

function playSynthNote(
  ctx: AudioContext,
  dest: AudioNode,
  pitch: number,
  when: number,
  duration: number,
  velocity: number,
  track: number,
): void {
  const osc = ctx.createOscillator();
  osc.type = (["sine", "triangle", "square", "sawtooth"] as OscillatorType[])[track % 4]!;
  osc.frequency.value = midiToFreq(pitch);
  const g = ctx.createGain();
  const peak = 0.18 * velocity;
  g.gain.setValueAtTime(0.0001, when);
  g.gain.exponentialRampToValueAtTime(peak, when + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, when + Math.max(0.05, duration));
  osc.connect(g);
  g.connect(dest);
  osc.start(when);
  osc.stop(when + Math.max(0.06, duration) + 0.05);
}

export function PianoRollMode() {
  const { ensureEngine } = useAudioEngine();
  const initial = loadModeSession("piano-roll", defaultSession());
  const [notes, setNotes] = useState<MidiNote[]>(initial.notes);
  const [bpm, setBpm] = useState(initial.bpm);
  const [snap, setSnap] = useState(initial.snap);
  const [loop, setLoop] = useState(initial.loop);
  const [track, setTrack] = useState(initial.track);
  const [velocity, setVelocity] = useState(initial.velocity);
  const [playing, setPlaying] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [playhead, setPlayhead] = useState(0);

  const notesRef = useRef(notes);
  const bpmRef = useRef(bpm);
  const loopRef = useRef(loop);
  const playingRef = useRef(playing);
  notesRef.current = notes;
  bpmRef.current = bpm;
  loopRef.current = loop;
  playingRef.current = playing;

  const busRef = useRef<GainNode | null>(null);
  const timerRef = useRef<number | null>(null);
  const nextBeatRef = useRef(0);
  const beatCursorRef = useRef(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const dragRef = useRef<{ pitch: number; start: number } | null>(null);

  const ensureBus = useCallback(() => {
    const engine = ensureEngine();
    if (!busRef.current) {
      busRef.current = engine.ctx.createGain();
      busRef.current.gain.value = 0.9;
      busRef.current.connect(engine.masterGain);
    }
    return { engine, bus: busRef.current };
  }, [ensureEngine]);

  const stopScheduler = useCallback(() => {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const scheduleAhead = useCallback(() => {
    const { engine, bus } = ensureBus();
    const lookAhead = 0.15;
    const secPerBeat = 60 / bpmRef.current;
    while (nextBeatRef.current < engine.ctx.currentTime + lookAhead) {
      const beat = beatCursorRef.current;
      for (const note of notesRef.current) {
        if (Math.abs(note.start - beat) < 0.001) {
          playSynthNote(
            engine.ctx,
            bus,
            note.pitch,
            nextBeatRef.current,
            note.duration * secPerBeat,
            note.velocity,
            note.track,
          );
        }
      }
      setPlayhead(beat);
      nextBeatRef.current += secPerBeat * 0.25;
      beatCursorRef.current += 0.25;
      if (beatCursorRef.current >= BEATS) {
        if (loopRef.current) beatCursorRef.current = 0;
        else {
          setPlaying(false);
          playingRef.current = false;
          stopScheduler();
          return;
        }
      }
    }
    timerRef.current = window.setTimeout(scheduleAhead, 25);
  }, [ensureBus, stopScheduler]);

  const togglePlay = useCallback(() => {
    setPlaying((p) => {
      const next = !p;
      playingRef.current = next;
      if (next) {
        const { engine } = ensureBus();
        void engine.ctx.resume();
        beatCursorRef.current = 0;
        nextBeatRef.current = engine.ctx.currentTime + 0.05;
        stopScheduler();
        scheduleAhead();
      } else {
        stopScheduler();
      }
      return next;
    });
  }, [ensureBus, scheduleAhead, stopScheduler]);

  useEffect(() => () => stopScheduler(), [stopScheduler]);

  useEffect(() => {
    saveModeSession("piano-roll", {
      notes,
      bpm,
      snap,
      loop,
      track,
      velocity,
    } satisfies RollSession);
  }, [notes, bpm, snap, loop, track, velocity]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const w = 960 * zoom;
    const h = 360;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.floor(w * dpr);
    canvas.height = Math.floor(h * dpr);
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = "#06080f";
    ctx.fillRect(0, 0, w, h);

    const pitches = NOTE_RANGE.hi - NOTE_RANGE.lo + 1;
    const rowH = h / pitches;
    const colW = w / BEATS;

    for (let p = 0; p < pitches; p++) {
      const midi = NOTE_RANGE.hi - p;
      const y = p * rowH;
      ctx.fillStyle = midi % 12 === 0 ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.02)";
      ctx.fillRect(0, y, w, rowH);
    }
    for (let b = 0; b <= BEATS; b++) {
      ctx.strokeStyle = b % 4 === 0 ? "rgba(255,255,255,0.18)" : "rgba(255,255,255,0.06)";
      ctx.beginPath();
      ctx.moveTo(b * colW, 0);
      ctx.lineTo(b * colW, h);
      ctx.stroke();
    }

    for (const note of notes) {
      if (note.pitch < NOTE_RANGE.lo || note.pitch > NOTE_RANGE.hi) continue;
      const x = note.start * colW;
      const y = (NOTE_RANGE.hi - note.pitch) * rowH;
      const nw = Math.max(4, note.duration * colW - 2);
      ctx.fillStyle = TRACK_COLORS[note.track % TRACK_COLORS.length]!;
      ctx.globalAlpha = 0.45 + note.velocity * 0.55;
      ctx.fillRect(x + 1, y + 1, nw, rowH - 2);
      ctx.globalAlpha = 1;
    }

    if (playing) {
      ctx.strokeStyle = "#f8fafc";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(playhead * colW, 0);
      ctx.lineTo(playhead * colW, h);
      ctx.stroke();
    }
  }, [notes, playhead, playing, zoom]);

  useEffect(() => {
    draw();
  }, [draw]);

  const pointerToNote = useCallback(
    (e: ReactPointerEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) return null;
      const rect = canvas.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * BEATS;
      const y = ((e.clientY - rect.top) / rect.height) * (NOTE_RANGE.hi - NOTE_RANGE.lo + 1);
      const pitch = Math.round(NOTE_RANGE.hi - y);
      const start = snapValue(Math.max(0, Math.min(BEATS - snap, x)), snap);
      return { pitch, start };
    },
    [snap],
  );

  const onPointerDown = useCallback(
    (e: ReactPointerEvent<HTMLCanvasElement>) => {
      const pos = pointerToNote(e);
      if (!pos) return;
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
      dragRef.current = pos;
      const existing = notes.find(
        (n) =>
          n.pitch === pos.pitch && Math.abs(n.start - pos.start) < snap / 2 && n.track === track,
      );
      if (existing) {
        setNotes((prev) => prev.filter((n) => n !== existing));
        dragRef.current = null;
      }
    },
    [notes, pointerToNote, snap, track],
  );

  const onPointerUp = useCallback(
    (e: ReactPointerEvent<HTMLCanvasElement>) => {
      const startPos = dragRef.current;
      dragRef.current = null;
      if (!startPos) return;
      const end = pointerToNote(e);
      if (!end) return;
      const duration = Math.max(
        snap,
        snapValue(Math.max(snap, end.start - startPos.start + snap), snap),
      );
      setNotes((prev) => [
        ...prev,
        {
          pitch: startPos.pitch,
          start: startPos.start,
          duration,
          velocity,
          track,
        },
      ]);
      const { engine, bus } = ensureBus();
      playSynthNote(
        engine.ctx,
        bus,
        startPos.pitch,
        engine.ctx.currentTime,
        (60 / bpm) * duration,
        velocity,
        track,
      );
    },
    [bpm, ensureBus, pointerToNote, snap, track, velocity],
  );

  const quantize = useCallback(() => {
    setNotes((prev) =>
      prev.map((n) => ({
        ...n,
        start: snapValue(n.start, snap),
        duration: Math.max(snap, snapValue(n.duration, snap)),
      })),
    );
  }, [snap]);

  const exportMidi = useCallback(() => {
    downloadMidi("audio-lab-roll.mid", notes, bpm);
  }, [bpm, notes]);

  const importMidi = useCallback(async (file: File) => {
    const buf = new Uint8Array(await file.arrayBuffer());
    const parsed = parseMidiNotes(buf);
    if (parsed.length) setNotes(parsed.map((n) => ({ ...n, track: n.track % 4 })));
  }, []);

  useShortcuts({
    " ": togglePlay,
    q: quantize,
  });

  return (
    <ModeStage>
      <div className={controlStyles.modeToolbar}>
        <Button variant="primary" size="sm" onClick={togglePlay}>
          {playing ? "❚❚ Stop" : "▶ Play"}
        </Button>
        <ToggleChip active={loop} onClick={() => setLoop((v) => !v)}>
          Loop
        </ToggleChip>
        <Button variant="secondary" size="sm" onClick={quantize}>
          Quantize
        </Button>
        <Button variant="secondary" size="sm" onClick={exportMidi}>
          Export MIDI
        </Button>
        <label className={controlStyles.fileLabel}>
          Import MIDI
          <input
            type="file"
            accept=".mid,.midi,audio/midi"
            className={controlStyles.hiddenFileInput}
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void importMidi(f);
              e.target.value = "";
            }}
          />
        </label>
        <div className={controlStyles.modeToolbarGroup}>
          {[0, 1, 2, 3].map((t) => (
            <Button
              key={t}
              variant={track === t ? "primary" : "secondary"}
              size="sm"
              onClick={() => setTrack(t)}
            >
              Track {t + 1}
            </Button>
          ))}
        </div>
      </div>

      <div className={`${controlStyles.panelGrid} ${controlStyles.panelGrid3}`}>
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
          label="Snap"
          value={snap}
          min={0.125}
          max={1}
          step={0.125}
          onChange={setSnap}
          format={(v) => `${v} beat`}
        />
        <SliderRow
          label="Velocity"
          value={velocity}
          min={0.1}
          max={1}
          step={0.01}
          onChange={setVelocity}
          format={(v) => `${Math.round(v * 100)}%`}
        />
        <SliderRow
          label="Zoom"
          value={zoom}
          min={0.75}
          max={2}
          step={0.25}
          onChange={setZoom}
          format={(v) => `${v}×`}
        />
      </div>

      <p className={controlStyles.emptyHint} style={{ padding: 0, textAlign: "left" }}>
        Click-drag on the grid to paint notes. Click an existing note to erase it. Four synth tracks
        share the roll; export/import uses a minimal Type-0 MIDI writer/parser.
      </p>

      <div className={styles.scroll}>
        <canvas
          ref={canvasRef}
          className={styles.roll}
          onPointerDown={onPointerDown}
          onPointerUp={onPointerUp}
          onContextMenu={(e) => e.preventDefault()}
        />
      </div>
    </ModeStage>
  );
}
