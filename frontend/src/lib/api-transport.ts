const API_BASE = '/api';
import { getLocalUiPreviewResponse, isLocalUiPreviewSession } from './local-ui-preview';
import { LOCAL_UI_PREVIEW_COOKIE } from './local-ui-preview';

// ─── Token helpers ────────────────────────────────────────────────────────────

export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('bavio_token');
}

export function getClientId(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('bavio_client_id');
}

export function setAuthData(token: string, clientId: string, name?: string) {
  localStorage.setItem('bavio_token', token);
  localStorage.setItem('bavio_client_id', clientId);
  if (name) localStorage.setItem('bavio_name', name);
}

export function clearAuthData() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('bavio_token');
    localStorage.removeItem('bavio_client_id');
    localStorage.removeItem('bavio_name');
    document.cookie = 'bavio_auth=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    document.cookie = 'bavio_onboarding_completed=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    document.cookie = `${LOCAL_UI_PREVIEW_COOKIE}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
  }
}

export function isAuthenticated(): boolean {
  return Boolean(getToken());
}

// ─── Core fetch wrapper ───────────────────────────────────────────────────────

interface ApiOptions extends RequestInit {
  skipAuth?: boolean;
}

export class ApiError extends Error {
  constructor(message: string, public readonly status: number) { super(message); this.name = 'ApiError'; }
}

export async function apiFetch<T = unknown>(
  path: string,
  options: ApiOptions = {}
): Promise<T> {
  const { skipAuth = false, headers = {}, ...rest } = options;
  const token = getToken();

  const preview = getLocalUiPreviewResponse<T>(path, rest.method);
  if (preview.handled) {
    if (rest.method && rest.method.toUpperCase() !== 'GET') {
      throw new ApiError('This action is disabled in local UI preview.', 403);
    }
    return preview.value as T;
  }

  if (isLocalUiPreviewSession() && rest.method && rest.method.toUpperCase() !== 'GET') {
    throw new ApiError('This action is disabled in local UI preview.', 403);
  }

  const finalHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(headers as Record<string, string>),
  };

  if (!skipAuth && token) {
    finalHeaders['Authorization'] = `Bearer ${token}`;
  }

  const url = `${API_BASE}${path}`;
  let res: Response;
  try {
    res = await fetch(url, { ...rest, headers: finalHeaders });
  } catch (err: any) {
    throw new Error(rest.method && rest.method !== 'GET'
      ? 'The request could not be confirmed. Refresh the current state before retrying.'
      : 'Unable to reach the server. Please retry.');
  }

  // Auto-redirect on unauthorized: ONLY for explicit auth verification endpoints
  if (res.status === 401 && !skipAuth && typeof window !== 'undefined') {
    const isAuthVerificationEndpoint = path.startsWith('/auth/profile') || path.startsWith('/auth/verify');
    if (isAuthVerificationEndpoint) {
      clearAuthData();
      window.location.href = '/login';
      throw new Error('Session expired. Redirecting to login.');
    }
  }

  let body: unknown;
  const contentType = res.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    try {
      body = await res.json();
    } catch {
      body = null;
    }
  } else {
    try {
      body = await res.text();
    } catch {
      body = null;
    }
  }

  if (!res.ok || (body && typeof body === 'object' && 'success' in body && body.success === false)) {
    const errMsg =
      (body as { message?: string })?.message ||
      (typeof (body as { error?: unknown })?.error === 'string' ? (body as { error: string }).error : undefined) ||
      `API error ${res.status}`;
    throw new ApiError(errMsg, res.status);
  }

  return body as T;
}

// ─── Auth ─────────────────────────────────────────────────────────────────────
