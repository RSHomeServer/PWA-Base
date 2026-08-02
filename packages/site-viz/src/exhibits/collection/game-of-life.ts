import type { ParamValues } from "@platform/controls";
import type { Exhibit } from "../types.js";
import { paramsKey } from "../lib/simulation.js";

interface LifeState {
  key: string;
  cols: number;
  rows: number;
  grid: Uint8Array;
  next: Uint8Array;
  generation: number;
}

const stateMap = new WeakMap<CanvasRenderingContext2D, LifeState>();

function createGrid(cols: number, rows: number): Uint8Array {
  const grid = new Uint8Array(cols * rows);
  for (let i = 0; i < grid.length; i++) {
    grid[i] = Math.random() < 0.28 ? 1 : 0;
  }
  return grid;
}

function getState(
  ctx: CanvasRenderingContext2D,
  values: ParamValues,
  width: number,
  height: number,
): LifeState {
  const cellSize = Number(values.cellSize);
  const cols = Math.floor(width / cellSize);
  const rows = Math.floor(height / cellSize);
  const key = paramsKey(values, ["cellSize", "speed"]);
  const existing = stateMap.get(ctx);
  if (existing && existing.key === key && existing.cols === cols && existing.rows === rows) {
    return existing;
  }

  const grid = createGrid(cols, rows);
  const state: LifeState = {
    key,
    cols,
    rows,
    grid,
    next: new Uint8Array(grid.length),
    generation: 0,
  };
  stateMap.set(ctx, state);
  return state;
}

function stepLife(state: LifeState): void {
  const { cols, rows, grid, next } = state;
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      let neighbors = 0;
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          if (dx === 0 && dy === 0) {
            continue;
          }
          const nx = (x + dx + cols) % cols;
          const ny = (y + dy + rows) % rows;
          neighbors += grid[ny * cols + nx]!;
        }
      }
      const alive = grid[y * cols + x]!;
      next[y * cols + x] = alive
        ? neighbors === 2 || neighbors === 3
          ? 1
          : 0
        : neighbors === 3
          ? 1
          : 0;
    }
  }
  state.grid.set(next);
  state.generation += 1;
}

export const gameOfLifeExhibit: Exhibit = {
  id: "game-of-life",
  path: "/game-of-life",
  title: "Game of Life",
  category: "Simulation",
  summary:
    "Conway's cellular automaton — simple birth/death rules produce gliders, oscillators, and chaos.",
  maths:
    "Each cell is alive (1) or dead (0). On each generation: a live cell with 2–3 neighbours survives; " +
    "a dead cell with exactly 3 neighbours is born; all other cells die. Despite two-line rules, " +
    "the dynamics are Turing-complete — patterns can compute.",
  animated: true,
  params: [
    {
      id: "playing",
      type: "boolean",
      label: "Playing",
      description: "Pause or resume the simulation.",
    },
    {
      id: "cellSize",
      type: "number",
      label: "Cell size",
      min: 4,
      max: 16,
      step: 1,
    },
    {
      id: "speed",
      type: "number",
      label: "Generations per frame",
      min: 1,
      max: 5,
      step: 1,
    },
  ],
  defaults: {
    playing: true,
    cellSize: 8,
    speed: 1,
  },
  exportFilename: "game-of-life.png",
  draw(ctx, width, height, values, time) {
    const playing = Boolean(values.playing);
    const speed = Number(values.speed);
    const cellSize = Number(values.cellSize);
    const state = getState(ctx, values, width, height);

    if (playing) {
      const steps = Math.max(1, Math.floor(speed));
      for (let s = 0; s < steps; s++) {
        stepLife(state);
      }
    }

    ctx.fillStyle = "rgb(6, 10, 20)";
    ctx.fillRect(0, 0, width, height);

    const pulse = 0.5 + 0.5 * Math.sin(time * 2);
    for (let y = 0; y < state.rows; y++) {
      for (let x = 0; x < state.cols; x++) {
        if (!state.grid[y * state.cols + x]) {
          continue;
        }
        const hue = 150 + (x / state.cols) * 80;
        ctx.fillStyle = `hsl(${hue}, 75%, ${45 + pulse * 15}%)`;
        ctx.fillRect(x * cellSize, y * cellSize, cellSize - 1, cellSize - 1);
      }
    }
  },
};
