import { useCallback, useMemo, useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent, WheelEvent as ReactWheelEvent } from "react";
import { Button } from "@platform/ui";
import { downloadCanvasPng } from "@platform/export";
import { clamp } from "@platform/math";
import {
  FLAGSHIP_CANVAS_HEIGHT,
  FLAGSHIP_CANVAS_WIDTH,
  prepareCanvas,
} from "../../canvas/setup.js";
import { FlagshipShell } from "../shared/FlagshipShell.js";
import { useAnimationFrame } from "../shared/useAnimationFrame.js";
import { useShortcuts } from "../shared/useShortcuts.js";
import { toCanvasPoint } from "../shared/pointer.js";
import canvasStyles from "../shared/canvasStyles.module.css";

const W = FLAGSHIP_CANVAS_WIDTH;
const H = FLAGSHIP_CANVAS_HEIGHT;
const COLS = 240;
const ROWS = 150;
const MIN_BRUSH = 1;
const MAX_BRUSH = 12;

type Preset = { name: string; feed: number; kill: number };
const PRESETS: Preset[] = [
  { name: "Mitosis", feed: 0.0367, kill: 0.0649 },
  { name: "Coral", feed: 0.0545, kill: 0.062 },
  { name: "Worms", feed: 0.078, kill: 0.061 },
  { name: "Spots", feed: 0.035, kill: 0.065 },
  { name: "Maze", feed: 0.029, kill: 0.057 },
];

type Palette = (v: number) => [number, number, number];
const PALETTES: { name: string; fn: Palette; glow: string }[] = [
  {
    name: "Teal",
    fn: (v) => [16 + v * 30, 50 + v * 175, 90 + (1 - v) * 130 + v * 40],
    glow: "150, 255, 225",
  },
  {
    name: "Ember",
    fn: (v) => [40 + v * 235, 22 + v * 90, 30 + (1 - v) * 50],
    glow: "255, 170, 90",
  },
  {
    name: "Cyan Pulse",
    fn: (v) => [10 + v * 60, 60 + v * 190, 110 + v * 145],
    glow: "120, 235, 255",
  },
];

function seedFields(a: Float32Array, b: Float32Array) {
  a.fill(1);
  b.fill(0);
  const cx = COLS >> 1;
  const cy = ROWS >> 1;
  for (let y = cy - 8; y < cy + 8; y++) {
    for (let x = cx - 8; x < cx + 8; x++) {
      b[y * COLS + x] = 1;
    }
  }
}

