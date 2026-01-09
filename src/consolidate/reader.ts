/**
 * Reader module for parsing JSON reports from output directory
 */

import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import type { ReportData, RepoIdentifier } from "../types.js";

const OUTPUT_DIR = "output";

// Regex to parse filename: YYYY-MM-owner-repo.json
const FILENAME_REGEX = /^(\d{4})-(\d{2})-(.+)\.json$/;

/**
 * Read all JSON report files from the output directory
 * Excludes consolidated report files
 */
export function readAllReports(): ReportData[] {
  const files = readdirSync(OUTPUT_DIR).filter(
    (f) => f.endsWith(".json") && !f.startsWith("consolidated-")
  );
  const reports: ReportData[] = [];

  for (const file of files) {
    try {
      const filepath = join(OUTPUT_DIR, file);
      const content = readFileSync(filepath, "utf-8");
      const data = JSON.parse(content) as ReportData;
      
      // Validate that this is a monthly report (has repo.fullName)
      if (!data.repo?.fullName) {
        console.warn(`Skipping ${file}: not a valid monthly report`);
        continue;
      }
      
      reports.push(data);
    } catch (error) {
      console.warn(`Failed to parse ${file}: ${(error as Error).message}`);
    }
  }

  return reports;
}

/**
 * Read reports filtered by year
 */
export function readReportsByYear(year: number): ReportData[] {
  const allReports = readAllReports();
  return allReports.filter((r) => r.year === year);
}

/**
 * Group reports by repository
 */
export function groupReportsByRepo(
  reports: ReportData[]
): Map<string, ReportData[]> {
  const grouped = new Map<string, ReportData[]>();

  for (const report of reports) {
    const key = report.repo.fullName;
    const existing = grouped.get(key) || [];
    existing.push(report);
    grouped.set(key, existing);
  }

  // Sort each repo's reports by month
  for (const [key, repoReports] of grouped) {
    grouped.set(
      key,
      repoReports.sort((a, b) => a.month - b.month)
    );
  }

  return grouped;
}

/**
 * Get unique repos from reports
 */
export function getUniqueRepos(reports: ReportData[]): RepoIdentifier[] {
  const seen = new Set<string>();
  const repos: RepoIdentifier[] = [];

  for (const report of reports) {
    if (!seen.has(report.repo.fullName)) {
      seen.add(report.repo.fullName);
      repos.push(report.repo);
    }
  }

  return repos;
}

/**
 * Get available years from reports
 */
export function getAvailableYears(): number[] {
  const reports = readAllReports();
  const years = new Set<number>();

  for (const report of reports) {
    years.add(report.year);
  }

  return Array.from(years).sort();
}
