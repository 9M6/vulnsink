import type { Finding } from '../types/index.js';

export function createAnalysisPrompt(findings: Finding[]): string {
  const findingsText = findings
    .map(
      (f, idx) => `
Finding ${idx + 1}:
Type: ${f.type}
Severity: ${f.severity}
Message: ${f.message}
Location: ${f.file}:${f.line}${f.column ? `:${f.column}` : ''}
Tool: ${f.tool}

Code Context:
${f.codeContext || 'No context available'}
`
    )
    .join('\n---\n');

  return `You are a security expert analyzing potential vulnerabilities found by SAST tools. Your task is to determine if each finding is a true positive or false positive.

For each finding, provide:
1. A confidence score (0-100) that this is a real security issue
2. Whether it's a false positive (true/false)
3. Brief reasoning explaining your assessment
4. A recommendation for the developer

Consider:
- Is the vulnerability exploitable in practice?
- Does the code context show proper validation or sanitization?
- Are there framework protections in place?
- Is this a common false positive pattern?

Findings to analyze:
${findingsText}

Respond with a JSON array where each object has this structure:
{
  "findingIndex": <0-based index>,
  "confidence": <0-100>,
  "isFalsePositive": <true/false>,
  "reasoning": "<brief explanation>",
  "recommendation": "<what developer should do>"
}

Respond ONLY with the JSON array, no additional text.`;
}

export function createFixPrompt(finding: Finding, fileContent: string): string {
  return `You are a security code fixer. Given this security vulnerability, generate a secure fix.

Vulnerability Details:
Type: ${finding.type}
Severity: ${finding.severity}
Location: ${finding.file}:${finding.line}
Description: ${finding.message}

Full file content:
\`\`\`
${fileContent}
\`\`\`

Generate a unified diff that fixes this security issue. The fix must:
- Resolve the security issue completely
- Maintain existing functionality
- Follow language best practices
- Be minimal and focused

Return ONLY the unified diff in standard format, no explanation or additional text.

Example format:
\`\`\`diff
--- a/${finding.file}
+++ b/${finding.file}
@@ -10,3 +10,3 @@
-const query = \`SELECT * FROM users WHERE id = \${userId}\`;
+const query = \`SELECT * FROM users WHERE id = ?\`;
+db.execute(query, [userId]);
\`\`\``;
}
