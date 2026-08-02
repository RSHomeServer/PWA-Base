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
import { fadeCanvas } from "../../exhibits/lib/simulation.js";
import { FlagshipShell } from "../shared/FlagshipShell.js";
import { useAnimationFrame } from "../shared/useAnimationFrame.js";
import { useShortcuts } from "../shared/useShortcuts.js";
import { toCanvasPoint } from "../shared/pointer.js";
import { mulberry32 } from "../shared/rng.js";
import canvasStyles from "../shared/canvasStyles.module.css";

const W = FLAGSHIP_CANVAS_WIDTH;
const H = FLAGSHIP_CANVAS_HEIGHT;
const LIGHT_GRAB_RADIUS = 34;

interface Ribbon {
  phase: number;
  baseY: number;
  /** 0 = electric cyan core, 1 = emerald edge — identity, not rainbow soup. */
  band: number;
  amp: number;
  depth: number;
  thickness: number;
}
interface Star {
  x: number;
  y: number;
  s: number;
  layer: number;
}
interface Ripple {
  x: number;
  y: number;
  age: number;
  hue: number;
}
interface Spark {
  x: number;
  y: number;
  vx: number;
  vy: number;
  age: number;
  hue: number;
}
interface ShootingStar {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
}

/** Electric cyan (175–195) ↔ emerald (140–160) — aurora identity. */
function auroraHue(band: number, elapsed: number): number {
  const drift = Math.sin(elapsed * 0.15) * 12;
  return band < 0.5 ? 185 + drift : 148 + drift;
}

