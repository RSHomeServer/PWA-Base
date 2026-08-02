import { useCallback, useState } from "react";
import type { ParamDef, ParamValue, ParamValues } from "@platform/controls";
import { drawSierpinski } from "../canvas/sierpinski.js";
import { DemoShell } from "../components/DemoShell.js";

const paramDefs: ParamDef[] = [
  {
    id: "depth",
    type: "number",
    label: "Recursion depth",
    description: "How many times each triangle is subdivided.",
    min: 0,
    max: 8,
    step: 1,
  },
  {
    id: "fillColor",
    type: "select",
    label: "Fill colour",
    options: [
      { value: "#2563eb", label: "Blue" },
      { value: "#059669", label: "Green" },
      { value: "#7c3aed", label: "Purple" },
      { value: "#111827", label: "Charcoal" },
    ],
  },
  {
    id: "strokeColor",
    type: "select",
    label: "Outline colour",
    options: [
      { value: "#1f2937", label: "Dark grey" },
      { value: "#dc2626", label: "Red" },
      { value: "#ffffff", label: "White" },
    ],
  },
];

const initialValues: ParamValues = {
  depth: 6,
  fillColor: "#2563eb",
  strokeColor: "#1f2937",
};

export function SierpinskiPage() {
  const [values, setValues] = useState<ParamValues>(initialValues);

  const handleChange = useCallback((id: string, value: ParamValue) => {
    setValues((prev) => ({ ...prev, [id]: value }));
  }, []);

  const draw = useCallback(
    (ctx: CanvasRenderingContext2D, width: number, height: number) => {
      drawSierpinski(ctx, width, height, {
        depth: Number(values.depth),
        fillColor: String(values.fillColor),
        strokeColor: String(values.strokeColor),
      });
    },
    [values],
  );

  return (
    <DemoShell
      title="Sierpinski Triangle"
      demoPath="/sierpinski"
      params={paramDefs}
      values={values}
      onChange={handleChange}
      draw={draw}
      exportFilename="sierpinski.png"
    >
      <p>
        Start with an equilateral triangle and repeatedly remove the central inverted triangle from
        each remaining piece. After infinitely many steps the result has zero area but a fractal
        boundary — the Sierpinski triangle.
      </p>
      <p>
        Each recursion depth here draws the next level of subdivision. Notice how three smaller
        copies assemble into the whole: self-similarity at every scale. Depth 8 produces 3⁸ = 6,561
        smallest triangles.
      </p>
    </DemoShell>
  );
}
