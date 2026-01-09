/**
 * Octokit client wrapper with rate limit handling
 */

import { Octokit } from "octokit";
import type { Config } from "../types.js";

let octokitInstance: Octokit | null = null;

/**
 * Get or create the Octokit instance
 */
export function getOctokit(config: Config): Octokit {
  if (!octokitInstance) {
    octokitInstance = new Octokit({
      auth: config.githubToken,
    });
  }
  return octokitInstance;
}

/**
 * Check rate limit status
 */
export async function checkRateLimit(octokit: Octokit): Promise<{
  remaining: number;
  limit: number;
  resetAt: Date;
}> {
  const { data } = await octokit.rest.rateLimit.get();
  return {
    remaining: data.rate.remaining,
    limit: data.rate.limit,
    resetAt: new Date(data.rate.reset * 1000),
  };
}

/**
 * Reset the client (useful for testing)
 */
export function resetClient(): void {
  octokitInstance = null;
}
