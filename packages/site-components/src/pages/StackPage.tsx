import { Badge, Button, Stack } from "@platform/ui";
import { AccessibilitySection } from "../components/AccessibilitySection.js";
import { ExampleBlock } from "../components/ExampleBlock.js";
import { PropsTable } from "../components/PropsTable.js";
import { ShowcaseSection } from "../components/ShowcaseSection.js";
import { ShowcaseShell } from "../components/ShowcaseShell.js";
import { UsageNote } from "../components/UsageNote.js";

export function StackPage() {
  return (
    <ShowcaseShell
      title="Stack"
      summary="Flexbox layout primitive for vertical or horizontal spacing. Prefer Stack over ad-hoc margin when composing UI."
    >
      <ShowcaseSection
        title="Direction and gap"
        description="Column is the default; row groups inline items."
      >
        <ExampleBlock title="Stack direction" column stretch>
          <Stack gap="sm">
            <strong>Column stack (default)</strong>
            <Badge>Item one</Badge>
            <Badge variant="accent">Item two</Badge>
            <Badge variant="success">Item three</Badge>
          </Stack>
          <Stack direction="row" gap="md" align="center">
            <Button size="sm">Previous</Button>
            <Button size="sm" variant="secondary">
              Next
            </Button>
          </Stack>
        </ExampleBlock>
      </ShowcaseSection>

      <ShowcaseSection
        title="Alignment"
        description="Control cross-axis alignment and main-axis distribution."
      >
        <ExampleBlock title="Stack alignment" column stretch muted>
          <Stack direction="row" gap="sm" align="center" justify="between">
            <span>Space between</span>
            <Button size="sm">Action</Button>
          </Stack>
          <Stack direction="row" gap="sm" align="center" justify="center">
            <Badge>Centered</Badge>
            <Badge variant="accent">Group</Badge>
          </Stack>
        </ExampleBlock>
      </ShowcaseSection>

      <ShowcaseSection
        title="Semantic element"
        description="Use the as prop for landmarks such as nav or main wrappers."
      >
        <ExampleBlock title="Stack as nav" stretch>
          <Stack as="nav" direction="row" gap="md" aria-label="Example navigation">
            <a href="#overview">Overview</a>
            <a href="#examples">Examples</a>
            <a href="#props">Props</a>
          </Stack>
        </ExampleBlock>
      </ShowcaseSection>

      <ShowcaseSection title="Intended usage">
        <UsageNote>{`import { Stack, Button } from "@platform/ui";

<Stack gap="lg">
  <header>...</header>
  <Stack direction="row" gap="md" justify="end">
    <Button variant="secondary">Cancel</Button>
    <Button>Save</Button>
  </Stack>
</Stack>`}</UsageNote>
      </ShowcaseSection>

      <ShowcaseSection title="Props">
        <PropsTable
          rows={[
            { name: "direction", type: '"row" | "column"', defaultValue: '"column"' },
            { name: "gap", type: '"none" | "sm" | "md" | "lg"', defaultValue: '"md"' },
            {
              name: "align",
              type: '"start" | "center" | "end" | "stretch"',
              defaultValue: '"stretch"',
            },
            {
              name: "justify",
              type: '"start" | "center" | "end" | "between"',
              defaultValue: '"start"',
            },
            {
              name: "as",
              type: "ElementType",
              defaultValue: '"div"',
              description: "Rendered element.",
            },
          ]}
        />
      </ShowcaseSection>

      <AccessibilitySection>
        <ul>
          <li>
            Use the <code>as</code> prop for semantic landmarks such as <code>nav</code> or{" "}
            <code>main</code>.
          </li>
          <li>
            When Stack wraps interactive items, preserve a logical tab order via DOM sequence.
          </li>
          <li>
            Pair <code>aria-label</code> with nav stacks that lack visible headings.
          </li>
        </ul>
      </AccessibilitySection>
    </ShowcaseShell>
  );
}
