/**
 * Prompt templates for LLM summarization
 */

import type { LLMPayload } from "../types.js";
import { formatPayloadForPrompt } from "../grouping.js";

/**
 * System prompt for the summarization task
 */
export const SYSTEM_PROMPT = `You are a technical writer analyzing GitHub repository activity. Your task is to summarize the work done in a specific month based on issues and pull requests.

Guidelines:
- Be concise and factual
- Focus on what was accomplished, not process details
- Group related items into themes when possible
- Use bullet points for clarity
- Highlight merged PRs as completed work
- Note significant bug fixes separately
- If there's little activity, keep the summary brief
- Do not make up information not present in the data`;

/**
 * Generate the user prompt for summarization
 */
export function generateUserPrompt(payload: LLMPayload): string {
  const activityText = formatPayloadForPrompt(payload);

  return `Analyze the following GitHub activity for ${payload.repo} in ${payload.monthName} ${payload.year}.

${activityText}

Based on this activity, provide a concise summary (3-5 bullet points) covering:
1. Major features or improvements worked on
2. Bug fixes (if any notable ones)
3. Overall themes or patterns

If there was no activity, simply state that there was no activity this month.`;
}

/**
 * Generate prompt for empty activity
 */
export function generateEmptyActivityResponse(payload: LLMPayload): string {
  return `No GitHub activity (issues or pull requests) was recorded for ${payload.repo} in ${payload.monthName} ${payload.year}.`;
}
