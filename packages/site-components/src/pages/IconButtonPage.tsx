import { useState } from "react";
import { IconButton, Stack } from "@platform/ui";
import { AccessibilitySection } from "../components/AccessibilitySection.js";
import { ExampleBlock } from "../components/ExampleBlock.js";
import { PropsTable } from "../components/PropsTable.js";
import { ShowcaseSection } from "../components/ShowcaseSection.js";
import { ShowcaseShell } from "../components/ShowcaseShell.js";
import { UsageNote } from "../components/UsageNote.js";

function PlusIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
      <path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
      <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function MenuIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
      <path
        d="M3 4.5h10M3 8h10M3 11.5h10"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function IconButtonPage() {
  const [open, setOpen] = useState(false);

  return (
    <ShowcaseShell
      title="IconButton"
      summary="Icon-only buttons for toolbars and compact controls. Always provide a descriptive label for screen readers."
    >
      <ShowcaseSection
        title="Variants"
        description="Ghost is the default for toolbars; subtle and outline add more visual weight when needed."
      >
        <ExampleBlock title="IconButton variants">
          <IconButton label="Add item" variant="ghost">
            <PlusIcon />
          </IconButton>
          <IconButton label="Close panel" variant="subtle">
            <CloseIcon />
          </IconButton>
          <IconButton label="Open menu" variant="outline">
            <MenuIcon />
          </IconButton>
        </ExampleBlock>
      </ShowcaseSection>

      <ShowcaseSection title="Sizes">
        <ExampleBlock title="IconButton sizes">
          <IconButton label="Add" size="sm">
            <PlusIcon />
          </IconButton>
          <IconButton label="Add" size="md">
            <PlusIcon />
          </IconButton>
        </ExampleBlock>
      </ShowcaseSection>

      <ShowcaseSection title="Interactive">
        <ExampleBlock title="Toggle menu" column stretch>
          <Stack direction="row" gap="md" align="center">
            <IconButton
              label={open ? "Close menu" : "Open menu"}
              onClick={() => setOpen((value) => !value)}
            >
              <MenuIcon />
            </IconButton>
            <span aria-live="polite">{open ? "Menu open" : "Menu closed"}</span>
          </Stack>
        </ExampleBlock>
      </ShowcaseSection>

      <ShowcaseSection title="Intended usage">
        <UsageNote>{`import { IconButton } from "@platform/ui";

<IconButton label="Close dialog" variant="ghost" onClick={onClose}>
  <CloseIcon />
</IconButton>`}</UsageNote>
      </ShowcaseSection>

      <ShowcaseSection title="Props">
        <PropsTable
          rows={[
            {
              name: "label",
              type: "string",
              description: "Required. Sets aria-label on the button.",
            },
            {
              name: "variant",
              type: '"ghost" | "subtle" | "outline"',
              defaultValue: '"ghost"',
            },
            { name: "size", type: '"sm" | "md"', defaultValue: '"md"' },
          ]}
        />
      </ShowcaseSection>

      <AccessibilitySection>
        <ul>
          <li>
            The <code>label</code> prop is required — it sets <code>aria-label</code> on the button.
          </li>
          <li>Describe the action, not the icon shape (“Close dialog”, not “X”).</li>
          <li>
            Toggle buttons should update the label when state changes (e.g. “Open menu” / “Close
            menu”).
          </li>
        </ul>
      </AccessibilitySection>
    </ShowcaseShell>
  );
}
