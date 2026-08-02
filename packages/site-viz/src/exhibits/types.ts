import type { ParamDef, ParamValues } from "@platform/controls";

export type ExhibitCategory =
  | "Fractals"
  | "Geometry"
  | "Simulation"
  | "Particles"
  | "Illusion"
  | "Waves"
  | "Systems"
  | "Procedural";

export type ExhibitDraw = (
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  values: ParamValues,
  time: number,
) => void;

export interface Exhibit {
  id: string;
  /** Route path under /viz, e.g. "/julia" */
  path: string;
  title: string;
  category: ExhibitCategory;
  summary: string;
  /** Short mathematical / conceptual background shown in About */
  maths: string;
  params: ParamDef[];
  defaults: ParamValues;
  /** When true, redraws every frame with increasing time (seconds). */
  animated?: boolean;
  draw: ExhibitDraw;
  exportFilename?: string;
  width?: number;
  height?: number;
}
