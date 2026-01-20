import React from 'react';
import { render } from 'ink';
import type { Config, ScanResult, CLIFlags } from '../../types/index.js';
import { App } from '../components/App.js';

export async function runInteractiveMode(
  config: Config,
  flags: CLIFlags
): Promise<ScanResult> {
  return new Promise((resolve, reject) => {
    let result: ScanResult | null = null;

    const { unmount } = render(
      <App
        config={config}
        onComplete={(scanResult) => {
          result = scanResult;
        }}
        fix={flags.fix}
        dryRun={flags.dryRun}
        targetPath={flags.path}
      />
    );

    // Wait for completion
    const checkInterval = setInterval(() => {
      if (result) {
        clearInterval(checkInterval);
        setTimeout(() => {
          unmount();
          resolve(result!);
        }, 100);
      }
    }, 100);

    // Timeout after 10 minutes
    setTimeout(() => {
      clearInterval(checkInterval);
      unmount();
      reject(new Error('Scan timed out after 10 minutes'));
    }, 600000);
  });
}
