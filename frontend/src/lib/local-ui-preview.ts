import { getCookie } from "./auth-utils";

export const LOCAL_UI_PREVIEW_EMAIL = "review@bavio.local";
export const LOCAL_UI_PREVIEW_PASSWORD = process.env.NEXT_PUBLIC_BAVIO_REVIEW_PASSWORD || "";
export const LOCAL_UI_PREVIEW_TOKEN = "local-ui-preview-token";
export const LOCAL_UI_PREVIEW_CLIENT_ID = "local-ui-preview-workspace";
export const LOCAL_UI_PREVIEW_COOKIE = "bavio_ui_review";

const previewDate = "2026-09-15T00:00:00.000Z";

export function isLocalUiPreviewEnabled(): boolean {
  if (typeof window === "undefined") return false;
  const localHost = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
  return process.env.NODE_ENV !== "production" &&
    process.env.NEXT_PUBLIC_BAVIO_UI_PREVIEW === "true" &&
    (localHost || (Boolean(process.env.NEXT_PUBLIC_BAVIO_REVIEW_HOST) && window.location.hostname === process.env.NEXT_PUBLIC_BAVIO_REVIEW_HOST));
}

export function isLocalUiPreviewCredentials(email: string, password: string): boolean {
  return isLocalUiPreviewEnabled() && email === LOCAL_UI_PREVIEW_EMAIL && password === LOCAL_UI_PREVIEW_PASSWORD;
}

export function isLocalUiPreviewSession(): boolean {
  return isLocalUiPreviewEnabled() && typeof window !== "undefined" &&
    getCookie(LOCAL_UI_PREVIEW_COOKIE) === "1" &&
    localStorage.getItem("bavio_token") === LOCAL_UI_PREVIEW_TOKEN;
}

type PreviewResult = { handled: true; value: unknown } | { handled: false };

const profile = {
  success: true,
  id: LOCAL_UI_PREVIEW_CLIENT_ID,
  userId: LOCAL_UI_PREVIEW_CLIENT_ID,
  businessId: LOCAL_UI_PREVIEW_CLIENT_ID,
  name: "Workspace unavailable",
  businessName: "Workspace unavailable",
  email: LOCAL_UI_PREVIEW_EMAIL,
  phone: "",
  country: "US",
  country_code: "US",
  api_key: "local-preview-only",
  minutes_limit: 0,
  minutes_used: 0,
  plan: "free",
  plan_name: "Unavailable",
  current_period_end: null,
  onboarding_status: "complete",
  onboarding_step: 6,
  dodo_subscription_id: null,
  subscription_status: "inactive",
  created_at: previewDate,
  industry: "Voice AI",
  language: "en-US",
  business_description: "Workspace profile is unavailable.",
  nextRoute: "/dashboard",
};

const conversation = {
  id: "local-preview-conversation-1",
  status: "completed",
  call_status: "completed",
  started_at: previewDate,
  ended_at: previewDate,
  created_at: previewDate,
  duration_seconds: 0,
  caller_number: "",
  caller_name: "",
  assistant_id: "local-preview-agent-1",
  assistant_name: "Voice agent",
  transcript: [],
  processing_state: "completed",
};

const assistant = {
  id: "local-preview-agent-1",
  business_id: LOCAL_UI_PREVIEW_CLIENT_ID,
  name: "Review Receptionist",
  system_prompt: "Synthetic frontend-only review fixture.",
  language: "en-US",
  voice: "Preview voice",
  voice_id: "local-preview-voice",
  model: "Preview model",
  first_message: "Voice agent greeting unavailable.",
  active: true,
  is_active: true,
  created_at: previewDate,
  updated_at: previewDate,
};

const lead = {
  id: "local-preview-lead-1",
  business_id: LOCAL_UI_PREVIEW_CLIENT_ID,
  call_id: conversation.id,
  phone: "Preview record",
  name: "Lead unavailable",
  intent: "Intent unavailable",
  budget: null,
  location: "United States",
  notes: "Synthetic frontend-only data. Not a customer record.",
  status: "new",
  created_at: previewDate,
};

