/**
 * Paginated GitHub issue/PR fetcher with date filtering
 */

import type { Octokit } from "octokit";
import { startOfMonth, endOfMonth, format } from "date-fns";
import type {
  RepoIdentifier,
  GitHubIssue,
  GitHubPullRequest,
  MonthlyActivity,
} from "../types.js";

/**
 * Fetch all issues for a repo within a date range
 */
export async function fetchIssues(
  octokit: Octokit,
  repo: RepoIdentifier,
  since: Date,
  until: Date
): Promise<GitHubIssue[]> {
  const issues: GitHubIssue[] = [];

  const iterator = octokit.paginate.iterator(octokit.rest.issues.listForRepo, {
    owner: repo.owner,
    repo: repo.repo,
    state: "all",
    since: since.toISOString(),
    per_page: 100,
    sort: "created",
    direction: "desc",
  });

  for await (const { data } of iterator) {
    for (const item of data) {
      // Skip pull requests (they come through this API too)
      if (item.pull_request) continue;

      const createdAt = new Date(item.created_at);

      // Filter by date range (since param only filters by updated_at)
      if (createdAt < since || createdAt > until) continue;

      issues.push({
        number: item.number,
        title: item.title,
        body: item.body ?? null,
        state: item.state as "open" | "closed",
        labels: item.labels.map((l) =>
          typeof l === "string" ? l : l.name || ""
        ),
        createdAt,
        closedAt: item.closed_at ? new Date(item.closed_at) : null,
        author: item.user?.login ?? null,
        url: item.html_url,
      });
    }

    // Stop paginating if we've gone past our date range
    const lastItem = data[data.length - 1];
    if (lastItem && new Date(lastItem.created_at) < since) {
      break;
    }
  }

  return issues;
}

/**
 * Fetch all pull requests for a repo within a date range
 */
export async function fetchPullRequests(
  octokit: Octokit,
  repo: RepoIdentifier,
  since: Date,
  until: Date
): Promise<GitHubPullRequest[]> {
  const prs: GitHubPullRequest[] = [];

  const iterator = octokit.paginate.iterator(octokit.rest.pulls.list, {
    owner: repo.owner,
    repo: repo.repo,
    state: "all",
    per_page: 100,
    sort: "created",
    direction: "desc",
  });

  for await (const { data } of iterator) {
    for (const item of data) {
      const createdAt = new Date(item.created_at);

      // Filter by date range
      if (createdAt < since || createdAt > until) continue;

      prs.push({
        number: item.number,
        title: item.title,
        body: item.body ?? null,
        state: item.state as "open" | "closed",
        merged: item.merged_at !== null,
        mergedAt: item.merged_at ? new Date(item.merged_at) : null,
        labels: item.labels.map((l) =>
          typeof l === "string" ? l : l.name || ""
        ),
        createdAt,
        closedAt: item.closed_at ? new Date(item.closed_at) : null,
        author: item.user?.login ?? null,
        url: item.html_url,
      });
    }

    // Stop paginating if we've gone past our date range
    const lastItem = data[data.length - 1];
    if (lastItem && new Date(lastItem.created_at) < since) {
      break;
    }
  }

  return prs;
}

/**
 * Fetch all activity (issues + PRs) for a repo in a specific month
 */
export async function fetchMonthlyActivity(
  octokit: Octokit,
  repo: RepoIdentifier,
  year: number,
  month: number
): Promise<MonthlyActivity> {
  const monthDate = new Date(year, month - 1, 1);
  const since = startOfMonth(monthDate);
  const until = endOfMonth(monthDate);

  const [issues, pullRequests] = await Promise.all([
    fetchIssues(octokit, repo, since, until),
    fetchPullRequests(octokit, repo, since, until),
  ]);

  return {
    year,
    month,
    repo,
    issues,
    pullRequests,
  };
}

/**
 * Check if a repo exists and is accessible
 */
export async function checkRepoAccess(
  octokit: Octokit,
  repo: RepoIdentifier
): Promise<{ accessible: boolean; error?: string }> {
  try {
    await octokit.rest.repos.get({
      owner: repo.owner,
      repo: repo.repo,
    });
    return { accessible: true };
  } catch (error: unknown) {
    const err = error as { status?: number; message?: string };
    if (err.status === 404) {
      return {
        accessible: false,
        error: "Repository not found or not accessible",
      };
    }
    if (err.status === 403) {
      return {
        accessible: false,
        error: "Access forbidden - check your token permissions",
      };
    }
    return { accessible: false, error: err.message || "Unknown error" };
  }
}
