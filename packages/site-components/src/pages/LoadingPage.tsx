import { useEffect, useState } from "react";
import { Button, Skeleton, Spinner, Stack } from "@platform/ui";
import { AccessibilitySection } from "../components/AccessibilitySection.js";
import { ExampleBlock } from "../components/ExampleBlock.js";
import { PropsTable } from "../components/PropsTable.js";
import { ShowcaseSection } from "../components/ShowcaseSection.js";
import { ShowcaseShell } from "../components/ShowcaseShell.js";
import { ShowcaseMotion } from "../components/ShowcaseMotion.js";
import { UsageNote } from "../components/UsageNote.js";
import motionStyles from "../components/ShowcaseMotion.module.css";

export function LoadingPage() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!loading) {
      return;
    }

    const timer = window.setTimeout(() => setLoading(false), 2400);
    return () => window.clearTimeout(timer);
  }, [loading]);

  const handleReload = () => {
    setLoading(true);
    window.setTimeout(() => setLoading(false), 2400);
  };

  return (
    <ShowcaseShell
      title="Spinner & Skeleton"
      summary="Indicate in-progress work with Spinner and preserve layout with Skeleton placeholders."
    >
      <ShowcaseSection
        title="Spinner sizes"
        description="Spinner exposes role=status with an accessible label."
      >
        <ExampleBlock title="Spinner sizes" center>
          <Spinner size="sm" label="Loading small" />
          <Spinner size="md" label="Loading medium" />
          <Spinner size="lg" label="Loading large" />
        </ExampleBlock>
      </ShowcaseSection>

      <ShowcaseSection
        title="Skeleton shapes"
        description="Skeleton blocks are aria-hidden; pair with visible status text."
      >
        <ExampleBlock title="Skeleton shapes" column stretch>
          <Stack direction="row" gap="md" align="center">
            <Skeleton circle style={{ width: "2.5rem", height: "2.5rem" }} />
            <Stack gap="sm" style={{ flex: 1 }}>
              <Skeleton style={{ height: "0.875rem", width: "60%" }} />
              <Skeleton style={{ height: "0.75rem", width: "40%" }} />
            </Stack>
          </Stack>
          <Skeleton style={{ height: "6rem", width: "100%" }} />
        </ExampleBlock>
      </ShowcaseSection>

      <ShowcaseSection
        title="Interactive demo"
        description="Simulates a card that loads, then reveals content. Click reload to replay."
      >
        <ExampleBlock title="Loading demo" column stretch muted minHeight>
          <Stack direction="row" gap="md" justify="between" align="center">
            <strong>Profile preview</strong>
            <Button variant="secondary" size="sm" onClick={handleReload}>
              Reload
            </Button>
          </Stack>

          <ShowcaseMotion key={loading ? "loading" : "loaded"}>
            {loading ? (
              <Stack gap="md" aria-busy="true" aria-live="polite">
                <Stack direction="row" gap="md" align="center">
                  <Skeleton circle style={{ width: "3rem", height: "3rem" }} />
                  <Stack gap="sm" style={{ flex: 1 }}>
                    <Skeleton style={{ height: "1rem", width: "50%" }} />
                    <Skeleton style={{ height: "0.75rem", width: "35%" }} />
                  </Stack>
                </Stack>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "center",
                    padding: "var(--space-4)",
                  }}
                >
                  <Spinner label="Loading profile" />
                </div>
              </Stack>
            ) : (
              <Stack direction="row" gap="md" align="center" aria-live="polite">
                <div
                  className={motionStyles.fadeEnter}
                  style={{
                    width: "3rem",
                    height: "3rem",
                    borderRadius: "999px",
                    background: "var(--color-accent)",
                    color: "var(--color-accent-foreground)",
                    display: "grid",
                    placeItems: "center",
                    fontWeight: "var(--font-weight-semibold)",
                  }}
                  aria-hidden="true"
                >
                  SS
                </div>
                <Stack gap="none">
                  <strong>Songara Studio</strong>
                  <span style={{ color: "var(--color-muted)", fontSize: "var(--font-size-sm)" }}>
                    Design system maintainer
                  </span>
                </Stack>
              </Stack>
            )}
          </ShowcaseMotion>
        </ExampleBlock>
      </ShowcaseSection>

      <ShowcaseSection title="Intended usage">
        <UsageNote>{`import { Spinner, Skeleton } from "@platform/ui";

{isLoading ? (
  <>
    <Spinner label="Loading chart" />
    <Skeleton style={{ height: "12rem" }} />
  </>
) : (
  <Chart data={data} />
)}`}</UsageNote>
      </ShowcaseSection>

      <ShowcaseSection title="Props">
        <PropsTable
          rows={[
            {
              name: "size",
              type: '"sm" | "md" | "lg"',
              defaultValue: '"md"',
              description: "Spinner diameter.",
            },
            {
              name: "label",
              type: "string",
              defaultValue: '"Loading"',
              description: "Accessible name for Spinner.",
            },
            {
              name: "circle",
              type: "boolean",
              defaultValue: "false",
              description: "Skeleton: render circular placeholder.",
            },
          ]}
        />
      </ShowcaseSection>

      <AccessibilitySection>
        <ul>
          <li>
            <code>Spinner</code> uses <code>role="status"</code> — always pass a meaningful{" "}
            <code>label</code>.
          </li>
          <li>
            Mark loading regions with <code>aria-busy="true"</code> and use{" "}
            <code>aria-live="polite"</code> for updates.
          </li>
          <li>
            Skeleton placeholders are decorative; provide visible loading text for screen readers.
          </li>
          <li>
            Respect <code>prefers-reduced-motion</code> — avoid relying on animation alone for state
            changes.
          </li>
        </ul>
      </AccessibilitySection>
    </ShowcaseShell>
  );
}
