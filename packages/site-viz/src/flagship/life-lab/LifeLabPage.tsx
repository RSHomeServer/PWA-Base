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
import canvasStyles from "../shared/canvasStyles.js";

const W = FLAGSHIP_CANVAS_WIDTH;
const H = FLAGSHIP_CANVAS_HEIGHT;
const COLS = 160;
const ROWS = 100;
const MAX_BRUSH = 5;

type RuleSet = { name: string; born: Set<number>; survive: Set<number> };

const RULES: RuleSet[] = [
  { name: "Conway B3/S23", born: new Set([3]), survive: new Set([2, 3]) },
  { name: "HighLife B36/S23", born: new Set([3, 6]), survive: new Set([2, 3]) },
  { name: "Day & Night", born: new Set([3, 6, 7, 8]), survive: new Set([3, 4, 6, 7, 8]) },
  { name: "Seeds B2/S", born: new Set([2]), survive: new Set() },
  { name: "Maze B3/S12345", born: new Set([3]), survive: new Set([1, 2, 3, 4, 5]) },
];

interface Stamp {
  name: string;
  cells: [number, number][];
}
const STAMPS: Stamp[] = [
  {
    name: "Glider",
    cells: [
      [1, 0],
      [2, 1],
      [0, 2],
      [1, 2],
      [2, 2],
    ],
  },
  {
    name: "Spaceship",
    cells: [
      [1, 0],
      [4, 0],
      [0, 1],
      [0, 2],
      [4, 2],
      [0, 3],
      [1, 3],
      [2, 3],
      [3, 3],
    ],
  },
  {
    name: "Beacon",
    cells: [
      [0, 0],
      [1, 0],
      [0, 1],
      [3, 2],
      [2, 3],
      [3, 3],
    ],
  },
];

interface Pulse {
  x: number;
  y: number;
  born: number;
  kind: "click" | "stamp";
}

function randomGrid(): Uint8Array {
  const g = new Uint8Array(COLS * ROWS);
  for (let i = 0; i < g.length; i++) g[i] = Math.random() < 0.28 ? 1 : 0;
  return g;
}

