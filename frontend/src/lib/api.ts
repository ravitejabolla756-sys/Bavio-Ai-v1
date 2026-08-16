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
  if (res.status === 401 && !skipAuth && typeof window !== 'undefined') {
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
  businessName?: string;
  businessPhone?: string;
  countryCode?: string;
  dialCode?: string;
  phoneNumber?: string;
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
  checkEmail: (email: string) =>
    apiFetch<{ available: boolean; email: string; message?: string }>('/auth/check-email', {
      method: 'POST',
      body: JSON.stringify({ email }),
      skipAuth: true,
    }),

  signup: (data: SignupPayload & { demoCompleted?: boolean }) =>
    apiFetch<AuthResponse>('/auth/signup', {
      method: 'POST',
      body: JSON.stringify(data),
      skipAuth: true,
    }),

  verifyOtp: (email: string, token: string) =>
    apiFetch<AuthResponse>('/auth/verify-otp', {
      method: 'POST',
      body: JSON.stringify({ email, token }),
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

  resendVerification: (email: string) =>
    apiFetch<{ success: boolean; message: string }>('/auth/resend-verification', {
      method: 'POST',
      body: JSON.stringify({ email }),
      skipAuth: true,
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
  twilio_number?: string | null;
  subscription_status?: string;
  businessName?: string;
  country_code?: string;
  assistant_name?: string;
  assistant_status?: string;
  voice?: string;
  greeting?: string;
  nextRoute?: string;
  success?: boolean;
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

// ─── Assistants (AI Agents & Model Tiers) ──────────────────────────────────

export interface ModelTierOption {
  id: 'auto' | 'swift' | 'core' | 'prime';
  label: string;
  tagline: string;
  description: string;
  priceInrPerMin: number;
  priceUsdPerMin: number;
  isDefault?: boolean;
}

export interface ProviderRegistryItem {
  provider: string;
  model: string;
  displayName: string;
  tier?: string;
  latencyClass?: string;
}

export interface ModelTiersCatalogResponse {
  success: boolean;
  tiers: ModelTierOption[];
  registry: {
    intelligence: ProviderRegistryItem[];
    stt: ProviderRegistryItem[];
    tts: ProviderRegistryItem[];
  };
}

export interface Assistant {
  id: string;
  business_id: string;
  name: string;
  system_prompt: string;
  language: string;
  voice: string;
  voice_id?: string;
  model: string;
  first_message: string;
  active: boolean;
  created_at: string;
  // Model Tier Architecture properties
  intelligence_tier?: 'auto' | 'swift' | 'core' | 'prime';
  intelligence_mode?: string;
  intelligence_provider?: string;
  intelligence_model?: string;
  stt_provider?: string;
  stt_model?: string;
  tts_provider?: string;
  tts_model?: string;
  model_routing_config?: Record<string, any>;
}

export const assistantsApi = {
  list: (clientId: string) =>
    apiFetch<Assistant[]>(`/assistants/${clientId}`),

  getModelTiers: () =>
    apiFetch<ModelTiersCatalogResponse>('/assistants/model-tiers'),

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
  virtual_number?: string;
  direction?: string;
  recording_url?: string;
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

  syncToAssistant: () =>
    apiFetch<{ docsCount: number; success: boolean; message: string }>(
      '/knowledge-base/sync',
      { method: 'POST' }
    ),
};


// ─── Numbers ──────────────────────────────────────────────────────────────────

export interface PhoneNumber {
  id: string;
  number: string;
  phone_number?: string;
  provider: string;
  label?: string;
  status: string;
  country_code?: string;
  phone_number_type?: string;
  capabilities?: {
    voice?: boolean;
    sms?: boolean;
    mms?: boolean;
    inbound?: boolean;
    outbound?: boolean;
  };
  regulatory_status?: string;
  assistant_id?: string | null;
  assistant_name?: string | null;
  created_at: string;
}

export interface PhoneCountry {
  code: string;
  name: string;
  flag: string;
  dialCode: string;
  hasDirectInventory: boolean;
  availableTypes: string[];
  notice?: string | null;
}

export interface NumberTypeOption {
  type: string;
  label: string;
  supported: boolean;
}

export interface AvailableNumber {
  phoneNumber: string;
  friendlyName: string;
  isoCountry: string;
  numberType: string;
  capabilities: {
    voice: boolean;
    sms: boolean;
    mms: boolean;
    inbound: boolean;
    outbound: boolean;
  };
  locality?: string | null;
  region?: string | null;
  postalCode?: string | null;
  monthlyRate: string;
}

export interface RegulatoryRequirement {
  required: boolean;
  friendlyName: string;
  requirements: string[];
  message: string;
}

export const numbersApi = {
  list: (clientId?: string) =>
    apiFetch<PhoneNumber[]>(clientId && clientId !== 'undefined' ? `/phone-numbers/${clientId}` : '/phone-numbers/list')
      .catch(() => apiFetch<PhoneNumber[]>('/phone-numbers/list'))
      .catch(() => []),

  getCountries: () =>
    apiFetch<{ success: boolean; countries: PhoneCountry[] }>('/phone-numbers/countries'),

  getNumberTypes: (countryCode: string) =>
    apiFetch<{ success: boolean; countryCode: string; types: NumberTypeOption[] }>(
      `/phone-numbers/types?countryCode=${encodeURIComponent(countryCode)}`
    ),

  getRegulatoryRequirements: (countryCode: string, numberType = 'local') =>
    apiFetch<RegulatoryRequirement & { success: boolean }>(
      `/phone-numbers/regulatory-requirements?countryCode=${encodeURIComponent(countryCode)}&numberType=${encodeURIComponent(numberType)}`
    ),

  search: (params: {
    countryCode: string;
    type?: string;
    voice?: boolean;
    sms?: boolean;
    areaCode?: string;
    contains?: string;
    limit?: number;
  }) => {
    const q = new URLSearchParams();
    q.set('countryCode', params.countryCode);
    if (params.type) q.set('type', params.type);
    if (params.voice !== undefined) q.set('voice', String(params.voice));
    if (params.sms !== undefined) q.set('sms', String(params.sms));
    if (params.areaCode) q.set('areaCode', params.areaCode);
    if (params.contains) q.set('contains', params.contains);
    if (params.limit) q.set('limit', String(params.limit));
    return apiFetch<{
      success: boolean;
      countryCode: string;
      numberType: string;
      numbers: AvailableNumber[];
      notice?: string | null;
    }>(`/phone-numbers/search?${q.toString()}`);
  },

  provision: (data: {
    phoneNumber: string;
    countryCode: string;
    numberType?: string;
    assistantId?: string;
    regulatoryInfo?: any;
  }) =>
    apiFetch<{ success: boolean; message: string; data: PhoneNumber }>('/phone-numbers/provision', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Backward compatibility alias methods
  getAvailable: (country: string) =>
    numbersApi.search({ countryCode: country, type: 'local' }).then((r) => r.numbers),

  buyNumber: (data: { phoneNumber: string; countryCode: string; assistantId?: string }) =>
    numbersApi.provision(data).then((r) => r.data),

  link: (data: {
    number?: string;
    phoneId?: string;
    phone_number_id?: string;
    assistantId?: string;
    assistant_id?: string;
    assistantName?: string;
  }) =>
    apiFetch<{ success: boolean; data: PhoneNumber }>('/phone-numbers/link', {
      method: 'POST',
      body: JSON.stringify(data),
    }).then((r) => r.data || (r as any)),

  linkNumber: (data: { phoneId: string; assistantId: string; assistantName?: string }) =>
    apiFetch<{ success: boolean; data: PhoneNumber }>('/phone-numbers/link', {
      method: 'POST',
      body: JSON.stringify(data),
    }).then((r) => r.data || (r as any)),

  unlinkNumber: (phoneId: string) =>
    apiFetch<{ success: boolean; data: PhoneNumber }>('/phone-numbers/unlink', {
      method: 'POST',
      body: JSON.stringify({ phoneId }),
    }).then((r) => r.data || (r as any)),

  release: (phoneId: string) =>
    apiFetch<{ success: boolean; message: string }>('/phone-numbers/release', {
      method: 'POST',
      body: JSON.stringify({ phoneId }),
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
  payment_type?: string;
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

  getBalance: () =>
    apiFetch<{
      plan: string;
      subscriptionStatus: string;
      billingPeriodEnd: string | null;
      monthlyLimitMinutes: number;
      monthlyUsedMinutes: number;
      monthlyRemainingMinutes: number;
      topupRemainingMinutes: number;
      totalAvailableMinutes: number;
      usagePercent: number;
      monthlyLimitSeconds: number;
      monthlyUsedSeconds: number;
      monthlyRemainingSeconds: number;
      topupBalanceSeconds: number;
    }>('/billing/balance', {
      method: 'GET',
    }),

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

// ─── Demo ─────────────────────────────────────────────────────────────────────

export const demoApi = {
  start: (phoneNumber: string, countryCode: string) =>
    apiFetch<{ success: boolean; session: any; callSid: string }>('/demo/start', {
      method: 'POST',
      body: JSON.stringify({ phoneNumber, countryCode }),
    }),
  getStatus: () =>
    apiFetch<{ eligible: boolean; session: any; transcript?: any[] }>('/demo/status', {
      method: 'GET',
    }),
  hangup: () =>
    apiFetch<{ success: boolean }>('/demo/hangup', {
      method: 'POST',
    }),
  saveCall: (data: {
    caller_number: string;
    duration?: number;
    call_status?: string;
    transcript?: string;
  }) =>
    apiFetch('/calls/demo', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  // Public Demo endpoints
  createSession: (industry: string, language: string) =>
    apiFetch<{ success: boolean; sessionId: string; checkoutUrl: string }>('/demo/create-session', {
      method: 'POST',
      body: JSON.stringify({ industry, language }),
    }),
  verifyPayment: (sessionId: string, mockPaid?: boolean) =>
    apiFetch<{ success: boolean; session: any }>(`/demo/verify-payment?session_id=${sessionId}${mockPaid ? '&mock_paid=true' : ''}`, {
      method: 'GET',
    }),
  getSessionStatus: (sessionId: string) =>
    apiFetch<{ success: boolean; session: any; transcript?: any[] }>(`/demo/session-status/${sessionId}`, {
      method: 'GET',
    }),
  startSessionCall: (sessionId: string, phoneNumber: string, countryCode: string) =>
    apiFetch<{ success: boolean; callSid: string }>(`/demo/start-session-call/${sessionId}`, {
      method: 'POST',
      body: JSON.stringify({ phoneNumber, countryCode }),
    }),
  hangupSessionCall: (sessionId: string) =>
    apiFetch<{ success: boolean }>(`/demo/hangup-session-call/${sessionId}`, {
      method: 'POST',
    }),
  configureSession: (sessionId: string, industry: string, language: string) =>
    apiFetch<{ success: boolean; session: any }>(`/demo/configure-session/${sessionId}`, {
      method: 'POST',
      body: JSON.stringify({ industry, language }),
    }),
};

