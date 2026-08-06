import { useCallback, useMemo, useRef, useState } from "react";
import type { MouseEvent as ReactMouseEvent, PointerEvent as ReactPointerEvent } from "react";
import { Button } from "@platform/ui";
import { downloadCanvasPng } from "@platform/export";
import {
  FLAGSHIP_CANVAS_HEIGHT,
  FLAGSHIP_CANVAS_WIDTH,
  FLAGSHIP_IMMERSIVE_MAX_DPR,
  FLAGSHIP_MAX_DPR,
  FLAGSHIP_SIM_GRID,
  prepareCanvas,
} from "../../canvas/setup.js";
import { FlagshipShell } from "../shared/FlagshipShell.js";
import { useAnimationFrame } from "../shared/useAnimationFrame.js";
import { useShortcuts } from "../shared/useShortcuts.js";
import { toCanvasPoint } from "../shared/pointer.js";
import canvasStyles from "../shared/canvasStyles.js";

const W = FLAGSHIP_CANVAS_WIDTH;
const H = FLAGSHIP_CANVAS_HEIGHT;
/** Conference-wall sim grid — 4× the old 128² cell count. */
const N = FLAGSHIP_SIM_GRID;
const MASK = N - 1;

function idx(x: number, y: number) {
  return ((y & MASK) * N + (x & MASK)) | 0;
}

/** Deep-ocean → plasma cosine palette that drifts with phase. */
function plasmaColour(t: number, phase: number): [number, number, number] {
  const u = t + phase;
  return [
    0.28 + 0.42 * Math.cos(6.28318 * (0.9 * u + 0.0)),
    0.38 + 0.38 * Math.cos(6.28318 * (0.7 * u + 0.33)),
    0.55 + 0.4 * Math.cos(6.28318 * (0.55 * u + 0.67)),
  ];
}