export function ReactionPaintPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const hudRef = useRef<HTMLDivElement>(null);
  const aRef = useRef(new Float32Array(COLS * ROWS));
  const bRef = useRef(new Float32Array(COLS * ROWS));
  const naRef = useRef(new Float32Array(COLS * ROWS));
  const nbRef = useRef(new Float32Array(COLS * ROWS));
  const painting = useRef(false);
  const presetRef = useRef(1);
  const palRef = useRef(0);
  const brushRef = useRef(4);
  const pulseRef = useRef(0);
  const bloomRef = useRef<HTMLCanvasElement | null>(null);
  const [presetIdx, setPresetIdx] = useState(1);
  const [palIdx, setPalIdx] = useState(0);
  const [paused, setPaused] = useState(false);
  const [brush, setBrush] = useState(4);
  const offRef = useRef<HTMLCanvasElement | null>(null);

  const reset = useCallback(() => {
    seedFields(aRef.current, bRef.current);
    setPaused(false);
  }, []);

  // init once
  useMemo(() => {
    seedFields(aRef.current, bRef.current);
  }, []);

  const paintChem = useCallback((clientX: number, clientY: number, erase: boolean) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const p = toCanvasPoint(canvas, clientX, clientY, W, H);
    const gx = Math.floor((p.x / W) * COLS);
    const gy = Math.floor((p.y / H) * ROWS);
    const r = brushRef.current;
    for (let dy = -r; dy <= r; dy++) {
      for (let dx = -r; dx <= r; dx++) {
        if (dx * dx + dy * dy > r * r) continue;
        const x = (gx + dx + COLS) % COLS;
        const y = (gy + dy + ROWS) % ROWS;
        const i = y * COLS + x;
        if (erase) {
          aRef.current[i] = 1;
          bRef.current[i] = 0;
        } else {
          aRef.current[i] = 0.5;
          bRef.current[i] = 1;
        }
      }
    }
  }, []);

  const triggerPulse = useCallback(() => {
    pulseRef.current = 1;
  }, []);

  useAnimationFrame(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = prepareCanvas(canvas, W, H, { maxDpr: 1.5 });
    const preset = PRESETS[presetRef.current]!;
    const feed = preset.feed;
    const kill = preset.kill;
    const dA = 1.0;
    const dB = 0.5;
    const a = aRef.current;
    const b = bRef.current;
    const na = naRef.current;
    const nb = nbRef.current;

    if (!paused) {
      for (let s = 0; s < 4; s++) {
        for (let y = 0; y < ROWS; y++) {
          for (let x = 0; x < COLS; x++) {
            const i = y * COLS + x;
            const aa = a[i]!;
            const bb = b[i]!;
            const lapA =
              a[y * COLS + ((x - 1 + COLS) % COLS)]! +
              a[y * COLS + ((x + 1) % COLS)]! +
              a[((y - 1 + ROWS) % ROWS) * COLS + x]! +
              a[((y + 1) % ROWS) * COLS + x]! -
              4 * aa;
            const lapB =
              b[y * COLS + ((x - 1 + COLS) % COLS)]! +
              b[y * COLS + ((x + 1) % COLS)]! +
              b[((y - 1 + ROWS) % ROWS) * COLS + x]! +
              b[((y + 1) % ROWS) * COLS + x]! -
              4 * bb;
            const react = aa * bb * bb;
            na[i] = aa + dA * lapA - react + feed * (1 - aa);
            nb[i] = bb + dB * lapB + react - (kill + feed) * bb;
          }
        }
        a.set(na);
        b.set(nb);
      }
    }

    if (!offRef.current) {
      offRef.current = document.createElement("canvas");
      offRef.current.width = COLS;
      offRef.current.height = ROWS;
    }
    const off = offRef.current;
    const octx = off.getContext("2d");
    if (!octx) return;
    const img = octx.createImageData(COLS, ROWS);
    const pal = PALETTES[palRef.current]!.fn;
    const data = img.data;
    for (let i = 0; i < b.length; i++) {
      const v = Math.min(1, Math.max(0, b[i]!));
      const [r, g, bl] = pal(v);
      const o = i * 4;
      data[o] = r;
      data[o + 1] = g;
      data[o + 2] = bl;
      data[o + 3] = 255;
    }
    octx.putImageData(img, 0, 0);
    ctx.fillStyle = "rgb(5, 7, 12)";
    ctx.fillRect(0, 0, W, H);
    ctx.imageSmoothingEnabled = true;
    ctx.drawImage(off, 0, 0, W, H);

    // Bloom pass — the reaction fronts glow softly in the active palette's hue.
    let bloom = bloomRef.current;
    if (!bloom) {
      bloom = document.createElement("canvas");
      bloom.width = 240;
      bloom.height = Math.round((240 * H) / W);
      bloomRef.current = bloom;
    }
    const bctx = bloom.getContext("2d");
    if (bctx) {
      bctx.clearRect(0, 0, bloom.width, bloom.height);
      bctx.drawImage(off, 0, 0, bloom.width, bloom.height);
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      ctx.globalAlpha = 0.4;
      ctx.filter = "blur(5px)";
      ctx.drawImage(bloom, 0, 0, W, H);
      ctx.filter = "none";
      ctx.restore();
    }

    // Preset-switch pulse — a soft glow wave sweeps the canvas to punctuate the change.
    if (pulseRef.current > 0) {
      const life = 1 - pulseRef.current;
      const radius = life * Math.hypot(W, H) * 0.7;
      const glow = PALETTES[palRef.current]!.glow;
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      const g = ctx.createRadialGradient(
        W / 2,
        H / 2,
        Math.max(0, radius - 90),
        W / 2,
        H / 2,
        radius,
      );
      g.addColorStop(0, `rgba(${glow}, 0)`);
      g.addColorStop(0.85, `rgba(${glow}, ${0.32 * pulseRef.current})`);
      g.addColorStop(1, `rgba(${glow}, 0)`);
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);
      ctx.restore();
      pulseRef.current = Math.max(0, pulseRef.current - 0.02);
    }

    if (hudRef.current) {
      hudRef.current.textContent = `${preset.name} · f=${feed.toFixed(4)} k=${kill.toFixed(4)} · ${PALETTES[palRef.current]!.name} · brush ${brushRef.current}${paused ? " · paused" : ""}`;
    }
  });

  const onPointer = useCallback(
    (e: ReactPointerEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const erase = e.altKey || e.button === 2 || (e.buttons & 2) !== 0;
      if (e.type === "pointerdown") {
        painting.current = true;
        canvas.setPointerCapture(e.pointerId);
        paintChem(e.clientX, e.clientY, erase);
      } else if (e.type === "pointermove" && painting.current) {
        paintChem(e.clientX, e.clientY, erase);
      } else if (e.type === "pointerup" || e.type === "pointercancel") {
        painting.current = false;
      }
    },
    [paintChem],
  );

  const onWheel = useCallback((e: ReactWheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    setBrush((v) => {
      const n = clamp(v + (e.deltaY > 0 ? -1 : 1), MIN_BRUSH, MAX_BRUSH);
      brushRef.current = n;
      return n;
    });
  }, []);

  const cyclePreset = useCallback(() => {
    setPresetIdx((i) => {
      const n = (i + 1) % PRESETS.length;
      presetRef.current = n;
      return n;
    });
    triggerPulse();
  }, [triggerPulse]);
  const cyclePal = useCallback(() => {
    setPalIdx((i) => {
      const n = (i + 1) % PALETTES.length;
      palRef.current = n;
      return n;
    });
    triggerPulse();
  }, [triggerPulse]);

  useShortcuts({
    " ": () => setPaused((v) => !v),
    r: reset,
    p: cyclePreset,
    c: cyclePal,
  });

  const handleExport = useCallback(() => {
    const c = canvasRef.current;
    if (c) downloadCanvasPng("reaction-paint.png", c);
  }, []);

  const shortcuts = useMemo(
    () => [
      { keys: "Paint", label: "Inject chemical B" },
      { keys: "Right-click / Alt+Paint", label: "Erase cells" },
      { keys: "Scroll", label: "Brush size" },
      { keys: "P", label: "Cycle Gray–Scott preset (pulses)" },
      { keys: "C", label: "Cycle colour palette (pulses)" },
      { keys: "Space / R", label: "Pause / Reset pattern" },
    ],
    [],
  );

  return (
    <FlagshipShell
      title="Reaction Paint"
      tagline="Paint chemicals into a live Gray–Scott reaction–diffusion field and watch morphologies bloom."
      demoPath="/reaction-paint"
      shortcuts={shortcuts}
      onReset={reset}
      onExport={handleExport}
      statusBar={<div ref={hudRef} />}
      toolbarExtra={
        <>
          <Button variant="secondary" size="sm" onClick={cyclePreset}>
            {PRESETS[presetIdx]!.name}
          </Button>
          <Button variant="secondary" size="sm" onClick={cyclePal}>
            {PALETTES[palIdx]!.name}
          </Button>
          <Button variant="secondary" size="sm" onClick={() => setPaused((v) => !v)}>
            {paused ? "▶" : "⏸"}
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() =>
              setBrush((v) => {
                const n = v >= MAX_BRUSH ? MIN_BRUSH : v + 2;
                brushRef.current = n;
                return n;
              })
            }
          >
            Brush {brush}
          </Button>
        </>
      }
      about={
        <>
          <p>
            The Gray–Scott model couples two diffusing chemicals. Feed and kill rates select spots,
            coral, worms, or mazes. Painting injects chemical B so patterns grow from your brush
            strokes in real time; right-click to erase, and scroll to resize the brush. Switching
            preset or palette sends a soft glow pulse across the canvas.
          </p>
        </>
      }
    >
      <canvas
        ref={canvasRef}
        className={canvasStyles.canvas}
        width={W}
        height={H}
        style={{ aspectRatio: `${W}/${H}`, maxWidth: "100%", maxHeight: "100%" }}
        aria-label="Reaction paint canvas"
        onPointerDown={onPointer}
        onPointerMove={onPointer}
        onPointerUp={onPointer}
        onPointerCancel={onPointer}
        onWheel={onWheel}
        onContextMenu={(e) => e.preventDefault()}
      />
    </FlagshipShell>
  );
}
