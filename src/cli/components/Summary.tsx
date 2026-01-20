import React from 'react';
import { Box, Text } from 'ink';
import type { ScanResult } from '../../types/index.js';
import { Finding } from './Finding.js';

interface SummaryProps {
  result: ScanResult;
}

export function Summary({ result }: SummaryProps) {
  const { stats, analyzedFindings, fixes } = result;
  const truePositiveFindings = analyzedFindings.filter(f => !f.isFalsePositive);

  return (
    <Box flexDirection="column" paddingX={2} paddingY={1}>
      {/* Header */}
      <Box marginBottom={2}>
        <Text bold color="cyan">
          Scan Complete
        </Text>
      </Box>

      {stats.totalFindings === 0 ? (
        /* No Issues Found */
        <Box flexDirection="column" marginBottom={1}>
          <Box marginBottom={1}>
            <Text color="green" bold>
              ✓ No security issues found
            </Text>
          </Box>
          <Text dimColor>Your code is looking secure!</Text>
        </Box>
      ) : (
        <>
          {/* Statistics */}
          <Box flexDirection="column" marginBottom={2}>
            <Box marginBottom={1}>
              <Text dimColor>Total findings: </Text>
              <Text bold>{stats.totalFindings}</Text>
              <Text dimColor> | True positives: </Text>
              <Text bold color={stats.truePositives > 0 ? 'red' : 'green'}>
                {stats.truePositives}
              </Text>
              <Text dimColor> | False positives: </Text>
              <Text bold color="yellow">
                {stats.falsePositives}
              </Text>
            </Box>

            {fixes && fixes.length > 0 && (
              <Box>
                <Text color="green">✓ {stats.fixesApplied} fix{stats.fixesApplied !== 1 ? 'es' : ''} applied</Text>
                {stats.fixesFailed > 0 && (
                  <>
                    <Text dimColor> | </Text>
                    <Text color="red">✗ {stats.fixesFailed} failed</Text>
                  </>
                )}
              </Box>
            )}
          </Box>

          {/* Findings List */}
          {truePositiveFindings.length > 0 && (
            <>
              <Box marginBottom={1}>
                <Text bold>Security Issues:</Text>
              </Box>

              {truePositiveFindings.map((finding, idx) => (
                <Finding
                  key={finding.id}
                  finding={finding}
                  showFix={!!fixes?.find(f => f.finding.id === finding.id)?.applied}
                />
              ))}
            </>
          )}
        </>
      )}
    </Box>
  );
}
