/**
 * Vercel AI SDK provider setup for OpenAI and Anthropic
 */

import { createOpenAI } from "@ai-sdk/openai";
import { createAnthropic } from "@ai-sdk/anthropic";
import type { LanguageModel } from "ai";
import type { Config, LLMProvider } from "../types.js";

/**
 * Get the appropriate language model based on config
 */
export function getLanguageModel(config: Config): LanguageModel {
  if (config.llmProvider === "anthropic") {
    const anthropic = createAnthropic({
      apiKey: config.anthropicApiKey,
    });
    return anthropic(config.llmModel);
  }

  // Default to OpenAI
  const openai = createOpenAI({
    apiKey: config.openaiApiKey,
  });
  return openai(config.llmModel);
}

/**
 * Get provider display name
 */
export function getProviderDisplayName(provider: LLMProvider): string {
  return provider === "anthropic" ? "Anthropic" : "OpenAI";
}
