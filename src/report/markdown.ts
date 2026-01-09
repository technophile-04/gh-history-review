/**
 * Markdown report generator
 */

import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { format } from "date-fns";
import type {
  MonthlySummary,
  MonthlyActivity,
  ReportData,
  ConsolidatedReport,
} from "../types.js";

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
  lines.push(
    `# ${summary.repo.fullName} - ${summary.monthName} ${summary.year}`
  );
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
      lines.push(
        `- ${state} [#${pr.number}: ${pr.title}](${pr.url}) (${status})`
      );
    }
    if (activity.pullRequests.length > 5) {
      lines.push(`- ... and ${activity.pullRequests.length - 5} more`);
    }
    lines.push("");
  }

  // Footer
  lines.push("---");
  lines.push("");
  lines.push(
    "*This report was generated using [gh-history](https://github.com/your-org/gh-history)*"
  );

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
  const filename = getReportFilename(
    summary.repo.fullName,
    summary.year,
    summary.month,
    "md"
  );
  const filepath = join(OUTPUT_DIR, filename);

  writeFileSync(filepath, content);

  return filepath;
}

/**
 * Print markdown to stdout
 */
export function printMarkdownReport(
  summary: MonthlySummary,
  activity: MonthlyActivity
): void {
  const content = generateMarkdownContent(summary, activity);
  console.log(content);
}

/**
 * Generate markdown content for consolidated report
 */
export function generateConsolidatedMarkdownContent(
  report: ConsolidatedReport
): string {
  const lines: string[] = [];

  // Header
  lines.push(`# GitHub Year-in-Review ${report.year}`);
  lines.push("");
  lines.push(`> Generated on ${format(new Date(report.generatedAt), "PPpp")}`);
  lines.push("");

  // Overall Stats
  lines.push("## Overview");
  lines.push("");
  lines.push(`- **Total Repositories:** ${report.totalRepositories}`);
  lines.push(`- **Total Issues:** ${report.totalIssues}`);
  lines.push(`- **Total Pull Requests:** ${report.totalPRs}`);
  lines.push("");

  // Repositories
  lines.push("## Repositories");
  lines.push("");

  for (const repo of report.repositories) {
    lines.push(`### ${repo.repo.fullName}`);
    lines.push("");
    lines.push(
      `**Stats:** ${repo.stats.totalIssues} issues, ${repo.stats.totalPRs} PRs`
    );
    lines.push("");
    lines.push(repo.metaSummary);
    lines.push("");

    // Monthly breakdown
    if (repo.months.length > 0) {
      lines.push("#### Monthly Breakdown");
      lines.push("");
      for (const month of repo.months) {
        lines.push(
          `**${month.monthName}:** ${month.issueCount} issues, ${month.prCount} PRs`
        );
        lines.push("");
        lines.push(month.summary);
        lines.push("");
      }
    }

    lines.push("---");
    lines.push("");
  }

  // Footer
  lines.push(
    "*This report was generated using [gh-history](https://github.com/your-org/gh-history)*"
  );

  return lines.join("\n");
}

/**
 * Write consolidated markdown report to file
 */
export function writeConsolidatedMarkdownReport(
  report: ConsolidatedReport,
  outputPath?: string
): string {
  ensureOutputDir();

  const content = generateConsolidatedMarkdownContent(report);
  let filename: string;
  if (outputPath) {
    // If outputPath ends with .json, replace with .md, otherwise append .md
    filename = outputPath.endsWith(".json")
      ? outputPath.replace(/\.json$/, ".md")
      : outputPath.endsWith(".md")
      ? outputPath
      : `${outputPath}.md`;
  } else {
    filename = `consolidated-${report.year}.md`;
  }
  const filepath = filename.includes("/")
    ? filename
    : join(OUTPUT_DIR, filename);

  writeFileSync(filepath, content);

  return filepath;
}
