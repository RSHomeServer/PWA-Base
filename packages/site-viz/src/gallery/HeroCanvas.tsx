import { useEffect, useRef } from "react";
import { prepareCanvas } from "../canvas/setup.js";

/**
 * Museum hero — a living miniature of Event Horizon + Aurora:
 * tilted accretion disk, ember→violet particles, cyan/emerald ribbon wash.
 * Invites the mouse; never freezes into SaaS particle wallpaper.
 */

interface DiskParticle {
  angle: number;
  radius: number;
  home: number;
  speed: number;
  hue: number;
  size: number;
}

interface Ribbon {
  phase: number;
  y: number;
  band: number;
  amp: number;
}

function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function seedDisk(count: number): DiskParticle[] {
  const out: DiskParticle[] = [];
  for (let i = 0; i < count; i++) {
    const radius = 0.18 + Math.random() * 0.42;
    out.push({
      angle: Math.random() * Math.PI * 2,
      radius,
      home: radius,
      speed: 0.35 + Math.random() * 0.9,
      hue: 18 + Math.random() * 30,
      size: 1.2 + Math.random() * 2.2,
    });
  }
  return out;
}

function seedRibbons(): Ribbon[] {
  return Array.from({ length: 4 }, (_, i) => ({
    phase: Math.random() * Math.PI * 2,
    y: 0.22 + i * 0.12,
    band: i % 2,
    amp: 0.03 + Math.random() * 0.04,
  }));
}

