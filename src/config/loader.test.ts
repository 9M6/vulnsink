import { describe, it, expect } from 'vitest';
import { createDefaultConfig } from './loader.js';

describe('Config Loader', () => {
  it('creates valid default config', () => {
    const config = createDefaultConfig();

    expect(config.tools).toHaveLength(1);
    expect(config.tools[0].name).toBe('semgrep');
    expect(config.llm.provider).toBe('openrouter');
    expect(config.filtering.confidenceThreshold).toBe(70);
    expect(config.fixing.minConfidenceToFix).toBe(80);
    expect(config.fixing.minConfidenceToFix).toBeGreaterThanOrEqual(
      config.filtering.confidenceThreshold
    );
  });
});
