import { readFile } from 'fs/promises';
import type { Finding } from '../types/index.js';

export async function enrichWithContext(
  findings: Finding[],
  contextLines: number
): Promise<Finding[]> {
  const enriched: Finding[] = [];

  for (const finding of findings) {
    try {
      const content = await readFile(finding.file, 'utf-8');
      const lines = content.split('\n');

      const startLine = Math.max(0, finding.line - contextLines - 1);
      const endLine = Math.min(lines.length, finding.line + contextLines);

      const contextLineArray = lines.slice(startLine, endLine);
      const codeContext = contextLineArray
        .map((line, idx) => {
          const lineNum = startLine + idx + 1;
          const marker = lineNum === finding.line ? '> ' : '  ';
          return `${marker}${lineNum.toString().padStart(4, ' ')} | ${line}`;
        })
        .join('\n');

      enriched.push({
        ...finding,
        codeContext,
      });
    } catch (error) {
      // If we can't read the file, just keep the finding without context
      enriched.push(finding);
    }
  }

  return enriched;
}
