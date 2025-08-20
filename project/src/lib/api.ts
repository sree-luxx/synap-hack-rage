export const API_BASE_URL = (import.meta as any).env?.VITE_API_BASE_URL || 'http://localhost:3000';

export type ApiMethod = 'GET' | 'POST' | 'PUT' | 'DELETE';

export async function apiFetch<T = any>(path: string, options?: { method?: ApiMethod; body?: any; token?: string; headers?: Record<string, string> }): Promise<T> {
  const method = options?.method || 'GET';
  const token = options?.token || localStorage.getItem('hackhub_token') || '';
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options?.headers || {}),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers,
    body: options?.body ? JSON.stringify(options.body) : undefined,
    credentials: 'include',
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || json?.success === false) {
    const message = json?.message || `Request failed (${res.status})`;
    throw new Error(message);
  }
  return (json?.data ?? json) as T;
}


