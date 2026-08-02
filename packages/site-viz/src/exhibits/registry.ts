import type { Exhibit } from "./types.js";
import { batchBExhibits } from "./collection/batch-b-index.js";
import { batchCExhibits } from "./collection/batch-c-index.js";
import { boidsExhibit } from "./collection/boids.js";
import { burningShipExhibit } from "./collection/burning-ship.js";
import { cliffordExhibit } from "./collection/clifford.js";
import { gameOfLifeExhibit } from "./collection/game-of-life.js";
import { juliaExhibit } from "./collection/julia.js";
import { lorenzExhibit } from "./collection/lorenz.js";
import { newtonExhibit } from "./collection/newton.js";
import { particleFountainExhibit } from "./collection/particle-fountain.js";
import { reactionDiffusionExhibit } from "./collection/reaction-diffusion.js";
import { rule30Exhibit } from "./collection/rule30.js";

const batchAExhibits: Exhibit[] = [
  juliaExhibit,
  newtonExhibit,
  burningShipExhibit,
  lorenzExhibit,
  cliffordExhibit,
  gameOfLifeExhibit,
  rule30Exhibit,
  boidsExhibit,
  particleFountainExhibit,
  reactionDiffusionExhibit,
];

export const exhibits: Exhibit[] = [...batchAExhibits, ...batchBExhibits, ...batchCExhibits];

export function exhibitByPath(path: string): Exhibit | undefined {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return exhibits.find((exhibit) => exhibit.path === normalized);
}
