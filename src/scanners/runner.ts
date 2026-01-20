import { spawn } from 'child_process';
import type { ToolConfig, Finding } from '../types/index.js';
import { parseSarif } from './parsers/sarif.js';
import { parseJson } from './parsers/json.js';

export async function runSastTool(tool: ToolConfig, targetPath?: string): Promise<Finding[]> {
  return new Promise((resolve, reject) => {
    // If a target path is provided, append it to the command
    let commandString = tool.command;
    if (targetPath) {
      commandString = `${tool.command} ${targetPath}`;
    }

    const [command, ...args] = commandString.split(' ');

    let stdout = '';
    let stderr = '';

    const proc = spawn(command, args, {
      shell: true,
      cwd: process.cwd(),
    });

    proc.stdout?.on('data', (data) => {
      stdout += data.toString();
    });

    proc.stderr?.on('data', (data) => {
      stderr += data.toString();
    });

    proc.on('close', (code) => {
      // Some SAST tools exit with non-zero when findings are found
      // We consider exit codes 0 and 1 as success
      if (code !== null && code > 1) {
        reject(new Error(`SAST tool failed with exit code ${code}\nStderr: ${stderr}`));
        return;
      }

      try {
        let findings: Finding[];

        if (tool.outputFormat === 'sarif') {
          findings = parseSarif(stdout, tool.name);
        } else {
          findings = parseJson(stdout, tool.name);
        }

        resolve(findings);
      } catch (error) {
        const preview = stdout.substring(0, 200);
        reject(
          new Error(
            `Failed to parse SAST output: ${error instanceof Error ? error.message : 'Unknown error'}\n` +
            `Tool: ${tool.name}\n` +
            `Expected format: ${tool.outputFormat}\n` +
            `Output preview: ${preview}${stdout.length > 200 ? '...' : ''}`
          )
        );
      }
    });

    proc.on('error', (error) => {
      reject(new Error(`Failed to execute SAST tool: ${error.message}`));
    });
  });
}
