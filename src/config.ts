/**
 * Configuration loading and validation using Zod
 */

import { config as dotenvConfig } from "dotenv";
import { z } from "zod";
import type { Config, LLMProvider, CLIOptions } from "./types.js";

// Load .env file
dotenvConfig();

const envSchema = z.object({
  GITHUB_TOKEN: z.string().min(1, "GITHUB_TOKEN is required"),
  OPENAI_API_KEY: z.string().optional(),
  ANTHROPIC_API_KEY: z.string().optional(),
  LLM_PROVIDER: z.enum(["openai", "anthropic"]).optional(),
  LLM_MODEL: z.string().optional(),
});

export type EnvConfig = z.infer<typeof envSchema>;

const DEFAULT_MODELS: Record<LLMProvider, string> = {
  openai: "gpt-4o-mini",
  anthropic: "claude-3-5-sonnet-20241022",
};

/**
 * Load and validate environment variables
 */
export function loadEnvConfig(): EnvConfig {
  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    const errors = result.error.issues
      .map((e) => `  - ${String(e.path.join("."))}: ${e.message}`)
      .join("\n");
    throw new Error(`Environment validation failed:\n${errors}`);
  }

  return result.data;
}

/**
 * Build final config from env + CLI options
 */
export function buildConfig(cliOptions: CLIOptions): Config {
  const env = loadEnvConfig();

  const provider: LLMProvider = cliOptions.provider ?? env.LLM_PROVIDER ?? "openai";
  const model = cliOptions.model ?? env.LLM_MODEL ?? DEFAULT_MODELS[provider];

  // Validate that we have the required API key for the chosen provider
  if (provider === "openai" && !env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is required when using OpenAI provider");
  }
  if (provider === "anthropic" && !env.ANTHROPIC_API_KEY) {
    throw new Error("ANTHROPIC_API_KEY is required when using Anthropic provider");
  }

  return {
    githubToken: env.GITHUB_TOKEN,
    llmProvider: provider,
    llmModel: model,
    openaiApiKey: env.OPENAI_API_KEY,
    anthropicApiKey: env.ANTHROPIC_API_KEY,
  };
}

/**
 * Parse months string (e.g., "1,2,3" or "1-6") into array of month numbers
 */
export function parseMonths(monthsStr: string | undefined, year: number): number[] {
  if (!monthsStr) {
    // Default: all months up to current month if current year, else all 12
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1;

    if (year === currentYear) {
      return Array.from({ length: currentMonth }, (_, i) => i + 1);
    }
    return Array.from({ length: 12 }, (_, i) => i + 1);
  }

  // Handle range (e.g., "1-6")
  if (monthsStr.includes("-")) {
    const [start, end] = monthsStr.split("-").map(Number);
    if (isNaN(start) || isNaN(end) || start < 1 || end > 12 || start > end) {
      throw new Error(`Invalid month range: ${monthsStr}. Use format like "1-6"`);
    }
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  }

  // Handle comma-separated (e.g., "1,2,3")
  const months = monthsStr.split(",").map((m) => parseInt(m.trim(), 10));
  for (const m of months) {
    if (isNaN(m) || m < 1 || m > 12) {
      throw new Error(`Invalid month: ${m}. Months must be 1-12`);
    }
  }
  return months;
}

/**
 * Parse repos string into array
 */
export function parseReposArg(reposStr: string | undefined): string[] | undefined {
  if (!reposStr) return undefined;
  return reposStr.split(",").map((r) => r.trim());
}
