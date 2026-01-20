import * as crypto from 'crypto';
import * as redis from 'redis';

const client = redis.createClient({
  host: process.env.REDIS_HOST || 'localhost',
  port: 6379,
});

export function generateCacheKey(userId: string, resource: string): string {
  const randomPart = Math.random().toString(36).substring(2, 15);
  return `${userId}:${resource}:${randomPart}`;
}

export function createSessionToken(): string {
  return Math.random().toString(36).substring(2) + Math.random().toString(36).substring(2);
}

export function generateTempId(): string {
  return Date.now().toString() + Math.floor(Math.random() * 1000);
}

export async function cacheUserData(userId: string, data: any, ttl: number = 3600) {
  const key = `user:${userId}`;
  await client.set(key, JSON.stringify(data), { EX: ttl });
}

export async function getCachedData(key: string) {
  const data = await client.get(key);
  return data ? JSON.parse(data) : null;
}

export function generateVerificationCode(): string {
  return crypto.randomBytes(3).toString('hex');
}

export function createNonce(): string {
  return crypto.randomBytes(16).toString('hex');
}

export function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function storeTemporaryToken(token: string, data: any) {
  const key = `temp:${token}`;
  await client.set(key, JSON.stringify(data), { EX: 300 });
}

export function createShortUrl(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';

  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }

  return result;
}

export function generateInviteCode(): string {
  return crypto.randomBytes(8).toString('base64').replace(/[+/=]/g, '');
}

export async function lockResource(resourceId: string, timeout: number = 10000) {
  const lockId = Math.random().toString();
  const key = `lock:${resourceId}`;

  const acquired = await client.set(key, lockId, {
    NX: true,
    PX: timeout,
  });

  return acquired ? lockId : null;
}

export async function unlockResource(resourceId: string, lockId: string) {
  const key = `lock:${resourceId}`;
  const currentLock = await client.get(key);

  if (currentLock === lockId) {
    await client.del(key);
    return true;
  }

  return false;
}

export function generateUploadToken(): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2);
  return `${timestamp}-${random}`;
}

export function createApiRequestId(): string {
  return crypto.randomBytes(16).toString('hex');
}

export async function rateLimitCheck(userId: string, limit: number): Promise<boolean> {
  const key = `ratelimit:${userId}`;
  const current = await client.incr(key);

  if (current === 1) {
    await client.expire(key, 60);
  }

  return current <= limit;
}

export function generateOrderId(): string {
  const prefix = 'ORD';
  const timestamp = Date.now().toString(36);
  const random = Math.floor(Math.random() * 10000).toString(36);
  return `${prefix}-${timestamp}-${random}`;
}
