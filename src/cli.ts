#!/usr/bin/env node

/**
 * GitHub Year-in-Review CLI
 * Generate LLM-powered summaries of your GitHub activity
 */

import { Command } from "commander";
import { readFileSync, existsSync } from "node:fs";
import chalk from "chalk";

import { buildConfig, parseMonths, parseReposArg } from "./config.js";
import type {
  CLIOptions,
  ConsolidateCLIOptions,
  RepoIdentifier,
  MonthlyActivity,
  MonthlySummary,
} from "./types.js";
import {
  getOctokit,
  checkRateLimit,
  fetchMonthlyActivity,
  checkRepoAccess,
  parseGitHubUrls,
  dedupeRepos,
} from "./github/index.js";
import { getCachedActivity, cacheActivity } from "./utils/cache.js";
import {
  startSpinner,
  succeedSpinner,
  failSpinner,
  logInfo,
  logSuccess,
  logWarning,
  logError,
  createProgressTracker,
} from "./utils/progress.js";
import {
  summarizeActivity,
  dryRunSummarize,
  getProviderDisplayName,
} from "./summarize/index.js";
import { writeMarkdownReport, writeJsonReport } from "./report/index.js";
import { getMonthName } from "./grouping.js";
import {
  consolidateReports,
  writeConsolidatedReport,
  getAvailableYears,
} from "./consolidate/index.js";

const DEFAULT_YEAR = 2025;
const REPOS_FILE = "repos.json";

/**
 * Load repos from repos.json file
 */
function loadReposFromFile(): string[] {
  if (!existsSync(REPOS_FILE)) {
    return [];
  }

  try {
    const content = readFileSync(REPOS_FILE, "utf-8");
    const data = JSON.parse(content);
    return data.repos || [];
  } catch (error) {
    logWarning(`Failed to parse ${REPOS_FILE}, using empty repo list`);
    return [];
  }
}

/**
 * Main CLI logic
 */
async function main(options: CLIOptions): Promise<void> {
  console.log(chalk.bold.cyan("\n📊 GitHub Year-in-Review\n"));

  // Build config from env + CLI options
  let config;
  try {
    config = buildConfig(options);
  } catch (error) {
    logError((error as Error).message);
    process.exit(1);
  }

  // Determine year and months
  const year = options.year ?? DEFAULT_YEAR;
  const months = parseMonths(options.months, year);

  // Get repos to process
  let repoStrings: string[];
  if (options.repos) {
    repoStrings = parseReposArg(options.repos) || [];
  } else {
    repoStrings = loadReposFromFile();
  }

  if (repoStrings.length === 0) {
    logError(
      "No repositories specified. Use --repos flag or create repos.json file."
    );
    process.exit(1);
  }

  // Parse and dedupe repos
  let repos: RepoIdentifier[];
  try {
    repos = dedupeRepos(parseGitHubUrls(repoStrings));
  } catch (error) {
    logError((error as Error).message);
    process.exit(1);
  }

  // Show config summary
  logInfo(`Year: ${year}`);
  logInfo(`Months: ${months.map((m) => getMonthName(m)).join(", ")}`);
  logInfo(`Repositories: ${repos.length}`);
  logInfo(
    `LLM Provider: ${getProviderDisplayName(config.llmProvider)} (${
      config.llmModel
    })`
  );
  if (options.noCache) logInfo("Cache: disabled");
  if (options.dryRun)
    logInfo(chalk.yellow("DRY RUN MODE - no LLM calls will be made"));
  console.log();

  // Initialize GitHub client
  const octokit = getOctokit(config);

  // Check rate limit
  const rateLimit = await checkRateLimit(octokit);
  logInfo(`GitHub API rate limit: ${rateLimit.remaining}/${rateLimit.limit}`);
  console.log();

  // Verify repo access
  startSpinner("Verifying repository access...");
  const accessibleRepos: RepoIdentifier[] = [];
  for (const repo of repos) {
    const access = await checkRepoAccess(octokit, repo);
    if (access.accessible) {
      accessibleRepos.push(repo);
    } else {
      logWarning(`Skipping ${repo.fullName}: ${access.error}`);
    }
  }

  if (accessibleRepos.length === 0) {
    failSpinner("No accessible repositories found");
    process.exit(1);
  }
  succeedSpinner(`${accessibleRepos.length} repositories accessible`);

  // Calculate total tasks
  const totalTasks = accessibleRepos.length * months.length;
  let completedTasks = 0;
  let reportsGenerated = 0;

  console.log();
  logInfo(`Processing ${totalTasks} repo-month combinations...\n`);

  // Process each repo-month combination
  for (const repo of accessibleRepos) {
    console.log(chalk.bold(`\n📁 ${repo.fullName}`));

    for (const month of months) {
      const monthName = getMonthName(month);
      const taskLabel = `${repo.fullName} - ${monthName} ${year}`;

      startSpinner(`Fetching ${monthName} ${year}...`);

      // Check cache first (unless --no-cache)
      let activity: MonthlyActivity | null = null;
      if (!options.noCache) {
        activity = getCachedActivity(repo, year, month);
        if (activity) {
          succeedSpinner(`${monthName}: loaded from cache`);
        }
      }

      // Fetch from GitHub if not cached
      if (!activity) {
        try {
          activity = await fetchMonthlyActivity(octokit, repo, year, month);

          // Cache the result
          if (!options.noCache) {
            cacheActivity(activity);
          }

          succeedSpinner(
            `${monthName}: fetched ${activity.issues.length} issues, ${activity.pullRequests.length} PRs`
          );
        } catch (error) {
          failSpinner(
            `${monthName}: fetch failed - ${(error as Error).message}`
          );
          completedTasks++;
          continue;
        }
      }

      // Skip if no activity
      if (activity.issues.length === 0 && activity.pullRequests.length === 0) {
        logInfo(`  ${monthName}: No activity, skipping`);
        completedTasks++;
        continue;
      }

      // Dry run mode - just show what would happen
      if (options.dryRun) {
        const dryRun = dryRunSummarize(activity);
        logInfo(
          `  ${monthName}: Would summarize ${dryRun.payload.issueCount} issues, ${dryRun.payload.prCount} PRs`
        );
        completedTasks++;
        continue;
      }

      // Summarize with LLM
      startSpinner(`Summarizing ${monthName} ${year}...`);
      let summary: MonthlySummary;
      try {
        summary = await summarizeActivity(activity, config);
        succeedSpinner(`${monthName}: summarized`);
      } catch (error) {
        failSpinner(
          `${monthName}: summarization failed - ${(error as Error).message}`
        );
        completedTasks++;
        continue;
      }

      // Write reports
      try {
        const mdPath = writeMarkdownReport(summary, activity);
        const jsonPath = writeJsonReport(summary, activity);
        logSuccess(`  Reports: ${mdPath}, ${jsonPath}`);
        reportsGenerated++;
      } catch (error) {
        logError(`  Failed to write reports: ${(error as Error).message}`);
      }

      completedTasks++;
    }
  }

  // Final summary
  console.log(chalk.bold.cyan("\n✨ Done!\n"));
  logSuccess(
    `Processed ${completedTasks}/${totalTasks} repo-month combinations`
  );
  logSuccess(`Generated ${reportsGenerated} reports in ./output/`);
}

