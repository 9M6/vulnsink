# VulnSink

A CLI tool that wraps SAST scanners and uses LLMs to filter false positives and automatically fix security issues.

## Features

- Run any CLI-based SAST tool (Semgrep, ESLint, Bandit, etc.)
- Use AI to distinguish true positives from false positives
- Generate and apply secure code fixes automatically
- Terminal interface with:
  - Real-time progress indicators with spinners
  - Color-coded severity levels and confidence scores
  - Organized findings with all relevant details
- Analysis includes reasoning and recommendations
- JSON output for CI/CD pipelines
- Automatic backups and dry-run mode

## Installation

Install VulnSink globally from npm:

```bash
npm install -g vulnsink
```

Or use it directly with npx without installing:

```bash
npx vulnsink scan
```

## Quick Start

1. Initialize configuration:
```bash
vulnsink init
```

2. Set your OpenRouter API key (choose one):

   Option A: Using .env file (recommended)
   ```bash
   cp .env.example .env
   # Edit .env and add your API key
   ```

   Option B: Environment variable
   ```bash
   export OPENROUTER_API_KEY=your_key_here
   ```

3. Run a scan:
```bash
vulnsink scan
```

4. Scan and auto-fix issues:
```bash
vulnsink scan --fix
```

## UI Showcase

### Scanner View
- Simple header with scan status
- Animated spinners showing real-time progress
- Different colors for scanning, analyzing, and fixing stages
- Live progress updates with finding counts

### Results Summary
- Total findings, true/false positives, fixes applied
- Color-coded issue severity
- Easy-to-scan layout

### Finding Details
Each security issue displays in a bordered box:
- Severity badge: [CRITICAL], [HIGH], [MEDIUM], [LOW] with color coding
- File path and line number
- Clear description of the issue
- Confidence score with percentage (green/yellow/red)
- LLM reasoning about the finding
- Actionable advice on fixing the issue
- Indicator when a fix has been applied

### Error Handling
- Simple error messages with clear descriptions
- Tips to guide troubleshooting

## Configuration

Edit `vulnsink.config.json`:

```json
{
  "tools": [
    {
      "name": "semgrep",
      "command": "semgrep scan --sarif",
      "outputFormat": "sarif"
    }
  ],
  "llm": {
    "provider": "openrouter",
    "model": "anthropic/claude-3.5-sonnet",
    "apiKey": "${OPENROUTER_API_KEY}"
  },
  "filtering": {
    "confidenceThreshold": 70,
    "showFalsePositives": false
  },
  "fixing": {
    "autoFix": false,
    "requireConfirmation": true,
    "createBackup": true,
    "minConfidenceToFix": 80
  },
  "contextLines": 10
}
```

### Tool Configuration Examples

Semgrep (SARIF format):
```json
{
  "name": "semgrep",
  "command": "semgrep scan --sarif",
  "outputFormat": "sarif"
}
```

Semgrep (JSON format):
```json
{
  "name": "semgrep",
  "command": "semgrep scan --json",
  "outputFormat": "json"
}
```

ESLint with security plugin:
```json
{
  "name": "eslint",
  "command": "eslint . --format json",
  "outputFormat": "json"
}
```

Important: Make sure the `command` output format matches the `outputFormat` setting:
- Use `--sarif` flag with `"outputFormat": "sarif"`
- Use `--json` flag with `"outputFormat": "json"`

### Environment Variables

VulnSink automatically loads environment variables from a `.env` file in your project root.

Supported variables:

| Variable | Description | Example |
|----------|-------------|---------|
| `OPENROUTER_API_KEY` | OpenRouter API key (required) | `sk-or-v1-...` |
| `LLM_MODEL` | Override default LLM model | `anthropic/claude-opus-4` |
| `CONFIDENCE_THRESHOLD` | Override default threshold | `80` |

Setup:

1. Copy the example file:
   ```bash
   cp .env.example .env
   ```

