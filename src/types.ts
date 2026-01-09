/**
 * Shared TypeScript types for the GitHub Year-in-Review CLI
 */

export interface RepoIdentifier {
  owner: string;
  repo: string;
  fullName: string; // owner/repo
}

export interface GitHubIssue {
  number: number;
  title: string;
  body: string | null;
  state: "open" | "closed";
  labels: string[];
  createdAt: Date;
  closedAt: Date | null;
  author: string | null;
  url: string;
}

export interface GitHubPullRequest {
  number: number;
  title: string;
  body: string | null;
  state: "open" | "closed";
  merged: boolean;
  mergedAt: Date | null;
  labels: string[];
  createdAt: Date;
  closedAt: Date | null;
  author: string | null;
  url: string;
}

export interface MonthlyActivity {
  year: number;
  month: number; // 1-12
  repo: RepoIdentifier;
  issues: GitHubIssue[];
  pullRequests: GitHubPullRequest[];
}

export interface LLMPayloadItem {
  type: "issue" | "pr";
  number: number;
  title: string;
  labels: string[];
  state: string;
  excerpt: string; // truncated body
  merged?: boolean;
}

export interface LLMPayload {
  repo: string;
  year: number;
  month: number;
  monthName: string;
  issueCount: number;
  prCount: number;
  items: LLMPayloadItem[];
}

export interface MonthlySummary {
  repo: RepoIdentifier;
  year: number;
  month: number;
  monthName: string;
  summary: string;
  issueCount: number;
  prCount: number;
  generatedAt: Date;
}

export interface ReportData {
  repo: RepoIdentifier;
  year: number;
  month: number;
  monthName: string;
  summary: string;
  issueCount: number;
  prCount: number;
  topIssues: Array<{ number: number; title: string; url: string }>;
  topPRs: Array<{
    number: number;
    title: string;
    url: string;
    merged: boolean;
  }>;
  generatedAt: string;
}

export type LLMProvider = "openai" | "anthropic";

export interface Config {
  githubToken: string;
  llmProvider: LLMProvider;
  llmModel: string;
  openaiApiKey?: string;
  anthropicApiKey?: string;
}

export interface CLIOptions {
  repos?: string;
  months?: string;
  year?: number;
  provider?: LLMProvider;
  model?: string;
  noCache?: boolean;
  dryRun?: boolean;
  output?: string;
}

// Consolidation types
export interface ConsolidatedMonth {
  month: number;
  monthName: string;
  summary: string;
  issueCount: number;
  prCount: number;
}

export interface ConsolidatedRepo {
  repo: RepoIdentifier;
  metaSummary: string;
  stats: {
    totalIssues: number;
    totalPRs: number;
  };
  months: ConsolidatedMonth[];
}

export interface ConsolidatedReport {
  generatedAt: string;
  year: number;
  totalRepositories: number;
  totalIssues: number;
  totalPRs: number;
  repositories: ConsolidatedRepo[];
}

export interface ConsolidateCLIOptions {
  year?: number;
  output?: string;
  dryRun?: boolean;
  provider?: LLMProvider;
  model?: string;
}
