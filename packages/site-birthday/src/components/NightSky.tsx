import { useEffect, useRef } from "react";
import { useReducedMotion } from "../hooks/useReducedMotion.js";

interface Star {
  x: number;
  y: number;
  size: number;
  baseOpacity: number;
  opacity: number;
  appearAt: number;
  twinklePhase: number;
  twinkleSpeed: number;
  cool: boolean;
}

interface Firefly {
  x: number;
  y: number;
  vx: number;
  vy: number;
  glow: number;
  phase: number;
}

interface NightSkyProps {
  /** Extra shower of light, used for the Konami easter egg. */
  burst?: boolean;
}

/**
 * Persistent night sky: cool blue-white stars that fade in on load,
 * soft fireflies that gather near the cursor, and a quiet pointer wake.
 */
export function NightSky({ burst = false }: NightSkyProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const reducedMotion = useReducedMotion();
  const pointerRef = useRef({ x: -9999, y: -9999, active: false });
  const burstRef = useRef(0);

  useEffect(() => {
    if (burst) burstRef.current = 34;
  }, [burst]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const startedAt = performance.now();
    let animationId = 0;
    let stars: Star[] = [];
    let fireflies: Firefly[] = [];

    const onPointerMove = (event: PointerEvent) => {
      pointerRef.current = { x: event.clientX, y: event.clientY, active: true };
    };
    const onPointerLeave = () => {
      pointerRef.current.active = false;
    };

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = window.innerWidth;
      const h = window.innerHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const starCount = Math.min(160, Math.floor((w * h) / 9000));
      stars = Array.from({ length: starCount }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        size: Math.random() * 1.3 + 0.35,
        baseOpacity: Math.random() * 0.55 + 0.2,
        opacity: 0,
        appearAt: Math.random() * 4200,
        twinklePhase: Math.random() * Math.PI * 2,
        twinkleSpeed: Math.random() * 0.6 + 0.2,
        cool: Math.random() > 0.35,
      }));

      const fireflyCount = reducedMotion ? 0 : Math.min(12, Math.floor(w / 120));
      fireflies = Array.from({ length: fireflyCount }, () => ({
        x: Math.random() * w,
        y: Math.random() * h * 0.85,
        vx: (Math.random() - 0.5) * 0.1,
        vy: (Math.random() - 0.5) * 0.1,
        glow: Math.random() * 0.4 + 0.3,
        phase: Math.random() * Math.PI * 2,
      }));
    };

    const draw = (now: number) => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      const elapsed = now - startedAt;
      const pointer = pointerRef.current;

      ctx.clearRect(0, 0, w, h);

      for (const s of stars) {
        if (reducedMotion) {
          s.opacity = s.baseOpacity;
        } else {
          const appear = Math.min(1, Math.max(0, (elapsed - s.appearAt) / 1400));
          const twinkle = 0.82 + 0.18 * Math.sin(now * 0.001 * s.twinkleSpeed + s.twinklePhase);
          let disturb = 0;
          if (pointer.active) {
            const dx = s.x - pointer.x;
            const dy = s.y - pointer.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < 110) disturb = (1 - dist / 110) * 0.4;
          }
          s.opacity = s.baseOpacity * appear * twinkle + disturb;
        }
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
        const alpha = Math.min(1, s.opacity);
        ctx.fillStyle = s.cool
          ? `rgba(199, 232, 255, ${alpha})`
          : `rgba(250, 245, 235, ${alpha * 0.85})`;
        ctx.fill();
      }

      if (!reducedMotion) {
        for (const f of fireflies) {
          if (pointer.active) {
            const dx = pointer.x - f.x;
            const dy = pointer.y - f.y;
            const dist = Math.sqrt(dx * dx + dy * dy) || 1;
            if (dist < 220) {
              const pull = (1 - dist / 220) * 0.015;
              f.vx += (dx / dist) * pull;
              f.vy += (dy / dist) * pull;
            }
          }
          f.vx += (Math.random() - 0.5) * 0.008;
          f.vy += (Math.random() - 0.5) * 0.008;
          f.vx *= 0.98;
          f.vy *= 0.98;
          const speed = Math.sqrt(f.vx * f.vx + f.vy * f.vy);
          const maxSpeed = 0.7;
          if (speed > maxSpeed) {
            f.vx = (f.vx / speed) * maxSpeed;
            f.vy = (f.vy / speed) * maxSpeed;
          }
          f.x += f.vx;
          f.y += f.vy;
          if (f.x < -20) f.x = w + 20;
          if (f.x > w + 20) f.x = -20;
          if (f.y < -20) f.y = h * 0.9;
          if (f.y > h * 0.95) f.y = h * 0.1;

          const flicker = 0.45 + 0.55 * Math.sin(now * 0.0018 + f.phase);
          const alpha = f.glow * flicker;
          const grad = ctx.createRadialGradient(f.x, f.y, 0, f.x, f.y, 8);
          grad.addColorStop(0, `rgba(145, 183, 255, ${alpha})`);
          grad.addColorStop(1, "rgba(145, 183, 255, 0)");
          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.arc(f.x, f.y, 8, 0, Math.PI * 2);
          ctx.fill();
          ctx.beginPath();
          ctx.arc(f.x, f.y, 1, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(199, 232, 255, ${Math.min(1, alpha + 0.25)})`;
          ctx.fill();
        }
      }

      if (burstRef.current > 0 && !reducedMotion) {
        for (let i = 0; i < 2; i++) {
          const angle = Math.random() * Math.PI * 2;
          const dist = Math.random() * Math.min(w, h) * 0.4;
          const x = w / 2 + Math.cos(angle) * dist;
          const y = h * 0.4 + Math.sin(angle) * dist;
          ctx.beginPath();
          ctx.arc(x, y, Math.random() * 1.6 + 0.6, 0, Math.PI * 2);
          ctx.fillStyle = "rgba(199, 232, 255, 0.85)";
          ctx.fill();
        }
        burstRef.current -= 1;
      }

      if (!reducedMotion) {
        animationId = requestAnimationFrame(draw);
      }
    };

    resize();
    window.addEventListener("resize", resize);
    window.addEventListener("pointermove", onPointerMove, { passive: true });
    window.addEventListener("pointerleave", onPointerLeave);

    if (reducedMotion) {
      draw(startedAt);
    } else {
      animationId = requestAnimationFrame(draw);
    }

    return () => {
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerleave", onPointerLeave);
      cancelAnimationFrame(animationId);
    };
  }, [reducedMotion]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 0,
        pointerEvents: "none",
        background:
          "radial-gradient(ellipse 120% 80% at 50% -10%, #0c1a2a 0%, #07111c 55%, #040a12 100%)",
      }}
    />
  );
}
