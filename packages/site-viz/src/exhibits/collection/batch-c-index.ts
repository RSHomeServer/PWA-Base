import type { Exhibit } from "../types.js";
import { auroraRibbons } from "./aurora-ribbons.js";
import { blackHole } from "./black-hole.js";
import { doublePendulum } from "./double-pendulum.js";
import { moireInterference } from "./moire-interference.js";

export const batchCExhibits: Exhibit[] = [
  blackHole,
  doublePendulum,
  moireInterference,
  auroraRibbons,
];
