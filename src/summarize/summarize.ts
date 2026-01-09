/**
 * Core summarization logic using Vercel AI SDK
 */

import { generateText } from "ai";
import type {
  Config,
  LLMPayload,
  MonthlySummary,
  MonthlyActivity,
} from "../types.js";
import { getLanguageModel } from "./provider.js";
import {
  SYSTEM_PROMPT,
  generateUserPrompt,
  generateEmptyActivityResponse,
} from "./prompt.js";
import { prepareLLMPayload, getMonthName, hasActivity } from "../grouping.js";

/**
 * Summarize monthly activity using LLM
 */
export async function summarizeActivity(
  activity: MonthlyActivity,
  config: Config
): Promise<MonthlySummary> {
  const payload = prepareLLMPayload(activity);

  // Handle empty activity without calling LLM
  if (!hasActivity(activity)) {
    return {
      repo: activity.repo,
      year: activity.year,
      month: activity.month,
      monthName: getMonthName(activity.month),
      summary: generateEmptyActivityResponse(payload),
      issueCount: 0,
      prCount: 0,
      generatedAt: new Date(),
    };
  }

  const model = getLanguageModel(config);
  const userPrompt = generateUserPrompt(payload);

  const result = await generateText({
    model,
    system: SYSTEM_PROMPT,
    prompt: userPrompt,
    temperature: 0.3, // Lower temperature for more consistent, factual output
  });

  return {
    repo: activity.repo,
    year: activity.year,
    month: activity.month,
    monthName: getMonthName(activity.month),
    summary: result.text,
    issueCount: activity.issues.length,
    prCount: activity.pullRequests.length,
    generatedAt: new Date(),
  };
}

/**
 * Dry run - prepare payload without calling LLM
 */
export function dryRunSummarize(activity: MonthlyActivity): {
  payload: LLMPayload;
  wouldCallLLM: boolean;
  prompt: string;
} {
  const payload = prepareLLMPayload(activity);
  const wouldCallLLM = hasActivity(activity);
  const prompt = wouldCallLLM ? generateUserPrompt(payload) : "";

  return { payload, wouldCallLLM, prompt };
}
