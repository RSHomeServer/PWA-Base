import { useCallback, useMemo, useState, type CSSProperties } from "react";
import type { ParamDef, ParamValue, ParamValues } from "@platform/controls";
import { ParameterPanel } from "@platform/controls";
import { Panel, Stack, Surface } from "@platform/ui";
import { AccessibilitySection } from "../components/AccessibilitySection.js";
import { ExampleBlock } from "../components/ExampleBlock.js";
import { ShowcaseSection } from "../components/ShowcaseSection.js";
import { ShowcaseShell } from "../components/ShowcaseShell.js";
import { UsageNote } from "../components/UsageNote.js";
import motionStyles from "../components/ShowcaseMotion.module.css";

const DEMO_PARAMS: ParamDef[] = [
  {
    id: "title",
    type: "text",
    label: "Chart title",
    description: "Displayed above the preview area.",
  },
  {
    id: "points",
    type: "number",
    label: "Data points",
    min: 3,
    max: 24,
    step: 1,
    description: "Number of samples to render.",
  },
  {
    id: "palette",
    type: "select",
    label: "Colour palette",
    description: "Visual style for the preview.",
    options: [
      { value: "ocean", label: "Ocean" },
      { value: "sunset", label: "Sunset" },
      { value: "mono", label: "Monochrome" },
    ],
  },
  {
    id: "showGrid",
    type: "boolean",
    label: "Show grid",
    description: "Overlay faint grid lines on the preview.",
  },
  {
    id: "animate",
    type: "boolean",
    label: "Animate bars",
    description: "Transition bar heights when parameters change.",
  },
];

const MINIMAL_PARAMS: ParamDef[] = [
  {
    id: "opacity",
    type: "number",
    label: "Overlay opacity",
    min: 0,
    max: 100,
    step: 5,
    description: "Preview layer transparency.",
  },
  {
    id: "mode",
    type: "select",
    label: "Blend mode",
    options: [
      { value: "normal", label: "Normal" },
      { value: "multiply", label: "Multiply" },
      { value: "screen", label: "Screen" },
    ],
  },
  {
    id: "locked",
    type: "boolean",
    label: "Lock layer",
  },
];

const DEFAULT_VALUES: ParamValues = {
  title: "Sample chart",
  points: 12,
  palette: "ocean",
  showGrid: true,
  animate: true,
};

const MINIMAL_DEFAULTS: ParamValues = {
  opacity: 60,
  mode: "normal",
  locked: false,
};

const PALETTE_COLOURS: Record<string, string> = {
  ocean: "var(--color-accent)",
  sunset: "#e07a5f",
  mono: "var(--color-muted)",
};

