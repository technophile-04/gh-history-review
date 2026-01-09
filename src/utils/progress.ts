/**
 * Progress and spinner utilities using ora
 */

import ora, { type Ora } from "ora";
import chalk from "chalk";

let currentSpinner: Ora | null = null;

/**
 * Start a spinner with a message
 */
export function startSpinner(message: string): Ora {
  if (currentSpinner) {
    currentSpinner.stop();
  }
  currentSpinner = ora(message).start();
  return currentSpinner;
}

/**
 * Update spinner text
 */
export function updateSpinner(message: string): void {
  if (currentSpinner) {
    currentSpinner.text = message;
  }
}

/**
 * Mark spinner as successful
 */
export function succeedSpinner(message?: string): void {
  if (currentSpinner) {
    currentSpinner.succeed(message);
    currentSpinner = null;
  }
}

/**
 * Mark spinner as failed
 */
export function failSpinner(message?: string): void {
  if (currentSpinner) {
    currentSpinner.fail(message);
    currentSpinner = null;
  }
}

/**
 * Stop spinner without status
 */
export function stopSpinner(): void {
  if (currentSpinner) {
    currentSpinner.stop();
    currentSpinner = null;
  }
}

/**
 * Log info message
 */
export function logInfo(message: string): void {
  stopSpinner();
  console.log(chalk.blue("ℹ"), message);
}

/**
 * Log success message
 */
export function logSuccess(message: string): void {
  stopSpinner();
  console.log(chalk.green("✓"), message);
}

/**
 * Log warning message
 */
export function logWarning(message: string): void {
  stopSpinner();
  console.log(chalk.yellow("⚠"), message);
}

/**
 * Log error message
 */
export function logError(message: string): void {
  stopSpinner();
  console.log(chalk.red("✗"), message);
}

/**
 * Create a progress tracker for multiple items
 */
export function createProgressTracker(total: number, label: string) {
  let current = 0;

  return {
    increment(itemLabel?: string) {
      current++;
      const percentage = Math.round((current / total) * 100);
      const msg = itemLabel
        ? `${label} [${current}/${total}] ${percentage}% - ${itemLabel}`
        : `${label} [${current}/${total}] ${percentage}%`;
      updateSpinner(msg);
    },
    get current() {
      return current;
    },
  };
}
