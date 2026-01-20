import type { Finding, AnalyzedFinding } from '../types/index.js';
import { OpenRouterClient } from './client.js';
import { createAnalysisPrompt } from './prompts.js';

const BATCH_SIZE = 5;

interface AnalysisResult {
  findingIndex: number;
  confidence: number;
  isFalsePositive: boolean;
  reasoning: string;
  recommendation: string;
}

export class LLMAnalyzer {
  private client: OpenRouterClient;

  constructor(client: OpenRouterClient) {
    this.client = client;
  }

  async analyzeFindings(findings: Finding[]): Promise<AnalyzedFinding[]> {
    const analyzed: AnalyzedFinding[] = [];

    // Process findings in batches
    for (let i = 0; i < findings.length; i += BATCH_SIZE) {
      const batch = findings.slice(i, Math.min(i + BATCH_SIZE, findings.length));

      try {
        const batchResults = await this.analyzeBatch(batch);
        analyzed.push(...batchResults);
      } catch (error) {
        // On error, mark all findings in batch as uncertain
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        console.error(`\n❌ LLM Analysis Failed: ${errorMsg}\n`);

        for (const finding of batch) {
          analyzed.push({
            ...finding,
            confidence: 50,
            isFalsePositive: false,
            reasoning: `Failed to analyze with LLM: ${errorMsg}`,
            recommendation: 'Manual review required',
          });
        }
      }
    }

    return analyzed;
  }

  private async analyzeBatch(findings: Finding[]): Promise<AnalyzedFinding[]> {
    const prompt = createAnalysisPrompt(findings);

    const response = await this.client.chat([
      {
        role: 'user',
        content: prompt,
      },
    ]);

    // Parse JSON response
    const results = this.parseAnalysisResponse(response.content);

    // Map results back to findings
    return findings.map((finding, idx) => {
      const result = results.find(r => r.findingIndex === idx);

      if (!result) {
        return {
          ...finding,
          confidence: 50,
          isFalsePositive: false,
          reasoning: 'No analysis result returned',
          recommendation: 'Manual review required',
        };
      }

      return {
        ...finding,
        confidence: result.confidence,
        isFalsePositive: result.isFalsePositive,
        reasoning: result.reasoning,
        recommendation: result.recommendation,
      };
    });
  }

  private parseAnalysisResponse(content: string): AnalysisResult[] {
    try {
      // Try to extract JSON from code blocks or plain text
      const jsonMatch = content.match(/```(?:json)?\s*([\s\S]+?)\s*```/) || [null, content];
      const jsonText = jsonMatch[1] || content;

      const parsed = JSON.parse(jsonText.trim());

      if (!Array.isArray(parsed)) {
        throw new Error('Response is not an array');
      }

      return parsed as AnalysisResult[];
    } catch (error) {
      throw new Error(`Failed to parse LLM response: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}
