import { useCallback, useMemo, useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import { Button } from "@platform/ui";
import { downloadCanvasPng } from "@platform/export";
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

type Season = "spring" | "summer" | "autumn" | "winter";
type Rgb = [number, number, number];

interface Branch {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  depth: number;
}
interface Leaf {
  x: number;
  y: number;
  vx: number;
  vy: number;
  hue: number;
  life: number;
  falling: boolean;
  growing: boolean;
  removing: boolean;
  size: number;
}
interface Flake {
  x: number;
  y: number;
  vx: number;
  size: number;
}
interface Petal {
  x: number;
  y: number;
  vx: number;
  vy: number;
  hue: number;
  life: number;
  spin: number;
}

/** Art-directed seasonal skies — golden sunrise / emerald / ember / midnight. */
const SKY: Record<Season, [Rgb, Rgb]> = {
  spring: [
    [28, 36, 58],
    [248, 170, 198],
  ],
  summer: [
    [18, 42, 72],
    [110, 210, 180],
  ],
  autumn: [
    [48, 22, 36],
    [220, 110, 48],
  ],
  winter: [
    [16, 22, 40],
    [70, 88, 120],
  ],
};
const GROUND: Record<Season, Rgb> = {
  spring: [42, 78, 44],
  summer: [32, 88, 42],
  autumn: [78, 46, 22],
  winter: [210, 222, 236],
};

function lerpRgb(a: Rgb, b: Rgb, t: number): Rgb {
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
}
function rgbCss([r, g, b]: Rgb): string {
  return `rgb(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)})`;
}
function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2;
}

function growTree(seed: number, generations: number): Branch[] {
  const rand = mulberry32(seed);
  const branches: Branch[] = [];
  const queue: { x: number; y: number; angle: number; len: number; depth: number }[] = [
    { x: W * 0.5, y: H * 0.92, angle: -Math.PI / 2, len: H * 0.18, depth: 0 },
  ];
  while (queue.length) {
    const n = queue.shift()!;
    const x2 = n.x + Math.cos(n.angle) * n.len;
    const y2 = n.y + Math.sin(n.angle) * n.len;
    branches.push({ x1: n.x, y1: n.y, x2, y2, depth: n.depth });
    if (n.depth >= generations) continue;
    const forks = n.depth < 2 ? 3 : 2;
    for (let i = 0; i < forks; i++) {
      const spread = (i - (forks - 1) / 2) * (0.35 + rand() * 0.25);
      queue.push({
        x: x2,
        y: y2,
        angle: n.angle + spread + (rand() - 0.5) * 0.15,
        len: n.len * (0.62 + rand() * 0.12),
        depth: n.depth + 1,
      });
    }
  }
  return branches;
}

/** Seasonal canopy hues — blossom pink / emerald / ember gold / frost. */
function hueForSeason(seasonName: Season): number {
  return seasonName === "autumn"
    ? 28
    : seasonName === "spring"
      ? 330
      : seasonName === "winter"
        ? 200
        : 135;
}

