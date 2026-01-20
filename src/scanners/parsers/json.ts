import type { Finding } from '../../types/index.js';
import { randomUUID } from 'crypto';

// Generic JSON parser that attempts to handle common SAST tool formats
export function parseJson(jsonOutput: string, toolName: string): Finding[] {
  try {
    const data = JSON.parse(jsonOutput);
    const findings: Finding[] = [];

    // Handle Semgrep JSON format
    if (data.results && Array.isArray(data.results)) {
      for (const result of data.results) {
        findings.push({
          id: randomUUID(),
          type: result.check_id || result.rule_id || 'unknown',
          severity: mapSemgrepSeverity(result.extra?.severity),
          message: result.extra?.message || result.message || 'No message',
          file: result.path || 'unknown',
          line: result.start?.line || 0,
          column: result.start?.col,
          endLine: result.end?.line,
          tool: toolName,
        });
      }
    }
    // Handle generic format
    else if (Array.isArray(data)) {
      for (const item of data) {
        findings.push({
          id: randomUUID(),
          type: item.type || item.ruleId || 'unknown',
          severity: item.severity || 'medium',
          message: item.message || 'No message',
          file: item.file || item.path || 'unknown',
          line: item.line || item.startLine || 0,
          column: item.column,
          endLine: item.endLine,
          tool: toolName,
        });
      }
    }

    return findings;
  } catch (error) {
    throw new Error(`Invalid JSON format: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

function mapSemgrepSeverity(severity?: string): Finding['severity'] {
  switch (severity?.toLowerCase()) {
    case 'error':
    case 'critical':
      return 'critical';
    case 'warning':
    case 'high':
      return 'high';
    case 'info':
    case 'medium':
      return 'medium';
    default:
      return 'low';
  }
}