export function HeroCanvas({ className }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const reduced = prefersReducedMotion();
    let frameId = 0;
    let width = 0;
    let height = 0;
    let particles = seedDisk(160);
    let ribbons = seedRibbons();
    let elapsed = 0;
    let last = 0;
    const pointer = { x: -9999, y: -9999, active: false };
    // Singularity eases toward pointer / ambient drift.
    const singularity = { x: 0.62, y: 0.42, tx: 0.62, ty: 0.42 };

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      width = Math.max(1, Math.floor(rect.width));
      height = Math.max(1, Math.floor(rect.height));
      prepareCanvas(canvas, width, height);
      const count = Math.min(280, Math.max(120, Math.floor((width * height) / 9000)));
      particles = seedDisk(count);
      ribbons = seedRibbons();
    };

    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(canvas);

    const onMove = (event: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      pointer.x = (event.clientX - rect.left) / rect.width;
      pointer.y = (event.clientY - rect.top) / rect.height;
      pointer.active = true;
      singularity.tx = 0.35 + pointer.x * 0.45;
      singularity.ty = 0.28 + pointer.y * 0.4;
    };
    const onLeave = () => {
      pointer.active = false;
    };
    canvas.addEventListener("pointermove", onMove);
    canvas.addEventListener("pointerleave", onLeave);

    const render = (t: number) => {
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      if (last) elapsed += Math.min((t - last) / 1000, 0.1);
      last = t;

      // Ambient singularity drift when idle.
      if (!pointer.active) {
        singularity.tx = 0.58 + Math.sin(elapsed * 0.22) * 0.08;
        singularity.ty = 0.4 + Math.cos(elapsed * 0.18) * 0.05;
      }
      singularity.x += (singularity.tx - singularity.x) * 0.04;
      singularity.y += (singularity.ty - singularity.y) * 0.04;

      const cx = singularity.x * width;
      const cy = singularity.y * height;
      const nebula = 0.5 + 0.5 * Math.sin(elapsed * 0.14);

      // Midnight void → ember/violet atmosphere.
      const sky = ctx.createRadialGradient(cx, cy, 20, cx, cy, Math.max(width, height) * 0.85);
      sky.addColorStop(
        0,
        `rgb(${Math.floor(18 + nebula * 20)}, 8, ${Math.floor(28 + nebula * 40)})`,
      );
      sky.addColorStop(0.45, `rgb(6, 10, ${Math.floor(22 + nebula * 18)})`);
      sky.addColorStop(1, "rgb(2, 6, 14)");
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, width, height);

      // Soft aurora wash in the upper third — electric cyan / emerald.
      ctx.globalCompositeOperation = "lighter";
      for (const ribbon of ribbons) {
        const hue =
          ribbon.band === 0
            ? 185 + Math.sin(elapsed * 0.2) * 10
            : 148 + Math.sin(elapsed * 0.18) * 8;
        const baseY = ribbon.y * height;
        const amp = ribbon.amp * height * (pointer.active ? 1.35 : 1);
        const phase = elapsed * 0.6 + ribbon.phase + (pointer.active ? pointer.x * 1.2 : 0);
        ctx.beginPath();
        for (let x = 0; x <= width; x += 8) {
          const y =
            baseY + amp * Math.sin(x * 0.008 + phase) + Math.sin(x * 0.02 + phase * 1.3) * 6;
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        for (let x = width; x >= 0; x -= 8) {
          const y =
            baseY + amp * Math.sin(x * 0.008 + phase) + 22 + Math.sin(x * 0.015 + phase) * 5;
          ctx.lineTo(x, y);
        }
        ctx.closePath();
        const g = ctx.createLinearGradient(0, baseY - 30, 0, baseY + 50);
        g.addColorStop(0, `hsla(${hue}, 90%, 60%, 0)`);
        g.addColorStop(0.45, `hsla(${hue}, 95%, 62%, 0.12)`);
        g.addColorStop(1, `hsla(${hue}, 80%, 40%, 0)`);
        ctx.fillStyle = g;
        ctx.fill();
      }

      // Accretion disk ellipse.
      ctx.save();
      ctx.translate(cx, cy);
      ctx.scale(1, 0.36);
      const diskR = Math.min(width, height) * 0.38;
      const disk = ctx.createRadialGradient(0, 0, diskR * 0.15, 0, 0, diskR);
      disk.addColorStop(0, "rgba(255,140,40,0)");
      disk.addColorStop(
        0.45,
        `rgba(${Math.floor(255 - nebula * 60)}, ${Math.floor(160 - nebula * 40)}, ${Math.floor(50 + nebula * 140)}, 0.22)`,
      );
      disk.addColorStop(
        0.75,
        `rgba(${Math.floor(220 - nebula * 80)}, 80, ${Math.floor(40 + nebula * 180)}, 0.35)`,
      );
      disk.addColorStop(1, "rgba(40,10,60,0)");
      ctx.fillStyle = disk;
      ctx.beginPath();
      ctx.arc(0, 0, diskR, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // Event horizon core.
      const core = ctx.createRadialGradient(cx, cy, 0, cx, cy, 28);
      core.addColorStop(0, "rgb(0,0,0)");
      core.addColorStop(0.65, "rgb(0,0,0)");
      core.addColorStop(1, "rgba(0,0,0,0)");
      ctx.globalCompositeOperation = "source-over";
      ctx.fillStyle = core;
      ctx.beginPath();
      ctx.arc(cx, cy, 28, 0, Math.PI * 2);
      ctx.fill();

      // Photon ring pulse.
      const pulse = 1 + Math.sin(elapsed * 2.8) * 0.12;
      ctx.strokeStyle = `hsla(${28 + nebula * 200}, 95%, 65%, ${0.55 * pulse})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(cx, cy, 32 * pulse, 12 * pulse, 0, 0, Math.PI * 2);
      ctx.stroke();

      // Orbiting accretion particles.
      ctx.globalCompositeOperation = "lighter";
      for (const p of particles) {
        if (!reduced) {
          p.angle += p.speed * 0.012;
          // Mouse gravity tug — invites interaction.
          if (pointer.active) {
            const pull = (pointer.x - singularity.x) * 0.002;
            p.home = Math.max(0.12, Math.min(0.65, p.home + pull * 0.3));
          } else {
            p.home += Math.sin(elapsed * 0.5 + p.angle) * 0.0004;
          }
          p.radius += (p.home - p.radius) * 0.04;
        }
        const tilt = 0.36;
        const px = cx + Math.cos(p.angle) * p.radius * Math.min(width, height) * 0.55;
        const py = cy + Math.sin(p.angle) * p.radius * Math.min(width, height) * 0.55 * tilt;
        const hue = p.hue + nebula * 200;
        ctx.fillStyle = `hsla(${hue}, 92%, 62%, 0.85)`;
        ctx.beginPath();
        ctx.arc(px, py, p.size, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalCompositeOperation = "source-over";

      // Pointer invitation halo.
      if (pointer.active && !reduced) {
        const hx = pointer.x * width;
        const hy = pointer.y * height;
        const halo = ctx.createRadialGradient(hx, hy, 0, hx, hy, 120);
        halo.addColorStop(0, "rgba(180, 220, 255, 0.12)");
        halo.addColorStop(1, "transparent");
        ctx.fillStyle = halo;
        ctx.fillRect(0, 0, width, height);
      }

      // Soft vignette for museum frame feel.
      const vig = ctx.createRadialGradient(
        width * 0.5,
        height * 0.45,
        height * 0.2,
        width * 0.5,
        height * 0.5,
        height * 0.85,
      );
      vig.addColorStop(0, "rgba(0,0,0,0)");
      vig.addColorStop(1, "rgba(0,0,0,0.45)");
      ctx.fillStyle = vig;
      ctx.fillRect(0, 0, width, height);

      if (!reduced) {
        frameId = window.requestAnimationFrame(render);
      }
    };

    if (reduced) {
      render(performance.now());
    } else {
      frameId = window.requestAnimationFrame(render);
    }

    return () => {
      observer.disconnect();
      canvas.removeEventListener("pointermove", onMove);
      canvas.removeEventListener("pointerleave", onLeave);
      if (frameId) window.cancelAnimationFrame(frameId);
    };
  }, []);

  return <canvas ref={canvasRef} className={className} aria-hidden="true" />;
}
