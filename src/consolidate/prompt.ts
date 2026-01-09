/**
 * Prompt templates for consolidated meta-summary generation
 */

import type { ReportData, ConsolidatedMonth } from "../types.js";

/**
 * System prompt for meta-summary generation
 */
export const META_SUMMARY_SYSTEM_PROMPT = `You are a technical writer creating yearly summaries of GitHub repository activity. Your task is to synthesize multiple monthly summaries into a cohesive yearly overview.

Guidelines:
- Be concise and highlight the most significant accomplishments
- Identify patterns and themes across the year
- Focus on completed work (merged PRs) and resolved issues
- Note any major releases, features, or milestones
- Keep the summary to 3-5 bullet points maximum
- Do not make up information not present in the data
- If a month had no activity, don't mention it`;

/**
 * Generate the user prompt for meta-summary
 */
export function generateMetaSummaryPrompt(
  repoFullName: string,
  year: number,
  months: ConsolidatedMonth[]
): string {
  const monthSummaries = months
    .map((m) => {
      return `### ${m.monthName} ${year}
- Issues: ${m.issueCount}, PRs: ${m.prCount}
${m.summary}`;
    })
    .join("\n\n");

  return `Create a yearly summary for the GitHub repository **${repoFullName}** for the year ${year}.

Below are the monthly summaries:

${monthSummaries}

Based on these monthly summaries, provide a condensed yearly overview (3-5 bullet points) covering:
1. Key accomplishments and features delivered
2. Major themes or focus areas throughout the year
3. Notable milestones or patterns

Keep it concise and focus on the most impactful work.`;
}

/**
 * Generate dry-run output showing what would be summarized
 */
export function generateDryRunOutput(
  repoFullName: string,
  year: number,
  months: ConsolidatedMonth[]
): string {
  const totalIssues = months.reduce((sum, m) => sum + m.issueCount, 0);
  const totalPRs = months.reduce((sum, m) => sum + m.prCount, 0);
  const activeMonths = months.filter(
    (m) => m.issueCount > 0 || m.prCount > 0
  ).length;

  return `[DRY RUN] Would generate meta-summary for ${repoFullName} (${year}):
  - ${activeMonths} months with activity
  - ${totalIssues} total issues
  - ${totalPRs} total PRs`;
}
