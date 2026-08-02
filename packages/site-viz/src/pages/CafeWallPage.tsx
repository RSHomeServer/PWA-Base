import { useCallback, useState } from "react";
import type { ParamDef, ParamValue, ParamValues } from "@platform/controls";
import { drawCafeWall } from "../canvas/cafe-wall.js";
import { DemoShell } from "../components/DemoShell.js";

const paramDefs: ParamDef[] = [
  {
    id: "tileSize",
    type: "number",
    label: "Tile size",
    description: "Width and height of each square tile in pixels.",
    min: 12,
    max: 80,
    step: 2,
  },
  {
    id: "mortarWidth",
    type: "number",
    label: "Mortar width",
    description: "Thickness of the grey lines between rows.",
    min: 1,
    max: 20,
    step: 1,
  },
  {
    id: "rowOffset",
    type: "number",
    label: "Row offset",
    description: "Horizontal shift applied to every other row.",
    min: 0,
    max: 80,
    step: 1,
  },
  {
    id: "rows",
    type: "number",
    label: "Row count",
    min: 3,
    max: 12,
    step: 1,
  },
  {
    id: "showGuides",
    type: "boolean",
    label: "Show guide lines",
    description: "Overlay straight red lines on mortar rows to compare.",
  },
];

const initialValues: ParamValues = {
  tileSize: 40,
  mortarWidth: 6,
  rowOffset: 20,
  rows: 8,
  showGuides: true,
};

export function CafeWallPage() {
  const [values, setValues] = useState<ParamValues>(initialValues);

  const handleChange = useCallback((id: string, value: ParamValue) => {
    setValues((prev) => ({ ...prev, [id]: value }));
  }, []);

  const draw = useCallback(
    (ctx: CanvasRenderingContext2D, width: number, height: number) => {
      drawCafeWall(ctx, width, height, {
        tileSize: Number(values.tileSize),
        mortarWidth: Number(values.mortarWidth),
        rowOffset: Number(values.rowOffset),
        rows: Number(values.rows),
        showGuides: Boolean(values.showGuides),
      });
    },
    [values],
  );

  return (
    <DemoShell
      title="Café Wall Illusion"
      demoPath="/cafe-wall"
      params={paramDefs}
      values={values}
      onChange={handleChange}
      draw={draw}
      exportFilename="cafe-wall.png"
    >
      <p>
        The café wall illusion, named after tile patterns on café fronts, shows how low-contrast
        mortar lines between rows of alternating tiles can make parallel lines appear slanted.
      </p>
      <p>
        Each row is perfectly horizontal — toggle the guide lines to verify. The effect comes from
        how your visual system integrates local contrast at tile edges with the mortar boundaries.
        Adjust the row offset to see when the illusion strengthens or weakens.
      </p>
    </DemoShell>
  );
}
