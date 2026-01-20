import { readFile, writeFile, access } from 'fs/promises';
import { constants } from 'fs';
import { applyPatch } from 'diff';
import type { Fix } from '../types/index.js';
import { BackupManager } from './backup.js';

export class FixApplier {
  private backupManager: BackupManager;

  constructor(backupManager: BackupManager) {
    this.backupManager = backupManager;
  }

  async applyFix(fix: Fix, createBackup: boolean = true): Promise<Fix> {
    try {
      const filePath = fix.finding.file;

      // Check if file exists and is writable
      try {
        await access(filePath, constants.R_OK | constants.W_OK);
      } catch {
        throw new Error(`File not readable/writable: ${filePath}`);
      }

      // Create backup if requested
      if (createBackup) {
        await this.backupManager.createBackup(filePath);
      }

      // Read current file content
      const content = await readFile(filePath, 'utf-8');

      // Apply the patch
      const patched = applyPatch(content, fix.diff);

      if (patched === false) {
        throw new Error('Failed to apply patch - diff does not match file content');
      }

      // Write the patched content
      await writeFile(filePath, patched, 'utf-8');

      return {
        ...fix,
        applied: true,
      };
    } catch (error) {
      // Try to restore backup on error
      if (this.backupManager.hasBackup(fix.finding.file)) {
        try {
          await this.backupManager.restoreBackup(fix.finding.file);
        } catch {
          // Ignore restoration errors
        }
      }

      return {
        ...fix,
        applied: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async applyFixes(fixes: Fix[], createBackup: boolean = true): Promise<Fix[]> {
    const results: Fix[] = [];

    for (const fix of fixes) {
      const result = await this.applyFix(fix, createBackup);
      results.push(result);
    }

    return results;
  }
}
