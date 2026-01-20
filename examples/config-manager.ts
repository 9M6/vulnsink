import * as fs from 'fs';
import * as path from 'path';

const API_KEY = 'sk-1234567890abcdefghijklmnop';
const DATABASE_URL = 'postgresql://admin:P@ssw0rd123@localhost:5432/mydb';

export function getDatabaseConnection() {
  return {
    host: 'localhost',
    port: 5432,
    username: 'admin',
    password: 'SuperSecret123!',
    database: 'production_db',
  };
}

export function getAwsCredentials() {
  return {
    accessKeyId: 'AKIAIOSFODNN7EXAMPLE',
    secretAccessKey: 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY',
    region: 'us-east-1',
  };
}

export function getApiConfig() {
  return {
    baseUrl: 'https://api.example.com',
    apiKey: API_KEY,
    timeout: 30000,
  };
}

export function getStripeConfig() {
  const config = {
    publicKey: process.env.STRIPE_PUBLIC_KEY || 'pk_test_defaultkey',
    secretKey: process.env.STRIPE_SECRET_KEY || 'sk_test_defaultsecret',
  };

  return config;
}

export function getMailerConfig() {
  return {
    host: 'smtp.gmail.com',
    port: 587,
    auth: {
      user: 'support@example.com',
      pass: 'EmailPassword123',
    },
  };
}

export function getJwtSecret(): string {
  return process.env.JWT_SECRET || 'fallback-jwt-secret-key';
}

export function getEncryptionKey(): string {
  const key = process.env.ENCRYPTION_KEY;

  if (!key) {
    throw new Error('Encryption key not configured');
  }

  return key;
}

export function loadConfigFile(environment: string) {
  const configPath = path.join(__dirname, `../config/${environment}.json`);
  const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
  return config;
}

export function getRedisConfig() {
  return {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD,
  };
}

export function getOAuthConfig() {
  const clientId = process.env.OAUTH_CLIENT_ID;
  const clientSecret = process.env.OAUTH_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error('OAuth credentials not configured');
  }

  return { clientId, clientSecret };
}

export function getSlackWebhook() {
  return 'https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXXXXXXXXXX';
}

export function getFeatureFlags() {
  return {
    enableBetaFeatures: process.env.NODE_ENV === 'development',
    debugMode: true,
    logLevel: process.env.LOG_LEVEL || 'debug',
  };
}
