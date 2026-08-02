import { useCallback, useMemo, useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import { Button } from "@platform/ui";
import { downloadCanvasPng } from "@platform/export";
import {
  FLAGSHIP_CANVAS_HEIGHT,
  FLAGSHIP_CANVAS_WIDTH,
  prepareCanvas,
} from "../../canvas/setup.js";
import { fadeCanvas } from "../../exhibits/lib/simulation.js";
import { FlagshipShell } from "../shared/FlagshipShell.js";
import { useAnimationFrame } from "../shared/useAnimationFrame.js";
import { useShortcuts } from "../shared/useShortcuts.js";
import { toCanvasPoint } from "../shared/pointer.js";
import canvasStyles from "../shared/canvasStyles.module.css";

const W = FLAGSHIP_CANVAS_WIDTH;
const H = FLAGSHIP_CANVAS_HEIGHT;

type Mode = "attract" | "predator" | "food" | "obstacle" | "paint";

interface Boid {
  x: number;
  y: number;
  vx: number;
  vy: number;
}
interface Obstacle {
  x: number;
  y: number;
  r: number;
}
interface Food {
  x: number;
  y: number;
}

function spawnBoids(n: number): Boid[] {
  return Array.from({ length: n }, () => ({
    x: Math.random() * W,
    y: Math.random() * H,
    vx: (Math.random() - 0.5) * 4,
    vy: (Math.random() - 0.5) * 4,
  }));
}

export function BoidsLabPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const hudRef = useRef<HTMLDivElement>(null);
  const boidsRef = useRef<Boid[]>(spawnBoids(120));
  const obstaclesRef = useRef<Obstacle[]>([]);
  const foodRef = useRef<Food[]>([]);
  const mouseRef = useRef<{ x: number; y: number; down: boolean }>({
    x: W / 2,
    y: H / 2,
    down: false,
  });
  const modeRef = useRef<Mode>("attract");
  const boostRef = useRef(0);
  const [mode, setMode] = useState<Mode>("attract");
  const [paused, setPaused] = useState(false);

  const setModeBoth = useCallback((m: Mode) => {
    modeRef.current = m;
    setMode(m);
  }, []);

  const reset = useCallback(() => {
    boidsRef.current = spawnBoids(120);
    obstaclesRef.current = [];
    foodRef.current = [];
    setPaused(false);
  }, []);

  const explode = useCallback(() => {
    const center = mouseRef.current;
    for (const b of boidsRef.current) {
      const dx = b.x - center.x;
      const dy = b.y - center.y;
      const d = Math.hypot(dx, dy) || 1;
      const power = 6 + Math.random() * 8;
      b.vx += (dx / d) * power;
      b.vy += (dy / d) * power;
    }
    boostRef.current = 1;
  }, []);

  useAnimationFrame(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = prepareCanvas(canvas, W, H, { maxDpr: 2 });
    const boids = boidsRef.current;
    const obstacles = obstaclesRef.current;
    const foods = foodRef.current;
    const mouse = mouseRef.current;
    const m = modeRef.current;
    const sep = 0.9;
    const ali = 0.05;
    const coh = 0.55;
    boostRef.current *= 0.96;
    const maxSp = 4.2 + boostRef.current * 9;
    const perc = 55;

    if (!paused) {
      for (const b of boids) {
        let sx = 0,
          sy = 0,
          ax = 0,
          ay = 0,
          cx = 0,
          cy = 0,
          sc = 0,
          fc = 0;
        for (const o of boids) {
          if (o === b) continue;
          const dx = o.x - b.x;
          const dy = o.y - b.y;
          const d = Math.hypot(dx, dy);
          if (d === 0 || d > perc) continue;
          if (d < 22) {
            sx -= dx / d;
            sy -= dy / d;
            sc++;
          }
          ax += o.vx;
          ay += o.vy;
          cx += o.x;
          cy += o.y;
          fc++;
        }
        if (sc) {
          b.vx += (sx / sc) * sep;
          b.vy += (sy / sc) * sep;
        }
        if (fc) {
          b.vx += (ax / fc - b.vx) * ali;
          b.vy += (ay / fc - b.vy) * ali;
          b.vx += (cx / fc - b.x) * coh * 0.01;
          b.vy += (cy / fc - b.y) * coh * 0.01;
        }
        for (const obs of obstacles) {
          const dx = b.x - obs.x;
          const dy = b.y - obs.y;
          const d = Math.hypot(dx, dy) || 0.01;
          if (d < obs.r + 40) {
            b.vx += (dx / d) * 0.8;
            b.vy += (dy / d) * 0.8;
          }
        }
        if (foods.length) {
          let nearest = foods[0]!;
          let nd = Infinity;
          for (const f of foods) {
            const d = Math.hypot(f.x - b.x, f.y - b.y);
            if (d < nd) {
              nd = d;
              nearest = f;
            }
          }
          if (nd < 180) {
            b.vx += ((nearest.x - b.x) / nd) * 0.12;
            b.vy += ((nearest.y - b.y) / nd) * 0.12;
          }
          if (nd < 10) {
            const i = foods.indexOf(nearest);
            if (i >= 0) foods.splice(i, 1);
          }
        }
        // Chase: a gentle constant pull toward the cursor, much stronger while held.
        if (m === "attract") {
          const dx = mouse.x - b.x;
          const dy = mouse.y - b.y;
          const d = Math.hypot(dx, dy) || 1;
          if (d < 340) {
            const strength = mouse.down ? 0.25 : 0.045;
            b.vx += (dx / d) * strength;
            b.vy += (dy / d) * strength;
          }
        }
        // Avoid: boids always keep a wary distance from the cursor, and scatter
        // hard when it's held down, like a predator lunging.
        if (m === "predator") {
          const dx = b.x - mouse.x;
          const dy = b.y - mouse.y;
          const d = Math.hypot(dx, dy) || 1;
          const scareRadius = mouse.down ? 220 : 130;
          if (d < scareRadius) {
            const strength = mouse.down ? 1.6 : 0.55;
            b.vx += (dx / d) * strength;
            b.vy += (dy / d) * strength;
          }
        }
        const sp = Math.hypot(b.vx, b.vy);
        if (sp > maxSp) {
          b.vx = (b.vx / sp) * maxSp;
          b.vy = (b.vy / sp) * maxSp;
        }
        b.x = (((b.x + b.vx) % W) + W) % W;
        b.y = (((b.y + b.vy) % H) + H) % H;
      }
    }

    // Motion-trail glow instead of a hard clear, so fast flocks streak softly.
    fadeCanvas(ctx, W, H, 0.32, "rgb(4, 8, 18)");

    for (const obs of obstacles) {
      ctx.fillStyle = "rgba(80, 90, 110, 0.55)";
      ctx.beginPath();
      ctx.arc(obs.x, obs.y, obs.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "rgba(160, 180, 220, 0.4)";
      ctx.stroke();
    }
    for (const f of foods) {
      ctx.fillStyle = "rgba(255, 200, 80, 0.9)";
      ctx.shadowColor = "rgba(255, 180, 40, 0.8)";
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(f.x, f.y, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    }
    if (mode === "predator") {
      ctx.strokeStyle = `rgba(255, 90, 110, ${mouse.down ? 0.55 : 0.25})`;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(mouse.x, mouse.y, mouse.down ? 220 : 130, 0, Math.PI * 2);
      ctx.stroke();
      if (mouse.down) {
        ctx.fillStyle = "rgba(255, 60, 80, 0.3)";
        ctx.beginPath();
        ctx.arc(mouse.x, mouse.y, 28, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    if (mode === "attract") {
      ctx.strokeStyle = "rgba(120, 220, 255, 0.2)";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(mouse.x, mouse.y, 340, 0, Math.PI * 2);
      ctx.stroke();
    }

    for (const b of boids) {
      const ang = Math.atan2(b.vy, b.vx);
      const speed = Math.hypot(b.vx, b.vy);
      const hue = 180 + speed * 18;
      ctx.save();
      ctx.translate(b.x, b.y);
      ctx.rotate(ang);
      ctx.fillStyle = `hsla(${hue}, 80%, 62%, 0.9)`;
      ctx.shadowColor = `hsla(${hue}, 95%, 65%, 0.85)`;
      ctx.shadowBlur = 4 + boostRef.current * 10 + Math.min(6, speed);
      ctx.beginPath();
      ctx.moveTo(7, 0);
      ctx.lineTo(-5, 3.5);
      ctx.lineTo(-2, 0);
      ctx.lineTo(-5, -3.5);
      ctx.closePath();
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.restore();
    }

    if (hudRef.current) {
      hudRef.current.textContent = `${boids.length} boids · ${foods.length} food · ${obstacles.length} obstacles · mode: ${m}${paused ? " · paused" : ""} · Space to detonate`;
    }
  });

  const onPointer = useCallback((e: ReactPointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const p = toCanvasPoint(canvas, e.clientX, e.clientY, W, H);
    mouseRef.current.x = p.x;
    mouseRef.current.y = p.y;
    if (e.type === "pointerdown") {
      mouseRef.current.down = true;
      canvas.setPointerCapture(e.pointerId);
      const m = modeRef.current;
      if (m === "food") foodRef.current.push({ x: p.x, y: p.y });
      if (m === "obstacle")
        obstaclesRef.current.push({ x: p.x, y: p.y, r: 28 + Math.random() * 20 });
      if (m === "paint") {
        for (let i = 0; i < 6; i++) {
          boidsRef.current.push({
            x: p.x + (Math.random() - 0.5) * 20,
            y: p.y + (Math.random() - 0.5) * 20,
            vx: (Math.random() - 0.5) * 3,
            vy: (Math.random() - 0.5) * 3,
          });
        }
        if (boidsRef.current.length > 400)
          boidsRef.current.splice(0, boidsRef.current.length - 400);
      }
    } else if (e.type === "pointermove" && mouseRef.current.down && modeRef.current === "paint") {
      boidsRef.current.push({
        x: p.x,
        y: p.y,
        vx: (Math.random() - 0.5) * 2,
        vy: (Math.random() - 0.5) * 2,
      });
      if (boidsRef.current.length > 400) boidsRef.current.shift();
    } else if (e.type === "pointerup" || e.type === "pointercancel") {
      mouseRef.current.down = false;
    }
  }, []);

  useShortcuts({
    " ": explode,
    p: () => setPaused((v) => !v),
    r: reset,
    "1": () => setModeBoth("attract"),
    "2": () => setModeBoth("predator"),
    "3": () => setModeBoth("food"),
    "4": () => setModeBoth("obstacle"),
    "5": () => setModeBoth("paint"),
  });

  const handleExport = useCallback(() => {
    const c = canvasRef.current;
    if (c) downloadCanvasPng("boids-lab.png", c);
  }, []);

  const shortcuts = useMemo(
    () => [
      { keys: "1–5", label: "Attract / Predator / Food / Obstacle / Paint" },
      { keys: "Drag", label: "Use current tool" },
      { keys: "Space", label: "Detonate — scatter the flock" },
      { keys: "P", label: "Pause" },
      { keys: "R", label: "Reset flock" },
    ],
    [],
  );

  return (
    <FlagshipShell
      title="Boids Lab"
      tagline="Flocking with a chasing or fleeing cursor, predators, food, painted obstacles, and a detonate button."
      demoPath="/boids-lab"
      shortcuts={shortcuts}
      onReset={reset}
      onExport={handleExport}
      statusBar={<div ref={hudRef} />}
      toolbarExtra={
        <>
          {(["attract", "predator", "food", "obstacle", "paint"] as Mode[]).map((m) => (
            <Button
              key={m}
              variant="secondary"
              size="sm"
              onClick={() => setModeBoth(m)}
              aria-pressed={mode === m}
            >
              {m}
            </Button>
          ))}
          <Button variant="secondary" size="sm" onClick={explode}>
            💥 Detonate
          </Button>
          <Button variant="secondary" size="sm" onClick={() => setPaused((v) => !v)}>
            {paused ? "▶" : "⏸"}
          </Button>
        </>
      }
      about={
        <>
          <p>
            Craig Reynolds&apos; boids emerge from three local rules — separation, alignment, and
            cohesion. In attract mode the flock always drifts gently toward the cursor and surges
            when you hold the button; in predator mode it keeps a wary distance and bolts if you
            lunge. Hit space (or Detonate) to scatter the whole flock outward in a burst of glowing
            trails.
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
        aria-label="Boids lab canvas"
        onPointerDown={onPointer}
        onPointerMove={onPointer}
        onPointerUp={onPointer}
        onPointerCancel={onPointer}
      />
    </FlagshipShell>
  );
}
