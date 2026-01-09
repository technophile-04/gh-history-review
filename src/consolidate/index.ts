/**
 * Consolidate module exports
 */

export {
  readAllReports,
  readReportsByYear,
  groupReportsByRepo,
  getUniqueRepos,
  getAvailableYears,
} from "./reader.js";

export {
  META_SUMMARY_SYSTEM_PROMPT,
  generateMetaSummaryPrompt,
  generateDryRunOutput,
} from "./prompt.js";

export { consolidateReports, writeConsolidatedReport } from "./consolidate.js";
