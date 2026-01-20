#!/usr/bin/env node

import { config as dotenvConfig } from 'dotenv';
import { writeFile } from 'fs/promises';
import meow from 'meow';
import chalk from 'chalk';
import type { CLIFlags, ExitCode } from '../types/index.js';
import { loadConfig, createDefaultConfig } from '../config/loader.js';
import { runInteractiveMode } from './modes/interactive.js';
import { runCIMode } from './modes/ci.js';

// Load environment variables from .env file
dotenvConfig();

const cli = meow(
  `
  Usage
    $ vulnsink <command> [options]

  Commands
    scan [path]       Run security scan (defaults to current directory)
    init              Create default config file

  Options
    --path <dir>      Directory to scan (default: current directory)
    --tool <name>     Override SAST tool from config
    --model <name>    Override LLM model from config
    --threshold <n>   Confidence threshold (0-100)
    --show-all        Include false positives in output
    --fix             Generate and apply fixes
    --auto            Skip confirmation prompts (use with --fix)
    --no-backup       Skip creating backup files
    --dry-run         Show fixes without applying
    --ci              CI/CD mode (JSON output, no interactive UI)
    --fail-on-findings  Exit with code 2 if issues found
    --output <file>   Write JSON results to file

  Examples
    $ vulnsink scan
    $ vulnsink scan ./src
    $ vulnsink scan --path ./src --fix --auto
    $ vulnsink scan --ci --output results.json
    $ vulnsink scan --tool semgrep --threshold 80
    $ vulnsink init
`,
  {
    importMeta: import.meta,
    flags: {
      tool: {
        type: 'string',
      },
      model: {
        type: 'string',
      },
      threshold: {
        type: 'number',
      },
      showAll: {
        type: 'boolean',
        default: false,
      },
      fix: {
        type: 'boolean',
        default: false,
      },
      auto: {
        type: 'boolean',
        default: false,
      },
      noBackup: {
        type: 'boolean',
        default: false,
      },
      dryRun: {
        type: 'boolean',
        default: false,
      },
      ci: {
        type: 'boolean',
        default: false,
      },
      failOnFindings: {
        type: 'boolean',
        default: false,
      },
      output: {
        type: 'string',
      },
      path: {
        type: 'string',
      },
    },
  }
);

async function main() {
  const [command = 'scan', ...args] = cli.input;

  try {
    if (command === 'init') {
      await handleInit();
      return;
    }

    if (command === 'scan') {
      // Support positional path argument: vulnsink scan ./src
      const flags = cli.flags as CLIFlags;
      if (args.length > 0 && !flags.path) {
        flags.path = args[0];
      }
      await handleScan(flags);
      return;
    }

    console.error(chalk.red(`Unknown command: ${command}`));
    process.exit(1);
  } catch (error) {
    console.error(chalk.red('Error:'), error instanceof Error ? error.message : 'Unknown error');
    process.exit(1);
  }
}

async function handleInit() {
  const defaultConfig = createDefaultConfig();

  await writeFile('vulnsink.config.json', JSON.stringify(defaultConfig, null, 2));

  console.log(chalk.green('✓ Created vulnsink.config.json'));
  console.log(chalk.dim('\nNext steps:'));
  console.log(chalk.dim('1. Set your OPENROUTER_API_KEY environment variable'));
  console.log(chalk.dim('2. Configure your SAST tools in the config file'));
  console.log(chalk.dim('3. Run: vulnsink scan'));
}

async function handleScan(flags: CLIFlags) {
  const config = await loadConfig();

  // Apply CLI flag overrides
  if (flags.tool) {
    const toolConfig = config.tools.find(t => t.name === flags.tool);
    if (toolConfig) {
      config.tools = [toolConfig];
    } else {
      throw new Error(`Tool not found in config: ${flags.tool}`);
    }
  }

  if (flags.model) {
    config.llm.model = flags.model;
  }

  if (flags.threshold !== undefined) {
    config.filtering.confidenceThreshold = flags.threshold;
  }

  if (flags.showAll) {
    config.filtering.showFalsePositives = true;
  }

  if (flags.auto) {
    config.fixing.requireConfirmation = false;
  }

  // Run scan
  let result;

  if (flags.ci) {
    result = await runCIMode(config, flags);
  } else {
    result = await runInteractiveMode(config, flags);
  }

  // Write output file if requested (for both modes)
  if (flags.output && !flags.ci) {
    // In CI mode, the output is already written
    await writeFile(flags.output, JSON.stringify(result, null, 2));
    console.log(chalk.green(`\n✓ Results written to ${flags.output}`));
  }

  // Determine exit code
  let exitCode: ExitCode = 0;

  if (result.stats.fixesFailed > 0 && result.stats.fixesApplied > 0) {
    exitCode = 3; // Partial success
  } else if (result.stats.fixesFailed > 0) {
    exitCode = 1; // Failed to apply fixes
  } else if (flags.failOnFindings && result.stats.truePositives > 0) {
    exitCode = 2; // Issues found
  }

  process.exit(exitCode);
}

main();