export function FluidLabPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const hudRef = useRef<HTMLDivElement>(null);
  const bloomRef = useRef<HTMLCanvasElement | null>(null);
  const vx = useRef(new Float32Array(N * N));
  const vy = useRef(new Float32Array(N * N));
  const dyeR = useRef(new Float32Array(N * N));
  const dyeG = useRef(new Float32Array(N * N));
  const dyeB = useRef(new Float32Array(N * N));
  const tmp = useRef(new Float32Array(N * N));
  const prev = useRef<{ x: number; y: number } | null>(null);
  const down = useRef(false);
  const hueRef = useRef(0);
  const palettePhaseRef = useRef(0);
  const idleTimerRef = useRef(0);
  const immersiveRef = useRef(false);
  const [viscosity, setViscosity] = useState(0.8);
  const [smoke, setSmoke] = useState(false);
  const viscosTargetRef = useRef(0.8);
  const viscosRef = useRef(0.8);
  const smokeRef = useRef(false);
  const offRef = useRef<HTMLCanvasElement | null>(null);

  const reset = useCallback(() => {
    vx.current.fill(0);
    vy.current.fill(0);
    dyeR.current.fill(0);
    dyeG.current.fill(0);
    dyeB.current.fill(0);
    idleTimerRef.current = 0;
  }, []);

  const inject = useCallback((gx: number, gy: number, fx: number, fy: number, radius = 4) => {
    const r = radius;
    const phase = palettePhaseRef.current;
    const h = hueRef.current;
    const [cr, cg, cb] = plasmaColour(h * 0.08, phase);
    for (let dy = -r; dy <= r; dy++) {
      for (let dx = -r; dx <= r; dx++) {
        if (dx * dx + dy * dy > r * r) continue;
        const i = idx(gx + dx, gy + dy);
        vx.current[i]! += fx * 0.35;
        vy.current[i]! += fy * 0.35;
        dyeR.current[i] = Math.min(1, dyeR.current[i]! + cr * 0.32);
        dyeG.current[i] = Math.min(1, dyeG.current[i]! + cg * 0.32);
        dyeB.current[i] = Math.min(1, dyeB.current[i]! + cb * 0.32);
      }
    }
    hueRef.current += 0.06;
  }, []);

  const explode = useCallback((gx: number, gy: number) => {
    const radius = 22;
    const phase = palettePhaseRef.current;
    for (let dy = -radius; dy <= radius; dy++) {
      for (let dx = -radius; dx <= radius; dx++) {
        const d = Math.hypot(dx, dy);
        if (d > radius) continue;
        const i = idx(gx + dx, gy + dy);
        const falloff = 1 - d / radius;
        const push = falloff * falloff * 10;
        const nx = dx / (d || 1);
        const ny = dy / (d || 1);
        vx.current[i]! += nx * push;
        vy.current[i]! += ny * push;
        const [cr, cg, cb] = plasmaColour(falloff + phase, phase);
        dyeR.current[i] = Math.min(1, dyeR.current[i]! + falloff * cr);
        dyeG.current[i] = Math.min(1, dyeG.current[i]! + falloff * cg);
        dyeB.current[i] = Math.min(1, dyeB.current[i]! + falloff * cb);
      }
    }
  }, []);

  function diffuse(field: Float32Array, rate: number) {
    const out = tmp.current;
    for (let y = 0; y < N; y++) {
      for (let x = 0; x < N; x++) {
        const i = idx(x, y);
        const neigh =
          field[idx(x - 1, y)]! +
          field[idx(x + 1, y)]! +
          field[idx(x, y - 1)]! +
          field[idx(x, y + 1)]!;
        out[i] = field[i]! * (1 - rate) + neigh * 0.25 * rate;
      }
    }
    field.set(out);
  }

  function advect(field: Float32Array) {
    const out = tmp.current;
    const uvx = vx.current;
    const uvy = vy.current;
    for (let y = 0; y < N; y++) {
      for (let x = 0; x < N; x++) {
        const i = idx(x, y);
        let sx = x - uvx[i]!;
        let sy = y - uvy[i]!;
        sx = ((sx % N) + N) % N;
        sy = ((sy % N) + N) % N;
        const x0 = Math.floor(sx);
        const y0 = Math.floor(sy);
        const x1 = (x0 + 1) & MASK;
        const y1 = (y0 + 1) & MASK;
        const fx = sx - x0;
        const fy = sy - y0;
        const a = field[idx(x0, y0)]!;
        const b = field[idx(x1, y0)]!;
        const c = field[idx(x0, y1)]!;
        const d = field[idx(x1, y1)]!;
        out[i] = a * (1 - fx) * (1 - fy) + b * fx * (1 - fy) + c * (1 - fx) * fy + d * fx * fy;
      }
    }
    field.set(out);
  }

  /** Soft ambient dye + swirl so the canvas never freezes when idle. */
  function ambientDrift(elapsed: number, dt: number) {
    idleTimerRef.current += dt;
    if (down.current) {
      idleTimerRef.current = 0;
      return;
    }
    const phase = palettePhaseRef.current;
    const centers = 3;
    for (let c = 0; c < centers; c++) {
      const gx = Math.floor(N * (0.5 + 0.32 * Math.sin(elapsed * 0.11 + c * 2.1)));
      const gy = Math.floor(N * (0.5 + 0.28 * Math.cos(elapsed * 0.09 + c * 1.7)));
      const swirl = 0.08 + 0.04 * Math.sin(elapsed * 0.4 + c);
      const [cr, cg, cb] = plasmaColour(0.15 * c + phase, phase);
      const r = 3;
      for (let dy = -r; dy <= r; dy++) {
        for (let dx = -r; dx <= r; dx++) {
          if (dx * dx + dy * dy > r * r) continue;
          const i = idx(gx + dx, gy + dy);
          vx.current[i]! += -dy * swirl * 0.015;
          vy.current[i]! += dx * swirl * 0.015;
          dyeR.current[i] = Math.min(1, dyeR.current[i]! + cr * 0.012);
          dyeG.current[i] = Math.min(1, dyeG.current[i]! + cg * 0.012);
          dyeB.current[i] = Math.min(1, dyeB.current[i]! + cb * 0.012);
        }
      }
    }
  }

  useAnimationFrame((dt, elapsed) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const maxDpr = immersiveRef.current ? FLAGSHIP_IMMERSIVE_MAX_DPR : FLAGSHIP_MAX_DPR;
    const ctx = prepareCanvas(canvas, W, H, { maxDpr });

    palettePhaseRef.current = elapsed * 0.035;
    viscosRef.current += (viscosTargetRef.current - viscosRef.current) * Math.min(1, dt * 2.2);
    const vis = viscosRef.current;

    ambientDrift(elapsed, dt);

    diffuse(vx.current, 0.12 + vis * 0.22);
    diffuse(vy.current, 0.12 + vis * 0.22);
    advect(vx.current);
    advect(vy.current);
    advect(dyeR.current);
    advect(dyeG.current);
    advect(dyeB.current);
    diffuse(dyeR.current, 0.04);
    diffuse(dyeG.current, 0.04);
    diffuse(dyeB.current, 0.04);

    const decay = smokeRef.current ? 0.993 : 0.998;
    for (let i = 0; i < N * N; i++) {
      dyeR.current[i]! *= decay;
      dyeG.current[i]! *= decay;
      dyeB.current[i]! *= decay;
      vx.current[i]! *= 0.996;
      vy.current[i]! *= 0.996;
    }

    if (!offRef.current) {
      offRef.current = document.createElement("canvas");
      offRef.current.width = N;
      offRef.current.height = N;
    }
    const off = offRef.current;
    const octx = off.getContext("2d");
    if (!octx) return;
    const img = octx.createImageData(N, N);
    const data = img.data;
    const smokeMode = smokeRef.current;
    const phase = palettePhaseRef.current;
    // Slow background wash so empty cells still breathe colour.
    const bgPulse = 0.5 + 0.5 * Math.sin(elapsed * 0.2);
    const [br, bg, bb] = plasmaColour(0.2 + bgPulse * 0.15, phase);

    for (let i = 0; i < N * N; i++) {
      let r = dyeR.current[i]!;
      let g = dyeG.current[i]!;
      let b = dyeB.current[i]!;
      // Remap dye through evolving ocean/plasma identity.
      const dens = Math.min(1, r + g + b);
      if (dens > 0.001) {
        const [pr, pg, pb] = plasmaColour(dens * 0.85 + phase * 0.5, phase);
        r = Math.min(1, r * 0.55 + pr * dens * 0.7);
        g = Math.min(1, g * 0.55 + pg * dens * 0.7);
        b = Math.min(1, b * 0.55 + pb * dens * 0.7);
      } else {
        r = br * 0.04;
        g = bg * 0.05;
        b = bb * 0.08;
      }
      const o = i * 4;
      if (smokeMode) {
        const v = Math.min(1, (r + g + b) * 0.55);
        data[o] = Math.floor(v * 200 + br * 40);
        data[o + 1] = Math.floor(v * 220 + bg * 30);
        data[o + 2] = Math.floor(v * 255);
        data[o + 3] = Math.floor(Math.min(255, v * 255 + 12));
      } else {
        data[o] = Math.min(255, Math.floor(r * 255));
        data[o + 1] = Math.min(255, Math.floor(g * 255));
        data[o + 2] = Math.min(255, Math.floor(b * 255));
        data[o + 3] = 255;
      }
    }
    octx.putImageData(img, 0, 0);

    if (smokeMode) {
      ctx.fillStyle = "rgb(4, 8, 18)";
      ctx.fillRect(0, 0, W, H);
      ctx.globalCompositeOperation = "lighter";
    } else {
      ctx.fillStyle = `rgb(${Math.floor(br * 18)}, ${Math.floor(bg * 22)}, ${Math.floor(bb * 36)})`;
      ctx.fillRect(0, 0, W, H);
    }
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(off, 0, 0, W, H);
    ctx.globalCompositeOperation = "source-over";

    let bloom = bloomRef.current;
    if (!bloom) {
      bloom = document.createElement("canvas");
      bloom.width = 280;
      bloom.height = Math.round((280 * H) / W);
      bloomRef.current = bloom;
    }
    const bctx = bloom.getContext("2d");
    if (bctx) {
      bctx.clearRect(0, 0, bloom.width, bloom.height);
      bctx.drawImage(off, 0, 0, bloom.width, bloom.height);
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      ctx.globalAlpha = smokeMode ? 0.55 : 0.32;
      ctx.filter = `blur(${smokeMode ? 10 : 6}px)`;
      ctx.drawImage(bloom, 0, 0, W, H);
      ctx.filter = "none";
      ctx.restore();
    }

    if (hudRef.current) {
      hudRef.current.textContent = `grid ${N}² · viscosity ${viscosRef.current.toFixed(2)} · ${smokeMode ? "smoke" : "plasma"} · drag to stir · double-click to detonate`;
    }
  });

  const onPointer = useCallback(
    (e: ReactPointerEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const p = toCanvasPoint(canvas, e.clientX, e.clientY, W, H);
      const gx = Math.floor((p.x / W) * N);
      const gy = Math.floor((p.y / H) * N);
      if (e.type === "pointerdown") {
        down.current = true;
        prev.current = { x: gx, y: gy };
        canvas.setPointerCapture(e.pointerId);
        inject(gx, gy, 0, 0);
      } else if (e.type === "pointermove" && down.current && prev.current) {
        inject(gx, gy, gx - prev.current.x, gy - prev.current.y);
        prev.current = { x: gx, y: gy };
      } else if (e.type === "pointerup" || e.type === "pointercancel") {
        down.current = false;
        prev.current = null;
      }
    },
    [inject],
  );

  const onDoubleClick = useCallback(
    (e: ReactMouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const p = toCanvasPoint(canvas, e.clientX, e.clientY, W, H);
      const gx = Math.floor((p.x / W) * N);
      const gy = Math.floor((p.y / H) * N);
      explode(gx, gy);
    },
    [explode],
  );

  const setViscosityTarget = useCallback((updater: (v: number) => number) => {
    setViscosity((v) => {
      const n = updater(v);
      viscosTargetRef.current = n;
      return n;
    });
  }, []);

  useShortcuts({
    r: reset,
    s: () => {
      setSmoke((v) => {
        smokeRef.current = !v;
        return !v;
      });
    },
    "[": () => setViscosityTarget((v) => Math.max(0.1, v - 0.1)),
    "]": () => setViscosityTarget((v) => Math.min(1.5, v + 0.1)),
  });

  const handleExport = useCallback(() => {
    const c = canvasRef.current;
    if (c) downloadCanvasPng("fluid-lab.png", c);
  }, []);

  const onImmersiveChange = useCallback((immersive: boolean) => {
    immersiveRef.current = immersive;
  }, []);

  const shortcuts = useMemo(
    () => [
      { keys: "Drag", label: "Stir fluid & inject colour" },
      { keys: "Double-click", label: "Detonate — radial fluid explosion" },
      { keys: "S", label: "Toggle smoke mode" },
      { keys: "[ / ]", label: "Viscosity down / up (eases in)" },
      { keys: "R", label: "Clear fluid" },
    ],
    [],
  );

  return (
    <FlagshipShell
      title="Fluid Lab"
      tagline="Drag through a luminous plasma ocean — vortices bloom under your hand; smoke mode softens into atmosphere."
      demoPath="/fluid-lab"
      shortcuts={shortcuts}
      onReset={reset}
      onExport={handleExport}
      onImmersiveChange={onImmersiveChange}
      statusBar={<div ref={hudRef} />}
      toolbarExtra={
        <>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              setSmoke((v) => {
                smokeRef.current = !v;
                return !v;
              });
            }}
          >
            {smoke ? "Smoke" : "Plasma"}
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() =>
              setViscosityTarget((v) => (v >= 1.4 ? 0.2 : Math.round((v + 0.2) * 10) / 10))
            }
          >
            Viscosity {viscosity.toFixed(1)}
          </Button>
        </>
      }
      about={
        <>
          <p>
            A Navier–Stokes playground on a {N}² torus grid: velocity is diffused and advected while
            dye rides the flow. Dragging injects momentum and pigment; double-click detonates a
            radial blast. When idle, soft ambient swirls keep the plasma ocean alive — the palette
            drifts deep-ocean → cyan → violet over time so the canvas never freezes.
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
        aria-label="Fluid lab canvas"
        onPointerDown={onPointer}
        onPointerMove={onPointer}
        onPointerUp={onPointer}
        onPointerCancel={onPointer}
        onDoubleClick={onDoubleClick}
      />
    </FlagshipShell>
  );
}
