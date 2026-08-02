import { useCallback, useMemo, useState } from "react";
import type { ParamDef, ParamValue, ParamValues } from "@platform/controls";
import { ParameterPanel } from "@platform/controls";
import { Badge, Button, Stack } from "@platform/ui";
import { AccessibilitySection } from "../components/AccessibilitySection.js";
import { ExampleBlock } from "../components/ExampleBlock.js";
import { PropsTable } from "../components/PropsTable.js";
import { ShowcaseSection } from "../components/ShowcaseSection.js";
import { ShowcaseShell } from "../components/ShowcaseShell.js";
import { UsageNote } from "../components/UsageNote.js";

const PLAYGROUND_PARAMS: ParamDef[] = [
  {
    id: "label",
    type: "text",
    label: "Label",
    description: "Button text content.",
  },
  {
    id: "variant",
    type: "select",
    label: "Variant",
    options: [
      { value: "primary", label: "Primary" },
      { value: "secondary", label: "Secondary" },
    ],
  },
  {
    id: "size",
    type: "select",
    label: "Size",
    options: [
      { value: "sm", label: "Small" },
      { value: "md", label: "Medium" },
    ],
  },
  {
    id: "disabled",
    type: "boolean",
    label: "Disabled",
    description: "Prevents interaction and lowers opacity.",
  },
];

const DEFAULT_PLAYGROUND: ParamValues = {
  label: "Save changes",
  variant: "primary",
  size: "md",
  disabled: false,
};

export function ButtonPage() {
  const [clicks, setClicks] = useState(0);
  const [playground, setPlayground] = useState<ParamValues>(DEFAULT_PLAYGROUND);

  const handlePlaygroundChange = useCallback((id: string, value: ParamValue) => {
    setPlayground((current) => ({ ...current, [id]: value }));
  }, []);

  const label = typeof playground.label === "string" ? playground.label : "Save changes";
  const variant = playground.variant === "secondary" ? "secondary" : "primary";
  const size = playground.size === "sm" ? "sm" : "md";
  const disabled = Boolean(playground.disabled);

  const codeSnippet = useMemo(
    () =>
      `<Button variant="${variant}" size="${size}"${disabled ? " disabled" : ""}>${label}</Button>`,
    [disabled, label, size, variant],
  );

  return (
    <ShowcaseShell
      title="Button"
      summary="Use buttons for primary actions and secondary alternatives. Prefer a single primary button per view."
    >
      <ShowcaseSection
        title="Playground"
        description="Adjust properties live — the snippet updates to match your configuration."
      >
        <ExampleBlock title="Button playground" column stretch muted usageNote={codeSnippet}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "minmax(0, 1fr) min(14rem, 100%)",
              gap: "var(--space-4)",
              alignItems: "start",
            }}
          >
            <Stack gap="md" align="center" style={{ minHeight: "5rem", justifyContent: "center" }}>
              <Button variant={variant} size={size} disabled={disabled}>
                {label}
              </Button>
            </Stack>
            <ParameterPanel
              params={PLAYGROUND_PARAMS}
              values={playground}
              onChange={handlePlaygroundChange}
            />
          </div>
        </ExampleBlock>
      </ShowcaseSection>

      <ShowcaseSection
        title="Variants"
        description="Primary draws attention to the main action; secondary supports cancel, back, or low-emphasis actions."
      >
        <ExampleBlock
          title="Button variants"
          usageNote={`<Button variant="primary">Primary</Button>
<Button variant="secondary">Secondary</Button>`}
        >
          <Button variant="primary">Primary</Button>
          <Button variant="secondary">Secondary</Button>
        </ExampleBlock>
      </ShowcaseSection>

      <ShowcaseSection
        title="Sizes"
        description="Small buttons fit dense toolbars; medium is the default for forms."
      >
        <ExampleBlock title="Button sizes">
          <Button size="sm">Small</Button>
          <Button size="md">Medium</Button>
        </ExampleBlock>
      </ShowcaseSection>

      <ShowcaseSection
        title="Interactive"
        description="Buttons accept standard HTML button attributes including disabled state."
      >
        <ExampleBlock title="Interactive button" column stretch>
          <Stack direction="row" gap="md" align="center">
            <Button onClick={() => setClicks((count) => count + 1)}>Click me</Button>
            <span aria-live="polite">
              {clicks} click{clicks === 1 ? "" : "s"}
            </span>
          </Stack>
          <Button disabled>Disabled</Button>
        </ExampleBlock>
      </ShowcaseSection>

      <ShowcaseSection
        title="Composition"
        description="Buttons pair with Badge for status rows and Stack for action groups."
      >
        <ExampleBlock title="Button composition" column stretch muted>
          <Stack direction="row" gap="sm" align="center" justify="between">
            <Stack direction="row" gap="sm" align="center">
              <span>Deployment</span>
              <Badge variant="success">Live</Badge>
            </Stack>
            <Stack direction="row" gap="sm">
              <Button variant="secondary" size="sm">
                Rollback
              </Button>
              <Button size="sm">Redeploy</Button>
            </Stack>
          </Stack>
          <Stack direction="row" gap="sm" justify="end">
            <Button variant="secondary" size="sm">
              Cancel
            </Button>
            <Button size="sm">Confirm</Button>
          </Stack>
        </ExampleBlock>
      </ShowcaseSection>

      <ShowcaseSection title="Intended usage">
        <UsageNote>{`import { Button } from "@platform/ui";

<Button variant="primary" onClick={handleSave}>Save changes</Button>
<Button variant="secondary" size="sm">Cancel</Button>`}</UsageNote>
      </ShowcaseSection>

      <ShowcaseSection title="Props">
        <PropsTable
          rows={[
            {
              name: "variant",
              type: '"primary" | "secondary"',
              defaultValue: '"primary"',
              description: "Visual emphasis level.",
            },
            {
              name: "size",
              type: '"sm" | "md"',
              defaultValue: '"md"',
              description: "Padding and type scale.",
            },
            {
              name: "type",
              type: "button type",
              defaultValue: '"button"',
              description: "Set to submit inside forms.",
            },
          ]}
        />
      </ShowcaseSection>

      <AccessibilitySection>
        <ul>
          <li>
            Buttons render native <code>&lt;button&gt;</code> elements with visible focus rings.
          </li>
          <li>
            Use descriptive labels — avoid generic text like “Click here” when context is unclear.
          </li>
          <li>
            Set <code>disabled</code> for unavailable actions; do not rely on opacity alone to
            communicate state.
          </li>
          <li>Limit to one primary button per view to preserve clear action hierarchy.</li>
        </ul>
      </AccessibilitySection>
    </ShowcaseShell>
  );
}