export function AuroraSkyPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const bloomRef = useRef<HTMLCanvasElement | null>(null);
  const hudRef = useRef<HTMLDivElement>(null);
  const windRef = useRef({ x: 0, y: 0, tx: 0, ty: 0 });
  const ribbonsRef = useRef<Ribbon[]>([]);
  const starsRef = useRef<Star[]>([]);
  const ripplesRef = useRef<Ripple[]>([]);
  const sparksRef = useRef<Spark[]>([]);
  const shootersRef = useRef<ShootingStar[]>([]);
  const seedRef = useRef(17);
  const intensityRef = useRef(1);
  const immersiveRef = useRef(false);
  const lastPointerRef = useRef(0);
  const lightRef = useRef({
    x: W * 0.5,
    y: H * 0.16,
    tx: W * 0.5,
    ty: H * 0.16,
    dragging: false,
  });

  const init = useCallback(() => {
    const rand = mulberry32(seedRef.current);
    // Fewer, clearer ribbons in depth layers — structure over glow-soup.
    ribbonsRef.current = Array.from({ length: 6 }, (_, i) => ({
      phase: rand() * Math.PI * 2,
      baseY: H * (0.14 + (i / 5) * 0.42),
      band: i % 2 === 0 ? 0.2 + rand() * 0.2 : 0.65 + rand() * 0.25,
      amp: 28 + rand() * 40,
      depth: i / 5,
      thickness: 18 + rand() * 22,
    }));
    starsRef.current = Array.from({ length: 220 }, () => ({
      x: rand() * W,
      y: rand() * H * 0.55,
      s: 0.5 + rand() * 1.6,
      layer: rand(),
    }));
  }, []);

  useMemo(() => {
    init();
  }, [init]);

  const reset = useCallback(() => {
    seedRef.current = (seedRef.current + 31) % 997;
    windRef.current = { x: 0, y: 0, tx: 0, ty: 0 };
    ripplesRef.current = [];
    sparksRef.current = [];
    intensityRef.current = 1;
    lightRef.current = { x: W * 0.5, y: H * 0.16, tx: W * 0.5, ty: H * 0.16, dragging: false };
    init();
  }, [init]);

  const spawnBurst = useCallback((x: number, y: number) => {
    const rand = Math.random;
    ripplesRef.current.push({ x, y, age: 0, hue: 160 + rand() * 40 });
    for (let i = 0; i < 22; i++) {
      const a = rand() * Math.PI * 2;
      const speed = 1.2 + rand() * 3.4;
      sparksRef.current.push({
        x,
        y,
        vx: Math.cos(a) * speed,
        vy: Math.sin(a) * speed,
        age: 0,
        hue: 150 + rand() * 50,
      });
    }
    if (ripplesRef.current.length > 12) ripplesRef.current.shift();
    if (sparksRef.current.length > 400) sparksRef.current.splice(0, sparksRef.current.length - 400);
  }, []);

  const onImmersiveChange = useCallback((immersive: boolean) => {
    immersiveRef.current = immersive;
  }, []);

  useAnimationFrame((dt, elapsed) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const maxDpr = immersiveRef.current ? FLAGSHIP_IMMERSIVE_MAX_DPR : FLAGSHIP_MAX_DPR;
    const ctx = prepareCanvas(canvas, W, H, { maxDpr });
    const wind = windRef.current;

    // Ambient wind when idle — curtains keep breathing.
    const idle = performance.now() / 1000 - lastPointerRef.current > 1.4;
    if (idle && !lightRef.current.dragging) {
      wind.tx = Math.sin(elapsed * 0.22) * 90;
      wind.ty = Math.cos(elapsed * 0.18) * 40;
    }

    wind.x += (wind.tx - wind.x) * 0.04;
    wind.y += (wind.ty - wind.y) * 0.04;
    const light = lightRef.current;
    light.x += (light.tx - light.x) * 0.16;
    light.y += (light.ty - light.y) * 0.16;
    if (idle && !light.dragging) {
      light.tx = W * 0.5 + Math.sin(elapsed * 0.12) * 60;
      light.ty = H * 0.16 + Math.cos(elapsed * 0.1) * 20;
    }
    const intensity = intensityRef.current;

    // Midnight sky that slowly breathes cyan/emerald.
    const skyPulse = 0.5 + 0.5 * Math.sin(elapsed * 0.1);
    fadeCanvas(
      ctx,
      W,
      H,
      0.14,
      `rgb(2, ${Math.floor(6 + skyPulse * 4)}, ${Math.floor(18 + skyPulse * 8)})`,
    );

    if (Math.random() < 0.006 && shootersRef.current.length < 2) {
      const sx = Math.random() * W * 0.7 + W * 0.15;
      shootersRef.current.push({
        x: sx,
        y: Math.random() * H * 0.25,
        vx: (Math.random() - 0.5) * 6 - 4,
        vy: 2 + Math.random() * 2,
        life: 1,
      });
    }

    // Depth-layered ambient glow (cyan near moon, emerald deeper).
    const glowRadius = H * (0.38 + intensity * 0.1);
    const glow = ctx.createRadialGradient(light.x, light.y, 20, light.x, light.y, glowRadius);
    glow.addColorStop(0, `rgba(120, 240, 255, ${0.14 * intensity})`);
    glow.addColorStop(0.45, `rgba(40, 200, 160, ${0.07 * intensity})`);
    glow.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, W, H);

    // Parallax stars by depth layer.
    for (const s of starsRef.current) {
      const tw = 0.4 + 0.6 * Math.sin(elapsed * 1.6 + s.x * 0.01);
      const parallax = 1 + s.layer * 0.4;
      const sx = (s.x + wind.x * 0.01 * parallax + elapsed * s.layer * 3) % W;
      ctx.globalAlpha = tw * (0.45 + s.layer * 0.35);
      ctx.fillStyle = s.layer > 0.6 ? "#d8f8ff" : "#a8c8e8";
      ctx.fillRect(sx < 0 ? sx + W : sx, s.y, s.s * (0.7 + s.layer * 0.5), s.s);
    }
    ctx.globalAlpha = 1;

    for (let i = shootersRef.current.length - 1; i >= 0; i--) {
      const sh = shootersRef.current[i]!;
      sh.x += sh.vx;
      sh.y += sh.vy;
      sh.life -= 0.02;
      if (sh.life <= 0 || sh.y > H * 0.5) {
        shootersRef.current.splice(i, 1);
        continue;
      }
      ctx.strokeStyle = `rgba(200, 245, 255, ${sh.life * 0.8})`;
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(sh.x, sh.y);
      ctx.lineTo(sh.x - sh.vx * 4, sh.y - sh.vy * 4);
      ctx.stroke();
    }

    // Draw far ribbons first (dimmer), then near — clearer structure.
    const sorted = [...ribbonsRef.current].sort((a, b) => a.depth - b.depth);
    ctx.globalCompositeOperation = "lighter";
    for (const ribbon of sorted) {
      const t = elapsed * 0.55 + ribbon.phase + wind.x * 0.002;
      const windAmp = (ribbon.amp + wind.y * 0.08) * intensity;
      const lightBoost = 1 + 1.0 * Math.exp(-Math.abs(ribbon.baseY - light.y) / 160);
      const depthFade = 0.35 + ribbon.depth * 0.65;
      const hue = auroraHue(ribbon.band, elapsed);
      const step = immersiveRef.current ? 3 : 5;

      // Sharp ribbon spine — readable curtain edge.
      ctx.beginPath();
      for (let x = 0; x <= W; x += step) {
        const y =
          ribbon.baseY +
          windAmp * Math.sin(x * 0.007 + t) +
          Math.sin(x * 0.018 + t * 1.4) * (6 + ribbon.depth * 4) +
          wind.x * 0.015 * Math.sin(x * 0.01);
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      for (let x = W; x >= 0; x -= step) {
        const y =
          ribbon.baseY +
          windAmp * Math.sin(x * 0.007 + t) +
          Math.sin(x * 0.018 + t * 1.4) * (6 + ribbon.depth * 4) +
          ribbon.thickness +
          Math.sin(x * 0.014 + t) * 5;
        ctx.lineTo(x, y);
      }
      ctx.closePath();
      const baseAlpha = 0.22 * intensity * lightBoost * depthFade;
      const grad = ctx.createLinearGradient(
        0,
        ribbon.baseY - 40,
        0,
        ribbon.baseY + ribbon.thickness + 50,
      );
      grad.addColorStop(0, `hsla(${hue}, 90%, 60%, 0)`);
      grad.addColorStop(0.35, `hsla(${hue}, 95%, ${58 + lightBoost * 6}%, ${baseAlpha})`);
      grad.addColorStop(
        0.55,
        `hsla(${hue + (ribbon.band < 0.5 ? 8 : -8)}, 90%, ${62 + lightBoost * 5}%, ${baseAlpha * 1.35})`,
      );
      grad.addColorStop(1, `hsla(${hue}, 70%, 35%, 0)`);
      ctx.fillStyle = grad;
      ctx.fill();

      // Bright filament line along the top edge for structure.
      ctx.strokeStyle = `hsla(${hue}, 100%, 78%, ${0.18 * intensity * depthFade})`;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      for (let x = 0; x <= W; x += step) {
        const y =
          ribbon.baseY +
          windAmp * Math.sin(x * 0.007 + t) +
          Math.sin(x * 0.018 + t * 1.4) * (6 + ribbon.depth * 4);
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
    ctx.globalCompositeOperation = "source-over";

    for (let i = ripplesRef.current.length - 1; i >= 0; i--) {
      const rp = ripplesRef.current[i]!;
      rp.age += dt;
      const life = rp.age / 1.4;
      if (life >= 1) {
        ripplesRef.current.splice(i, 1);
        continue;
      }
      const radius = 12 + life * 220;
      ctx.globalCompositeOperation = "lighter";
      ctx.strokeStyle = `hsla(${rp.hue}, 90%, 70%, ${(1 - life) * 0.55})`;
      ctx.lineWidth = 3 * (1 - life) + 0.5;
      ctx.beginPath();
      ctx.arc(rp.x, rp.y, radius, 0, Math.PI * 2);
      ctx.stroke();
      ctx.globalCompositeOperation = "source-over";
    }

    ctx.globalCompositeOperation = "lighter";
    for (let i = sparksRef.current.length - 1; i >= 0; i--) {
      const sp = sparksRef.current[i]!;
      sp.age += dt;
      if (sp.age > 1.1) {
        sparksRef.current.splice(i, 1);
        continue;
      }
      sp.x += sp.vx;
      sp.y += sp.vy;
      sp.vx *= 0.96;
      sp.vy = sp.vy * 0.96 + 0.01;
      const a = clamp(1 - sp.age / 1.1, 0, 1);
      ctx.fillStyle = `hsla(${sp.hue}, 95%, 75%, ${a})`;
      ctx.beginPath();
      ctx.arc(sp.x, sp.y, 1.6 * a + 0.4, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalCompositeOperation = "source-over";

    const orbPulse = 1 + Math.sin(elapsed * 2) * 0.06;
    ctx.globalCompositeOperation = "lighter";
    const orbGlow = ctx.createRadialGradient(light.x, light.y, 0, light.x, light.y, 46 * orbPulse);
    orbGlow.addColorStop(0, "rgba(220, 250, 255, 0.9)");
    orbGlow.addColorStop(0.35, "rgba(100, 230, 220, 0.4)");
    orbGlow.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = orbGlow;
    ctx.beginPath();
    ctx.arc(light.x, light.y, 46 * orbPulse, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = light.dragging ? "rgba(255,255,255,0.95)" : "rgba(220,248,255,0.85)";
    ctx.beginPath();
    ctx.arc(light.x, light.y, light.dragging ? 8 : 6.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalCompositeOperation = "source-over";

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
      // Lower bloom than before — structure over soup.
      ctx.globalAlpha = 0.22 * intensity;
      ctx.filter = "blur(5px)";
      ctx.drawImage(bloom, 0, 0, W, H);
      ctx.filter = "none";
      ctx.restore();
    }

    const horizon = ctx.createLinearGradient(0, H * 0.7, 0, H);
    horizon.addColorStop(0, "rgba(2,8,20,0)");
    horizon.addColorStop(1, "rgba(1,4,12,0.92)");
    ctx.fillStyle = horizon;
    ctx.fillRect(0, H * 0.65, W, H * 0.35);

    const vignette = ctx.createRadialGradient(
      W * 0.5,
      H * 0.45,
      H * 0.25,
      W * 0.5,
      H * 0.5,
      H * 0.78,
    );
    vignette.addColorStop(0, "rgba(0,0,0,0)");
    vignette.addColorStop(1, "rgba(0,0,0,0.48)");
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, W, H);

    if (hudRef.current) {
      hudRef.current.textContent = `wind ${wind.x.toFixed(0)}, ${wind.y.toFixed(0)} · intensity ${intensity.toFixed(2)}× · drag the moon, click to flare, scroll to brighten`;
    }
  });

  const lightHit = useCallback((x: number, y: number) => {
    const light = lightRef.current;
    return Math.hypot(x - light.x, y - light.y) < LIGHT_GRAB_RADIUS;
  }, []);

  const onPointerDown = useCallback(
    (e: ReactPointerEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      lastPointerRef.current = performance.now() / 1000;
      const p = toCanvasPoint(canvas, e.clientX, e.clientY, W, H);
      if (lightHit(p.x, p.y)) {
        lightRef.current.dragging = true;
        canvas.setPointerCapture(e.pointerId);
      } else {
        spawnBurst(p.x, p.y);
      }
    },
    [lightHit, spawnBurst],
  );

  const onPointerMove = useCallback((e: ReactPointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    lastPointerRef.current = performance.now() / 1000;
    const p = toCanvasPoint(canvas, e.clientX, e.clientY, W, H);
    if (lightRef.current.dragging) {
      lightRef.current.tx = clamp(p.x, 20, W - 20);
      lightRef.current.ty = clamp(p.y, 20, H * 0.6);
    } else {
      windRef.current.tx = (p.x - W / 2) * 1.4;
      windRef.current.ty = (p.y - H / 2) * 0.8;
    }
  }, []);

  const onPointerUp = useCallback((e: ReactPointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (canvas && lightRef.current.dragging) {
      canvas.releasePointerCapture(e.pointerId);
    }
    lightRef.current.dragging = false;
  }, []);

  const onWheel = useCallback((e: ReactWheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    intensityRef.current = clamp(intensityRef.current + (e.deltaY > 0 ? -0.08 : 0.08), 0.4, 2.2);
  }, []);

  useShortcuts({ r: reset });

  const handleExport = useCallback(() => {
    const c = canvasRef.current;
    if (c) downloadCanvasPng("aurora-sky.png", c);
  }, []);

  const shortcuts = useMemo(
    () => [
      { keys: "Move mouse", label: "Wind / gust direction" },
      { keys: "Drag the moon", label: "Reposition light source" },
      { keys: "Click sky", label: "Flare a light burst" },
      { keys: "Scroll", label: "Aurora intensity / bloom" },
      { keys: "R", label: "Reseed ribbons & stars" },
    ],
    [],
  );

  return (
    <FlagshipShell
      title="Aurora Sky"
      tagline="Electric cyan and emerald curtains with readable ribbon structure — drag the moon, pull the wind."
      demoPath="/aurora-sky"
      shortcuts={shortcuts}
      onReset={reset}
      onExport={handleExport}
      onImmersiveChange={onImmersiveChange}
      statusBar={<div ref={hudRef} />}
      about={
        <>
          <p>
            Auroral curtains are rendered as layered ribbons with a bright filament edge — structure
            first, glow second. The palette stays in electric cyan and emerald identity, evolving
            slowly over time. Moving the pointer injects wind; a draggable moon brightens nearby
            bands. When idle, soft ambient wind keeps the sky breathing so it never freezes into a
            screensaver soup.
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
        aria-label="Aurora sky canvas"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onWheel={onWheel}
      />
    </FlagshipShell>
  );
}
