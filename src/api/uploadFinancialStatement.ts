import type { UploadResponse } from '../types';

function productionApiBase(): string {
  const raw = import.meta.env.VITE_API_URL?.trim() ?? '';
  return raw.replace(/\/$/, '');
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

  const form = new FormData();
  form.append('organization', organization);
  form.append('financial_statement', file, file.name);

  const res = await fetch(`${base}/api/upload`, {
    method: 'POST',
    body: form,
  });

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
