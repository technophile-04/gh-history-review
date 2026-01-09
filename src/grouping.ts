/**
 * Group items by month and prepare LLM payload
 */

import { format } from "date-fns";
import type { MonthlyActivity, LLMPayload, LLMPayloadItem } from "./types.js";

const EXCERPT_LENGTH = 200;

/**
 * Truncate text to a maximum length
 */
function truncate(text: string | null, maxLength: number): string {
  if (!text) return "";
  const cleaned = text.replace(/\r\n/g, "\n").replace(/\n+/g, " ").trim();
  if (cleaned.length <= maxLength) return cleaned;
  return cleaned.slice(0, maxLength - 3) + "...";
}

/**
 * Get month name from month number (1-12)
 */
export function getMonthName(month: number): string {
  const date = new Date(2024, month - 1, 1);
  return format(date, "MMMM");
}

/**
 * Prepare LLM payload from monthly activity
 */
export function prepareLLMPayload(activity: MonthlyActivity): LLMPayload {
  const items: LLMPayloadItem[] = [];

  // Add issues
  for (const issue of activity.issues) {
    items.push({
      type: "issue",
      number: issue.number,
      title: issue.title,
      labels: issue.labels,
      state: issue.state,
      excerpt: truncate(issue.body, EXCERPT_LENGTH),
    });
  }

  // Add PRs
  for (const pr of activity.pullRequests) {
    items.push({
      type: "pr",
      number: pr.number,
      title: pr.title,
      labels: pr.labels,
      state: pr.merged ? "merged" : pr.state,
      excerpt: truncate(pr.body, EXCERPT_LENGTH),
      merged: pr.merged,
    });
  }

  return {
    repo: activity.repo.fullName,
    year: activity.year,
    month: activity.month,
    monthName: getMonthName(activity.month),
    issueCount: activity.issues.length,
    prCount: activity.pullRequests.length,
    items,
  };
}

/**
 * Format LLM payload as text for the prompt
 */
export function formatPayloadForPrompt(payload: LLMPayload): string {
  const lines: string[] = [];

  lines.push(`Repository: ${payload.repo}`);
  lines.push(`Period: ${payload.monthName} ${payload.year}`);
  lines.push("");

  // Issues section
  const issues = payload.items.filter((i) => i.type === "issue");
  lines.push(`## Issues (${issues.length} total)`);
  if (issues.length === 0) {
    lines.push("No issues created this month.");
  } else {
    for (const issue of issues) {
      const labels = issue.labels.length > 0 ? ` [${issue.labels.join(", ")}]` : "";
      lines.push(`- #${issue.number}: ${issue.title}${labels} (${issue.state})`);
      if (issue.excerpt) {
        lines.push(`  > ${issue.excerpt}`);
      }
    }
  }
  lines.push("");

  // PRs section
  const prs = payload.items.filter((i) => i.type === "pr");
  lines.push(`## Pull Requests (${prs.length} total)`);
  if (prs.length === 0) {
    lines.push("No pull requests created this month.");
  } else {
    for (const pr of prs) {
      const labels = pr.labels.length > 0 ? ` [${pr.labels.join(", ")}]` : "";
      const status = pr.merged ? "merged" : pr.state;
      lines.push(`- #${pr.number}: ${pr.title}${labels} (${status})`);
      if (pr.excerpt) {
        lines.push(`  > ${pr.excerpt}`);
      }
    }
  }

  return lines.join("\n");
}

/**
 * Check if activity has any items worth summarizing
 */
export function hasActivity(activity: MonthlyActivity): boolean {
  return activity.issues.length > 0 || activity.pullRequests.length > 0;
}