2. Edit `.env` and add your values:
   ```bash
   OPENROUTER_API_KEY=sk-or-v1-your-key-here
   ```

3. The config file can reference environment variables:
   ```json
   {
     "llm": {
       "apiKey": "${OPENROUTER_API_KEY}"
     }
   }
   ```

Note: `.env` files are automatically ignored by git for security.

## Commands

### `vulnsink scan [path]`

Run a security scan with interactive UI.

Arguments:
- `path`: Directory to scan (default: current directory)

Options:
- `--path <dir>`: Directory to scan (alternative to positional argument)
- `--tool <name>`: Override SAST tool from config
- `--model <name>`: Override LLM model (e.g., `anthropic/claude-opus-4`)
- `--threshold <0-100>`: Confidence threshold for filtering
- `--show-all`: Include false positives in output
- `--fix`: Generate and apply fixes for true positives
- `--auto`: Skip confirmation prompts (use with --fix)
- `--no-backup`: Skip creating backup files before fixes
- `--dry-run`: Show fixes without applying them
- `--ci`: CI/CD mode (no interactive UI, JSON output)
- `--fail-on-findings`: Exit with code 2 if security issues found
- `--output <file>`: Write JSON results to file (works in both interactive and CI modes)

Examples:

```bash
# Scan current directory
vulnsink scan

# Scan a specific directory
vulnsink scan ./src
vulnsink scan --path ./src

# Scan and auto-fix with confirmations
vulnsink scan ./src --fix

# Auto-fix without prompts
vulnsink scan ./src --fix --auto

# Interactive mode with JSON output
vulnsink scan --output scan.json

# CI mode with JSON output
vulnsink scan ./src --ci --output results.json

# Preview fixes without applying
vulnsink scan --fix --dry-run

# Use specific tool and model
vulnsink scan --tool semgrep --model anthropic/claude-opus-4

# Stricter filtering threshold
vulnsink scan --threshold 90
```

### `vulnsink init`

Create a default configuration file.

## Exit Codes

- `0`: Success (no issues or all fixed)
- `1`: Error (config error, tool failure, API error)
- `2`: Security issues found (when `--fail-on-findings` is used)
- `3`: Fixes partially applied (some succeeded, some failed)

## How It Works

1. Run SAST Tool: Executes configured SAST scanner (e.g., Semgrep)
2. Parse Output: Normalizes JSON/SARIF format to internal representation
3. Enrich Context: Extracts surrounding code lines from source files
4. Analyze with LLM: Sends findings to OpenRouter for analysis
5. Filter Results: Applies confidence threshold to remove false positives
6. Generate Fixes (optional): Uses LLM to create secure code fixes
7. Apply Fixes (optional): Creates backups and applies unified diffs

## CI/CD Integration

Use VulnSink in your CI pipeline:

```yaml
# GitHub Actions example
- name: Run VulnSink
  env:
    OPENROUTER_API_KEY: ${{ secrets.OPENROUTER_API_KEY }}
  run: |
    vulnsink scan --ci --fail-on-findings --output vulnsink-results.json

- name: Upload Results
  uses: actions/upload-artifact@v3
  with:
    name: vulnsink-results
    path: vulnsink-results.json
```

## Safety Features

- Automatic Backups: Creates `.bak` files before applying fixes
- Confirmation Prompts: Review each fix before applying (unless `--auto`)
- Dry Run Mode: Preview all fixes without applying
- Confidence Thresholds: Only fix high-confidence findings
- Validation: Verifies diffs before applying
- Rollback: Automatically restores from backup on error

## Development

```bash
# Install dependencies
npm install

# Run in development
npm run dev -- scan

# Build
npm run build

# Run tests
npm test

# Type check
npm run type-check
```

## Requirements

- Node.js >= 18.0.0
- OpenRouter API key
- SAST tool installed (e.g., Semgrep)

## License

MIT
