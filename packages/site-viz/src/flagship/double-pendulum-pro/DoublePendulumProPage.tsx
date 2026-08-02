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
import { bobPositions, stepPendulum, totalEnergy } from "./physics.js";
import type { PendulumParams, PendulumState } from "./physics.js";
import styles from "./DoublePendulumProPage.module.css";

const WIDTH = FLAGSHIP_CANVAS_WIDTH;
const HEIGHT = FLAGSHIP_CANVAS_HEIGHT;
const PIVOT_X = WIDTH * 0.5;
const PIVOT_Y = HEIGHT * 0.2;
const SCALE = Math.min(WIDTH, HEIGHT) / 420;
const SPEEDS = [1, 0.35, 0.1];
const GHOST_EPSILON = 0.0025;
const RESET_ANIM_SECONDS = 0.7;
const HISTORY_WINDOW = 3.5;

const DEFAULT_PARAMS: PendulumParams = {
  length1: 120,
  length2: 110,
  mass1: 1.2,
  mass2: 1,
  gravity: 9.8,
};

function initialState(): PendulumState {
  return { theta1: (150 * Math.PI) / 180, omega1: 0, theta2: (150 * Math.PI) / 180, omega2: 0 };
}

/** Shortest signed angular distance from `from` to `to`, wrapped into [-pi, pi]. */
function angleDelta(from: number, to: number): number {
  let d = (to - from) % (Math.PI * 2);
  if (d > Math.PI) d -= Math.PI * 2;
  if (d < -Math.PI) d += Math.PI * 2;
  return d;
}

function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2;
}

interface HistorySample {
  t: number;
  theta1: number;
  theta2: number;
}