const workflow = {
  id: "local-preview-workflow-1",
  key: "preview-lead-webhook",
  name: "Preview lead workflow",
  enabled: true,
  version: 1,
  version_id: "local-preview-workflow-version-1",
  steps: [
    { id: "local-preview-step-1", position: 1, action_type: "bavio.lead.create", name: "Create lead", system: "Bavio", kind: "lead" },
    { id: "local-preview-step-2", position: 2, action_type: "bavio.webhook.deliver", name: "Deliver webhook", system: "Bavio", kind: "webhook" },
  ],
  last_run: { id: "local-preview-workflow-execution-1", status: "succeeded", started_at: previewDate, completed_at: previewDate },
  created_at: previewDate,
  updated_at: previewDate,
};

const workflowExecution = {
  execution: {
    id: "local-preview-workflow-execution-1",
    workflow_definition_id: workflow.id,
    workflow_version_id: workflow.version_id,
    workflow_key: workflow.key,
    name: workflow.name,
    version: 1,
    status: "succeeded",
    created_at: previewDate,
    started_at: previewDate,
    completed_at: previewDate,
  },
  steps: [
    { id: "local-preview-step-execution-1", workflow_step_id: workflow.steps[0].id, position: 1, status: "succeeded", action_type: "bavio.lead.create", name: "Create lead", system: "Bavio", kind: "lead", lead_id: lead.id },
    { id: "local-preview-step-execution-2", workflow_step_id: workflow.steps[1].id, position: 2, status: "succeeded", action_type: "bavio.webhook.deliver", name: "Deliver webhook", system: "Bavio", kind: "webhook" },
  ],
};

export function getLocalUiPreviewResponse<T = unknown>(path: string, method = "GET"): PreviewResult {
  if (!isLocalUiPreviewSession()) return { handled: false };
  if (method.toUpperCase() !== "GET") return { handled: true, value: undefined };
  const cleanPath = path.split("?")[0];
  if (cleanPath === "/auth/profile") return { handled: true, value: profile };
  if (cleanPath.startsWith("/assistants/")) return { handled: true, value: [assistant] };
  if (cleanPath.startsWith("/calls/")) return { handled: true, value: [] };
  if (cleanPath.startsWith("/leads/")) return { handled: true, value: { data: [], pagination: { has_more: false, next_cursor: null } } };
  if (cleanPath.startsWith("/numbers/")) return { handled: true, value: [] };
  if (cleanPath === "/knowledge-base") {
    const query = new URLSearchParams(path.split("?")[1] || "");
    return { handled: true, value: { data: [], hasMore: false, page: Number(query.get("page") || "1") } };
  }
  if (cleanPath.startsWith("/knowledge-base/")) return { handled: true, value: [] };
  if (cleanPath === "/usage/" + LOCAL_UI_PREVIEW_CLIENT_ID) return { handled: true, value: { summary: { minutes_used: 0, total_cost: 0 }, logs: [] } };
  if (cleanPath === "/demo/status") return { handled: true, value: { eligible: false, session: null, transcript: [] } };
  if (cleanPath === "/voice/catalog") return { handled: true, value: [] };
  if (cleanPath === "/integrations/status") {
    const unavailable = { connected: false, keyMasked: "", lastTested: null, testStatus: "pending", usageLimit: null, usageCurrent: null };
    return { handled: true, value: { deepgram: unavailable, openai: unavailable, elevenlabs: unavailable } };
  }
  if (cleanPath === "/billing/status/" + LOCAL_UI_PREVIEW_CLIENT_ID) return { handled: true, value: { client: profile } };
  if (cleanPath === "/billing/payments/" + LOCAL_UI_PREVIEW_CLIENT_ID) return { handled: true, value: { payments: [] } };
  if (cleanPath === "/v1/calls" || cleanPath.startsWith("/v1/calls?")) return { handled: true, value: { data: [], pagination: { has_more: false, next_cursor: null } } };
  // Actions are intentionally not populated by the local UI preview. A preview
  // workspace must never present synthetic capabilities or successful runs as
  // customer records. The real API owns this surface.
  if (cleanPath === "/v1/actions") return { handled: true, value: { data: { actions: [], executions: [], pagination: { has_more: false, next_cursor: null } } } };
  if (cleanPath.startsWith("/v1/actions/")) return { handled: true, value: { data: null } };
  if (cleanPath === "/v1/workflows" || cleanPath.startsWith("/v1/workflows/") || cleanPath.startsWith("/v1/workflow-executions/")) return { handled: true, value: { data: { workflows: [] } } };
  return { handled: false };
}
