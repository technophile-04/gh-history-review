/**
 * Markdown report generator
 */

import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { format } from "date-fns";
import type { MonthlySummary, MonthlyActivity, ReportData } from "../types.js";

const OUTPUT_DIR = "output";

/**
 * Ensure output directory exists
 */
function ensureOutputDir(): void {
  if (!existsSync(OUTPUT_DIR)) {
    mkdirSync(OUTPUT_DIR, { recursive: true });
  }
}

/**
 * Generate filename for a report
 */
function getReportFilename(
  repoFullName: string,
  year: number,
  month: number,
  extension: string
): string {
  const safeRepoName = repoFullName.replace("/", "-");
  const monthStr = month.toString().padStart(2, "0");
  return `${year}-${monthStr}-${safeRepoName}.${extension}`;
}

/**
 * Generate markdown report content
 */
export function generateMarkdownContent(
  summary: MonthlySummary,
  activity: MonthlyActivity
): string {
  const lines: string[] = [];

  // Header
  lines.push(`# ${summary.repo.fullName} - ${summary.monthName} ${summary.year}`);
  lines.push("");
  lines.push(`> Generated on ${format(summary.generatedAt, "PPpp")}`);
  lines.push("");

  // Stats
  lines.push("## Activity Overview");
  lines.push("");
  lines.push(`- **Issues Created:** ${summary.issueCount}`);
  lines.push(`- **Pull Requests Created:** ${summary.prCount}`);
  lines.push("");

  // Summary
  lines.push("## Summary");
  lines.push("");
  lines.push(summary.summary);
  lines.push("");

  // Top Issues (if any)
  if (activity.issues.length > 0) {
    lines.push("## Notable Issues");
    lines.push("");
    const topIssues = activity.issues.slice(0, 5);
    for (const issue of topIssues) {
      const state = issue.state === "closed" ? "✅" : "🔴";
      lines.push(`- ${state} [#${issue.number}: ${issue.title}](${issue.url})`);
    }
    if (activity.issues.length > 5) {
      lines.push(`- ... and ${activity.issues.length - 5} more`);
    }
    lines.push("");
  }

  // Top PRs (if any)
  if (activity.pullRequests.length > 0) {
    lines.push("## Notable Pull Requests");
    lines.push("");
    const topPRs = activity.pullRequests.slice(0, 5);
    for (const pr of topPRs) {
      const state = pr.merged ? "🟣" : pr.state === "closed" ? "🔴" : "🟢";
      const status = pr.merged ? "merged" : pr.state;
      lines.push(`- ${state} [#${pr.number}: ${pr.title}](${pr.url}) (${status})`);
    }
    if (activity.pullRequests.length > 5) {
      lines.push(`- ... and ${activity.pullRequests.length - 5} more`);
    }
    lines.push("");
  }

  // Footer
  lines.push("---");
  lines.push("");
  lines.push("*This report was generated using [gh-history](https://github.com/your-org/gh-history)*");

  return lines.join("\n");
}

/**
 * Write markdown report to file
 */
export function writeMarkdownReport(
  summary: MonthlySummary,
  activity: MonthlyActivity
): string {
  ensureOutputDir();

  const content = generateMarkdownContent(summary, activity);
  const filename = getReportFilename(summary.repo.fullName, summary.year, summary.month, "md");
  const filepath = join(OUTPUT_DIR, filename);

  writeFileSync(filepath, content);

  return filepath;
}

/**
 * Print markdown to stdout
 */
export function printMarkdownReport(summary: MonthlySummary, activity: MonthlyActivity): void {
  const content = generateMarkdownContent(summary, activity);
  console.log(content);
}
