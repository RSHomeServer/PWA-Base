import { Button, EmptyState, Spinner } from "@platform/ui";
import { AccessibilitySection } from "../components/AccessibilitySection.js";
import { ExampleBlock } from "../components/ExampleBlock.js";
import { PropsTable } from "../components/PropsTable.js";
import { ShowcaseMotion } from "../components/ShowcaseMotion.js";
import { ShowcaseSection } from "../components/ShowcaseSection.js";
import { ShowcaseShell } from "../components/ShowcaseShell.js";
import { UsageNote } from "../components/UsageNote.js";
import motionStyles from "../components/ShowcaseMotion.module.css";

function InboxIcon() {
  return (
    <svg width="40" height="40" viewBox="0 0 40 40" aria-hidden="true">
      <rect
        x="6"
        y="10"
        width="28"
        height="22"
        rx="3"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      />
      <path d="M6 16h28" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

export function EmptyStatePage() {
  return (
    <ShowcaseShell
      title="EmptyState"
      summary="Communicate why content is missing and offer a next step. Use when lists, tables, or canvases have no data yet."
    >
      <ShowcaseSection
        title="Basic"
        description="Title is required; description and action slots are optional."
      >
        <ExampleBlock title="EmptyState basic" center minHeight>
          <ShowcaseMotion>
            <EmptyState
              title="No results yet"
              description="Try adjusting filters or importing data to get started."
            />
          </ShowcaseMotion>
        </ExampleBlock>
      </ShowcaseSection>

      <ShowcaseSection
        title="With media and action"
        description="Add an icon and a button to guide users toward recovery."
      >
        <ExampleBlock title="EmptyState with action" center minHeight muted>
          <ShowcaseMotion>
            <EmptyState
              title="Inbox zero"
              description="New messages will appear here when they arrive."
              media={<InboxIcon />}
              action={
                <Button variant="secondary" size="sm">
                  Refresh
                </Button>
              }
            />
          </ShowcaseMotion>
        </ExampleBlock>
      </ShowcaseSection>

      <ShowcaseSection
        title="Loading hand-off"
        description="Transition from EmptyState to Spinner while fetching."
      >
        <ExampleBlock title="Loading placeholder" center minHeight>
          <ShowcaseMotion>
            <EmptyState
              title="Fetching datasets"
              description="This preview uses EmptyState copy with a Spinner in the media slot."
              media={
                <div className={motionStyles.fadeEnter}>
                  <Spinner size="lg" label="Loading datasets" />
                </div>
              }
            />
          </ShowcaseMotion>
        </ExampleBlock>
      </ShowcaseSection>

      <ShowcaseSection title="Intended usage">
        <UsageNote>{`import { EmptyState, Button } from "@platform/ui";

<EmptyState
  title="No files"
  description="Upload a CSV to begin analysis."
  action={<Button>Upload file</Button>}
/>`}</UsageNote>
      </ShowcaseSection>

      <ShowcaseSection title="Props">
        <PropsTable
          rows={[
            { name: "title", type: "string", description: "Primary message (required)." },
            { name: "description", type: "string", description: "Supporting copy." },
            { name: "media", type: "ReactNode", description: "Icon or illustration slot." },
            { name: "action", type: "ReactNode", description: "Buttons or links slot." },
          ]}
        />
      </ShowcaseSection>

      <AccessibilitySection>
        <ul>
          <li>
            EmptyState title renders as a heading — maintain logical heading order on the page.
          </li>
          <li>Keep descriptions concise; action buttons need clear, verb-first labels.</li>
          <li>
            When using Spinner in the media slot, ensure loading status is also announced elsewhere
            if needed.
          </li>
          <li>
            Do not use EmptyState for error states that require urgent attention — pair with alert
            patterns instead.
          </li>
        </ul>
      </AccessibilitySection>
    </ShowcaseShell>
  );
}
