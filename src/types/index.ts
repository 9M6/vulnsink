// Core types for VulnSink

export interface Config {
  tools: ToolConfig[];
  llm: LLMConfig;
  filtering: FilteringConfig;
  fixing: FixingConfig;
  contextLines: number;
}

export interface ToolConfig {
  name: string;
  command: string;
  outputFormat: 'json' | 'sarif';
}

export interface LLMConfig {
  provider: string;
  model: string;
  apiKey: string;
}

export interface FilteringConfig {
  confidenceThreshold: number;
  showFalsePositives: boolean;
}

export interface FixingConfig {
  autoFix: boolean;
  requireConfirmation: boolean;
  createBackup: boolean;
  minConfidenceToFix: number;
}

export interface Finding {
  id: string;
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  file: string;
  line: number;
  column?: number;
  endLine?: number;
  codeContext?: string;
  tool: string;
}

export interface AnalyzedFinding extends Finding {
  confidence: number;
  isFalsePositive: boolean;
  reasoning: string;
  recommendation: string;
}

export interface Fix {
  finding: AnalyzedFinding;
  diff: string;
  applied: boolean;
  error?: string;
}

export interface ScanResult {
  findings: Finding[];
  analyzedFindings: AnalyzedFinding[];
  fixes?: Fix[];
  stats: {
    totalFindings: number;
    truePositives: number;
    falsePositives: number;
    fixesApplied: number;
    fixesFailed: number;
    fixesSkipped: number;
  };
}

export interface CLIFlags {
  tool?: string;
  model?: string;
  threshold?: number;
  showAll?: boolean;
  fix?: boolean;
  auto?: boolean;
  noBackup?: boolean;
  dryRun?: boolean;
  ci?: boolean;
  failOnFindings?: boolean;
  output?: string;
  path?: string;
}

export type ExitCode = 0 | 1 | 2 | 3;
