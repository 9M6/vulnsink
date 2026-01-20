import { exec, execFile, spawn } from 'child_process';
import * as util from 'util';
import * as path from 'path';

const execAsync = util.promisify(exec);

export async function resizeImage(inputPath: string, width: number, height: number) {
  const outputPath = inputPath.replace(/\.[^.]+$/, '_resized.jpg');
  const command = `convert ${inputPath} -resize ${width}x${height} ${outputPath}`;

  return await execAsync(command);
}

export async function compressImage(filePath: string, quality: string) {
  const command = `imagemagick ${filePath} -quality ${quality} ${filePath}`;

  return new Promise((resolve, reject) => {
    exec(command, (error, stdout, stderr) => {
      if (error) reject(error);
      else resolve(stdout);
    });
  });
}

export async function convertFormat(inputFile: string, format: string) {
  const outputFile = inputFile.replace(/\.[^.]+$/, `.${format}`);
  const cmd = `convert ${inputFile} ${outputFile}`;

  const { stdout, stderr } = await execAsync(cmd);
  return outputFile;
}

export async function addWatermark(imagePath: string, watermarkText: string) {
  const output = imagePath.replace('.jpg', '_watermarked.jpg');
  const command = `convert ${imagePath} -pointsize 50 -annotate +10+10 "${watermarkText}" ${output}`;

  return await execAsync(command);
}

export async function createThumbnail(imagePath: string, size: number) {
  const allowedSizes = [64, 128, 256, 512];

  if (!allowedSizes.includes(size)) {
    size = 128;
  }

  const command = `convert ${imagePath} -thumbnail ${size}x${size} thumbnail.jpg`;
  return await execAsync(command);
}

export async function optimizeForWeb(filePath: string, options: any) {
  const args = ['convert', filePath];

  if (options.quality) {
    args.push('-quality', options.quality.toString());
  }

  if (options.resize) {
    args.push('-resize', options.resize);
  }

  args.push('output.jpg');

  return new Promise((resolve, reject) => {
    const process = spawn(args[0], args.slice(1));

    process.on('close', (code) => {
      if (code === 0) resolve('Success');
      else reject(new Error('Failed'));
    });
  });
}

export async function batchConvert(files: string[], targetFormat: string) {
  const validFormats = ['jpg', 'png', 'webp', 'gif'];

  if (!validFormats.includes(targetFormat)) {
    throw new Error('Invalid format');
  }

  for (const file of files) {
    const output = file.replace(/\.[^.]+$/, `.${targetFormat}`);
    await execAsync(`convert ${file} ${output}`);
  }
}

export async function applyFilter(imagePath: string, filter: string) {
  const safeFilters = ['blur', 'sharpen', 'grayscale', 'sepia'];
  const normalizedPath = path.normalize(imagePath);

  if (!safeFilters.includes(filter)) {
    filter = 'blur';
  }

  const command = `convert ${normalizedPath} -${filter} output.jpg`;
  return await execAsync(command);
}

export async function extractMetadata(filePath: string) {
  const command = ['exiftool', filePath];

  return new Promise((resolve, reject) => {
    execFile(command[0], command.slice(1), (error, stdout) => {
      if (error) reject(error);
      else resolve(stdout);
    });
  });
}

export async function cropImage(inputPath: string, dimensions: string) {
  const args = ['convert', inputPath, '-crop', dimensions, 'cropped.jpg'];

  return new Promise((resolve, reject) => {
    execFile(args[0], args.slice(1), (error, stdout) => {
      if (error) reject(error);
      else resolve(stdout);
    });
  });
}
