import { useState } from "react";
import { Stack, ThemeToggle, useTheme } from "@platform/ui";
import { AccessibilitySection } from "../components/AccessibilitySection.js";
import { ExampleBlock } from "../components/ExampleBlock.js";
import { PropsTable } from "../components/PropsTable.js";
import { ShowcaseSection } from "../components/ShowcaseSection.js";
import { ShowcaseShell } from "../components/ShowcaseShell.js";
import { ThemeDemoProvider } from "../components/ThemeDemoProvider.js";
import { UsageNote } from "../components/UsageNote.js";

function ThemeStatus() {
  const { theme, resolvedTheme } = useTheme();

  return (
    <p style={{ margin: 0, color: "var(--color-muted)" }}>
      Preference: <strong>{theme}</strong> · Resolved: <strong>{resolvedTheme}</strong>
    </p>
  );
}

export function ThemeTogglePage() {
  const [showLabels, setShowLabels] = useState(false);

  return (
    <ShowcaseShell
      title="ThemeToggle"
      summary="Three-way theme control for light, dark, and system preference. Requires ThemeProvider from the host or a local wrapper."
    >
      <ShowcaseSection
        title="Default"
        description="Icons-only toggle saves space in headers and settings panels."
      >
        <ThemeDemoProvider>
          <ExampleBlock title="ThemeToggle default" column stretch muted>
            <ThemeToggle />
            <ThemeStatus />
          </ExampleBlock>
        </ThemeDemoProvider>
      </ShowcaseSection>

      <ShowcaseSection
        title="With labels"
        description="Visible text labels aid discoverability in settings views."
      >
        <ThemeDemoProvider>
          <ExampleBlock title="ThemeToggle with labels" column stretch muted>
            <Stack direction="row" gap="md" align="center" justify="between">
              <ThemeToggle showLabels={showLabels} />
              <label style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
                <input
                  type="checkbox"
                  checked={showLabels}
                  onChange={(event) => setShowLabels(event.target.checked)}
                />
                Show labels
              </label>
            </Stack>
            <ThemeStatus />
          </ExampleBlock>
        </ThemeDemoProvider>
      </ShowcaseSection>

      <ShowcaseSection title="Intended usage">
        <UsageNote>{`// Host wraps the app once:
import { ThemeProvider, ThemeToggle } from "@platform/ui";

<ThemeProvider>
  <header>
    <ThemeToggle showLabels />
  </header>
</ThemeProvider>`}</UsageNote>
      </ShowcaseSection>

      <ShowcaseSection title="Props">
        <PropsTable
          rows={[
            {
              name: "showLabels",
              type: "boolean",
              defaultValue: "false",
              description: "Show Light / Dark / System text beside icons.",
            },
          ]}
        />
      </ShowcaseSection>

      <AccessibilitySection>
        <ul>
          <li>ThemeToggle buttons expose their current selection to assistive technology.</li>
          <li>
            Enable <code>showLabels</code> in settings views where icon-only controls may be
            ambiguous.
          </li>
          <li>
            Respect system preference — the “System” option follows{" "}
            <code>prefers-color-scheme</code>.
          </li>
        </ul>
      </AccessibilitySection>
    </ShowcaseShell>
  );
}
