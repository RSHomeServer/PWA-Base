import { useEffect, useRef, type RefObject } from "react";

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  opacity: number;
  baseOpacity: number;
}

interface Cursor {
  x: number;
  y: number;
  active: boolean;
}

function createParticle(width: number, height: number): Particle {
  const baseOpacity = Math.random() * 0.28 + 0.06;
  return {
    x: Math.random() * width,
    y: Math.random() * height,
    vx: (Math.random() - 0.5) * 0.14,
    vy: (Math.random() - 0.5) * 0.14,
    radius: Math.random() * 1.1 + 0.35,
    opacity: baseOpacity,
    baseOpacity,
  };
}

export function useHeroParticles(canvasRef: RefObject<HTMLCanvasElement | null>) {
  const frameRef = useRef<number>(0);
  const cursorRef = useRef<Cursor>({ x: 0, y: 0, active: false });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) return;

    const context = canvas.getContext("2d");
    if (!context) return;

    let particles: Particle[] = [];
    let width = 0;
    let height = 0;

    const resize = () => {
      const parent = canvas.parentElement;
      if (!parent) return;

      width = parent.clientWidth;
      height = parent.clientHeight;
      canvas.width = width * devicePixelRatio;
      canvas.height = height * devicePixelRatio;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      context.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);

      const count = Math.min(72, Math.floor((width * height) / 18000));
      particles = Array.from({ length: count }, () => createParticle(width, height));
    };

    const accent = getComputedStyle(document.documentElement)
      .getPropertyValue("--color-accent")
      .trim();

    const onPointerMove = (event: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      cursorRef.current = {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top,
        active: true,
      };
    };

    const onPointerLeave = () => {
      cursorRef.current.active = false;
    };

    const draw = () => {
      context.clearRect(0, 0, width, height);
      const cursor = cursorRef.current;
      const influenceRadius = Math.min(width, height) * 0.18;

      for (const particle of particles) {
        if (cursor.active) {
          const dx = particle.x - cursor.x;
          const dy = particle.y - cursor.y;
          const distance = Math.hypot(dx, dy);

          if (distance < influenceRadius && distance > 0.001) {
            const force = (1 - distance / influenceRadius) * 0.045;
            particle.vx += (dx / distance) * force;
            particle.vy += (dy / distance) * force;
            particle.opacity = Math.min(
              0.55,
              particle.baseOpacity + (1 - distance / influenceRadius) * 0.32,
            );
          } else {
            particle.opacity += (particle.baseOpacity - particle.opacity) * 0.04;
          }
        } else {
          particle.opacity += (particle.baseOpacity - particle.opacity) * 0.04;
        }

        particle.vx *= 0.985;
        particle.vy *= 0.985;
        particle.x += particle.vx;
        particle.y += particle.vy;

        if (particle.x < -8) particle.x = width + 8;
        if (particle.x > width + 8) particle.x = -8;
        if (particle.y < -8) particle.y = height + 8;
        if (particle.y > height + 8) particle.y = -8;
      }

      if (cursor.active) {
        for (let i = 0; i < particles.length; i += 1) {
          const a = particles[i];
          for (let j = i + 1; j < particles.length; j += 1) {
            const b = particles[j];
            const dx = a.x - b.x;
            const dy = a.y - b.y;
            const distance = Math.hypot(dx, dy);
            if (distance > 72) continue;

            const nearCursor =
              Math.hypot(a.x - cursor.x, a.y - cursor.y) < influenceRadius ||
              Math.hypot(b.x - cursor.x, b.y - cursor.y) < influenceRadius;
            if (!nearCursor) continue;

            context.beginPath();
            context.moveTo(a.x, a.y);
            context.lineTo(b.x, b.y);
            context.strokeStyle = accent || "rgb(13, 148, 136)";
            context.globalAlpha = (1 - distance / 72) * 0.14;
            context.lineWidth = 0.6;
            context.stroke();
          }
        }
      }

      for (const particle of particles) {
        context.beginPath();
        context.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
        context.fillStyle = accent || "rgb(13, 148, 136)";
        context.globalAlpha = particle.opacity;
        context.fill();
      }

      context.globalAlpha = 1;
      frameRef.current = requestAnimationFrame(draw);
    };

    resize();
    draw();

    canvas.addEventListener("pointermove", onPointerMove);
    canvas.addEventListener("pointerleave", onPointerLeave);

    const observer = new ResizeObserver(resize);
    observer.observe(canvas.parentElement!);

    return () => {
      cancelAnimationFrame(frameRef.current);
      canvas.removeEventListener("pointermove", onPointerMove);
      canvas.removeEventListener("pointerleave", onPointerLeave);
      observer.disconnect();
    };
  }, [canvasRef]);
}
