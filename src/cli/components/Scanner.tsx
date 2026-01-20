import React, { useState, useEffect } from 'react';
import { Box, Text } from 'ink';
import Spinner from 'ink-spinner';
import type { Config, ScanResult, Finding, AnalyzedFinding, Fix } from '../../types/index.js';
import { runSastTool } from '../../scanners/runner.js';
import { enrichWithContext } from '../../scanners/context.js';
import { OpenRouterClient } from '../../llm/client.js';
import { LLMAnalyzer } from '../../llm/analyzer.js';
import { LLMFixer } from '../../llm/fixer.js';
import { FixApplier } from '../../fixer/applier.js';
import { BackupManager } from '../../fixer/backup.js';

interface ScannerProps {
  config: Config;
  onComplete: (result: ScanResult) => void;
  onError: (error: Error) => void;
  fix?: boolean;
  dryRun?: boolean;
  targetPath?: string;
}

type Stage = 'running-sast' | 'analyzing' | 'generating-fixes' | 'applying-fixes' | 'done';

export function Scanner({ config, onComplete, onError, fix, dryRun, targetPath }: ScannerProps) {
  const [stage, setStage] = useState<Stage>('running-sast');
  const [progress, setProgress] = useState<string>('');
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    runScan();
  }, []);

  async function runScan() {
    try {
      // Stage 1: Run SAST tool
      setStage('running-sast');
      setProgress('Executing security scanner');

      const tool = config.tools[0];
      const findings = await runSastTool(tool, targetPath);

      if (findings.length === 0) {
        onComplete({
          findings: [],
          analyzedFindings: [],
          stats: {
            totalFindings: 0,
            truePositives: 0,
            falsePositives: 0,
            fixesApplied: 0,
            fixesFailed: 0,
            fixesSkipped: 0,
          },
        });
        return;
      }

      setTotalCount(findings.length);

      // Enrich with code context
      const enriched = await enrichWithContext(findings, config.contextLines);

      // Stage 2: Analyze findings
      setStage('analyzing');
      setProgress(`Analyzing ${findings.length} security finding${findings.length !== 1 ? 's' : ''}`);

      const client = new OpenRouterClient(config.llm);
      const analyzer = new LLMAnalyzer(client);
      const analyzed = await analyzer.analyzeFindings(enriched);

      // Filter based on confidence threshold
      const truePositives = analyzed.filter(
        f => !f.isFalsePositive && f.confidence >= config.filtering.confidenceThreshold
      );
      const falsePositives = analyzed.filter(
        f => f.isFalsePositive || f.confidence < config.filtering.confidenceThreshold
      );

      // Stage 3: Generate fixes if requested
      let fixes: Fix[] = [];

      if (fix && truePositives.length > 0) {
        setStage('generating-fixes');
        const fixCandidates = truePositives.filter(
          f => f.confidence >= config.fixing.minConfidenceToFix
        );
        setProgress(`Generating ${fixCandidates.length} secure fix${fixCandidates.length !== 1 ? 'es' : ''}`);

        const fixer = new LLMFixer(client);
        fixes = await fixer.generateFixes(fixCandidates);

        // Stage 4: Apply fixes if not dry run
        if (!dryRun) {
          setStage('applying-fixes');
          setProgress(`Applying ${fixes.length} fix${fixes.length !== 1 ? 'es' : ''} to codebase`);

          const backupManager = new BackupManager();
          const applier = new FixApplier(backupManager);

          fixes = await applier.applyFixes(fixes, config.fixing.createBackup);
        }
      }

      // Complete
      setStage('done');

      const fixesApplied = fixes.filter(f => f.applied).length;
      const fixesFailed = fixes.filter(f => !f.applied && f.error).length;

      onComplete({
        findings: enriched,
        analyzedFindings: analyzed,
        fixes: fixes.length > 0 ? fixes : undefined,
        stats: {
          totalFindings: findings.length,
          truePositives: truePositives.length,
          falsePositives: falsePositives.length,
          fixesApplied,
          fixesFailed,
          fixesSkipped: 0,
        },
      });
    } catch (error) {
      onError(error instanceof Error ? error : new Error('Unknown error'));
    }
  }

  const getStageInfo = () => {
    switch (stage) {
      case 'running-sast':
        return { icon: '🔍', text: 'Scanning codebase', color: 'cyan' };
      case 'analyzing':
        return { icon: '🤖', text: 'Analyzing with LLM', color: 'magenta' };
      case 'generating-fixes':
        return { icon: '🔧', text: 'Generating fixes', color: 'yellow' };
      case 'applying-fixes':
        return { icon: '✓', text: 'Applying fixes', color: 'blue' };
      case 'done':
        return { icon: '✓', text: 'Complete', color: 'green' };
    }
  };

  const stageInfo = getStageInfo();
  const isRunning = stage !== 'done';

  return (
    <Box flexDirection="column" paddingX={2} paddingY={1}>
      {/* Header */}
      <Box marginBottom={2}>
        <Text bold color="cyan">
          VulnSink Security Scanner
        </Text>
      </Box>

      {/* Current Stage */}
      <Box marginBottom={1}>
        <Box marginRight={2}>
          {isRunning && (
            <Text color={stageInfo.color as any}>
              <Spinner type="dots" />
            </Text>
          )}
          {!isRunning && <Text color="green">✓</Text>}
        </Box>
        <Text color={stageInfo.color as any}>
          {stageInfo.icon} {stageInfo.text}
        </Text>
      </Box>

      {progress && (
        <Box marginLeft={4} marginBottom={1}>
          <Text dimColor>{progress}</Text>
        </Box>
      )}

      {totalCount > 0 && (
        <Box marginLeft={4}>
          <Text dimColor>Findings detected: </Text>
          <Text bold>{totalCount}</Text>
        </Box>
      )}
    </Box>
  );
}
