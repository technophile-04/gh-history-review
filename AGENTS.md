# AGENTS

These guidelines apply to the entire repository.

## General
- Keep changes focused on the user request.
- Follow existing project conventions and patterns.
- Prefer small, incremental edits over sweeping refactors.
- Avoid introducing new dependencies unless requested.
- Update docs only when behavior changes.
- Keep docs concise and aligned with existing style.

## Workflow
- Do not create commits or branches unless explicitly asked.
- Share tradeoffs or open questions before larger changes.
- Confirm before any destructive actions.
- Keep changes localized to relevant files.
- Avoid touching generated output unless requested.

## Project Overview
- TypeScript CLI app using ESM (`"type": "module"`).
- Entry point: `src/cli.ts` with Commander CLI.
- LLM providers via Vercel AI SDK + `@ai-sdk/*`.
- Uses Zod for config validation in `src/config.ts`.
- Outputs reports to `output/` and caches data in `.cache/`.

## Repo Layout
- `src/` contains CLI logic and modules.
- `src/github/` wraps Octokit fetching and URL parsing.
- `src/summarize/` holds provider wiring and prompt templates.
- `src/report/` writes Markdown and JSON outputs.
- `src/consolidate/` merges monthly reports into yearly output.
- `src/utils/` contains cache + progress helpers.
- `repos.json` stores default repo list.
- `output/` and `.cache/` are runtime artifacts.

## Configuration
- Env variables are loaded in `src/config.ts` via `dotenv`.
- Validate env using `zod` with explicit error messages.
- Default provider/model values live in `src/config.ts`.
- CLI flags should override env config where applicable.

## Build / Run Commands
- Install deps: `pnpm install`.
- Run CLI (default report flow): `pnpm report`.
- Run CLI (dev entrypoint): `pnpm dev`.
- Run consolidation: `pnpm consolidate`.
- Build TypeScript: `pnpm build`.
- Typecheck only: `pnpm typecheck`.

## Lint / Test Commands
- Linting is not configured (no ESLint/Prettier scripts).
- Tests are not configured (no test runner in `package.json`).
- Single-test command: not available; add a runner + script if needed.
- If adding lint/test tooling, add scripts and document here.

## Validation Tips
- Prefer `pnpm typecheck` after TypeScript changes.
- Use `pnpm report --dry-run` to validate flow without LLM calls.
- Use `pnpm report --no-cache` when testing fresh fetch logic.
- Run `pnpm consolidate -- --dry-run` for summary-only checks.

## CLI Usage Notes
- CLI arguments flow through Commander in `src/cli.ts`.
- Use `repos.json` to define default repositories.
- Use `.env` for required API keys (`env.example` template).
- Prefer `--dry-run` and `--no-cache` flags for debugging.

## Code Style
- Use modern TypeScript with ES modules.
- Keep imports at the top of the file.
- Prefer `const` over `let`; use `let` only when reassigned.
- Use explicit return types for exported functions.
- Avoid `any`; use `unknown` with type guards when needed.
- Prefer `type` imports (`import type { Foo } from "./types.js"`).
- Use `Record`/`Partial`/union types for structured data.
- Use `async`/`await` for async flows; avoid raw promises.
- Use `process.exit(1)` only in CLI entrypoints.
- Avoid inline comments unless necessary for clarity.

## Import Conventions
- Order imports: Node built-ins, third-party, local modules.
- Use `node:` prefixes for built-ins (e.g., `node:fs`).
- Include `.js` extensions in relative imports.
- Prefer named exports; default exports only for third-party libs.

## Formatting
- 2-space indentation.
- Use semicolons.
- Use double quotes for strings.
- Use trailing commas in multi-line objects/arrays/args.
- Keep lines readable; wrap long template strings thoughtfully.

## Naming
- `camelCase` for variables and functions.
- `PascalCase` for types, interfaces, and classes.
- `UPPER_SNAKE_CASE` for constants (e.g., defaults).
- File names are `kebab-case` in subfolders; match existing.

## Types and Data Modeling
- Central shared types live in `src/types.ts`.
- Keep exported types reusable and minimal.
- Prefer narrow types for CLI options.
- Use `zod` schemas for env/config validation.
- Convert raw JSON to typed data (e.g., `Date` restoration).

## Error Handling
- Validate external inputs early (CLI args, env, repo strings).
- Throw `Error` with clear messages for validation failures.
- Use `logError`, `logWarning`, `failSpinner` for CLI messaging.
- Catch errors where recovery is possible (e.g., cache reads).
- Avoid swallowing errors unless intentional (e.g., invalid cache).

## Logging and UX
- Use `chalk` for user-facing emphasis.
- Use `utils/progress.ts` helpers for consistent output.
- Keep CLI output concise and actionable.

## GitHub + LLM Integration
- Use `src/github/` helpers for API access and URL parsing.
- Avoid duplicating Octokit client setup; use `getOctokit`.
- Keep provider wiring in `src/summarize/provider.ts`.
- Prompt templates live in `src/summarize/prompt.ts`.
- Consolidation prompts live in `src/consolidate/prompt.ts`.

## Reports
- Markdown output logic lives in `src/report/markdown.ts`.
- JSON output logic lives in `src/report/json.ts`.
- Consolidated report output lives in `src/consolidate/consolidate.ts`.
- Keep report formatting changes isolated to report modules.

## File & Data Conventions
- `repos.json` lists repositories to process.
- `output/` contains generated Markdown/JSON reports.
- `.cache/` stores fetched GitHub activity.
- Do not edit generated files unless requested.

## Cursor / Copilot Rules
- No `.cursor/rules`, `.cursorrules`, or `copilot-instructions.md` found.
- If such files are added later, merge their guidance here.

## When Adding New Code
- Mirror existing patterns in `src/`.
- Add new exports to `src/*/index.ts` where appropriate.
- Keep functions small and single-purpose.
- Avoid new dependencies unless explicitly approved.

## Documentation
- Update `README.md` only when behavior or usage changes.
- Keep examples aligned with CLI flags and outputs.
