import { Panel, Stack, Surface } from "@platform/ui";
import { AccessibilitySection } from "../components/AccessibilitySection.js";
import { ExampleBlock } from "../components/ExampleBlock.js";
import { PropsTable } from "../components/PropsTable.js";
import { ShowcaseSection } from "../components/ShowcaseSection.js";
import { ShowcaseShell } from "../components/ShowcaseShell.js";
import { UsageNote } from "../components/UsageNote.js";

export function SurfacePanelPage() {
  return (
    <ShowcaseShell
      title="Surface & Panel"
      summary="Surface provides elevation and grouping; Panel adds a semantic section with an optional titled heading."
    >
      <ShowcaseSection
        title="Surface elevations"
        description="Use elevation to separate content layers. none sits flush; md is for prominent cards."
      >
        <ExampleBlock title="Surface elevations" column stretch>
          <Surface elevation="none" style={{ padding: "var(--space-3)" }}>
            No elevation
          </Surface>
          <Surface elevation="xs" style={{ padding: "var(--space-3)" }}>
            Extra small elevation
          </Surface>
          <Surface elevation="sm" style={{ padding: "var(--space-3)" }}>
            Small elevation (default)
          </Surface>
          <Surface elevation="md" style={{ padding: "var(--space-3)" }}>
            Medium elevation
          </Surface>
        </ExampleBlock>
      </ShowcaseSection>

      <ShowcaseSection
        title="Panel sections"
        description="Panel renders a section element with an optional h2 title."
      >
        <ExampleBlock title="Panel examples" column stretch>
          <Panel title="Parameters">
            <p style={{ margin: 0, color: "var(--color-muted)" }}>
              Group related controls or prose under a clear heading.
            </p>
          </Panel>
          <Panel>
            <Stack gap="sm">
              <strong>Untitled panel</strong>
              <span style={{ color: "var(--color-muted)" }}>
                Omit title when context is obvious.
              </span>
            </Stack>
          </Panel>
        </ExampleBlock>
      </ShowcaseSection>

      <ShowcaseSection title="Combined layout">
        <ExampleBlock title="Surface inside panel" column stretch muted>
          <Panel title="Workspace">
            <Surface elevation="sm" style={{ padding: "var(--space-4)" }}>
              Canvas or data preview lives on a raised surface inside a titled panel.
            </Surface>
          </Panel>
        </ExampleBlock>
      </ShowcaseSection>

      <ShowcaseSection title="Intended usage">
        <UsageNote>{`import { Panel, Surface } from "@platform/ui";

<Panel title="Results">
  <Surface elevation="sm">{content}</Surface>
</Panel>`}</UsageNote>
      </ShowcaseSection>

      <ShowcaseSection title="Props">
        <PropsTable
          rows={[
            {
              name: "elevation",
              type: '"none" | "xs" | "sm" | "md"',
              defaultValue: '"sm"',
              description: "Surface shadow depth.",
            },
            {
              name: "title",
              type: "string",
              description: "Panel section heading (optional).",
            },
          ]}
        />
      </ShowcaseSection>

      <AccessibilitySection>
        <ul>
          <li>
            Panel renders a <code>&lt;section&gt;</code> with an optional titled heading for
            landmark navigation.
          </li>
          <li>
            Do not nest multiple untitled panels — provide headings or aria-labels for grouped
            content.
          </li>
          <li>
            Surface is decorative grouping; ensure meaningful content inside remains accessible.
          </li>
        </ul>
      </AccessibilitySection>
    </ShowcaseShell>
  );
}
