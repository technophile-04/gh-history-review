/**
 * Main consolidation logic
 */

import { generateText } from "ai";
import { writeFileSync } from "node:fs";
import { join } from "node:path";
import type {
  Config,
  ReportData,
  ConsolidatedRepo,
  ConsolidatedReport,
  ConsolidatedMonth,
} from "../types.js";
import { getLanguageModel } from "../summarize/provider.js";
import { readReportsByYear, groupReportsByRepo } from "./reader.js";
import {
  META_SUMMARY_SYSTEM_PROMPT,
  generateMetaSummaryPrompt,
  generateDryRunOutput,
} from "./prompt.js";

const OUTPUT_DIR = "output";

/**
 * Convert ReportData to ConsolidatedMonth
 */
function toConsolidatedMonth(report: ReportData): ConsolidatedMonth {
  return {
    month: report.month,
    monthName: report.monthName,
    summary: report.summary,
    issueCount: report.issueCount,
    prCount: report.prCount,
  };
}

/**
 * Generate meta-summary for a repository using LLM
 */
async function generateRepoMetaSummary(
  repoFullName: string,
  year: number,
  months: ConsolidatedMonth[],
  config: Config
): Promise<string> {
  const model = getLanguageModel(config);
  const prompt = generateMetaSummaryPrompt(repoFullName, year, months);

  const result = await generateText({
    model,
    system: META_SUMMARY_SYSTEM_PROMPT,
    prompt,
    temperature: 0.3,
  });

  return result.text;
}

/**
 * Consolidate reports for a year
 */
export async function consolidateReports(
  year: number,
  config: Config,
  dryRun: boolean = false
): Promise<ConsolidatedReport> {
  const reports = readReportsByYear(year);

  if (reports.length === 0) {
    throw new Error(`No reports found for year ${year}`);
  }

  const grouped = groupReportsByRepo(reports);
  const repositories: ConsolidatedRepo[] = [];

  let totalIssues = 0;
  let totalPRs = 0;

  for (const [repoFullName, repoReports] of grouped) {
    const months = repoReports.map(toConsolidatedMonth);
    const repoTotalIssues = months.reduce((sum, m) => sum + m.issueCount, 0);
    const repoTotalPRs = months.reduce((sum, m) => sum + m.prCount, 0);

    totalIssues += repoTotalIssues;
    totalPRs += repoTotalPRs;

    let metaSummary: string;

    if (dryRun) {
      metaSummary = generateDryRunOutput(repoFullName, year, months);
    } else {
      metaSummary = await generateRepoMetaSummary(
        repoFullName,
        year,
        months,
        config
      );
    }

    repositories.push({
      repo: repoReports[0].repo,
      metaSummary,
      stats: {
        totalIssues: repoTotalIssues,
        totalPRs: repoTotalPRs,
      },
      months,
    });
  }

  // Sort repositories by total activity (PRs + issues) descending
  repositories.sort(
    (a, b) =>
      b.stats.totalIssues +
      b.stats.totalPRs -
      (a.stats.totalIssues + a.stats.totalPRs)
  );

  return {
    generatedAt: new Date().toISOString(),
    year,
    totalRepositories: repositories.length,
    totalIssues,
    totalPRs,
    repositories,
  };
}

/**
 * Write consolidated report to file
 */
export function writeConsolidatedReport(
  report: ConsolidatedReport,
  outputPath?: string
): string {
  const filename = outputPath || `consolidated-${report.year}.json`;
  const filepath = filename.includes("/") ? filename : join(OUTPUT_DIR, filename);

  writeFileSync(filepath, JSON.stringify(report, null, 2));

  return filepath;
}
