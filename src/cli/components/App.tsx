import React, { useState, useEffect } from 'react';
import { Box, Text } from 'ink';
import type { Config, ScanResult } from '../../types/index.js';
import { Scanner } from './Scanner.js';
import { Summary } from './Summary.js';

export interface AppProps {
  config: Config;
  onComplete: (result: ScanResult) => void;
  fix?: boolean;
  dryRun?: boolean;
  targetPath?: string;
}

type Stage = 'scanning' | 'analyzing' | 'fixing' | 'complete' | 'error';

export function App({ config, onComplete, fix, dryRun, targetPath }: AppProps) {
  const [stage, setStage] = useState<Stage>('scanning');
  const [result, setResult] = useState<ScanResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleScanComplete = (scanResult: ScanResult) => {
    setResult(scanResult);
    setStage('complete');
    onComplete(scanResult);
  };

  const handleError = (err: Error) => {
    setError(err.message);
    setStage('error');
  };

  if (stage === 'error') {
    return (
      <Box flexDirection="column" paddingX={2} paddingY={1}>
        <Box marginBottom={2}>
          <Text color="red" bold>
            ✗ Error
          </Text>
        </Box>

        <Box marginBottom={2}>
          <Text color="red">{error}</Text>
        </Box>

        <Box>
          <Text dimColor>Check your configuration and try again</Text>
        </Box>
      </Box>
    );
  }

  if (stage === 'complete' && result) {
    return <Summary result={result} />;
  }

  return (
    <Scanner
      config={config}
      onComplete={handleScanComplete}
      onError={handleError}
      fix={fix}
      dryRun={dryRun}
      targetPath={targetPath}
    />
  );
}
