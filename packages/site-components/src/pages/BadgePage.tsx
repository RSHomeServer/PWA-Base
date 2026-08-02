import { Badge, Stack } from "@platform/ui";
import { AccessibilitySection } from "../components/AccessibilitySection.js";
import { ExampleBlock } from "../components/ExampleBlock.js";
import { PropsTable } from "../components/PropsTable.js";
import { ShowcaseSection } from "../components/ShowcaseSection.js";
import { ShowcaseShell } from "../components/ShowcaseShell.js";
import { UsageNote } from "../components/UsageNote.js";

export function BadgePage() {
  const status: "draft" | "published" | "archived" = "published";

  const statusVariant =
    status === "published" ? "success" : status === "draft" ? "warning" : "default";

  return (
    <ShowcaseShell
      title="Badge"
      summary="Compact labels for status, counts, and categories. Use sparingly so badges remain meaningful."
    >
      <ShowcaseSection
        title="Variants"
        description="Each variant maps to a semantic tone in the design system."
      >
        <ExampleBlock title="Badge variants">
          <Badge variant="default">Default</Badge>
          <Badge variant="accent">Accent</Badge>
          <Badge variant="success">Success</Badge>
          <Badge variant="warning">Warning</Badge>
          <Badge variant="error">Error</Badge>
        </ExampleBlock>
      </ShowcaseSection>

      <ShowcaseSection
        title="In context"
        description="Pair badges with headings or list items to convey state."
      >
        <ExampleBlock title="Badge in context" column stretch>
          <Stack direction="row" gap="sm" align="center">
            <span>Release notes</span>
            <Badge variant={statusVariant}>{status}</Badge>
          </Stack>
          <Stack direction="row" gap="sm" align="center">
            <span>API tier</span>
            <Badge variant="accent">Pro</Badge>
          </Stack>
        </ExampleBlock>
      </ShowcaseSection>

      <ShowcaseSection title="Intended usage">
        <UsageNote>{`import { Badge } from "@platform/ui";

<Badge variant="success">Active</Badge>
<Badge variant="warning">Pending review</Badge>`}</UsageNote>
      </ShowcaseSection>

      <ShowcaseSection title="Props">
        <PropsTable
          rows={[
            {
              name: "variant",
              type: '"default" | "accent" | "success" | "warning" | "error"',
              defaultValue: '"default"',
            },
          ]}
        />
      </ShowcaseSection>

      <AccessibilitySection>
        <ul>
          <li>
            Badges supplement visible text — do not rely on colour alone to convey critical status.
          </li>
          <li>Keep badge copy short; screen readers announce the full label.</li>
          <li>Use semantic variants (success, warning, error) consistently across the product.</li>
        </ul>
      </AccessibilitySection>
    </ShowcaseShell>
  );
}
