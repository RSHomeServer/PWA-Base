import type { ParamValues } from "@platform/controls";
import type { Exhibit } from "../types.js";
import { paramsKey } from "../lib/simulation.js";

interface Rule30State {
  key: string;
  cols: number;
  rows: number;
  cells: Uint8Array;
  row: number;
}

const stateMap = new WeakMap<CanvasRenderingContext2D, Rule30State>();

function rule30(left: number, center: number, right: number): number {
  const pattern = (left << 2) | (center << 1) | right;
  return (30 >> pattern) & 1;
}

function getState(
  ctx: CanvasRenderingContext2D,
  values: ParamValues,
  width: number,
  height: number,
): Rule30State {
  const cellSize = Number(values.cellSize);
  const cols = Math.floor(width / cellSize);
  const rows = Math.floor(height / cellSize);
  const key = paramsKey(values, ["cellSize"]);
  const existing = stateMap.get(ctx);
  if (existing && existing.key === key && existing.cols === cols && existing.rows === rows) {
    return existing;
  }

  const cells = new Uint8Array(cols * rows);
  cells[Math.floor(cols / 2)] = 1;
  const state: Rule30State = { key, cols, rows, cells, row: 0 };
  stateMap.set(ctx, state);
  return state;
}

function advanceRow(state: Rule30State): void {
  if (state.row >= state.rows - 1) {
    return;
  }
  const y = state.row;
  const nextY = y + 1;
  for (let x = 0; x < state.cols; x++) {
    const left = state.cells[y * state.cols + ((x - 1 + state.cols) % state.cols)]!;
    const center = state.cells[y * state.cols + x]!;
    const right = state.cells[y * state.cols + ((x + 1) % state.cols)]!;
    state.cells[nextY * state.cols + x] = rule30(left, center, right);
  }
  state.row = nextY;
}

export const rule30Exhibit: Exhibit = {
  id: "rule-30",
  path: "/rule-30",
  title: "Rule 30 Automaton",
  category: "Simulation",
  summary:
    "A single-cell seed evolves under Wolfram's Rule 30 into a chaotic, triangle-shaped pattern.",
  maths:
    "Elementary CA Rule 30 maps three neighbour bits to the next centre cell via lookup table 30. " +
    "Starting from one live cell, each row is computed from the row above. Rule 30 is famous for " +
    "pseudo-random central columns — used as a random number generator in Mathematica.",
  animated: true,
  params: [
    {
      id: "cellSize",
      type: "number",
      label: "Cell size",
      min: 2,
      max: 10,
      step: 1,
    },
    {
      id: "speed",
      type: "number",
      label: "Rows per frame",
      min: 1,
      max: 8,
      step: 1,
    },
  ],
  defaults: {
    cellSize: 4,
    speed: 2,
  },
  exportFilename: "rule-30.png",
  draw(ctx, width, height, values) {
    const cellSize = Number(values.cellSize);
    const speed = Number(values.speed);
    const state = getState(ctx, values, width, height);

    for (let s = 0; s < speed; s++) {
      advanceRow(state);
    }

    ctx.fillStyle = "rgb(8, 8, 16)";
    ctx.fillRect(0, 0, width, height);

    for (let y = 0; y <= state.row; y++) {
      for (let x = 0; x < state.cols; x++) {
        if (!state.cells[y * state.cols + x]) {
          continue;
        }
        const t = y / Math.max(1, state.rows);
        ctx.fillStyle = `hsl(${210 + t * 60}, 70%, ${35 + t * 30}%)`;
        ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
      }
    }
  },
};
