import type { Finding } from '../../types/index.js';
import { randomUUID } from 'crypto';

interface SarifLog {
  runs: SarifRun[];
}

interface SarifRun {
  results: SarifResult[];
  tool?: {
    driver?: {
      name?: string;
    };
  };
}

interface SarifResult {
  ruleId?: string;
  message: {
    text: string;
  };
  level?: 'error' | 'warning' | 'note' | 'none';
  locations?: SarifLocation[];
}

interface SarifLocation {
  physicalLocation?: {
    artifactLocation?: {
      uri?: string;
    };
    region?: {
      startLine?: number;
      startColumn?: number;
      endLine?: number;
    };
  };
}

function mapSeverity(level?: string): Finding['severity'] {
  switch (level) {
    case 'error':
      return 'critical';
    case 'warning':
      return 'high';
    case 'note':
      return 'medium';
    default:
      return 'low';
  }
}

export function parseSarif(sarifOutput: string, toolName: string): Finding[] {
  try {
    const sarif = JSON.parse(sarifOutput);
    const findings: Finding[] = [];

    // Validate SARIF structure
    if (!sarif || typeof sarif !== 'object') {
      throw new Error('Output is not a valid JSON object');
    }

    if (!sarif.runs || !Array.isArray(sarif.runs)) {
      throw new Error('Missing or invalid "runs" array in SARIF output');
    }

    for (const run of sarif.runs) {
      if (!run.results || !Array.isArray(run.results)) {
        continue; // Skip runs without results
      }

      for (const result of run.results) {
        const location = result.locations?.[0]?.physicalLocation;
        const file = location?.artifactLocation?.uri || 'unknown';
        const line = location?.region?.startLine || 0;
        const column = location?.region?.startColumn;
        const endLine = location?.region?.endLine;

        findings.push({
          id: randomUUID(),
          type: result.ruleId || 'unknown',
          severity: mapSeverity(result.level),
          message: result.message?.text || 'No message',
          file,
          line,
          column,
          endLine,
          tool: toolName,
        });
      }
    }

    return findings;
  } catch (error) {
    throw new Error(`Invalid SARIF format: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
