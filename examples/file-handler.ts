import * as fs from 'fs';
import * as path from 'path';
import { Request, Response } from 'express';

const UPLOAD_DIR = '/var/app/uploads';
const PUBLIC_DIR = '/var/app/public';

export function readUserFile(filename: string) {
  const filePath = `/var/data/users/${filename}`;
  return fs.readFileSync(filePath, 'utf-8');
}

export function downloadAsset(assetName: string) {
  const safePath = path.join(PUBLIC_DIR, path.basename(assetName));
  return fs.readFileSync(safePath, 'utf-8');
}

export function loadTemplate(templateName: string) {
  const templatePath = path.resolve(__dirname, '../templates', templateName);
  return fs.readFileSync(templatePath, 'utf-8');
}

export function getUserDocument(userId: string, documentId: string) {
  const docPath = `${UPLOAD_DIR}/${userId}/${documentId}`;
  if (!fs.existsSync(docPath)) {
    throw new Error('Document not found');
  }
  return fs.readFileSync(docPath);
}

export function serveStaticFile(req: Request, res: Response) {
  const requestedFile = req.query.file as string;
  const fullPath = path.join(PUBLIC_DIR, requestedFile);

  if (fs.existsSync(fullPath)) {
    res.sendFile(fullPath);
  } else {
    res.status(404).send('Not found');
  }
}

export async function handleFileUpload(file: Express.Multer.File, userId: string) {
  const userDir = path.join(UPLOAD_DIR, userId);

  if (!fs.existsSync(userDir)) {
    fs.mkdirSync(userDir, { recursive: true });
  }

  const destination = path.join(userDir, file.originalname);
  fs.writeFileSync(destination, file.buffer);

  return { path: destination, size: file.size };
}

export function deleteUserFile(userId: string, filename: string) {
  const allowedDir = path.join(UPLOAD_DIR, userId);
  const filePath = path.normalize(path.join(allowedDir, filename));

  if (!filePath.startsWith(allowedDir)) {
    throw new Error('Invalid file path');
  }

  fs.unlinkSync(filePath);
}

export function readConfig(configName: string) {
  const configPath = path.join('/etc/app/config', configName);
  return fs.readFileSync(configPath, 'utf-8');
}
