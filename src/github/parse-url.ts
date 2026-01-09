/**
 * Parse GitHub URLs to extract owner/repo
 * Handles various URL formats:
 * - https://github.com/owner/repo
 * - https://github.com/owner/repo/
 * - https://github.com/owner/repo/pull/123
 * - https://github.com/owner/repo/issues/456
 * - https://github.com/owner/repo/tree/main
 * - owner/repo (shorthand)
 */

import type { RepoIdentifier } from "../types.js";

const GITHUB_URL_REGEX = /^(?:https?:\/\/)?(?:www\.)?github\.com\/([^/]+)\/([^/]+)/;
const SHORTHAND_REGEX = /^([^/]+)\/([^/]+)$/;

/**
 * Parse a GitHub URL or shorthand into owner/repo
 */
export function parseGitHubUrl(input: string): RepoIdentifier {
  const trimmed = input.trim();

  // Try full URL first
  const urlMatch = trimmed.match(GITHUB_URL_REGEX);
  if (urlMatch) {
    const owner = urlMatch[1];
    const repo = urlMatch[2].replace(/\.git$/, ""); // Remove .git suffix if present
    return {
      owner,
      repo,
      fullName: `${owner}/${repo}`,
    };
  }

  // Try shorthand (owner/repo)
  const shorthandMatch = trimmed.match(SHORTHAND_REGEX);
  if (shorthandMatch) {
    const owner = shorthandMatch[1];
    const repo = shorthandMatch[2].replace(/\.git$/, "");
    return {
      owner,
      repo,
      fullName: `${owner}/${repo}`,
    };
  }

  throw new Error(`Invalid GitHub repository format: "${input}". Expected URL or owner/repo format.`);
}

/**
 * Parse multiple GitHub URLs/shorthands
 */
export function parseGitHubUrls(inputs: string[]): RepoIdentifier[] {
  return inputs.map(parseGitHubUrl);
}

/**
 * Deduplicate repos by fullName
 */
export function dedupeRepos(repos: RepoIdentifier[]): RepoIdentifier[] {
  const seen = new Set<string>();
  return repos.filter((repo) => {
    const key = repo.fullName.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
