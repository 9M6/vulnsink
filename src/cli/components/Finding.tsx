import React from 'react';
import { Box, Text } from 'ink';
import type { AnalyzedFinding } from '../../types/index.js';

interface FindingProps {
  finding: AnalyzedFinding;
  showFix?: boolean;
}

export function Finding({ finding, showFix }: FindingProps) {
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'red';
      case 'high':
        return 'yellow';
      case 'medium':
        return 'blue';
      default:
        return 'gray';
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 90) return 'green';
    if (confidence >= 70) return 'yellow';
    return 'red';
  };

  return (
    <Box flexDirection="column" marginY={1} borderStyle="round" paddingX={2} paddingY={1}>
      {/* Header */}
      <Box marginBottom={1}>
        <Text bold color={getSeverityColor(finding.severity) as any}>
          [{finding.severity.toUpperCase()}]
        </Text>
        <Text bold> {finding.type}</Text>
      </Box>

      {/* Location */}
      <Box marginBottom={1}>
        <Text dimColor>{finding.file}:</Text>
        <Text color="cyan">{finding.line}</Text>
      </Box>

      {/* Message */}
      <Box marginBottom={1}>
        <Text>{finding.message}</Text>
      </Box>

      {/* Confidence */}
      <Box marginBottom={1}>
        <Text dimColor>Confidence: </Text>
        <Text bold color={getConfidenceColor(finding.confidence) as any}>
          {finding.confidence}%
        </Text>
        {showFix && (
          <>
            <Text dimColor> | </Text>
            <Text color="green" bold>
              ✓ Fixed
            </Text>
          </>
        )}
      </Box>

      {/* Reasoning */}
      <Box marginBottom={1}>
        <Text dimColor>{finding.reasoning}</Text>
      </Box>

      {/* Recommendation */}
      <Box>
        <Text dimColor>→ </Text>
        <Text color="yellow">{finding.recommendation}</Text>
      </Box>
    </Box>
  );
}