export function LivingTreePage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const hudRef = useRef<HTMLDivElement>(null);
  const branchesRef = useRef<Branch[]>(growTree(7, 7));
  const leavesRef = useRef<Leaf[]>([]);
  const flakesRef = useRef<Flake[]>([]);
  const petalsRef = useRef<Petal[]>([]);
  const windRef = useRef(0);
  const mouseWind = useRef(0);
  const lightningRef = useRef(0);
  const growthRef = useRef(1);
  const seasonRef = useRef<Season>("spring");
  const [season, setSeason] = useState<Season>("spring");
  const seedRef = useRef(7);
  const morphRef = useRef({ from: "spring" as Season, to: "spring" as Season, t: 1 });
  const winterAlphaRef = useRef(0);
  const bloomRef = useRef<HTMLCanvasElement | null>(null);
  const immersiveRef = useRef(false);
  const lastPointerRef = useRef(0);

  const spawnLeaves = useCallback((seasonName: Season, morph: boolean) => {
    const tips = branchesRef.current.filter((b) => b.depth >= 5);
    const hueBase = hueForSeason(seasonName);
    const grow = seasonName !== "winter";
    // Thicker atmospheric canopy — more foliage volume.
    const perTip = seasonName === "summer" ? 5 : 4;
    const newLeaves: Leaf[] = grow
      ? tips.flatMap((t) =>
          Array.from({ length: perTip }, () => ({
            x: t.x2 + (Math.random() - 0.5) * 18,
            y: t.y2 + (Math.random() - 0.5) * 16,
            vx: 0,
            vy: 0,
            hue: hueBase + Math.random() * 28,
            life: morph ? 0 : 1,
            falling: false,
            growing: morph,
            removing: false,
            size: 3.2 + Math.random() * 3.8,
          })),
        )
      : [];
    if (morph) {
      for (const leaf of leavesRef.current) {
        leaf.removing = true;
        leaf.growing = false;
      }
      leavesRef.current = [...leavesRef.current, ...newLeaves];
    } else {
      leavesRef.current = newLeaves;
    }
    if (!flakesRef.current.length) {
      flakesRef.current = Array.from({ length: 140 }, () => ({
        x: Math.random() * W,
        y: Math.random() * H,
        vx: (Math.random() - 0.5) * 0.6,
        size: 1 + Math.random() * 2.5,
      }));
    }
  }, []);

  useMemo(() => {
    spawnLeaves("spring", false);
  }, [spawnLeaves]);

  const setSeasonBoth = useCallback(
    (s: Season) => {
      if (s === seasonRef.current) return;
      morphRef.current = { from: seasonRef.current, to: s, t: 0 };
      seasonRef.current = s;
      setSeason(s);
      spawnLeaves(s, true);
    },
    [spawnLeaves],
  );

  const reset = useCallback(() => {
    seedRef.current = (seedRef.current + 13) % 500;
    branchesRef.current = growTree(seedRef.current, 7);
    growthRef.current = 0.15;
    lightningRef.current = 0;
    morphRef.current = { from: seasonRef.current, to: seasonRef.current, t: 1 };
    spawnLeaves(seasonRef.current, false);
  }, [spawnLeaves]);

  const strike = useCallback(() => {
    lightningRef.current = 1;
  }, []);

  const spawnBlossomBurst = useCallback((x: number, y: number) => {
    const seasonName = seasonRef.current;
    const hueBase = hueForSeason(seasonName);
    for (let i = 0; i < 28; i++) {
      const a = Math.random() * Math.PI * 2;
      const speed = 1 + Math.random() * 3.2;
      petalsRef.current.push({
        x,
        y,
        vx: Math.cos(a) * speed,
        vy: Math.sin(a) * speed - 1.2,
        hue: hueBase + (Math.random() - 0.5) * 36,
        life: 1,
        spin: (Math.random() - 0.5) * 0.3,
      });
    }
    if (petalsRef.current.length > 320) {
      petalsRef.current.splice(0, petalsRef.current.length - 320);
    }
  }, []);

  const onImmersiveChange = useCallback((immersive: boolean) => {
    immersiveRef.current = immersive;
  }, []);

  useAnimationFrame((dt, elapsed) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const maxDpr = immersiveRef.current ? FLAGSHIP_IMMERSIVE_MAX_DPR : FLAGSHIP_MAX_DPR;
    const ctx = prepareCanvas(canvas, W, H, { maxDpr });
    const seasonName = seasonRef.current;

    // Ambient breathing wind when idle — canopy never freezes.
    const idle = performance.now() / 1000 - lastPointerRef.current > 1.5;
    const ambientWind = Math.sin(elapsed * 0.55) * 0.42 + Math.sin(elapsed * 0.19) * 0.18;
    windRef.current =
      ambientWind + (idle ? Math.sin(elapsed * 0.31) * 0.25 : 0) + mouseWind.current * 0.02;

    if (growthRef.current < 1) growthRef.current = Math.min(1, growthRef.current + 0.004);

    const morph = morphRef.current;
    if (morph.t < 1) morph.t = Math.min(1, morph.t + dt / 1.3);
    const morphT = easeInOutCubic(morph.t);
    const skyFrom = SKY[morph.from];
    const skyTo = SKY[morph.to];
    // Slow sky colour breathing even within a season.
    const breath = 0.5 + 0.5 * Math.sin(elapsed * 0.08);
    const skyTopC = lerpRgb(skyFrom[0], skyTo[0], morphT);
    const skyBotC = lerpRgb(skyFrom[1], skyTo[1], morphT);
    skyTopC[0] += breath * 4;
    skyBotC[1] += breath * 6;
    const groundC = lerpRgb(GROUND[morph.from], GROUND[morph.to], morphT);

    winterAlphaRef.current +=
      ((seasonName === "winter" ? 1 : 0) - winterAlphaRef.current) * Math.min(1, dt * 1.6);

    const bg = ctx.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, rgbCss(skyTopC));
    bg.addColorStop(1, rgbCss(skyBotC));
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    // Soft atmospheric haze behind canopy.
    const haze = ctx.createRadialGradient(W * 0.5, H * 0.35, 40, W * 0.5, H * 0.4, H * 0.55);
    const hazeColour =
      seasonName === "autumn"
        ? `rgba(255, 140, 60, ${0.08 + breath * 0.04})`
        : seasonName === "spring"
          ? `rgba(255, 180, 210, ${0.07 + breath * 0.03})`
          : seasonName === "summer"
            ? `rgba(80, 220, 160, ${0.06 + breath * 0.03})`
            : `rgba(160, 190, 230, ${0.08 + breath * 0.03})`;
    haze.addColorStop(0, hazeColour);
    haze.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = haze;
    ctx.fillRect(0, 0, W, H);

    if (lightningRef.current > 0) {
      ctx.fillStyle = `rgba(220, 230, 255, ${lightningRef.current * 0.55})`;
      ctx.fillRect(0, 0, W, H);
      lightningRef.current *= 0.88;
      if (lightningRef.current < 0.02) lightningRef.current = 0;
    }

    ctx.fillStyle = rgbCss(groundC);
    ctx.fillRect(0, H * 0.9, W, H * 0.1);

    const g = growthRef.current;
    const wind = windRef.current;
    for (const b of branchesRef.current) {
      if (b.depth / 7 > g) continue;
      const sway = wind * (10 + b.depth * 2.4) * (b.y2 / H);
      const x2 = b.x2 + sway;
      // Thicker, warmer bark — less Processing-sketch.
      const barkR = 52 + b.depth * 6;
      const barkG = 34 + b.depth * 4;
      const barkB = 22 + b.depth * 2;
      ctx.strokeStyle = `rgb(${barkR}, ${barkG}, ${barkB})`;
      ctx.lineWidth = Math.max(1.8, 14 - b.depth * 1.35);
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(b.x1 + sway * 0.4, b.y1);
      ctx.lineTo(x2, b.y2);
      ctx.stroke();
    }

    for (let i = leavesRef.current.length - 1; i >= 0; i--) {
      const leaf = leavesRef.current[i]!;
      if (leaf.growing) {
        leaf.life = Math.min(1, leaf.life + dt * 1.6);
        if (leaf.life >= 1) leaf.growing = false;
      }
      if (seasonName === "autumn" && !leaf.removing && Math.random() < 0.002) leaf.falling = true;
      if (leaf.falling || leaf.removing) {
        leaf.vx += wind * 0.3;
        leaf.vy += 0.05;
        leaf.x += leaf.vx;
        leaf.y += leaf.vy;
        leaf.life -= leaf.removing ? 0.02 : 0.002;
      } else {
        // Soft canopy sway — atmospheric volume.
        leaf.x += wind * 0.22 + Math.sin(elapsed * 1.2 + leaf.y * 0.02) * 0.08;
        leaf.y += Math.sin(elapsed * 0.9 + leaf.x * 0.015) * 0.06;
      }
      if (leaf.life <= 0) {
        leavesRef.current.splice(i, 1);
        continue;
      }
      const scale = (leaf.growing ? leaf.life : 1) * leaf.size;
      const sat = seasonName === "spring" ? 72 : seasonName === "autumn" ? 82 : 68;
      const lit = seasonName === "spring" ? 72 : seasonName === "autumn" ? 52 : 42;
      ctx.fillStyle = `hsla(${leaf.hue}, ${sat}%, ${lit}%, ${leaf.life * 0.92})`;
      ctx.beginPath();
      ctx.ellipse(
        leaf.x,
        leaf.y,
        scale * 0.9,
        scale * 0.55,
        leaf.x * 0.01 + wind * 0.15,
        0,
        Math.PI * 2,
      );
      ctx.fill();
    }

    const wAlpha = winterAlphaRef.current;
    if (wAlpha > 0.01) {
      ctx.globalAlpha = wAlpha;
      for (const f of flakesRef.current) {
        f.x += f.vx + wind * 2;
        f.y += 0.8 + f.size * 0.3;
        if (f.y > H) {
          f.y = 0;
          f.x = Math.random() * W;
        }
        if (f.x < 0) f.x = W;
        if (f.x > W) f.x = 0;
        ctx.fillStyle = "rgba(255,255,255,0.85)";
        ctx.beginPath();
        ctx.arc(f.x, f.y, f.size, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    }

    ctx.globalCompositeOperation = "lighter";
    for (let i = petalsRef.current.length - 1; i >= 0; i--) {
      const p = petalsRef.current[i]!;
      p.life -= dt * 0.6;
      if (p.life <= 0) {
        petalsRef.current.splice(i, 1);
        continue;
      }
      p.vx *= 0.97;
      p.vy = p.vy * 0.97 + 0.06;
      p.x += p.vx;
      p.y += p.vy;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.life * p.spin * 10);
      ctx.fillStyle = `hsla(${p.hue}, 85%, 72%, ${p.life})`;
      ctx.beginPath();
      ctx.ellipse(0, 0, 5, 2.8, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
    ctx.globalCompositeOperation = "source-over";

    if (lightningRef.current > 0.3) {
      ctx.strokeStyle = `rgba(220, 240, 255, ${lightningRef.current})`;
      ctx.lineWidth = 2.5;
      ctx.shadowColor = "#aef";
      ctx.shadowBlur = 22;
      let lx = W * (0.3 + Math.random() * 0.4);
      let ly = 0;
      ctx.beginPath();
      ctx.moveTo(lx, ly);
      for (let i = 0; i < 8; i++) {
        lx += (Math.random() - 0.5) * 60;
        ly += H * 0.1;
        ctx.lineTo(lx, ly);
      }
      ctx.stroke();
      ctx.shadowBlur = 0;
    }

    let bloom = bloomRef.current;
    if (!bloom) {
      bloom = document.createElement("canvas");
      bloom.width = 300;
      bloom.height = Math.round((300 * H) / W);
      bloomRef.current = bloom;
    }
    const bctx = bloom.getContext("2d");
    if (bctx) {
      bctx.clearRect(0, 0, bloom.width, bloom.height);
      bctx.drawImage(canvas, 0, 0, bloom.width, bloom.height);
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      ctx.globalAlpha = 0.28;
      ctx.filter = "blur(6px)";
      ctx.drawImage(bloom, 0, 0, W, H);
      ctx.filter = "none";
      ctx.restore();
    }

    if (hudRef.current) {
      hudRef.current.textContent = `${seasonName} · growth ${(g * 100).toFixed(0)}% · wind ${wind.toFixed(2)} · move mouse for wind, click for blossoms, L for lightning`;
    }
  });

  const onPointerMove = useCallback((e: ReactPointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    lastPointerRef.current = performance.now() / 1000;
    const p = toCanvasPoint(canvas, e.clientX, e.clientY, W, H);
    mouseWind.current = (p.x / W - 0.5) * 8;
  }, []);

  const onPointerDown = useCallback(
    (e: ReactPointerEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      lastPointerRef.current = performance.now() / 1000;
      const p = toCanvasPoint(canvas, e.clientX, e.clientY, W, H);
      spawnBlossomBurst(p.x, p.y);
    },
    [spawnBlossomBurst],
  );

  useShortcuts({
    r: reset,
    l: strike,
    "1": () => setSeasonBoth("spring"),
    "2": () => setSeasonBoth("summer"),
    "3": () => setSeasonBoth("autumn"),
    "4": () => setSeasonBoth("winter"),
  });

  const handleExport = useCallback(() => {
    const c = canvasRef.current;
    if (c) downloadCanvasPng("living-tree.png", c);
  }, []);

  const shortcuts = useMemo(
    () => [
      { keys: "Move mouse", label: "Wind" },
      { keys: "Click", label: "Burst of blossoms" },
      { keys: "1–4", label: "Spring / Summer / Autumn / Winter (morphs sky)" },
      { keys: "L", label: "Lightning strike" },
      { keys: "R", label: "Regrow tree" },
    ],
    [],
  );

  return (
    <FlagshipShell
      title="Living Tree"
      tagline="An atmospheric canopy with seasonal colour identity — wind, blossoms, snow, and lightning."
      demoPath="/living-tree"
      shortcuts={shortcuts}
      onReset={reset}
      onExport={handleExport}
      onImmersiveChange={onImmersiveChange}
      statusBar={<div ref={hudRef} />}
      toolbarExtra={
        <>
          {(["spring", "summer", "autumn", "winter"] as Season[]).map((s) => (
            <Button
              key={s}
              variant="secondary"
              size="sm"
              onClick={() => setSeasonBoth(s)}
              aria-pressed={season === s}
            >
              {s}
            </Button>
          ))}
          <Button variant="secondary" size="sm" onClick={strike}>
            Lightning
          </Button>
        </>
      }
      about={
        <>
          <p>
            Branches grow from a recursive fork into a thick atmospheric canopy — not thin
            Processing-sketch lines. Each season owns a palette: spring blossom, summer emerald,
            autumn ember gold, winter midnight frost. Ambient breathing wind keeps the tree alive
            when idle; mouse wind sways the limbs, clicking bursts blossoms, lightning whites the
            sky.
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
        aria-label="Living tree canvas"
        onPointerMove={onPointerMove}
        onPointerDown={onPointerDown}
      />
    </FlagshipShell>
  );
}
