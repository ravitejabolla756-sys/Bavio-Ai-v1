/**
 * api.ts — Centralized API Client for Bavio
 * All backend calls go through here.
 * - Auto-attaches Bearer token from localStorage
 * - Handles 401 → redirect to /login
 * - Typed helpers for common patterns
 */

const API_BASE = '/api';

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
  }
}

export function isAuthenticated(): boolean {
  return Boolean(getToken());
}

// ─── Core fetch wrapper ───────────────────────────────────────────────────────

interface ApiOptions extends RequestInit {
  skipAuth?: boolean;
}

export async function apiFetch<T = unknown>(
  path: string,
  options: ApiOptions = {}
): Promise<T> {
  const { skipAuth = false, headers = {}, ...rest } = options;
  const token = getToken();

  const finalHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(headers as Record<string, string>),
  };

  if (!skipAuth && token) {
    finalHeaders['Authorization'] = `Bearer ${token}`;
  }

  const url = `${API_BASE}${path}`;
  const res = await fetch(url, { ...rest, headers: finalHeaders });

  // Auto-redirect on unauthorized
  if (res.status === 401 && typeof window !== 'undefined') {
    clearAuthData();
    window.location.href = '/login';
    throw new Error('Session expired. Redirecting to login.');
  }

  let body: unknown;
  const contentType = res.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    body = await res.json();
  } else {
    body = await res.text();
  }

  if (!res.ok) {
    const errMsg =
      (body as { error?: string; message?: string })?.error ||
      (body as { error?: string; message?: string })?.message ||
      `API error ${res.status}`;
    throw new Error(errMsg);
  }

  return body as T;
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

export interface SignupPayload {
  name?: string;
  email: string;
  phone?: string;
  password: string;
  country?: string;
  country_code?: string;
  business_name?: string;
  business_phone?: string;
  industry?: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface AuthResponse {
  success: boolean;
  token: string;
  client_id: string;
  name: string;
  email: string;
  plan: string;
  onboarding_status: string;
  onboarding_step: number;
}

export const authApi = {
  signup: (data: SignupPayload) =>
    apiFetch<AuthResponse>('/auth/signup', {
      method: 'POST',
      body: JSON.stringify(data),
      skipAuth: true,
    }),

  login: (data: LoginPayload) =>
    apiFetch<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
      skipAuth: true,
    }),

  getProfile: () => apiFetch<BusinessProfile>('/auth/profile'),

  updateProfile: (data: Partial<BusinessProfile>) =>
    apiFetch<BusinessProfile>('/auth/profile', {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  logout: () => {
    clearAuthData();
    if (typeof window !== 'undefined') {
      window.location.href = '/';
    }
  },
};

// ─── Business Profile ─────────────────────────────────────────────────────────

export interface BusinessProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  country: string;
  api_key: string;
  minutes_limit: number;
  minutes_used: number;
  plan: string;
  plan_name: string;
  current_period_end: string | null;
  onboarding_status: string;
  onboarding_step: number;
  dodo_subscription_id: string | null;
  created_at: string;
  industry?: string;
  language?: string;
  business_description?: string;
  city?: string;
  website?: string;
}

// ─── Onboarding ───────────────────────────────────────────────────────────────

export interface OnboardingStepPayload {
  step: number;
  data: Record<string, unknown>;
}

