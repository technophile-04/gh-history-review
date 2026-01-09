/**
 * File-based cache for GitHub data to avoid re-fetching
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import type { MonthlyActivity, RepoIdentifier } from "../types.js";

const CACHE_DIR = ".cache";

interface CacheEntry<T> {
  data: T;
  cachedAt: string;
}

/**
 * Get cache file path for a repo + year + month
 */
function getCachePath(repo: RepoIdentifier, year: number, month: number): string {
  const safeRepoName = repo.fullName.replace("/", "-");
  return join(CACHE_DIR, `${safeRepoName}-${year}-${month.toString().padStart(2, "0")}.json`);
}

/**
 * Ensure cache directory exists
 */
function ensureCacheDir(): void {
  if (!existsSync(CACHE_DIR)) {
    mkdirSync(CACHE_DIR, { recursive: true });
  }
}

/**
 * Get cached monthly activity if available
 */
export function getCachedActivity(
  repo: RepoIdentifier,
  year: number,
  month: number
): MonthlyActivity | null {
  const cachePath = getCachePath(repo, year, month);

  if (!existsSync(cachePath)) {
    return null;
  }

  try {
    const content = readFileSync(cachePath, "utf-8");
    const entry: CacheEntry<MonthlyActivity> = JSON.parse(content);

    // Restore Date objects
    const activity = entry.data;
    activity.issues = activity.issues.map((issue) => ({
      ...issue,
      createdAt: new Date(issue.createdAt),
      closedAt: issue.closedAt ? new Date(issue.closedAt) : null,
    }));
    activity.pullRequests = activity.pullRequests.map((pr) => ({
      ...pr,
      createdAt: new Date(pr.createdAt),
      closedAt: pr.closedAt ? new Date(pr.closedAt) : null,
      mergedAt: pr.mergedAt ? new Date(pr.mergedAt) : null,
    }));

    return activity;
  } catch {
    // Invalid cache, return null
    return null;
  }
}

/**
 * Cache monthly activity
 */
export function cacheActivity(activity: MonthlyActivity): void {
  ensureCacheDir();

  const cachePath = getCachePath(activity.repo, activity.year, activity.month);
  const entry: CacheEntry<MonthlyActivity> = {
    data: activity,
    cachedAt: new Date().toISOString(),
  };

  // Ensure directory exists
  const dir = dirname(cachePath);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }

  writeFileSync(cachePath, JSON.stringify(entry, null, 2));
}

/**
 * Clear all cache
 */
export async function clearCache(): Promise<void> {
  const fs = await import("node:fs/promises");
  if (existsSync(CACHE_DIR)) {
    await fs.rm(CACHE_DIR, { recursive: true, force: true });
  }
}
