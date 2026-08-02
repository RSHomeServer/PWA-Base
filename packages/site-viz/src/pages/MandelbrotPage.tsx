import { useCallback, useState } from "react";
import type { ParamDef, ParamValue, ParamValues } from "@platform/controls";
import { drawMandelbrot } from "../canvas/mandelbrot.js";
import { DemoShell } from "../components/DemoShell.js";

const paramDefs: ParamDef[] = [
  {
    id: "zoom",
    type: "number",
    label: "Zoom",
    description: "Magnification around the centre point.",
    min: 0.5,
    max: 200,
    step: 0.5,
  },
  {
    id: "centerRe",
    type: "number",
    label: "Centre (real)",
    min: -2,
    max: 1,
    step: 0.01,
  },
  {
    id: "centerIm",
    type: "number",
    label: "Centre (imaginary)",
    min: -1.5,
    max: 1.5,
    step: 0.01,
  },
  {
    id: "maxIter",
    type: "number",
    label: "Max iterations",
    description: "Higher values reveal finer detail but take longer to render.",
    min: 32,
    max: 256,
    step: 8,
  },
];

const initialValues: ParamValues = {
  zoom: 1,
  centerRe: -0.5,
  centerIm: 0,
  maxIter: 128,
};

export function MandelbrotPage() {
  const [values, setValues] = useState<ParamValues>(initialValues);

  const handleChange = useCallback((id: string, value: ParamValue) => {
    setValues((prev) => ({ ...prev, [id]: value }));
  }, []);

  const draw = useCallback(
    (ctx: CanvasRenderingContext2D, width: number, height: number) => {
      drawMandelbrot(ctx, width, height, {
        zoom: Number(values.zoom),
        centerRe: Number(values.centerRe),
        centerIm: Number(values.centerIm),
        maxIter: Number(values.maxIter),
      });
    },
    [values],
  );

  return (
    <DemoShell
      title="Mandelbrot Set"
      demoPath="/mandelbrot"
      params={paramDefs}
      values={values}
      onChange={handleChange}
      draw={draw}
      exportFilename="mandelbrot.png"
    >
      <p>
        The Mandelbrot set contains complex numbers <em>c</em> for which iterating{" "}
        <em>z → z² + c</em> (starting from <em>z = 0</em>) stays bounded. Points inside the set are
        coloured dark; points that escape are shaded by how quickly they diverge.
      </p>
      <p>
        Zoom in near the boundary to see repeating filaments and miniature copies of the whole set —
        a hallmark of fractal geometry. Try increasing max iterations when zoomed in to resolve
        finer structure.
      </p>
    </DemoShell>
  );
}
