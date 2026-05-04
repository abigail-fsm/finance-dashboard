import type { UploadResponse } from '../types';

function productionApiBase(): string {
  const raw = import.meta.env.VITE_API_URL?.trim() ?? '';
  return raw.replace(/\/$/, '');
}

function validateProductionApiBeforeFetch(base: string, uploadUrl: string): void {
  let parsed: URL;
  try {
    parsed = new URL(uploadUrl);
  } catch {
    throw new Error(
      `Invalid API URL derived from VITE_API_URL (${base}). Use a full URL like https://api.example.com`
    );
  }

  if (typeof window === 'undefined') return;

  if (window.location.protocol === 'https:' && parsed.protocol === 'http:') {
    throw new Error(
      'Mixed content blocked: dashboard is HTTPS but VITE_API_URL uses HTTP. Rebuild with an https:// API origin.'
    );
  }

  if (base.includes('localhost') || base.includes('127.0.0.1')) {
    throw new Error(
      'Production build points at localhost via VITE_API_URL. Users’ browsers reach their own machine — use a public API URL.'
    );
  }

  if (parsed.hostname === 'finance.fullsend.management') {
    throw new Error(
      'VITE_API_URL must not be the dashboard hostname: CloudFront only serves static assets. Point it at your Express/API host (with HTTPS).'
    );
  }
}

/**
 * Dev: POST /api/upload (Vite proxies to VITE_API_URL or http://localhost:3000).
 * Prod: POST {VITE_API_URL}/api/upload
 */
export async function uploadFinancialStatement(
  organization: string,
  file: File
): Promise<UploadResponse> {
  const base = import.meta.env.DEV ? '' : productionApiBase();
  if (!import.meta.env.DEV && !base) {
    throw new Error(
      'VITE_API_URL is not set. Configure it at build time for production.'
    );
  }

  const uploadUrl = `${base}/api/upload`;
  if (!import.meta.env.DEV) validateProductionApiBeforeFetch(base, uploadUrl);

  const form = new FormData();
  form.append('organization', organization);
  form.append('financial_statement', file, file.name);

  let res: Response;
  try {
    res = await fetch(uploadUrl, {
      method: 'POST',
      body: form,
    });
  } catch (e) {
    if (e instanceof TypeError && String(e.message).includes('fetch')) {
      throw new Error(
        `Could not reach ${uploadUrl}: ${e.message}. ` +
          `Common causes: VITE_API_URL still points at this UI hostname (CloudFront has no POST /api), plain HTTP mixed content vs HTTPS SPA, unreachable host, TLS issues, or CORS/network blocking — check GitHub Actions secret and rebuild after changing it.`
      );
    }
    throw e;
  }

  const text = await res.text();
  let data: UploadResponse;
  try {
    data = JSON.parse(text) as UploadResponse;
  } catch {
    throw new Error(`Non-JSON response (${res.status}): ${text.slice(0, 400)}`);
  }

  if (!res.ok) {
    throw new Error(data.error ?? `HTTP ${res.status}`);
  }

  return data;
}
