export type {
  FileAreaGroup,
  FileChangeItem,
  RunCompletionSummary,
  TestResultItem,
  TestResultStatus,
} from "./types.js";

export {
  COMPLETION_SUMMARY_SCHEMA_VERSION,
  completionSummaryFromPayload,
  formatCompletionSummaryMarkdown,
  isStructuredCompletionSummary,
  mergeCompletionSummary,
  normaliseCompletionSummary,
  parseCompletionSummaryFromMarkdown,
} from "./completion-summary.js";

export {
  COMPLETION_REPORT_SECTIONS,
  listPersistedReportSectionTitles,
  validateCompletionReportPipeline,
  validateCompletionSummary,
  validateCompletionSummaryInput,
} from "./completion-report-contract.js";

export type {
  CompletionReportSectionDefinition,
  CompletionReportValidationIssue,
  CompletionReportValidationResult,
  ReportSectionPresence,
  ReportSectionStorage,
} from "./completion-report-contract.js";
