import type { Fix } from '../types/index.js';

export function validateDiff(diff: string): boolean {
  if (!diff || diff.trim().length === 0) {
    return false;
  }

  // Check for basic unified diff format markers
  const hasHeader = /^---.*\n\+\+\+.*\n/m.test(diff);
  const hasHunks = /^@@.*@@/m.test(diff);

  return hasHeader && hasHunks;
}

export function validateFix(fix: Fix): { valid: boolean; error?: string } {
  if (!fix.diff) {
    return { valid: false, error: 'No diff provided' };
  }

  if (!validateDiff(fix.diff)) {
    return { valid: false, error: 'Invalid diff format' };
  }

  return { valid: true };
}
