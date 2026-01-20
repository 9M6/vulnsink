import { describe, it, expect } from 'vitest';
import { parseSarif } from './sarif.js';

describe('SARIF Parser', () => {
  it('parses valid SARIF output', () => {
    const sarifOutput = JSON.stringify({
      runs: [
        {
          results: [
            {
              ruleId: 'sql-injection',
              level: 'error',
              message: {
                text: 'Possible SQL injection',
              },
              locations: [
                {
                  physicalLocation: {
                    artifactLocation: {
                      uri: 'src/test.ts',
                    },
                    region: {
                      startLine: 10,
                      startColumn: 5,
                      endLine: 12,
                    },
                  },
                },
              ],
            },
          ],
        },
      ],
    });

    const findings = parseSarif(sarifOutput, 'test-tool');

    expect(findings).toHaveLength(1);
    expect(findings[0].type).toBe('sql-injection');
    expect(findings[0].severity).toBe('critical');
    expect(findings[0].file).toBe('src/test.ts');
    expect(findings[0].line).toBe(10);
    expect(findings[0].tool).toBe('test-tool');
  });

  it('handles empty results', () => {
    const sarifOutput = JSON.stringify({
      runs: [
        {
          results: [],
        },
      ],
    });

    const findings = parseSarif(sarifOutput, 'test-tool');

    expect(findings).toHaveLength(0);
  });
});
