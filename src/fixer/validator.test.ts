import { describe, it, expect } from 'vitest';
import { validateDiff, validateFix } from './validator.js';
import type { Fix, AnalyzedFinding } from '../types/index.js';

describe('Fix Validator', () => {
  it('validates correct unified diff', () => {
    const diff = `--- a/test.ts
+++ b/test.ts
@@ -1,3 +1,3 @@
-const x = 1;
+const x = 2;
`;

    expect(validateDiff(diff)).toBe(true);
  });

  it('rejects invalid diff', () => {
    expect(validateDiff('')).toBe(false);
    expect(validateDiff('not a diff')).toBe(false);
    expect(validateDiff('--- only header')).toBe(false);
  });

  it('validates fix with valid diff', () => {
    const fix: Fix = {
      finding: {} as AnalyzedFinding,
      diff: `--- a/test.ts
+++ b/test.ts
@@ -1,3 +1,3 @@
-const x = 1;
+const x = 2;
`,
      applied: false,
    };

    const result = validateFix(fix);
    expect(result.valid).toBe(true);
  });

  it('rejects fix with invalid diff', () => {
    const fix: Fix = {
      finding: {} as AnalyzedFinding,
      diff: 'not a diff',
      applied: false,
    };

    const result = validateFix(fix);
    expect(result.valid).toBe(false);
    expect(result.error).toBeDefined();
  });
});
