import axios, { AxiosError } from 'axios';
import type { LLMConfig } from '../types/index.js';

export interface LLMMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface LLMResponse {
  content: string;
}

const RETRY_DELAYS = [1000, 2000, 4000]; // Exponential backoff: 1s, 2s, 4s

export class OpenRouterClient {
  private config: LLMConfig;

  constructor(config: LLMConfig) {
    this.config = config;

    // Validate API key
    if (!config.apiKey || config.apiKey.trim() === '') {
      throw new Error('OpenRouter API key is missing or empty. Set OPENROUTER_API_KEY in your .env file.');
    }

    if (config.apiKey.includes('${') || config.apiKey.includes('your_key')) {
      throw new Error('OpenRouter API key is not properly set. Replace ${OPENROUTER_API_KEY} with your actual key in .env file.');
    }
  }

  async chat(messages: LLMMessage[], retries = 3): Promise<LLMResponse> {
    let lastError: Error | undefined;

    for (let attempt = 0; attempt < retries; attempt++) {
      try {
        const response = await axios.post(
          'https://openrouter.ai/api/v1/chat/completions',
          {
            model: this.config.model,
            messages: messages.map(m => ({
              role: m.role,
              content: m.content,
            })),
          },
          {
            headers: {
              'Authorization': `Bearer ${this.config.apiKey}`,
              'HTTP-Referer': 'https://github.com/vulnsink/vulnsink',
              'X-Title': 'VulnSink',
              'Content-Type': 'application/json',
            },
            timeout: 60000, // 60 second timeout
          }
        );

        const content = response.data.choices?.[0]?.message?.content;

        if (!content) {
          throw new Error('No content in LLM response');
        }

        return { content };
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error');

        // Don't retry on auth errors
        if (error instanceof AxiosError) {
          if (error.response?.status === 401 || error.response?.status === 403) {
            throw new Error(
              `Authentication failed: ${error.response.data?.error?.message || 'Invalid API key'}.\n` +
              `Check your OPENROUTER_API_KEY in the .env file.\n` +
              `Get a key at: https://openrouter.ai/keys`
            );
          }

          // Provide better error messages for common issues
          if (error.response?.status === 429) {
            throw new Error('Rate limit exceeded. Please wait and try again.');
          }

          if (error.response?.status && error.response.status >= 500) {
            throw new Error(`OpenRouter server error (${error.response.status}). Please try again later.`);
          }
        }

        // Wait before retrying
        if (attempt < retries - 1) {
          await new Promise(resolve => setTimeout(resolve, RETRY_DELAYS[attempt]));
        }
      }
    }

    throw new Error(`LLM request failed after ${retries} attempts: ${lastError?.message}`);
  }
}
