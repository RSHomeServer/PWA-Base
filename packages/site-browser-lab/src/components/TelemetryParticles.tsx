import { useEffect, useRef } from "react";
import { useReducedMotion } from "../hooks/useReducedMotion.js";
import styles from "./TelemetryParticles.module.css";

export interface TelemetryParticlesProps {
  active: boolean;
  progress: number;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  hue: number;
}

export function TelemetryParticles({ active, progress }: TelemetryParticlesProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    if (!active || reducedMotion) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();

    const particles: Particle[] = [];
    let raf = 0;

    const spawn = () => {
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      for (let i = 0; i < 3; i += 1) {
        particles.push({
          x: Math.random() * w,
          y: h * 0.5 + (Math.random() - 0.5) * h * 0.6,
          vx: 1.2 + Math.random() * 2.5 + progress * 2,
          vy: (Math.random() - 0.5) * 1.2,
          life: 1,
          hue: 168 + Math.random() * 20,
        });
      }
    };

    const tick = () => {
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      ctx.clearRect(0, 0, w, h);

      if (Math.random() < 0.35 + progress * 0.4) spawn();

      for (let i = particles.length - 1; i >= 0; i -= 1) {
        const p = particles[i]!;
        p.x += p.vx;
        p.y += p.vy;
        p.life -= 0.018;

        if (p.life <= 0 || p.x > w + 8) {
          particles.splice(i, 1);
          continue;
        }

        ctx.beginPath();
        ctx.arc(p.x, p.y, 1.5 * p.life, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${p.hue}, 70%, 65%, ${p.life * 0.7})`;
        ctx.fill();
      }

      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, [active, progress, reducedMotion]);

  if (!active || reducedMotion) return null;

  return <canvas ref={canvasRef} className={styles.canvas} aria-hidden="true" />;
}
