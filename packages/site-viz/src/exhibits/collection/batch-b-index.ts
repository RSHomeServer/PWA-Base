import type { Exhibit } from "../types.js";
import { delaunay } from "./delaunay.js";
import { dragonCurve } from "./dragon-curve.js";
import { fourierEpicycles } from "./fourier-epicycles.js";
import { harmonograph } from "./harmonograph.js";
import { hilbertCurve } from "./hilbert-curve.js";
import { kaleidoscope } from "./kaleidoscope.js";
import { perlinFlow } from "./perlin-flow.js";
import { recursiveTree } from "./recursive-tree.js";
import { simplexTerrain } from "./simplex-terrain.js";
import { starfield } from "./starfield.js";
import { voronoiDiagram } from "./voronoi.diagram.js";
import { waveInterference } from "./wave-interference.js";

export const batchBExhibits: Exhibit[] = [
  voronoiDiagram,
  delaunay,
  perlinFlow,
  simplexTerrain,
  waveInterference,
  fourierEpicycles,
  dragonCurve,
  hilbertCurve,
  recursiveTree,
  kaleidoscope,
  harmonograph,
  starfield,
];