export function DoublePendulumProPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const energyCanvasRef = useRef<HTMLCanvasElement>(null);
  const hudRef = useRef<HTMLDivElement>(null);

  const paramsRef = useRef<PendulumParams>({ ...DEFAULT_PARAMS });
  const stateRef = useRef<PendulumState>(initialState());
  const ghostStateRef = useRef<PendulumState>({
    ...initialState(),
    theta1: initialState().theta1 + GHOST_EPSILON,
  });
  const energyHistoryRef = useRef<Float32Array>(new Float32Array(240).fill(NaN));
  const energyPtrRef = useRef(0);
  const clearTrailRef = useRef(true);
  const dragRef = useRef<{ bob: 1 | 2; pointerId: number } | null>(null);
  const resetAnimRef = useRef<{
    from: PendulumState;
    to: PendulumState;
    t: number;
  } | null>(null);
  const historyRef = useRef<HistorySample[]>([]);
  const elapsedRef = useRef(0);
  const replayRef = useRef(false);
  const replayPhaseRef = useRef(0);

  const [paused, setPaused] = useState(false);
  const [speedIdx, setSpeedIdx] = useState(0);
  const [ghostOn, setGhostOn] = useState(true);
  const [replaying, setReplaying] = useState(false);

  const speed = SPEEDS[speedIdx]!;

  /** Eases the bobs back to their resting pose along the shortest angular path. */
  const smoothResetPositions = useCallback(() => {
    const target = initialState();
    resetAnimRef.current = { from: { ...stateRef.current }, to: target, t: 0 };
    ghostStateRef.current = { ...target, theta1: target.theta1 + GHOST_EPSILON };
    clearTrailRef.current = true;
    replayRef.current = false;
    setReplaying(false);
  }, []);

  const reset = useCallback(() => {
    paramsRef.current = { ...DEFAULT_PARAMS };
    energyHistoryRef.current.fill(NaN);
    energyPtrRef.current = 0;
    historyRef.current = [];
    replayRef.current = false;
    setReplaying(false);
    setPaused(false);
    setSpeedIdx(0);
    smoothResetPositions();
  }, [smoothResetPositions]);

  const clearTrail = useCallback(() => {
    clearTrailRef.current = true;
  }, []);

  const togglePause = useCallback(() => setPaused((v) => !v), []);
  const cycleSpeed = useCallback(() => setSpeedIdx((i) => (i + 1) % SPEEDS.length), []);
  const toggleGhost = useCallback(() => setGhostOn((v) => !v), []);
  const adjustGravity = useCallback((delta: number) => {
    paramsRef.current.gravity = Math.max(1, Math.min(30, paramsRef.current.gravity + delta));
  }, []);

  const toggleReplay = useCallback(() => {
    if (historyRef.current.length < 8) return;
    replayRef.current = !replayRef.current;
    replayPhaseRef.current = 0;
    setReplaying(replayRef.current);
    if (replayRef.current) clearTrailRef.current = true;
  }, []);

  useAnimationFrame((dt) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = prepareCanvas(canvas, WIDTH, HEIGHT, { maxDpr: 2 });
    const params = paramsRef.current;
    const state = stateRef.current;
    const ghost = ghostStateRef.current;
    const dragging = dragRef.current !== null;
    elapsedRef.current += dt;

    // Smooth reset animation — lerp angles along shortest path.
    const anim = resetAnimRef.current;
    if (anim) {
      anim.t = Math.min(1, anim.t + dt / RESET_ANIM_SECONDS);
      const e = easeInOutCubic(anim.t);
      state.theta1 = anim.from.theta1 + angleDelta(anim.from.theta1, anim.to.theta1) * e;
      state.theta2 = anim.from.theta2 + angleDelta(anim.from.theta2, anim.to.theta2) * e;
      state.omega1 = 0;
      state.omega2 = 0;
      if (anim.t >= 1) {
        state.theta1 = anim.to.theta1;
        state.theta2 = anim.to.theta2;
        resetAnimRef.current = null;
      }
    } else if (!paused && !dragging && !replayRef.current) {
      const subSteps = 8;
      const subDt = (dt * speed) / subSteps;
      for (let i = 0; i < subSteps; i++) {
        stepPendulum(state, params, subDt);
        if (ghostOn) stepPendulum(ghost, params, subDt);
      }
      // Record path history for ghost playback.
      historyRef.current.push({
        t: elapsedRef.current,
        theta1: state.theta1,
        theta2: state.theta2,
      });
      const cutoff = elapsedRef.current - HISTORY_WINDOW;
      while (historyRef.current.length && historyRef.current[0]!.t < cutoff) {
        historyRef.current.shift();
      }
    }

    if (clearTrailRef.current) {
      ctx.fillStyle = "rgb(6, 7, 15)";
      ctx.fillRect(0, 0, WIDTH, HEIGHT);
      clearTrailRef.current = false;
    } else {
      fadeCanvas(ctx, WIDTH, HEIGHT, dragging || anim ? 0.35 : 0.055, "rgb(6, 7, 15)");
    }

    // Soft vignette atmosphere under the trail.
    const vignette = ctx.createRadialGradient(
      PIVOT_X,
      PIVOT_Y + 80,
      40,
      PIVOT_X,
      HEIGHT * 0.55,
      HEIGHT * 0.7,
    );
    vignette.addColorStop(0, "rgba(12, 40, 48, 0.04)");
    vignette.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    // Ghost playback: scrub the recorded trail as a fading afterimage ribbon.
    if (replayRef.current && historyRef.current.length > 2) {
      replayPhaseRef.current = (replayPhaseRef.current + dt * 0.35) % 1;
      const hist = historyRef.current;
      const n = hist.length;
      const head = Math.floor(replayPhaseRef.current * (n - 1));
      ctx.lineWidth = 2;
      for (let i = Math.max(0, head - 40); i < head; i++) {
        const a = hist[i]!;
        const b = hist[i + 1];
        if (!b) continue;
        const alpha = ((i - (head - 40)) / 40) * 0.55;
        const pa = bobPositions(
          { theta1: a.theta1, theta2: a.theta2, omega1: 0, omega2: 0 },
          params,
          PIVOT_X,
          PIVOT_Y,
          SCALE,
        );
        const pb = bobPositions(
          { theta1: b.theta1, theta2: b.theta2, omega1: 0, omega2: 0 },
          params,
          PIVOT_X,
          PIVOT_Y,
          SCALE,
        );
        ctx.strokeStyle = `hsla(175, 80%, 65%, ${alpha})`;
        ctx.beginPath();
        ctx.moveTo(pa.x2, pa.y2);
        ctx.lineTo(pb.x2, pb.y2);
        ctx.stroke();
      }
      const tip = hist[head]!;
      const tipPos = bobPositions(
        { theta1: tip.theta1, theta2: tip.theta2, omega1: 0, omega2: 0 },
        params,
        PIVOT_X,
        PIVOT_Y,
        SCALE,
      );
      ctx.strokeStyle = "hsla(175, 90%, 70%, 0.45)";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(PIVOT_X, PIVOT_Y);
      ctx.lineTo(tipPos.x1, tipPos.y1);
      ctx.lineTo(tipPos.x2, tipPos.y2);
      ctx.stroke();
      ctx.fillStyle = "hsla(175, 95%, 70%, 0.85)";
      ctx.shadowColor = "hsla(175, 100%, 60%, 0.8)";
      ctx.shadowBlur = 14;
      ctx.beginPath();
      ctx.arc(tipPos.x2, tipPos.y2, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    }

    const pos = bobPositions(state, params, PIVOT_X, PIVOT_Y, SCALE);
    const speedMag = Math.hypot(state.omega1, state.omega2);
    const hue = 175 + speedMag * 14;

    if (ghostOn && !replayRef.current) {
      const gpos = bobPositions(ghost, params, PIVOT_X, PIVOT_Y, SCALE);
      ctx.strokeStyle = "hsla(20, 70%, 60%, 0.35)";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(PIVOT_X, PIVOT_Y);
      ctx.lineTo(gpos.x1, gpos.y1);
      ctx.lineTo(gpos.x2, gpos.y2);
      ctx.stroke();
      ctx.fillStyle = "hsla(20, 80%, 60%, 0.5)";
      ctx.beginPath();
      ctx.arc(gpos.x2, gpos.y2, 5, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.strokeStyle = `hsla(${hue}, 70%, 60%, 0.5)`;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(PIVOT_X, PIVOT_Y);
    ctx.lineTo(pos.x1, pos.y1);
    ctx.lineTo(pos.x2, pos.y2);
    ctx.stroke();

    const bob1R = 7 + params.mass1 * 3;
    const bob2R = 7 + params.mass2 * 3;

    ctx.fillStyle = `hsla(${hue + 20}, 85%, 65%, 0.9)`;
    ctx.beginPath();
    ctx.arc(pos.x1, pos.y1, bob1R, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = `hsla(${hue + 50}, 90%, 70%, 0.95)`;
    ctx.shadowColor = `hsla(${hue + 50}, 100%, 60%, 0.85)`;
    ctx.shadowBlur = 18;
    ctx.beginPath();
    ctx.arc(pos.x2, pos.y2, bob2R, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    ctx.fillStyle = "rgba(220, 224, 240, 0.9)";
    ctx.beginPath();
    ctx.arc(PIVOT_X, PIVOT_Y, 5, 0, Math.PI * 2);
    ctx.fill();

    if (dragging) {
      ctx.strokeStyle = "rgba(255, 255, 255, 0.5)";
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.arc(
        dragRef.current!.bob === 1 ? pos.x1 : pos.x2,
        dragRef.current!.bob === 1 ? pos.y1 : pos.y2,
        16,
        0,
        Math.PI * 2,
      );
      ctx.stroke();
      ctx.setLineDash([]);
    }

    const energy = totalEnergy(state, params);
    const hist = energyHistoryRef.current;
    hist[energyPtrRef.current % hist.length] = energy;
    energyPtrRef.current += 1;

    const ec = energyCanvasRef.current;
    if (ec) {
      const ectx = prepareCanvas(ec, 220, 64, { maxDpr: 2 });
      ectx.clearRect(0, 0, 220, 64);
      let min = Infinity;
      let max = -Infinity;
      for (const v of hist) {
        if (Number.isFinite(v)) {
          min = Math.min(min, v);
          max = Math.max(max, v);
        }
      }
      if (Number.isFinite(min) && max - min < 1e-6) max = min + 1;
      ectx.strokeStyle = "rgba(120, 220, 200, 0.9)";
      ectx.lineWidth = 1.5;
      ectx.beginPath();
      let first = true;
      for (let i = 0; i < hist.length; i++) {
        const idx = (energyPtrRef.current + i) % hist.length;
        const v = hist[idx]!;
        if (!Number.isFinite(v)) continue;
        const x = (i / hist.length) * 220;
        const y = 64 - ((v - min) / (max - min || 1)) * 56 - 4;
        if (first) {
          ectx.moveTo(x, y);
          first = false;
        } else {
          ectx.lineTo(x, y);
        }
      }
      ectx.stroke();
    }

    if (hudRef.current) {
      const bits = [
        `energy ${energy.toFixed(1)}`,
        `ω₁ ${state.omega1.toFixed(2)} ω₂ ${state.omega2.toFixed(2)}`,
        `${speed}×`,
      ];
      if (paused) bits.push("paused");
      if (anim) bits.push("easing home");
      if (replaying) bits.push("ghost playback");
      hudRef.current.textContent = bits.join("  ·  ");
    }
  });

  const dragBobHitTest = useCallback((px: number, py: number): 1 | 2 | null => {
    const pos = bobPositions(stateRef.current, paramsRef.current, PIVOT_X, PIVOT_Y, SCALE);
    const d2 = Math.hypot(px - pos.x2, py - pos.y2);
    const d1 = Math.hypot(px - pos.x1, py - pos.y1);
    if (d2 < 28) return 2;
    if (d1 < 28) return 1;
    return null;
  }, []);

  const handlePointerDown = useCallback(
    (e: ReactPointerEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const p = toCanvasPoint(canvas, e.clientX, e.clientY, WIDTH, HEIGHT);
      const bob = dragBobHitTest(p.x, p.y);
      if (bob) {
        canvas.setPointerCapture(e.pointerId);
        dragRef.current = { bob, pointerId: e.pointerId };
        resetAnimRef.current = null;
      } else {
        // Click empty canvas → smooth ease back to home pose.
        smoothResetPositions();
      }
    },
    [dragBobHitTest, smoothResetPositions],
  );

  const handlePointerMove = useCallback((e: ReactPointerEvent<HTMLCanvasElement>) => {
    const drag = dragRef.current;
    const canvas = canvasRef.current;
    if (!drag || !canvas) return;
    const p = toCanvasPoint(canvas, e.clientX, e.clientY, WIDTH, HEIGHT);
    const state = stateRef.current;
    if (drag.bob === 1) {
      state.theta1 = Math.atan2(p.x - PIVOT_X, p.y - PIVOT_Y);
      state.omega1 = 0;
    } else {
      const params = paramsRef.current;
      const x1 = PIVOT_X + params.length1 * SCALE * Math.sin(state.theta1);
      const y1 = PIVOT_Y + params.length1 * SCALE * Math.cos(state.theta1);
      state.theta2 = Math.atan2(p.x - x1, p.y - y1);
      state.omega2 = 0;
    }
  }, []);

  const handlePointerUp = useCallback((e: ReactPointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (canvas && dragRef.current) canvas.releasePointerCapture(e.pointerId);
    dragRef.current = null;
  }, []);

  useShortcuts({
    " ": togglePause,
    s: cycleSpeed,
    g: toggleGhost,
    c: clearTrail,
    r: reset,
    h: toggleReplay,
    "+": () => adjustGravity(1),
    "=": () => adjustGravity(1),
    "-": () => adjustGravity(-1),
  });

  const handleExport = useCallback(() => {
    const canvas = canvasRef.current;
    if (canvas) downloadCanvasPng("double-pendulum-pro.png", canvas);
  }, []);

  const shortcuts = useMemo(
    () => [
      { keys: "Drag a bob", label: "Reposition & release to swing" },
      { keys: "Click empty", label: "Smooth ease back to home pose" },
      { keys: "H", label: "Ghost playback of recent path" },
      { keys: "Space", label: "Pause / resume" },
      { keys: "S", label: "Cycle slow-motion speed" },
      { keys: "G", label: "Toggle chaos twin" },
      { keys: "C", label: "Clear trail" },
      { keys: "+ / -", label: "Adjust gravity" },
      { keys: "R", label: "Full reset" },
    ],
    [],
  );

  return (
    <FlagshipShell
      title="Double Pendulum Pro"
      tagline="A chaotic double pendulum with glowing trails, ghost playback of its own past, and a smooth ease-home reset."
      demoPath="/double-pendulum-pro"
      shortcuts={shortcuts}
      onReset={reset}
      onExport={handleExport}
      statusBar={<div ref={hudRef} className={styles.hud} />}
      toolbarExtra={
        <>
          <Button variant="secondary" size="sm" onClick={togglePause} aria-pressed={paused}>
            {paused ? "▶ Resume" : "⏸ Pause"}
          </Button>
          <Button variant="secondary" size="sm" onClick={cycleSpeed}>
            🐢 {speed}× speed
          </Button>
          <Button variant="secondary" size="sm" onClick={toggleGhost} aria-pressed={ghostOn}>
            {ghostOn ? "👻 Ghost on" : "👻 Ghost off"}
          </Button>
          <Button variant="secondary" size="sm" onClick={toggleReplay} aria-pressed={replaying}>
            {replaying ? "▶ Playback" : "⟲ Playback"}
          </Button>
          <Button variant="secondary" size="sm" onClick={clearTrail}>
            Clear trail
          </Button>
        </>
      }
      overlay={
        <div className={styles.energyPanel}>
          <span className={styles.energyLabel}>Total energy</span>
          <canvas ref={energyCanvasRef} width={220} height={64} className={styles.energyCanvas} />
        </div>
      }
      about={
        <>
          <p>
            Two rigid arms joined by frictionless pivots form one of the simplest systems that is
            provably chaotic: nudge the starting angle by a hair and the two trajectories — the
            bright pendulum and its dim <strong>ghost twin</strong>, offset by just 0.0025 radians —
            diverge completely within seconds.
          </p>
          <p>
            Grab either bob and drag it to pose the pendulum, then let go to watch it swing. Click
            empty canvas to ease home smoothly. Press H to scrub a teal ghost playback of the last
            few seconds of motion.
          </p>
        </>
      }
    >
      <canvas
        ref={canvasRef}
        className={canvasStyles.canvas}
        width={WIDTH}
        height={HEIGHT}
        style={{
          aspectRatio: `${WIDTH} / ${HEIGHT}`,
          maxWidth: "100%",
          maxHeight: "100%",
          cursor: "grab",
        }}
        aria-label="Double pendulum canvas"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      />
    </FlagshipShell>
  );
}
