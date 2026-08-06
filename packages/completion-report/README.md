# @platform/completion-report

Engineering contract for structured agent run reports (`RunCompletionSummary`).

## Installation

Workspace package (already wired in the monorepo):

```json
{
  "dependencies": {
    "@platform/completion-report": "workspace:*"
  }
}
```

Published consumers may import via `@songara/pwa-base/completion-report`.

## Types

```typescript
import type {
  FileAreaGroup,
  RunCompletionSummary,
  TestResultItem,
  TestResultStatus,
} from "@platform/completion-report";
```

`RunCompletionSummary` is schema version 2. Markdown is export-only — never the source of truth for new ingest.

## Normalise and export

```typescript
import {
  normaliseCompletionSummary,
  mergeCompletionSummary,
  formatCompletionSummaryMarkdown,
  isStructuredCompletionSummary,
  completionSummaryFromPayload,
} from "@platform/completion-report";

const summary = normaliseCompletionSummary({
  overview: "What shipped and why.",
  executiveSummary: "One-line headline",
  testingPerformed: [{ check: "Unit", status: "pass", detail: "" }],
});

const md = formatCompletionSummaryMarkdown(summary);
```

## Section registry and validation

```typescript
import {
  COMPLETION_REPORT_SECTIONS,
  validateCompletionSummary,
  validateCompletionSummaryInput,
  validateCompletionReportPipeline,
  listPersistedReportSectionTitles,
} from "@platform/completion-report";
```

`COMPLETION_REPORT_SECTIONS` defines display order and required/recommended/optional persisted sections. Validation returns errors (structural) and warnings (missing sections, thin overview, unknown fields).

## Artifact capture

Screenshot capture uploads to the telemetry HTTP service and is **not** part of this package. Use `pnpm capture:artifacts` (delegates to `@platform/telemetry` until the telemetry product is extracted).
