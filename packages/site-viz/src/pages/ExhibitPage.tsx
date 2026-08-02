import { useCallback, useEffect, useMemo, useState } from "react";
import type { ParamValue, ParamValues } from "@platform/controls";
import { DemoShell } from "../components/DemoShell.js";
import type { Exhibit } from "../exhibits/types.js";
import { recordDemoView } from "../gallery/storage.js";

export interface ExhibitPageProps {
  exhibit: Exhibit;
}

export function ExhibitPage({ exhibit }: ExhibitPageProps) {
  useEffect(() => {
    recordDemoView(exhibit.id);
  }, [exhibit.id]);

  const [values, setValues] = useState<ParamValues>(() => ({ ...exhibit.defaults }));

  const handleChange = useCallback((id: string, value: ParamValue) => {
    setValues((prev) => ({ ...prev, [id]: value }));
  }, []);

  const handleReset = useCallback(() => {
    setValues({ ...exhibit.defaults });
  }, [exhibit.defaults]);

  const draw = useCallback(
    (ctx: CanvasRenderingContext2D, width: number, height: number, time = 0) => {
      exhibit.draw(ctx, width, height, values, time);
    },
    [exhibit, values],
  );

  const mathsParagraphs = useMemo(
    () => exhibit.maths.split(/\n\n+/).map((paragraph, index) => <p key={index}>{paragraph}</p>),
    [exhibit.maths],
  );

  return (
    <DemoShell
      title={exhibit.title}
      demoPath={exhibit.path}
      params={exhibit.params}
      values={values}
      onChange={handleChange}
      onReset={handleReset}
      draw={draw}
      animated={exhibit.animated}
      exportFilename={exhibit.exportFilename ?? `${exhibit.id}.png`}
      width={exhibit.width}
      height={exhibit.height}
    >
      {mathsParagraphs}
    </DemoShell>
  );
}