export function LifeLabPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const hudRef = useRef<HTMLDivElement>(null);
  const bloomRef = useRef<HTMLCanvasElement | null>(null);
  const gridRef = useRef(randomGrid());
  const nextRef = useRef(new Uint8Array(COLS * ROWS));
  const genRef = useRef(0);
  const camRef = useRef({ x: 0, y: 0, zoom: 1 });
  const paintRef = useRef(false);
  const panRef = useRef<{ x: number; y: number; camX: number; camY: number } | null>(null);
  const ruleRef = useRef(0);
  const brushRef = useRef(1);
  const stampIdxRef = useRef(0);
  const stampModeRef = useRef(false);
  const pulsesRef = useRef<Pulse[]>([]);
  const clockRef = useRef(0);
  const [ruleIdx, setRuleIdx] = useState(0);
  const [paused, setPaused] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [brush, setBrush] = useState(1);
  const [stampIdx, setStampIdx] = useState(0);
  const [stampMode, setStampMode] = useState(false);

  const reset = useCallback(() => {
    gridRef.current = randomGrid();
    genRef.current = 0;
    camRef.current = { x: 0, y: 0, zoom: 1 };
    setPaused(false);
  }, []);

  const clear = useCallback(() => {
    gridRef.current.fill(0);
    genRef.current = 0;
  }, []);

  const step = useCallback(() => {
    const rule = RULES[ruleRef.current]!;
    const g = gridRef.current;
    const n = nextRef.current;
    for (let y = 0; y < ROWS; y++) {
      for (let x = 0; x < COLS; x++) {
        let nb = 0;
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            if (!dx && !dy) continue;
            const nx = (x + dx + COLS) % COLS;
            const ny = (y + dy + ROWS) % ROWS;
            nb += g[ny * COLS + nx]!;
          }
        }
        const alive = g[y * COLS + x]!;
        n[y * COLS + x] = alive ? (rule.survive.has(nb) ? 1 : 0) : rule.born.has(nb) ? 1 : 0;
      }
    }
    gridRef.current.set(n);
    genRef.current++;
  }, []);

  useAnimationFrame((dt) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = prepareCanvas(canvas, W, H, { maxDpr: 2 });
    clockRef.current += dt;
    const elapsed = clockRef.current;
    if (!paused) {
      for (let i = 0; i < speed; i++) step();
    }
    const cam = camRef.current;
    const cellW = (W / COLS) * cam.zoom;
    const cellH = (H / ROWS) * cam.zoom;
    ctx.fillStyle = "rgb(6, 10, 20)";
    ctx.fillRect(0, 0, W, H);
    const g = gridRef.current;
    for (let y = 0; y < ROWS; y++) {
      for (let x = 0; x < COLS; x++) {
        if (!g[y * COLS + x]) continue;
        const px = x * cellW + cam.x;
        const py = y * cellH + cam.y;
        if (px + cellW < 0 || py + cellH < 0 || px > W || py > H) continue;
        const hue = 150 + (x / COLS) * 80;
        ctx.fillStyle = `hsl(${hue}, 75%, 55%)`;
        ctx.fillRect(px, py, Math.max(1, cellW - 0.5), Math.max(1, cellH - 0.5));
      }
    }

    // Click / stamp pulses — expanding rings that also spark a few cells alive
    // as they pass over the grid, like a shockwave seeding life.
    const pulses = pulsesRef.current;
    for (let i = pulses.length - 1; i >= 0; i--) {
      const p = pulses[i]!;
      const age = elapsed - p.born;
      if (age > 1.1) {
        pulses.splice(i, 1);
        continue;
      }
      const ringPx = age * 340;
      const ringCells = ringPx / Math.max(1, cellW * (cam.zoom > 0 ? 1 : 1));
      if (!paused) {
        const gx0 = Math.floor((p.x - cam.x) / cellW);
        const gy0 = Math.floor((p.y - cam.y) / cellH);
        const steps = 40;
        for (let s = 0; s < steps; s++) {
          const a = (s / steps) * Math.PI * 2;
          const gx = Math.round(gx0 + Math.cos(a) * ringCells);
          const gy = Math.round(gy0 + Math.sin(a) * ringCells);
          if (gx >= 0 && gx < COLS && gy >= 0 && gy < ROWS && Math.random() < 0.22) {
            gridRef.current[gy * COLS + gx] = 1;
          }
        }
      }
      ctx.strokeStyle =
        p.kind === "stamp"
          ? `rgba(255, 200, 110, ${(1 - age / 1.1) * 0.65})`
          : `rgba(120, 255, 210, ${(1 - age / 1.1) * 0.55})`;
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.arc(p.x, p.y, ringPx, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Bloom: soft glow over the living cells and pulses.
    let bloom = bloomRef.current;
    if (!bloom) {
      bloom = document.createElement("canvas");
      bloom.width = 260;
      bloom.height = Math.round((260 * H) / W);
      bloomRef.current = bloom;
    }
    const bctx = bloom.getContext("2d");
    if (bctx) {
      bctx.clearRect(0, 0, bloom.width, bloom.height);
      bctx.drawImage(canvas, 0, 0, bloom.width, bloom.height);
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      ctx.globalAlpha = 0.22;
      ctx.filter = "blur(4px)";
      ctx.drawImage(bloom, 0, 0, W, H);
      ctx.filter = "none";
      ctx.restore();
    }

    if (hudRef.current) {
      const modeLabel = stampModeRef.current
        ? `stamp: ${STAMPS[stampIdxRef.current]!.name}`
        : `brush ${brushRef.current}`;
      hudRef.current.textContent = `gen ${genRef.current} · ${RULES[ruleIdx]!.name} · zoom ${cam.zoom.toFixed(2)}× · ${modeLabel}${paused ? " · paused" : ""}`;
    }
  });

  const paintAt = useCallback((clientX: number, clientY: number, value = 1) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const p = toCanvasPoint(canvas, clientX, clientY, W, H);
    const cam = camRef.current;
    const cellW = (W / COLS) * cam.zoom;
    const cellH = (H / ROWS) * cam.zoom;
    const gx = Math.floor((p.x - cam.x) / cellW);
    const gy = Math.floor((p.y - cam.y) / cellH);
    const r = brushRef.current - 1;
    for (let dy = -r; dy <= r; dy++) {
      for (let dx = -r; dx <= r; dx++) {
        if (dx * dx + dy * dy > r * r + 0.5) continue;
        const x = gx + dx;
        const y = gy + dy;
        if (x >= 0 && x < COLS && y >= 0 && y < ROWS) {
          gridRef.current[y * COLS + x] = value;
        }
      }
    }
  }, []);

  const stampAt = useCallback((clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const p = toCanvasPoint(canvas, clientX, clientY, W, H);
    const cam = camRef.current;
    const cellW = (W / COLS) * cam.zoom;
    const cellH = (H / ROWS) * cam.zoom;
    const gx = Math.floor((p.x - cam.x) / cellW);
    const gy = Math.floor((p.y - cam.y) / cellH);
    const stamp = STAMPS[stampIdxRef.current]!;
    for (const [dx, dy] of stamp.cells) {
      const x = (((gx + dx) % COLS) + COLS) % COLS;
      const y = (((gy + dy) % ROWS) + ROWS) % ROWS;
      gridRef.current[y * COLS + x] = 1;
    }
    pulsesRef.current.push({ x: p.x, y: p.y, born: clockRef.current, kind: "stamp" });
  }, []);

  const onPointerDown = useCallback(
    (e: ReactPointerEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      canvas.setPointerCapture(e.pointerId);
      if (e.shiftKey || e.button === 1) {
        panRef.current = {
          x: e.clientX,
          y: e.clientY,
          camX: camRef.current.x,
          camY: camRef.current.y,
        };
      } else if (stampModeRef.current) {
        stampAt(e.clientX, e.clientY);
      } else {
        paintRef.current = true;
        paintAt(e.clientX, e.clientY, e.altKey ? 0 : 1);
        if (!e.altKey) {
          const canvas2 = canvasRef.current;
          if (canvas2) {
            const p = toCanvasPoint(canvas2, e.clientX, e.clientY, W, H);
            pulsesRef.current.push({ x: p.x, y: p.y, born: clockRef.current, kind: "click" });
            if (pulsesRef.current.length > 10) pulsesRef.current.shift();
          }
        }
      }
    },
    [paintAt, stampAt],
  );

  const onPointerMove = useCallback(
    (e: ReactPointerEvent<HTMLCanvasElement>) => {
      if (panRef.current) {
        const pan = panRef.current;
        const canvas = canvasRef.current;
        if (!canvas) return;
        const rect = canvas.getBoundingClientRect();
        camRef.current.x = pan.camX + ((e.clientX - pan.x) * W) / rect.width;
        camRef.current.y = pan.camY + ((e.clientY - pan.y) * H) / rect.height;
      } else if (paintRef.current && !stampModeRef.current) {
        paintAt(e.clientX, e.clientY, e.altKey ? 0 : 1);
      }
    },
    [paintAt],
  );

  const onPointerUp = useCallback(() => {
    paintRef.current = false;
    panRef.current = null;
  }, []);

  const onWheel = useCallback((e: ReactWheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    if (e.ctrlKey || e.metaKey) {
      const cam = camRef.current;
      cam.zoom = clamp(cam.zoom * (e.deltaY > 0 ? 0.9 : 1.1), 0.4, 6);
    } else if (stampModeRef.current) {
      setStampIdx((i) => {
        const n = (i + (e.deltaY > 0 ? 1 : -1) + STAMPS.length) % STAMPS.length;
        stampIdxRef.current = n;
        return n;
      });
    } else {
      setBrush((v) => {
        const n = clamp(v + (e.deltaY > 0 ? -1 : 1), 1, MAX_BRUSH);
        brushRef.current = n;
        return n;
      });
    }
  }, []);

  const cycleRule = useCallback(() => {
    setRuleIdx((i) => {
      const n = (i + 1) % RULES.length;
      ruleRef.current = n;
      return n;
    });
  }, []);

  const cycleStamp = useCallback((dir: 1 | -1) => {
    setStampIdx((i) => {
      const n = (i + dir + STAMPS.length) % STAMPS.length;
      stampIdxRef.current = n;
      return n;
    });
  }, []);

  const toggleStampMode = useCallback(() => {
    setStampMode((v) => {
      stampModeRef.current = !v;
      return !v;
    });
  }, []);

  useShortcuts({
    " ": () => setPaused((v) => !v),
    r: reset,
    c: clear,
    n: () => {
      setPaused(true);
      step();
    },
    t: cycleRule,
    m: toggleStampMode,
    "[": () => cycleStamp(-1),
    "]": () => cycleStamp(1),
    "+": () => setSpeed((s) => Math.min(8, s + 1)),
    "=": () => setSpeed((s) => Math.min(8, s + 1)),
    "-": () => setSpeed((s) => Math.max(1, s - 1)),
  });

  const handleExport = useCallback(() => {
    const c = canvasRef.current;
    if (c) downloadCanvasPng("life-lab.png", c);
  }, []);

  const shortcuts = useMemo(
    () => [
      { keys: "Draw", label: "Paint live cells (Alt = erase), sends a life pulse" },
      { keys: "Scroll", label: "Brush size (stamp size in stamp mode)" },
      { keys: "Ctrl+Scroll", label: "Zoom" },
      { keys: "Shift+Drag", label: "Pan" },
      { keys: "M", label: "Toggle stamp mode" },
      { keys: "[ / ]", label: "Cycle pattern stamp" },
      { keys: "Space", label: "Pause" },
      { keys: "N", label: "Step one generation" },
      { keys: "T", label: "Cycle ruleset" },
      { keys: "C / R", label: "Clear / Randomise" },
    ],
    [],
  );

  return (
    <FlagshipShell
      title="Life Lab"
      tagline="Draw cellular automata by hand, stamp gliders with a glowing flash, and swap birth/survival rulesets live."
      demoPath="/life-lab"
      shortcuts={shortcuts}
      onReset={reset}
      onExport={handleExport}
      statusBar={<div ref={hudRef} />}
      toolbarExtra={
        <>
          <Button variant="secondary" size="sm" onClick={() => setPaused((v) => !v)}>
            {paused ? "▶" : "⏸"}
          </Button>
          <Button variant="secondary" size="sm" onClick={cycleRule}>
            {RULES[ruleIdx]!.name}
          </Button>
          <Button variant="secondary" size="sm" onClick={toggleStampMode} aria-pressed={stampMode}>
            {stampMode ? `Stamp: ${STAMPS[stampIdx]!.name}` : `Brush ${brush}`}
          </Button>
          {stampMode ? (
            <Button variant="secondary" size="sm" onClick={() => cycleStamp(1)}>
              Next pattern
            </Button>
          ) : null}
          <Button variant="secondary" size="sm" onClick={clear}>
            Clear
          </Button>
          <Button variant="secondary" size="sm" onClick={() => setSpeed((s) => (s % 4) + 1)}>
            {speed}×
          </Button>
        </>
      }
      about={
        <>
          <p>
            Conway&apos;s Game of Life and cousins are cellular automata: each cell lives or dies
            from a local count of neighbours. Painting sends a glowing shockwave pulse across the
            grid that sparks a few extra cells alive as it passes. Switch to stamp mode to drop
            classic patterns — gliders, spaceships, beacons — with a bright flash on placement.
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
        aria-label="Life lab canvas"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onWheel={onWheel}
        onContextMenu={(e) => e.preventDefault()}
      />
    </FlagshipShell>
  );
}
