import { readFile } from 'fs/promises';
import type { AnalyzedFinding, Fix } from '../types/index.js';
import { OpenRouterClient } from './client.js';
import { createFixPrompt } from './prompts.js';

export class LLMFixer {
  private client: OpenRouterClient;

  constructor(client: OpenRouterClient) {
    this.client = client;
  }

  async generateFix(finding: AnalyzedFinding): Promise<Fix> {
    try {
      const fileContent = await readFile(finding.file, 'utf-8');
      const prompt = createFixPrompt(finding, fileContent);

      const response = await this.client.chat([
        {
          role: 'user',
          content: prompt,
        },
      ]);

      const diff = this.extractDiff(response.content);

      return {
        finding,
        diff,
        applied: false,
      };
    } catch (error) {
      return {
        finding,
        diff: '',
        applied: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async generateFixes(findings: AnalyzedFinding[]): Promise<Fix[]> {
    const fixes: Fix[] = [];

    for (const finding of findings) {
      const fix = await this.generateFix(finding);
      fixes.push(fix);
    }

    return fixes;
  }

  private extractDiff(content: string): string {
    // Try to extract diff from code blocks
    const diffMatch = content.match(/```(?:diff)?\s*([\s\S]+?)\s*```/);

    if (diffMatch) {
      return diffMatch[1].trim();
    }

    // If no code block, assume entire content is the diff
    return content.trim();
  }
}
