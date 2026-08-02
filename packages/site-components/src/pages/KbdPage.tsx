import { Kbd, Stack } from "@platform/ui";
import { AccessibilitySection } from "../components/AccessibilitySection.js";
import { ExampleBlock } from "../components/ExampleBlock.js";
import { ShowcaseSection } from "../components/ShowcaseSection.js";
import { ShowcaseShell } from "../components/ShowcaseShell.js";
import { UsageNote } from "../components/UsageNote.js";

export function KbdPage() {
  return (
    <ShowcaseShell
      title="Kbd"
      summary="Style keyboard shortcuts inline in help text, tooltips, and documentation."
    >
      <ShowcaseSection
        title="Single keys"
        description="Wrap individual key names for monospace styling."
      >
        <ExampleBlock title="Single kbd keys">
          <span>
            Press <Kbd>Esc</Kbd> to close
          </span>
          <span>
            Toggle sidebar with <Kbd>S</Kbd>
          </span>
        </ExampleBlock>
      </ShowcaseSection>

      <ShowcaseSection
        title="Combinations"
        description="Group modifiers and keys to show chord shortcuts."
      >
        <ExampleBlock title="Kbd combinations" column stretch>
          <Stack direction="row" gap="sm" align="center">
            <span>Save</span>
            <Kbd>Ctrl</Kbd>
            <span>+</span>
            <Kbd>S</Kbd>
          </Stack>
          <Stack direction="row" gap="sm" align="center">
            <span>Command palette</span>
            <Kbd>Ctrl</Kbd>
            <span>+</span>
            <Kbd>K</Kbd>
          </Stack>
          <Stack direction="row" gap="sm" align="center">
            <span>Navigate sections</span>
            <Kbd>↑</Kbd>
            <Kbd>↓</Kbd>
          </Stack>
        </ExampleBlock>
      </ShowcaseSection>

      <ShowcaseSection title="Intended usage">
        <UsageNote>{`import { Kbd } from "@platform/ui";

<p>
  Press <Kbd>Ctrl</Kbd> + <Kbd>K</Kbd> to open the command palette.
</p>`}</UsageNote>
      </ShowcaseSection>

      <AccessibilitySection>
        <ul>
          <li>
            <code>Kbd</code> renders semantic <code>&lt;kbd&gt;</code> elements for keyboard
            references.
          </li>
          <li>
            Spell out modifier keys clearly (Ctrl, Alt, Shift) — avoid ambiguous abbreviations.
          </li>
          <li>Do not use Kbd styling for non-keyboard UI elements.</li>
        </ul>
      </AccessibilitySection>
    </ShowcaseShell>
  );
}
