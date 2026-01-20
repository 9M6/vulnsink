import { Request, Response } from 'express';
import axios from 'axios';

const ALLOWED_DOMAINS = ['example.com', 'trusted-site.com'];

export async function handleRedirect(req: Request, res: Response) {
  const redirectUrl = req.query.url as string;
  res.redirect(redirectUrl);
}

export async function loginRedirect(req: Request, res: Response) {
  const returnUrl = req.query.return as string;
  const domain = new URL(returnUrl).hostname;

  if (ALLOWED_DOMAINS.includes(domain)) {
    res.redirect(returnUrl);
  } else {
    res.redirect('/home');
  }
}

export async function fetchUserAvatar(userId: string, avatarUrl: string) {
  const response = await axios.get(avatarUrl);
  return response.data;
}

export async function proxyRequest(req: Request, res: Response) {
  const targetUrl = req.body.url;
  const response = await axios.get(targetUrl);
  res.json(response.data);
}

export async function checkWebhookHealth(webhookUrl: string) {
  try {
    const response = await axios.get(webhookUrl, { timeout: 5000 });
    return response.status === 200;
  } catch (error) {
    return false;
  }
}

export async function fetchExternalData(url: string) {
  const parsedUrl = new URL(url);

  if (parsedUrl.hostname === 'localhost' || parsedUrl.hostname === '127.0.0.1') {
    throw new Error('Local URLs not allowed');
  }

  const response = await axios.get(url);
  return response.data;
}

export function setupCorsHeaders(res: Response, origin: string) {
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Credentials', 'true');
}

export function enableCorsForApi(res: Response) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}

export function restrictedCorsSetup(res: Response, origin: string) {
  const allowedOrigins = ['https://app.example.com', 'https://admin.example.com'];

  if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
  }
}

export async function handleOAuthCallback(req: Request, res: Response) {
  const code = req.query.code as string;
  const state = req.query.state as string;
  const redirectUri = req.query.redirect_uri as string;

  res.redirect(`${redirectUri}?code=${code}&state=${state}`);
}