export function ParameterPanelPage() {
  const [values, setValues] = useState<ParamValues>(DEFAULT_VALUES);
  const [minimalValues, setMinimalValues] = useState<ParamValues>(MINIMAL_DEFAULTS);

  const handleChange = useCallback((id: string, value: ParamValue) => {
    setValues((current) => ({ ...current, [id]: value }));
  }, []);

  const handleMinimalChange = useCallback((id: string, value: ParamValue) => {
    setMinimalValues((current) => ({ ...current, [id]: value }));
  }, []);

  const previewBars = useMemo(() => {
    const count = typeof values.points === "number" ? values.points : 12;
    const colour = PALETTE_COLOURS[String(values.palette)] ?? PALETTE_COLOURS.ocean;
    return Array.from({ length: count }, (_, index) => ({
      id: index,
      height: `${30 + ((index * 17) % 55)}%`,
      colour,
    }));
  }, [values.palette, values.points]);

  const title = typeof values.title === "string" ? values.title : "Sample chart";
  const showGrid = Boolean(values.showGrid);
  const animate = Boolean(values.animate);

  const opacity = typeof minimalValues.opacity === "number" ? minimalValues.opacity : 60;
  const mode = String(minimalValues.mode ?? "normal");
  const locked = Boolean(minimalValues.locked);

  return (
    <ShowcaseShell
      title="ParameterPanel"
      summary="Declarative parameter forms from @platform/controls. Sites own param definitions and state; the panel renders fields."
    >
      <ShowcaseSection
        title="Live demo"
        description="Adjust parameters to see how sites wire ParameterPanel into a workspace layout."
      >
        <ExampleBlock title="ParameterPanel demo" column stretch muted>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr min(16rem, 100%)",
              gap: "var(--space-4)",
            }}
          >
            <Panel title="Preview">
              <Surface elevation="sm" style={{ padding: "var(--space-4)" }}>
                <Stack gap="sm">
                  <strong>{title}</strong>
                  <div
                    className={animate ? motionStyles.fadeEnter : undefined}
                    style={{
                      position: "relative",
                      display: "flex",
                      alignItems: "flex-end",
                      gap: "var(--space-1)",
                      height: "8rem",
                      padding: "var(--space-2)",
                      borderRadius: "var(--radius-sm)",
                      background: "var(--color-background)",
                    }}
                    aria-label={`${title} bar preview`}
                  >
                    {showGrid ? (
                      <div
                        aria-hidden="true"
                        style={{
                          position: "absolute",
                          inset: "var(--space-2)",
                          backgroundImage:
                            "linear-gradient(var(--color-border) 1px, transparent 1px), linear-gradient(90deg, var(--color-border) 1px, transparent 1px)",
                          backgroundSize: "1.5rem 1.5rem",
                          opacity: 0.35,
                        }}
                      />
                    ) : null}
                    {previewBars.map((bar) => (
                      <div
                        key={bar.id}
                        style={{
                          flex: 1,
                          height: bar.height,
                          borderRadius: "var(--radius-sm)",
                          background: bar.colour,
                          transition: animate
                            ? `height var(--motion-duration-normal) var(--motion-easing-standard), background var(--motion-duration-normal) var(--motion-easing-standard)`
                            : undefined,
                        }}
                      />
                    ))}
                  </div>
                </Stack>
              </Surface>
            </Panel>

            <aside aria-labelledby="params-heading">
              <Stack gap="sm">
                <h3 id="params-heading" style={{ margin: 0, fontSize: "var(--font-size-base)" }}>
                  Parameters
                </h3>
                <ParameterPanel params={DEMO_PARAMS} values={values} onChange={handleChange} />
              </Stack>
            </aside>
          </div>
        </ExampleBlock>
      </ShowcaseSection>

      <ShowcaseSection
        title="Compact panel"
        description="A minimal parameter set for overlay or layer controls — fewer fields, same API."
      >
        <ExampleBlock title="Minimal ParameterPanel" column stretch>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "minmax(0, 1fr) min(12rem, 100%)",
              gap: "var(--space-4)",
              alignItems: "center",
            }}
          >
            <Surface
              elevation="sm"
              style={{
                padding: "var(--space-6)",
                minHeight: "6rem",
                display: "grid",
                placeItems: "center",
                opacity: locked ? 0.5 : opacity / 100,
                mixBlendMode: mode as CSSProperties["mixBlendMode"],
                transition: `opacity var(--motion-duration-normal) var(--motion-easing-standard)`,
              }}
              aria-label="Layer preview"
            >
              <span style={{ color: "var(--color-muted)" }}>Layer preview</span>
            </Surface>
            <ParameterPanel
              params={MINIMAL_PARAMS}
              values={minimalValues}
              onChange={handleMinimalChange}
            />
          </div>
        </ExampleBlock>
      </ShowcaseSection>

      <ShowcaseSection
        title="Supported field types"
        description="number, boolean, select, and text param definitions are supported."
      >
        <UsageNote>{`const params: ParamDef[] = [
  { id: "zoom", type: "number", label: "Zoom", min: 0.5, max: 4, step: 0.1 },
  { id: "visible", type: "boolean", label: "Show overlay" },
  { id: "mode", type: "select", label: "Mode", options: [...] },
  { id: "name", type: "text", label: "Layer name" },
];

<ParameterPanel params={params} values={values} onChange={handleChange} />`}</UsageNote>
      </ShowcaseSection>

      <ShowcaseSection title="Intended usage">
        <UsageNote>{`import { ParameterPanel } from "@platform/controls";
import type { ParamDef, ParamValues, ParamValue } from "@platform/controls";

const [values, setValues] = useState<ParamValues>({ zoom: 1 });

const handleChange = (id: string, value: ParamValue) => {
  setValues((prev) => ({ ...prev, [id]: value }));
};

<ParameterPanel params={PARAMS} values={values} onChange={handleChange} />`}</UsageNote>
      </ShowcaseSection>

      <AccessibilitySection>
        <ul>
          <li>
            ParameterPanel renders labelled native controls — ensure each ParamDef has a clear
            label.
          </li>
          <li>
            Provide descriptions for non-obvious fields; they surface as helper text where
            supported.
          </li>
          <li>Keep related parameters grouped; use separate panels for distinct concerns.</li>
          <li>Reflect disabled or locked state in both the preview and control values.</li>
        </ul>
      </AccessibilitySection>
    </ShowcaseShell>
  );
}
