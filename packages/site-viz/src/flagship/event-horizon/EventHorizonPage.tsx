import { useCallback, useMemo, useRef } from "react";
import type { PointerEvent as ReactPointerEvent, WheelEvent as ReactWheelEvent } from "react";
import { downloadCanvasPng } from "@platform/export";
import { clamp } from "@platform/math";
import {
  FLAGSHIP_CANVAS_HEIGHT,
  FLAGSHIP_CANVAS_WIDTH,
  FLAGSHIP_IMMERSIVE_MAX_DPR,
  FLAGSHIP_MAX_DPR,
  prepareCanvas,
} from "../../canvas/setup.js";
import { FlagshipShell } from "../shared/FlagshipShell.js";
import { useAnimationFrame } from "../shared/useAnimationFrame.js";
import { useShortcuts } from "../shared/useShortcuts.js";
import { toCanvasPoint } from "../shared/pointer.js";
import { mulberry32 } from "../shared/rng.js";
import canvasStyles from "../shared/canvasStyles.module.css";

const W = FLAGSHIP_CANVAS_WIDTH;
const H = FLAGSHIP_CANVAS_HEIGHT;
const BASE_PARTICLES = 420;
const IMMERSIVE_PARTICLES = 720;

interface Particle {
  angle: number;
  radius: number;
  homeRadius: number;
  speed: number;
  hue: number;
  flash: number;
}
interface Star {
  x: number;
  y: number;
  b: number;
}
interface Shockwave {
  x: number;
  y: number;
  born: number;
}

/** Ember → violet nebula cycle over time. */
function accretionHue(base: number, elapsed: number): number {
  // 18–42 ember, drifts toward 280 violet nebula, cycles back.
  const cycle = 0.5 + 0.5 * Math.sin(elapsed * 0.12);
  return base + cycle * 220;
}

