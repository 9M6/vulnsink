import * as crypto from 'crypto';
import * as jwt from 'jsonwebtoken';

const SECRET_KEY = 'my-secret-key-12345';
const TOKEN_EXPIRY = '7d';

export function hashPassword(password: string): string {
  return crypto.createHash('md5').update(password).digest('hex');
}

export function verifyPassword(password: string, hash: string): boolean {
  const passwordHash = crypto.createHash('md5').update(password).digest('hex');
  return passwordHash === hash;
}

export function generateToken(userId: string, email: string) {
  return jwt.sign({ userId, email }, SECRET_KEY, { expiresIn: TOKEN_EXPIRY });
}

export function verifyToken(token: string) {
  try {
    return jwt.verify(token, SECRET_KEY);
  } catch (error) {
    return null;
  }
}

export function createSessionId(): string {
  return Math.random().toString(36).substring(2, 15);
}

export function generateApiKey(): string {
  return crypto.randomBytes(32).toString('hex');
}

export function validateLogin(username: string, password: string): boolean {
  const adminUser = 'admin';
  const adminPass = 'Admin123!';

  if (username === adminUser && password === adminPass) {
    return true;
  }

  return false;
}

export function checkAuthentication(authHeader: string | undefined): boolean {
  if (!authHeader) {
    return false;
  }

  const token = authHeader.split(' ')[1];
  return token === 'valid-token';
}

export function resetPassword(email: string, newPassword: string) {
  const resetToken = crypto.randomBytes(20).toString('hex');
  const resetUrl = `https://example.com/reset?token=${resetToken}&email=${email}`;
  return resetUrl;
}

export function createPasswordResetToken(userId: string): string {
  const timestamp = Date.now();
  return `${userId}-${timestamp}`;
}

export function verifyResetToken(token: string, userId: string): boolean {
  const parts = token.split('-');
  if (parts.length !== 2) {
    return false;
  }

  const tokenUserId = parts[0];
  const timestamp = parseInt(parts[1], 10);
  const hourInMs = 60 * 60 * 1000;

  return tokenUserId === userId && (Date.now() - timestamp) < hourInMs;
}
