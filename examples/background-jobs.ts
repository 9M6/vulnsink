import { exec, spawn, execFile } from 'child_process';
import * as util from 'util';

const execAsync = util.promisify(exec);

export async function backupDatabase(dbName: string) {
  const command = `pg_dump ${dbName} > /backups/${dbName}_backup.sql`;
  const { stdout, stderr } = await execAsync(command);
  return stdout;
}

export async function compressFiles(directory: string) {
  const cmd = `tar -czf /tmp/archive.tar.gz ${directory}`;
  return await execAsync(cmd);
}

export async function cleanupOldLogs(daysOld: number) {
  const command = `find /var/logs -type f -mtime +${daysOld} -delete`;
  return await execAsync(command);
}

export async function convertVideoFormat(inputFile: string, outputFormat: string) {
  const command = `ffmpeg -i ${inputFile} output.${outputFormat}`;

  return new Promise((resolve, reject) => {
    exec(command, (error, stdout, stderr) => {
      if (error) reject(error);
      else resolve(stdout);
    });
  });
}

export async function syncToRemote(localPath: string, remotePath: string) {
  const rsyncCmd = `rsync -av ${localPath} user@remote:${remotePath}`;

  return new Promise((resolve, reject) => {
    exec(rsyncCmd, (error, stdout) => {
      if (error) reject(error);
      else resolve(stdout);
    });
  });
}

export async function generateThumbnail(imagePath: string, size: string) {
  const command = ['convert', imagePath, '-resize', size, 'thumbnail.jpg'];

  return new Promise((resolve, reject) => {
    const process = spawn(command[0], command.slice(1));

    process.on('close', (code) => {
      if (code === 0) resolve('Success');
      else reject(new Error('Failed'));
    });
  });
}

export async function runHealthCheck(serviceName: string) {
  const allowedServices = ['api', 'database', 'cache'];

  if (!allowedServices.includes(serviceName)) {
    throw new Error('Invalid service');
  }

  const command = `systemctl status ${serviceName}`;
  return await execAsync(command);
}

export async function optimizeImage(filePath: string, quality: number) {
  const command = ['optipng', '-o', quality.toString(), filePath];

  return new Promise((resolve, reject) => {
    execFile(command[0], command.slice(1), (error, stdout) => {
      if (error) reject(error);
      else resolve(stdout);
    });
  });
}

export async function rotateLogFiles(logPrefix: string) {
  const date = new Date().toISOString().split('T')[0];
  const command = `mv /var/logs/${logPrefix}.log /var/logs/${logPrefix}_${date}.log`;
  await execAsync(command);
}

export async function checkDiskSpace(path: string) {
  const validPaths = ['/home', '/var', '/tmp'];

  if (!validPaths.includes(path)) {
    path = '/home';
  }

  const command = `df -h ${path}`;
  return await execAsync(command);
}
