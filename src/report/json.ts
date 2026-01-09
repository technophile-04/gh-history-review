/**
 * JSON report generator
 */

import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
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
 * Generate JSON report data structure
 */
export function generateJsonData(
  summary: MonthlySummary,
  activity: MonthlyActivity
): ReportData {
  return {
    repo: summary.repo,
    year: summary.year,
    month: summary.month,
    monthName: summary.monthName,
    summary: summary.summary,
    issueCount: summary.issueCount,
    prCount: summary.prCount,
    topIssues: activity.issues.slice(0, 10).map((issue) => ({
      number: issue.number,
      title: issue.title,
      url: issue.url,
    })),
    topPRs: activity.pullRequests.slice(0, 10).map((pr) => ({
      number: pr.number,
      title: pr.title,
      url: pr.url,
      merged: pr.merged,
    })),
    generatedAt: summary.generatedAt.toISOString(),
  };
}

/**
 * Write JSON report to file
 */
export function writeJsonReport(
  summary: MonthlySummary,
  activity: MonthlyActivity
): string {
  ensureOutputDir();

  const data = generateJsonData(summary, activity);
  const filename = getReportFilename(summary.repo.fullName, summary.year, summary.month, "json");
  const filepath = join(OUTPUT_DIR, filename);

  writeFileSync(filepath, JSON.stringify(data, null, 2));

  return filepath;
}

/**
 * Print JSON to stdout
 */
export function printJsonReport(summary: MonthlySummary, activity: MonthlyActivity): void {
  const data = generateJsonData(summary, activity);
  console.log(JSON.stringify(data, null, 2));
}
