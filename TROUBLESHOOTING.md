# VulnSink Troubleshooting Guide

## "Failed to analyze with LLM" Error

### Symptom
You see errors like:
- `Failed to analyze with LLM - marked as uncertain`
- `❌ LLM Analysis Failed: Authentication failed`

### Solution

This usually means your OpenRouter API key is not configured correctly.

**Step 1: Get an OpenRouter API Key**

1. Go to https://openrouter.ai/keys
2. Sign up or log in
3. Create a new API key
4. Copy the key (starts with `sk-or-v1-...`)

**Step 2: Set Your API Key**

Edit your `.env` file and replace the test key:

```bash
# Before (WRONG):
OPENROUTER_API_KEY=test_key_from_env_file

# After (CORRECT):
OPENROUTER_API_KEY=sk-or-v1-your-actual-key-here
```

**Step 3: Verify**

Run a scan again:
```bash
vulnsink scan
```

You should now see proper LLM analysis instead of "marked as uncertain".

## Common Errors

### Authentication Failed
**Error:** `Authentication failed: Invalid API key`

**Solution:**
- Check your API key in `.env` file
- Make sure it starts with `sk-or-v1-`
- Verify the key is active at https://openrouter.ai/keys

### Rate Limit Exceeded
**Error:** `Rate limit exceeded. Please wait and try again.`

**Solution:**
- Wait a few minutes
- Check your OpenRouter usage limits
- Consider upgrading your plan if needed

### OpenRouter Server Error
**Error:** `OpenRouter server error (500)`

**Solution:**
- This is a temporary OpenRouter issue
- Wait a few minutes and try again
- Check https://status.openrouter.ai for service status

### Config File Not Found
**Error:** `Config file not found: vulnsink.config.json`

**Solution:**
```bash
vulnsink init
```

### SAST Tool Not Found
**Error:** `Failed to execute SAST tool: spawn semgrep ENOENT`

**Solution:**
- Install the SAST tool: `pip install semgrep`
- Or change the tool in `vulnsink.config.json`

### Invalid SARIF/JSON Format
**Error:** `Failed to parse SAST output: Invalid SARIF format`

**Solution:**
- Check that your tool command matches the output format
- `--sarif` flag → `"outputFormat": "sarif"`
- `--json` flag → `"outputFormat": "json"`

## Debug mode

For more detailed error messages:

1. Check the console output for error details
2. Look for lines starting with `❌`
3. The error message tells you exactly what failed

## Still having issues?

1. Check your `.env` file is in the project root
2. Verify the API key has no extra spaces or quotes
3. Run `npm run build` if you made any code changes
4. Try `--ci` mode to see JSON output: `vulnsink scan --ci`

## Example working setup

**.env file:**
```bash
OPENROUTER_API_KEY=sk-or-v1-1234567890abcdef...
```

**vulnsink.config.json:**
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

**Run scan:**
```bash
vulnsink scan
```

Should work without errors!
