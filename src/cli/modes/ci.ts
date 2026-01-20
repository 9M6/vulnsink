import { writeFile } from 'fs/promises';
import type { Config, ScanResult, CLIFlags, Fix } from '../../types/index.js';
import { runSastTool } from '../../scanners/runner.js';
import { enrichWithContext } from '../../scanners/context.js';
import { OpenRouterClient } from '../../llm/client.js';
import { LLMAnalyzer } from '../../llm/analyzer.js';
import { LLMFixer } from '../../llm/fixer.js';
import { FixApplier } from '../../fixer/applier.js';
import { BackupManager } from '../../fixer/backup.js';

export async function runCIMode(config: Config, flags: CLIFlags): Promise<ScanResult> {
  console.log('Running SAST scanner...');

  const tool = config.tools[0];
  const findings = await runSastTool(tool, flags.path);

  if (findings.length === 0) {
    console.log('No findings detected.');
    return {
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
    };
  }

  const enriched = await enrichWithContext(findings, config.contextLines);

  console.log(`Analyzing ${findings.length} findings...`);

  const client = new OpenRouterClient(config.llm);
  const analyzer = new LLMAnalyzer(client);
  const analyzed = await analyzer.analyzeFindings(enriched);

  const truePositives = analyzed.filter(
    f => !f.isFalsePositive && f.confidence >= config.filtering.confidenceThreshold
  );
  const falsePositives = analyzed.filter(
    f => f.isFalsePositive || f.confidence < config.filtering.confidenceThreshold
  );

  console.log(`Found ${truePositives.length} true positives, ${falsePositives.length} false positives`);

  let fixes: Fix[] = [];
  let fixesApplied = 0;
  let fixesFailed = 0;

  if (flags.fix && truePositives.length > 0) {
    console.log('Generating fixes...');

    const fixer = new LLMFixer(client);
    const fixCandidates = truePositives.filter(
      f => f.confidence >= config.fixing.minConfidenceToFix
    );
    fixes = await fixer.generateFixes(fixCandidates);

    if (!flags.dryRun) {
      console.log('Applying fixes...');

      const backupManager = new BackupManager();
      const applier = new FixApplier(backupManager);

      fixes = await applier.applyFixes(fixes, !flags.noBackup);

      fixesApplied = fixes.filter(f => f.applied).length;
      fixesFailed = fixes.filter(f => !f.applied && f.error).length;

      console.log(`Applied ${fixesApplied} fixes, ${fixesFailed} failed`);
    }
  }

  const result: ScanResult = {
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
  };

  if (flags.output) {
    await writeFile(flags.output, JSON.stringify(result, null, 2));
    console.log(`Results written to ${flags.output}`);
  }

  return result;
}
