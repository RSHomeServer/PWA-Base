import type { ParamValues } from "@platform/controls";
import type { Exhibit } from "../types.js";
import { fadeCanvas, paramsKey } from "../lib/simulation.js";

interface PendulumState {
  key: string;
  theta1: number;
  omega1: number;
  theta2: number;
  omega2: number;
}

const stateMap = new WeakMap<CanvasRenderingContext2D, PendulumState>();

function getState(ctx: CanvasRenderingContext2D, values: ParamValues): PendulumState {
  const key = paramsKey(values, [
    "length1",
    "length2",
    "mass1",
    "mass2",
    "gravity",
    "angle1",
    "angle2",
  ]);
  const existing = stateMap.get(ctx);
  if (existing && existing.key === key) {
    return existing;
  }
  const state: PendulumState = {
    key,
    theta1: (Number(values.angle1) * Math.PI) / 180,
    omega1: 0,
    theta2: (Number(values.angle2) * Math.PI) / 180,
    omega2: 0,
  };
  stateMap.set(ctx, state);
  return state;
}

function stepPendulum(state: PendulumState, values: ParamValues, dt: number, steps: number): void {
  const g = Number(values.gravity);
  const m1 = Number(values.mass1);
  const m2 = Number(values.mass2);
  const l1 = Number(values.length1);
  const l2 = Number(values.length2);

  for (let s = 0; s < steps; s++) {
    const { theta1, theta2, omega1, omega2 } = state;
    const delta = theta2 - theta1;
    const sinD = Math.sin(delta);
    const cosD = Math.cos(delta);
    const sin1 = Math.sin(theta1);

    const den1 = l1 * (2 * m1 + m2 - m2 * Math.cos(2 * delta));
    const den2 = l2 * (2 * m1 + m2 - m2 * Math.cos(2 * delta));

    const num1 =
      -g * (2 * m1 + m2) * sin1 -
      m2 * g * Math.sin(theta1 - 2 * theta2) -
      2 * sinD * m2 * (omega2 * omega2 * l2 + omega1 * omega1 * l1 * cosD);
    const num2 =
      2 *
      sinD *
      (omega1 * omega1 * l1 * (m1 + m2) +
        g * (m1 + m2) * Math.cos(theta1) +
        omega2 * omega2 * l2 * m2 * cosD);

    const alpha1 = num1 / den1;
    const alpha2 = num2 / den2;

    state.omega1 += alpha1 * dt;
    state.omega2 += alpha2 * dt;
    state.theta1 += state.omega1 * dt;
    state.theta2 += state.omega2 * dt;
  }
}

export const doublePendulum: Exhibit = {
  id: "double-pendulum",
  path: "/double-pendulum",
  title: "Double Pendulum",
  category: "Systems",
  summary:
    "A chaotic double pendulum leaves a glowing trail as tiny differences in motion explode over time.",
  maths:
    "The double pendulum is governed by coupled nonlinear ODEs from the Lagrangian L = T − V. " +
    "With two angular coordinates θ₁, θ₂, the system is chaotic for most initial conditions — " +
    "nearby trajectories diverge exponentially despite deterministic equations.",
  animated: true,
  width: 960,
  height: 720,
  exportFilename: "double-pendulum.png",
  params: [
    { id: "length1", label: "Arm 1 length", type: "number", min: 60, max: 180, step: 5 },
    { id: "length2", label: "Arm 2 length", type: "number", min: 40, max: 160, step: 5 },
    { id: "mass1", label: "Bob 1 mass", type: "number", min: 0.5, max: 3, step: 0.1 },
    { id: "mass2", label: "Bob 2 mass", type: "number", min: 0.5, max: 3, step: 0.1 },
    { id: "gravity", label: "Gravity", type: "number", min: 4, max: 20, step: 0.5 },
    { id: "fade", label: "Trail fade", type: "number", min: 0.02, max: 0.25, step: 0.01 },
    { id: "angle1", label: "Start angle 1°", type: "number", min: 60, max: 179, step: 1 },
    { id: "angle2", label: "Start angle 2°", type: "number", min: 60, max: 179, step: 1 },
    { id: "steps", label: "Steps per frame", type: "number", min: 2, max: 16, step: 1 },
  ],
  defaults: {
    length1: 120,
    length2: 110,
    mass1: 1.2,
    mass2: 1,
    gravity: 9.8,
    fade: 0.06,
    angle1: 170,
    angle2: 170,
    steps: 8,
  },
  draw(ctx, width, height, values, time) {
    const l1 = Number(values.length1);
    const l2 = Number(values.length2);
    const m1 = Number(values.mass1);
    const m2 = Number(values.mass2);
    const fade = Number(values.fade);
    const steps = Number(values.steps);

    const state = getState(ctx, values);
    stepPendulum(state, values, 0.018, steps);

    fadeCanvas(ctx, width, height, fade, "rgb(8, 6, 16)");

    const pivotX = width * 0.5;
    const pivotY = height * 0.28;
    const scale = Math.min(width, height) / 420;

    const x1 = pivotX + l1 * scale * Math.sin(state.theta1);
    const y1 = pivotY + l1 * scale * Math.cos(state.theta1);
    const x2 = x1 + l2 * scale * Math.sin(state.theta2);
    const y2 = y1 + l2 * scale * Math.cos(state.theta2);

    const speed = Math.hypot(state.omega1, state.omega2);
    const hue = 200 + speed * 18 + Math.sin(time * 0.5) * 20;

    ctx.lineWidth = 2.5;
    ctx.strokeStyle = `hsla(${hue}, 70%, 55%, 0.45)`;
    ctx.beginPath();
    ctx.moveTo(pivotX, pivotY);
    ctx.lineTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();

    const bob1R = 6 + m1 * 3;
    const bob2R = 6 + m2 * 3;

    ctx.fillStyle = `hsla(${hue + 30}, 85%, 65%, 0.9)`;
    ctx.beginPath();
    ctx.arc(x1, y1, bob1R, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = `hsla(${hue + 80}, 90%, 70%, 0.95)`;
    ctx.shadowColor = `hsla(${hue + 80}, 100%, 60%, 0.8)`;
    ctx.shadowBlur = 14;
    ctx.beginPath();
    ctx.arc(x2, y2, bob2R, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    ctx.fillStyle = "rgba(220, 220, 240, 0.9)";
    ctx.beginPath();
    ctx.arc(pivotX, pivotY, 5, 0, Math.PI * 2);
    ctx.fill();
  },
};