export const onboardingApi = {
  saveStep: (payload: OnboardingStepPayload) =>
    apiFetch('/onboarding/save-step', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  completeTrial: (data: Record<string, unknown> = {}) =>
    apiFetch('/onboarding/complete-trial', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getStatus: (clientId: string) =>
    apiFetch(`/onboarding/status/${clientId}`),
};

// ─── Assistants (AI Agents) ───────────────────────────────────────────────────

export interface Assistant {
  id: string;
  business_id: string;
  name: string;
  system_prompt: string;
  language: string;
  voice: string;
  model: string;
  first_message: string;
  active: boolean;
  created_at: string;
}

export const assistantsApi = {
  list: (clientId: string) =>
    apiFetch<Assistant[]>(`/assistants/${clientId}`),

  create: (data: Partial<Assistant>) =>
    apiFetch<Assistant>('/assistants', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (id: string, data: Partial<Assistant>) =>
    apiFetch<Assistant>(`/assistants/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
};

// ─── Calls ────────────────────────────────────────────────────────────────────

export interface CallRecord {
  id: string;
  caller_number: string;
  call_status: string;
  duration: number;
  provider: string;
  created_at: string;
  transcript?: { role: string; content: string }[];
  cost_total?: number;
  language?: string;
}

export const callsApi = {
  list: (clientId: string) =>
    apiFetch<CallRecord[]>(`/calls/${clientId}`),
};

// ─── Leads ────────────────────────────────────────────────────────────────────

export interface Lead {
  id: string;
  business_id: string;
  call_id: string | null;
  phone: string;
  name: string | null;
  intent: string | null;
  budget: string | null;
  location: string | null;
  notes: string | null;
  status: string;
  created_at: string;
}

export const leadsApi = {
  list: (clientId: string) =>
    apiFetch<Lead[]>(`/leads/${clientId}`),
  
  create: (data: Partial<Lead>) =>
    apiFetch<Lead>('/leads', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (id: string, data: Partial<Lead>) =>
    apiFetch<Lead>(`/leads/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
};

// ─── Usage ────────────────────────────────────────────────────────────────────

export interface UsageSummary {
  summary: {
    minutes_used: number;
    total_cost: number;
  };
  logs: UsageLog[];
}

export interface UsageLog {
  id: string;
  call_id: string;
  minutes_used: number;
  cost_total: number;
  is_overage: boolean;
  created_at: string;
  caller_number?: string;
  duration?: number;
}

export const usageApi = {
  get: (clientId: string) =>
    apiFetch<UsageSummary>(`/usage/${clientId}`),
};

// ─── Knowledge Base ───────────────────────────────────────────────────────────

export interface KnowledgeDoc {
  id: string;
  business_id: string;
  name: string;
  content: string;
  created_at: string;
  word_count?: number;
}

export interface SearchResult {
  chunk: string;
  source: string;
  confidence: string;
}

export const knowledgeBaseApi = {
  list: () => apiFetch<KnowledgeDoc[]>('/knowledge-base'),

  create: (data: { name: string; content: string }) =>
    apiFetch<KnowledgeDoc>('/knowledge-base', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  delete: (id: string) =>
    apiFetch(`/knowledge-base/${id}`, { method: 'DELETE' }),

  search: (q: string) =>
    apiFetch<SearchResult[]>(`/knowledge-base/search?q=${encodeURIComponent(q)}`),
};

// ─── Integrations ─────────────────────────────────────────────────────────────

export interface Integration {
  id: string;
  name: string;
  desc: string;
  status: 'Connected' | 'Inactive' | 'Coming Soon';
  category: string;
  comingSoon: boolean;
  enabled: boolean;
  keys: Record<string, string>;
}

export const integrationsApi = {
  list: () => apiFetch<{ success: boolean; data: Integration[] }>('/integrations'),

  connect: (id: string, keys: Record<string, string>) =>
    apiFetch(`/integrations/${id}/connect`, {
      method: 'POST',
      body: JSON.stringify(keys),
    }),

  disconnect: (id: string) =>
    apiFetch(`/integrations/${id}/disconnect`, { method: 'POST' }),

  test: (id: string) =>
    apiFetch(`/integrations/${id}/test`, { method: 'POST' }),

  sync: (id: string) =>
    apiFetch(`/integrations/${id}/sync`, { method: 'POST' }),
};

// ─── Numbers ──────────────────────────────────────────────────────────────────

export interface PhoneNumber {
  id: string;
  number: string;
  provider: string;
  label?: string;
  status: string;
  created_at: string;
}

export const numbersApi = {
  list: (clientId: string) =>
    apiFetch<PhoneNumber[]>(`/numbers/${clientId}`),

  link: (data: { number: string; label?: string; provider?: string }) =>
    apiFetch('/numbers/link', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};

// ─── Billing ──────────────────────────────────────────────────────────────────

export interface BillingStatus {
  id: string;
  plan: string;
  plan_name: string;
  minutes_limit: number;
  minutes_used: number;
  current_period_end: string | null;
  dodo_subscription_id: string | null;
  status: string;
}

export interface PaymentRecord {
  id: string;
  amount: number;
  currency: string;
  plan: string;
  created_at: string;
  status: string;
}

export interface RazorpayOrder {
  order_id: string;
  amount: number;
  currency: string;
  key_id: string;
  notes?: Record<string, string>;
}

export const billingApi = {
  getStatus: (clientId: string) =>
    apiFetch<BillingStatus>(`/billing/status/${clientId}`),

  getPayments: (clientId: string) =>
    apiFetch<PaymentRecord[]>(`/billing/payments/${clientId}`),

  subscribe: (plan: string, country_code?: string) =>
    apiFetch<{ subscriptionId: string; url: string; checkoutUrl: string }>('/billing/subscribe', {
      method: 'POST',
      body: JSON.stringify({ plan, ...(country_code ? { country_code } : {}) }),
    }),

  cancel: () =>
    apiFetch('/billing/cancel', { method: 'POST' }),

  changePlan: (plan: string) =>
    apiFetch('/billing/change-plan', {
      method: 'POST',
      body: JSON.stringify({ plan }),
    }),

  createRazorpayOrder: (data: { amount: number; plan?: string; type?: string }) =>
    apiFetch<RazorpayOrder>('/billing/razorpay/create-order', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  verifyRazorpayPayment: (data: {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
    plan?: string;
    type?: string;
    topupMinutes?: number;
    amount?: number;
    gstNumber?: string;
    gstBusinessName?: string;
  }) =>
    apiFetch('/billing/razorpay/verify', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};