export function EventHorizonPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const bloomRef = useRef<HTMLCanvasElement | null>(null);
  const hudRef = useRef<HTMLDivElement>(null);
  const targetRef = useRef({ x: W * 0.5, y: H * 0.5 });
  const posRef = useRef({ x: W * 0.5, y: H * 0.5, vx: 0, vy: 0 });
  const particlesRef = useRef<Particle[]>([]);
  const starsRef = useRef<Star[]>([]);
  const shockwavesRef = useRef<Shockwave[]>([]);
  const massRef = useRef(1.6);
  const seedRef = useRef(42);
  const immersiveRef = useRef(false);
  const idleDriftRef = useRef({ ax: 0, ay: 0 });
  const lastPointerRef = useRef(0);

  const init = useCallback((count = BASE_PARTICLES) => {
    const rand = mulberry32(seedRef.current);
    starsRef.current = Array.from({ length: 900 }, () => ({
      x: rand() * W,
      y: rand() * H,
      b: 0.3 + rand() * 0.7,
    }));
    particlesRef.current = Array.from({ length: count }, () => {
      const radius = 70 + rand() * 220;
      return {
        angle: rand() * Math.PI * 2,
        radius,
        homeRadius: radius,
        speed: 0.4 + rand() * 1.2,
        hue: 18 + rand() * 28,
        flash: 0,
      };
    });
  }, []);

  useMemo(() => {
    init();
  }, [init]);

  const reset = useCallback(() => {
    seedRef.current = (seedRef.current + 17) % 900;
    massRef.current = 1.6;
    targetRef.current = { x: W * 0.5, y: H * 0.5 };
    posRef.current = { x: W * 0.5, y: H * 0.5, vx: 0, vy: 0 };
    shockwavesRef.current = [];
    init(immersiveRef.current ? IMMERSIVE_PARTICLES : BASE_PARTICLES);
  }, [init]);

  const triggerShockwave = useCallback((x: number, y: number) => {
    shockwavesRef.current.push({ x, y, born: performance.now() / 1000 });
    if (shockwavesRef.current.length > 5) shockwavesRef.current.shift();
  }, []);

  const onImmersiveChange = useCallback(
    (immersive: boolean) => {
      immersiveRef.current = immersive;
      init(immersive ? IMMERSIVE_PARTICLES : BASE_PARTICLES);
    },
    [init],
  );

  useAnimationFrame((_dt, elapsed) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const maxDpr = immersiveRef.current ? FLAGSHIP_IMMERSIVE_MAX_DPR : FLAGSHIP_MAX_DPR;
    const ctx = prepareCanvas(canvas, W, H, { maxDpr });

    // Ambient camera drift when idle — singularity never sits still.
    const idle = performance.now() / 1000 - lastPointerRef.current > 1.2;
    const drift = idleDriftRef.current;
    if (idle) {
      drift.ax = Math.sin(elapsed * 0.18) * 28;
      drift.ay = Math.cos(elapsed * 0.14) * 18;
      targetRef.current = {
        x: W * 0.5 + drift.ax,
        y: H * 0.5 + drift.ay,
      };
    }

    const pos = posRef.current;
    const target = targetRef.current;
    pos.vx += (target.x - pos.x) * 0.022;
    pos.vy += (target.y - pos.y) * 0.022;
    pos.vx *= 0.88;
    pos.vy *= 0.88;
    pos.x += pos.vx;
    pos.y += pos.vy;

    const cx = pos.x;
    const cy = pos.y;
    const mass = massRef.current;
    const horizon = 22 + mass * 10;
    const massSq = mass * mass * 1400;

    // Colour evolution: deep midnight → ember photon ring → violet nebula wash.
    const emberMix = 0.5 + 0.5 * Math.sin(elapsed * 0.12);
    const nebulaMix = 0.5 + 0.5 * Math.sin(elapsed * 0.12 + 2.1);
    const bgR = Math.floor(2 + emberMix * 6 + nebulaMix * 8);
    const bgG = Math.floor(1 + nebulaMix * 4);
    const bgB = Math.floor(10 + nebulaMix * 28 + emberMix * 6);

    const step = 2;
    const img = ctx.createImageData(W, H);
    const out = img.data;
    const stars = starsRef.current;
    const bg = new Uint8ClampedArray(W * H * 4);
    for (const s of stars) {
      // Slow starfield drift so the lensed background never freezes.
      const sx = Math.round((s.x + elapsed * 2.4) % W);
      const sy = Math.round((s.y + Math.sin(elapsed * 0.05 + s.x * 0.01) * 4) % H);
      if (sx < 0 || sy < 0) continue;
      const i = (sy * W + sx) * 4;
      const v = Math.floor(s.b * 255);
      bg[i] = Math.min(255, v + Math.floor(nebulaMix * 20));
      bg[i + 1] = Math.min(255, v);
      bg[i + 2] = Math.min(255, v + 40 + Math.floor(nebulaMix * 50));
      bg[i + 3] = 255;
    }

    const ringPulse = 1 + Math.sin(elapsed * 3) * 0.15;
    for (let py = 0; py < H; py += step) {
      for (let px = 0; px < W; px += step) {
        const dx = px - cx;
        const dy = py - cy;
        const r = Math.hypot(dx, dy) + 0.001;
        let rOut = bgR;
        let gOut = bgG;
        let bOut = bgB;
        if (r < horizon) {
          rOut = 0;
          gOut = 0;
          bOut = 0;
        } else {
          const warp = 1 + massSq / (r * r);
          const sx = Math.round(cx + dx * warp);
          const sy = Math.round(cy + dy * warp);
          if (sx >= 0 && sx < W && sy >= 0 && sy < H) {
            const i = (sy * W + sx) * 4;
            rOut = bg[i]!;
            gOut = bg[i + 1]!;
            bOut = bg[i + 2]!;
          }
          const ring = Math.exp(-Math.abs(r - horizon * 1.35) * 0.08) * ringPulse;
          // Ember → violet photon ring.
          rOut = clamp(rOut + ring * (255 - nebulaMix * 80), 0, 255);
          gOut = clamp(gOut + ring * (140 - nebulaMix * 40), 0, 255);
          bOut = clamp(bOut + ring * (40 + nebulaMix * 160), 0, 255);
        }
        for (let sy = 0; sy < step && py + sy < H; sy++) {
          for (let sx = 0; sx < step && px + sx < W; sx++) {
            const i = ((py + sy) * W + (px + sx)) * 4;
            out[i] = rOut;
            out[i + 1] = gOut;
            out[i + 2] = bOut;
            out[i + 3] = 255;
          }
        }
      }
    }
    ctx.putImageData(img, 0, 0);

    // Accretion disk — colour cycles ember → violet.
    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(1, 0.38);
    const diskR = horizon * 1.7;
    const grad = ctx.createRadialGradient(0, 0, horizon, 0, 0, diskR * 1.5);
    const emberA = 0.15 * ringPulse;
    const violetA = 0.32 * ringPulse;
    grad.addColorStop(0, "rgba(255,120,30,0)");
    grad.addColorStop(
      0.4,
      `rgba(${Math.floor(255 - nebulaMix * 40)}, ${Math.floor(180 - nebulaMix * 60)}, ${Math.floor(60 + nebulaMix * 160)}, ${emberA + nebulaMix * 0.1})`,
    );
    grad.addColorStop(
      0.7,
      `rgba(${Math.floor(255 - nebulaMix * 100)}, ${Math.floor(90 + nebulaMix * 20)}, ${Math.floor(20 + nebulaMix * 200)}, ${violetA})`,
    );
    grad.addColorStop(
      1,
      `rgba(${Math.floor(80 + nebulaMix * 60)}, 20, ${Math.floor(nebulaMix * 90)}, 0)`,
    );
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(0, 0, diskR * 1.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    const waves = shockwavesRef.current;
    for (let i = waves.length - 1; i >= 0; i--) {
      const w = waves[i]!;
      const age = elapsed - w.born;
      const ringR = age * 520;
      if (age > 1.4) {
        waves.splice(i, 1);
        continue;
      }
      ctx.strokeStyle = `rgba(180, 160, 255, ${(1 - age / 1.4) * 0.5})`;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.ellipse(w.x, w.y, ringR, ringR * 0.38, 0, 0, Math.PI * 2);
      ctx.stroke();
    }

    for (const p of particlesRef.current) {
      // Ambient orbital breathing when idle.
      p.angle += (p.speed * mass * 0.015) / Math.max(0.4, p.radius / 120);
      if (idle) {
        p.homeRadius += Math.sin(elapsed * 0.6 + p.angle) * 0.15;
      }
      p.radius += (p.homeRadius - p.radius) * 0.01;
      for (const w of waves) {
        const age = elapsed - w.born;
        const ringR = age * 520;
        const dist = Math.abs(p.radius - ringR);
        if (dist < 30 && age < 1.4) {
          p.radius += (1 - dist / 30) * 5;
          p.flash = 1;
        }
      }
      const tilt = 0.38;
      const px = cx + Math.cos(p.angle) * p.radius;
      const py = cy + Math.sin(p.angle) * p.radius * tilt;
      const dist = Math.hypot(px - cx, (py - cy) / tilt);
      if (dist < horizon * 1.05) {
        p.radius = 90 + Math.random() * 200;
        p.homeRadius = p.radius;
        continue;
      }
      p.flash *= 0.92;
      const glowMix = 1 + p.flash * 1.6;
      const hue = accretionHue(p.hue, elapsed);
      ctx.fillStyle = `hsla(${hue}, 92%, ${clamp(62 * glowMix, 0, 88)}%, 0.88)`;
      ctx.shadowColor = `hsla(${hue}, 100%, 55%, 0.85)`;
      ctx.shadowBlur = 8 + p.flash * 12;
      ctx.beginPath();
      ctx.arc(px, py, 1.8 + p.flash * 1.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    }

    let bloom = bloomRef.current;
    if (!bloom) {
      bloom = document.createElement("canvas");
      bloom.width = 320;
      bloom.height = Math.round((320 * H) / W);
      bloomRef.current = bloom;
    }
    const bctx = bloom.getContext("2d");
    if (bctx) {
      bctx.clearRect(0, 0, bloom.width, bloom.height);
      bctx.drawImage(canvas, 0, 0, bloom.width, bloom.height);
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      ctx.globalAlpha = 0.32 + nebulaMix * 0.08;
      ctx.filter = "blur(5px)";
      ctx.drawImage(bloom, 0, 0, W, H);
      ctx.filter = "none";
      ctx.restore();
    }

    if (hudRef.current) {
      hudRef.current.textContent = `mass ${mass.toFixed(2)} · horizon ${horizon.toFixed(0)}px · drag to orbit · click for shockwave · scroll for mass`;
    }
  });

  const onPointerMove = useCallback((e: ReactPointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    lastPointerRef.current = performance.now() / 1000;
    const p = toCanvasPoint(canvas, e.clientX, e.clientY, W, H);
    targetRef.current = p;
  }, []);

  const onPointerDown = useCallback(
    (e: ReactPointerEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      lastPointerRef.current = performance.now() / 1000;
      const p = toCanvasPoint(canvas, e.clientX, e.clientY, W, H);
      triggerShockwave(p.x, p.y);
    },
    [triggerShockwave],
  );

  const onWheel = useCallback((e: ReactWheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    massRef.current = clamp(massRef.current + (e.deltaY > 0 ? -0.12 : 0.12), 0.4, 4);
  }, []);

  useShortcuts({
    r: reset,
    "[": () => {
      massRef.current = Math.max(0.4, massRef.current - 0.15);
    },
    "]": () => {
      massRef.current = Math.min(4, massRef.current + 0.15);
    },
  });

  const handleExport = useCallback(() => {
    const c = canvasRef.current;
    if (c) downloadCanvasPng("event-horizon.png", c);
  }, []);

  const shortcuts = useMemo(
    () => [
      { keys: "Move mouse", label: "Steer singularity (springy orbit inertia)" },
      { keys: "Click", label: "Shockwave — kicks the accretion disk" },
      { keys: "Scroll / [ ]", label: "Decrease / increase lens mass" },
      { keys: "R", label: "Reseed starfield" },
    ],
    [],
  );

  return (
    <FlagshipShell
      title="Event Horizon"
      tagline="Mouse-steered gravitational lensing — ember accretion drifts into violet nebula, never still."
      demoPath="/event-horizon"
      shortcuts={shortcuts}
      onReset={reset}
      onExport={handleExport}
      onImmersiveChange={onImmersiveChange}
      statusBar={<div ref={hudRef} />}
      about={
        <>
          <p>
            Background stars are warped by an inverse-square lens map around a springy,
            inertia-carrying singularity. Inside the horizon light vanishes; outside, a pulsing
            photon ring and accretion particles skim the disk. Colour evolves continuously — ember
            fire cycling toward violet nebula — and when idle the singularity drifts so the
            installation never freezes. Click anywhere to send a shockwave through the disk.
          </p>
        </>
      }
    >
      <canvas
        ref={canvasRef}
        className={canvasStyles.canvas}
        width={W}
        height={H}
        style={{
          aspectRatio: `${W}/${H}`,
          maxWidth: "100%",
          maxHeight: "100%",
          cursor: "crosshair",
        }}
        aria-label="Event horizon canvas"
        onPointerMove={onPointerMove}
        onPointerDown={onPointerDown}
        onWheel={onWheel}
      />
    </FlagshipShell>
  );
}