/**
 * Consolidate command logic
 */
async function consolidateCommand(
  options: ConsolidateCLIOptions
): Promise<void> {
  console.log(chalk.bold.cyan("\n📊 GitHub Year-in-Review - Consolidate\n"));

  // Determine year
  const year = options.year ?? DEFAULT_YEAR;

  // Check available years
  const availableYears = getAvailableYears();
  if (availableYears.length === 0) {
    logError(
      "No reports found in output/ directory. Run the main command first to generate reports."
    );
    process.exit(1);
  }

  if (!availableYears.includes(year)) {
    logError(
      `No reports found for year ${year}. Available years: ${availableYears.join(
        ", "
      )}`
    );
    process.exit(1);
  }

  // Build config for LLM (only needed if not dry-run)
  let config;
  if (!options.dryRun) {
    try {
      config = buildConfig({
        provider: options.provider,
        model: options.model,
      });
    } catch (error) {
      logError((error as Error).message);
      process.exit(1);
    }

    logInfo(
      `LLM Provider: ${getProviderDisplayName(config.llmProvider)} (${
        config.llmModel
      })`
    );
  }

  logInfo(`Year: ${year}`);
  if (options.dryRun)
    logInfo(chalk.yellow("DRY RUN MODE - no LLM calls will be made"));
  console.log();

  // Consolidate reports
  startSpinner(`Consolidating reports for ${year}...`);

  try {
    const report = await consolidateReports(
      year,
      config!,
      options.dryRun ?? false
    );

    succeedSpinner(`Consolidated ${report.totalRepositories} repositories`);

    // Write output
    const outputPath = writeConsolidatedReport(report, options.output);

    console.log(chalk.bold.cyan("\n✨ Done!\n"));
    logSuccess(`Total repositories: ${report.totalRepositories}`);
    logSuccess(`Total issues: ${report.totalIssues}`);
    logSuccess(`Total PRs: ${report.totalPRs}`);
    logSuccess(`Output: ${outputPath}`);
  } catch (error) {
    failSpinner(`Consolidation failed: ${(error as Error).message}`);
    process.exit(1);
  }
}

// CLI setup
const program = new Command();

program
  .name("gh-history")
  .description("Generate LLM-powered summaries of your GitHub activity")
  .version("1.0.0");

// Generate command (default)
program
  .command("generate", { isDefault: true })
  .description("Generate monthly reports for repositories")
  .option(
    "-r, --repos <repos>",
    "Comma-separated list of repos (owner/repo format)"
  )
  .option("-m, --months <months>", "Months to process (e.g., '1,2,3' or '1-6')")
  .option("-y, --year <year>", "Year to process", (v: string) =>
    parseInt(v, 10)
  )
  .option("-p, --provider <provider>", "LLM provider (openai or anthropic)")
  .option("--model <model>", "LLM model to use")
  .option("--no-cache", "Disable caching")
  .option("--dry-run", "Fetch data but skip LLM calls")
  .option("-o, --output <dir>", "Output directory")
  .action(async (options: CLIOptions) => {
    try {
      await main(options);
    } catch (error) {
      logError(`Unexpected error: ${(error as Error).message}`);
      process.exit(1);
    }
  });

// Consolidate command
program
  .command("consolidate")
  .description("Consolidate all monthly reports into a single summary file")
  .option("-y, --year <year>", "Year to consolidate", (v: string) =>
    parseInt(v, 10)
  )
  .option(
    "-o, --output <file>",
    "Output filename (default: consolidated-{year}.json)"
  )
  .option("-p, --provider <provider>", "LLM provider (openai or anthropic)")
  .option("--model <model>", "LLM model to use")
  .option("--dry-run", "Aggregate data but skip LLM calls")
  .action(async (options: ConsolidateCLIOptions) => {
    try {
      await consolidateCommand(options);
    } catch (error) {
      logError(`Unexpected error: ${(error as Error).message}`);
      process.exit(1);
    }
  });

program.parse();
