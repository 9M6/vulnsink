import { copyFile, unlink } from 'fs/promises';

export class BackupManager {
  private backups: Map<string, string> = new Map();

  async createBackup(filePath: string): Promise<void> {
    const backupPath = `${filePath}.bak`;
    await copyFile(filePath, backupPath);
    this.backups.set(filePath, backupPath);
  }

  async restoreBackup(filePath: string): Promise<void> {
    const backupPath = this.backups.get(filePath);

    if (!backupPath) {
      throw new Error(`No backup found for ${filePath}`);
    }

    await copyFile(backupPath, filePath);
  }

  async cleanupBackups(): Promise<void> {
    for (const backupPath of this.backups.values()) {
      try {
        await unlink(backupPath);
      } catch (error) {
        // Ignore errors during cleanup
      }
    }

    this.backups.clear();
  }

  getBackupPath(filePath: string): string | undefined {
    return this.backups.get(filePath);
  }

  hasBackup(filePath: string): boolean {
    return this.backups.has(filePath);
  }
}
