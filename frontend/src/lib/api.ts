/** Existing public API surface; transport and response normalization live separately. */
import { unwrapData, requireArray, requireRecord } from './api-response';
import { apiFetch, clearAuthData } from './api-transport';
export { apiFetch, getToken, getClientId, setAuthData, clearAuthData, isAuthenticated } from './api-transport';

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

  forgotPassword: (email: string) =>
    apiFetch<{ success: boolean; message: string }>('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
      skipAuth: true,
    }),

  verifyResetToken: (token: string) =>
    apiFetch<{ success: boolean; valid: boolean; error?: string }>('/auth/verify-reset-token', {
      method: 'POST',
      body: JSON.stringify({ token }),
      skipAuth: true,
    }),

  resetPassword: (data: { token: string; password: string }) =>
    apiFetch<{ success: boolean; message: string }>('/auth/reset-password', {
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
  api_key?: string;
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

export interface ApiKeyRecord {
  id: string;
  name: string;
  key_prefix: string;
  environment: string;
  created_at: string;
  last_used_at?: string | null;
  revoked_at?: string | null;
  secret?: string;
}

export const developersApi = {
  listKeys: () => apiFetch<unknown>('/v1/api-keys').then(value => requireArray<ApiKeyRecord>(unwrapData(value))),
  createKey: (name: string, environment: 'live' | 'test' = 'live') =>
    apiFetch<unknown>('/v1/api-keys', { method: 'POST', body: JSON.stringify({ name, environment }) })
      .then(value => requireRecord<ApiKeyRecord>(unwrapData(value))),
  revokeKey: (id: string) => apiFetch<unknown>(`/v1/api-keys/${id}`, { method: 'DELETE' }),
};

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
    apiFetch<unknown>(`/assistants/${clientId}`).then(value => requireArray<Assistant>(unwrapData(value))),

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
    apiFetch<unknown>(`/calls/${clientId}`).then(value => requireArray<CallRecord>(unwrapData(value))),
};

// ─── Leads ────────────────────────────────────────────────────────────────────

import type { Lead } from '@/features/leads/model';
export type { Lead } from '@/features/leads/model';

export const leadsApi = {
  list: (clientId: string) =>
    apiFetch<unknown>(`/leads/${clientId}`).then(value => requireArray<Lead>(unwrapData(value))),
  
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

// ─── Evidence-backed Actions ────────────────────────────────────────────────

export type ActionAvailability = 'configured' | 'not_configured' | 'unavailable';
export type ActionStatus = 'started' | 'processing' | 'succeeded' | 'failed' | 'unknown';

export interface ActionEvidence {
  type: string;
  record_id?: string | null;
  http_status?: number | null;
  outcome?: string | null;
  provider_reference?: string | null;
}

export interface ActionExecution {
  id: string;
  type: string;
  name: string;
  system: string;
  kind: string;
  status: ActionStatus;
  started_at: string;
  completed_at?: string | null;
  duration_ms?: number | null;
  error_code?: string | null;
  error_message?: string | null;
  source_type?: string | null;
  source_id?: string | null;
  conversation_id?: string | null;
  lead_id?: string | null;
  evidence?: ActionEvidence | null;
}

export interface ActionDefinition {
  type: string;
  name: string;
  system: string;
  kind: string;
  description: string;
  availability: ActionAvailability;
  last_execution: ActionExecution | null;
}

export interface WebhookConfiguration {
  id: string;
  url: string;
  events: string[];
  status: string;
  created_at: string;
  updated_at?: string;
}

interface ActionsPayload {
  actions: ActionDefinition[];
  executions: ActionExecution[];
  pagination: { has_more: boolean; next_cursor?: string | null };
}

export const actionsApi = {
  list: () => apiFetch<{ data: ActionsPayload }>('/v1/actions').then(response => response.data),
  detail: (type: string) => apiFetch<{ data: { action: ActionDefinition; configurations: WebhookConfiguration[]; executions: ActionExecution[]; pagination: { has_more: boolean } } | null }>(`/v1/actions/${encodeURIComponent(type)}`).then(response => {
    if (!response.data?.action) throw new Error('Action detail is unavailable.');
    return response.data;
  }),
  execution: (id: string) => apiFetch<{ data: ActionExecution | null }>(`/v1/actions/executions/${encodeURIComponent(id)}`).then(response => {
    if (!response.data?.id) throw new Error('Execution detail is unavailable.');
    return response.data;
  }),
  leadExecutions: (id: string) => apiFetch<{ data: ActionExecution[] }>(`/v1/actions/leads/${encodeURIComponent(id)}`).then(response => response.data),
  conversationExecutions: (id: string) => apiFetch<{ data: ActionExecution[] }>(`/v1/actions/conversations/${encodeURIComponent(id)}`).then(response => response.data),
  createWebhook: (url: string) => apiFetch<{ data: WebhookConfiguration }>('/v1/webhooks', { method: 'POST', body: JSON.stringify({ url, events: ['*'] }) }).then(response => response.data),
};

// ─── Read-only Workflow Product Surface ────────────────────────────────────

export type WorkflowStatus = 'pending' | 'running' | 'processing' | 'succeeded' | 'failed' | 'partial' | 'unknown';
export type WorkflowStepStatus = WorkflowStatus | 'skipped';
export interface WorkflowStep { id: string; position: number; action_type: string; name: string; system: string; kind: string; configuration?: Record<string, unknown>; }
export interface WorkflowRun { id: string; workflow_definition_id: string; workflow_version_id: string; version: number; status: WorkflowStatus; source_type?: string | null; source_id?: string | null; conversation_id?: string | null; started_at?: string | null; completed_at?: string | null; created_at: string; failure_code?: string | null; failure_message?: string | null; failure_step?: string | null; }
export interface WorkflowDefinition { id: string; key: string; name: string; enabled: boolean; version: number; version_id: string; trigger?: string | null; steps: WorkflowStep[]; last_run: { id: string; status: WorkflowStatus; started_at?: string | null; completed_at?: string | null } | null; created_at: string; updated_at: string; }
export interface WorkflowStepExecution { id: string; workflow_step_id: string; position: number; status: WorkflowStepStatus; action_type: string; name: string; system: string; kind: string; action_execution_id?: string | null; started_at?: string | null; completed_at?: string | null; failure_code?: string | null; failure_message?: string | null; action_status?: ActionStatus | null; action_error_code?: string | null; action_error_message?: string | null; lead_id?: string | null; evidence?: ActionEvidence | null; }
export interface WorkflowExecutionDetail { execution: WorkflowRun & { workflow_key: string; name: string }; steps: WorkflowStepExecution[]; }
interface WorkflowsPayload { workflows: WorkflowDefinition[]; }
interface WorkflowRunsPayload { executions: WorkflowRun[]; pagination: { limit: number; offset: number; has_more: boolean; next_offset?: number | null }; }
export const workflowsApi = {
  list: () => apiFetch<{ data: WorkflowsPayload }>('/v1/workflows').then(response => response.data),
  detail: (id: string) => apiFetch<{ data: { workflow: WorkflowDefinition } }>(`/v1/workflows/${encodeURIComponent(id)}`).then(response => response.data),
  executions: (id: string, offset = 0) => apiFetch<{ data: WorkflowRunsPayload }>(`/v1/workflows/${encodeURIComponent(id)}/executions?limit=20&offset=${offset}`).then(response => response.data),
  execution: (id: string) => apiFetch<{ data: WorkflowExecutionDetail }>(`/v1/workflow-executions/${encodeURIComponent(id)}`).then(response => response.data),
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
  list: () => apiFetch<unknown>('/knowledge-base').then(value => requireArray<KnowledgeDoc>(unwrapData(value))),

  create: (data: { name: string; content: string }) =>
    apiFetch<KnowledgeDoc>('/knowledge-base', {
      method: 'POST',
      body: JSON.stringify(data),
    }).then(value => requireRecord<KnowledgeDoc>(unwrapData(value))),

  update: (id: string, data: Partial<KnowledgeDoc>) =>
    apiFetch<KnowledgeDoc>(`/knowledge-base/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }).then(value => requireRecord<KnowledgeDoc>(unwrapData(value))),

  delete: (id: string) =>
    apiFetch(`/knowledge-base/${id}`, { method: 'DELETE' }),

  search: (q: string) =>
    apiFetch<unknown>(`/knowledge-base/search?q=${encodeURIComponent(q)}`).then(value => requireArray<SearchResult>(unwrapData(value))),

  syncToAssistant: () =>
    apiFetch<{ docsCount: number; success: boolean; message: string }>(
      '/knowledge-base/sync',
      { method: 'POST' }
    ),
};

// ─── Numbers ──────────────────────────────────────────────────────────────────

export interface PhoneNumber {
  twilio_sid?: string | null;
  id: string;
  number: string;
  provider: string;
  label?: string;
  status: string;
  created_at: string;
  assistant_id?: string | null;
  assistant_name?: string | null;
  country_code?: string;
}

export interface AvailablePhoneNumber {
  phoneNumber: string;
  friendlyName?: string;
  isoCountry?: string;
  numberType?: string;
  capabilities?: { voice?: boolean; sms?: boolean; mms?: boolean; inbound?: boolean; outbound?: boolean };
  locality?: string | null;
  region?: string | null;
  postalCode?: string | null;
  monthlyRate?: string | null;
}

/** A country Bavio supports for phone number provisioning, sourced from the canonical backend catalog. */
export interface SupportedCountry {
  code: string;
  name: string;
  flag: string;
  dialCode: string;
  hasDirectInventory: boolean;
  availableTypes: string[];
  notice: string | null;
  /**
   * available                – Twilio confirmed this country supports provisioning
   * regulatory_requirements  – provisioning possible but requires compliance docs
   * temporarily_unavailable  – Twilio API was unreachable this cycle; may work
   * unsupported              – not confirmed by provider; excluded from selector
   */
  provisioningStatus: 'available' | 'regulatory_requirements' | 'temporarily_unavailable' | 'unsupported';
}

export interface CountriesResponse {
  status: 'available' | 'temporarily_unavailable';
  countries: SupportedCountry[];
}

/** A number type (local, tollFree, mobile, etc.) supported for a given country. */
export interface SupportedNumberType {
  type: string;
  label: string;
  supported: boolean;
}

export const numbersApi = {
  list: (clientId: string) =>
    apiFetch<unknown>(`/numbers/${clientId}`).then(value => requireArray<PhoneNumber>(unwrapData(value))),

  link: (data: { number: string; label?: string; provider?: string }) =>
    apiFetch('/numbers/link', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  /** Fetch the canonical Bavio-supported country catalog from the backend. */
  getCountries: (): Promise<CountriesResponse> =>
    apiFetch<{ success: boolean; status?: 'available' | 'temporarily_unavailable'; countries: unknown }>('/numbers/countries').then(value => {
      const countriesList = Array.isArray(value?.countries) ? (value.countries as SupportedCountry[]) : [];
      const status = value?.status || (countriesList.length > 0 ? 'available' : 'temporarily_unavailable');
      return { status, countries: countriesList };
    }),

  /** Fetch available number types for a country from the backend. */
  getNumberTypes: (countryCode: string): Promise<SupportedNumberType[]> =>
    apiFetch<{ success: boolean; types: unknown }>(`/numbers/types?countryCode=${encodeURIComponent(countryCode)}`).then(value => {
      if (!value || !Array.isArray(value.types)) throw new Error('Number types unavailable.');
      return value.types as SupportedNumberType[];
    }),

  getAvailable: (country: string, type?: string) =>
    apiFetch<{ numbers: unknown; notice?: string | null }>(
      `/numbers/available?countryCode=${encodeURIComponent(country)}${type ? `&type=${encodeURIComponent(type)}` : ''}`
    ).then(value => {
      if (!value || !Array.isArray(value.numbers)) throw new Error('Telephony service unavailable. Phone number inventory could not be checked.');
      return { numbers: requireArray<AvailablePhoneNumber>(value.numbers), notice: value.notice || null };
    }),

  buyNumber: (data: { phoneNumber: string; countryCode: string }) =>
    apiFetch<unknown>('/numbers/buy', {
      method: 'POST',
      body: JSON.stringify(data),
    }).then(value => requireRecord<PhoneNumber>(unwrapData(value))),

  linkNumber: (data: { phoneId: string; assistantId: string; assistantName?: string }) =>
    apiFetch<unknown>('/numbers/link', {
      method: 'POST',
      body: JSON.stringify(data),
    }).then(value => requireRecord<PhoneNumber>(unwrapData(value))),

  unlinkNumber: (phoneId: string) =>
    apiFetch('/numbers/unlink', { method: 'POST', body: JSON.stringify({ phoneId }) }),
};

// ─── Voice & Languages Catalog ────────────────────────────────────────────────

export interface BavioLanguage {
  code: string;
  name: string;
}

export const voiceApi = {
  getLanguages: (): Promise<BavioLanguage[]> =>
    apiFetch<{ success: boolean; languages: BavioLanguage[] }>('/voice/languages').then(res => {
      if (!res || !Array.isArray(res.languages)) throw new Error('Language availability is temporarily unavailable.');
      return res.languages;
    }),

  getCatalog: (): Promise<any[]> =>
    apiFetch<{ success: boolean; voices: unknown; catalog: unknown }>('/voice/catalog').then(res => {
      const list = res?.voices || res?.catalog || res;
      if (!Array.isArray(list)) throw new Error('Voice service is temporarily unavailable.');
      return list;
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
  client?: any;
  data?: any;
}

export interface PaymentRecord {
  invoiceNumber?: string | null;
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
    apiFetch<{ payments: unknown }>(`/billing/payments/${clientId}`).then(value => requireArray<Record<string, unknown>>(value.payments).map(row => ({
      ...row,
      id: String(row.id ?? row.dodoPaymentId ?? ''),
      created_at: row.date as string,
      plan: row.planName as string,
      payment_type: row.paymentType as string,
    } as unknown as PaymentRecord))),

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
