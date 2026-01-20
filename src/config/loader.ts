import { readFile } from 'fs/promises';
import { z } from 'zod';
import type { Config } from '../types/index.js';

const ToolConfigSchema = z.object({
  name: z.string().min(1),
  command: z.string().min(1),
  outputFormat: z.enum(['json', 'sarif']),
});

const LLMConfigSchema = z.object({
  provider: z.string().min(1),
  model: z.string().min(1),
  apiKey: z.string().min(1),
});

const FilteringConfigSchema = z.object({
  confidenceThreshold: z.number().min(0).max(100),
  showFalsePositives: z.boolean(),
});

const FixingConfigSchema = z.object({
  autoFix: z.boolean(),
  requireConfirmation: z.boolean(),
  createBackup: z.boolean(),
  minConfidenceToFix: z.number().min(0).max(100),
});

const ConfigSchema = z.object({
  tools: z.array(ToolConfigSchema).min(1),
  llm: LLMConfigSchema,
  filtering: FilteringConfigSchema,
  fixing: FixingConfigSchema,
  contextLines: z.number().min(0).max(100),
});

function replaceEnvVars(value: string): string {
  return value.replace(/\$\{([^}]+)\}/g, (_, envVar) => {
    const val = process.env[envVar];
    if (!val) {
      throw new Error(`Environment variable ${envVar} is not set`);
    }
    return val;
  });
}

function processConfigValues(obj: any): any {
  if (typeof obj === 'string') {
    return replaceEnvVars(obj);
  }
  if (Array.isArray(obj)) {
    return obj.map(processConfigValues);
  }
  if (obj && typeof obj === 'object') {
    const processed: any = {};
    for (const [key, value] of Object.entries(obj)) {
      processed[key] = processConfigValues(value);
    }
    return processed;
  }
  return obj;
}

export async function loadConfig(configPath: string = 'vulnsink.config.json'): Promise<Config> {
  try {
    const content = await readFile(configPath, 'utf-8');
    const rawConfig = JSON.parse(content);
    const processedConfig = processConfigValues(rawConfig);

    const validatedConfig = ConfigSchema.parse(processedConfig);

    // Additional validation
    if (validatedConfig.fixing.minConfidenceToFix < validatedConfig.filtering.confidenceThreshold) {
      throw new Error(
        `minConfidenceToFix (${validatedConfig.fixing.minConfidenceToFix}) must be >= confidenceThreshold (${validatedConfig.filtering.confidenceThreshold})`
      );
    }

    return validatedConfig as Config;
  } catch (error) {
    if (error instanceof Error) {
      if ('code' in error && error.code === 'ENOENT') {
        throw new Error(`Config file not found: ${configPath}. Run 'vulnsink init' to create one.`);
      }
      if (error instanceof z.ZodError) {
        const issues = error.errors.map(err => `  - ${err.path.join('.')}: ${err.message}`).join('\n');
        throw new Error(`Invalid configuration:\n${issues}`);
      }
      throw error;
    }
    throw new Error('Unknown error loading config');
  }
}

export function createDefaultConfig(): Config {
  return {
    tools: [
      {
        name: 'semgrep',
        command: 'semgrep scan --sarif',
        outputFormat: 'sarif',
      },
    ],
    llm: {
      provider: 'openrouter',
      model: 'anthropic/claude-3.5-sonnet',
      apiKey: '${OPENROUTER_API_KEY}',
    },
    filtering: {
      confidenceThreshold: 70,
      showFalsePositives: false,
    },
    fixing: {
      autoFix: false,
      requireConfirmation: true,
      createBackup: true,
      minConfidenceToFix: 80,
    },
    contextLines: 10,
  };
}
