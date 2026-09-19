export interface Agent {
  id: string;
  name: string;
  system_prompt: string;
  greeting?: string;
  language?: string;
  voice_id?: string;
  voice?: string;
  is_active?: boolean;
  updated_at?: string;
  created_at?: string;
  intelligence_model?: string;
  model_routing_config?: Record<string, any>;
}

export interface Voice {
  id: string;
  name: string;
  gender: 'male' | 'female';
  tone: string;
  description: string;
  supportedLanguages: string[];
  previewAvailable: boolean;
  // Backward compatibility aliases
  voice_id?: string;
  voice_display_name?: string;
  voice_language?: string;
  preview_url?: string;
}

export interface Draft {
  name: string;
  role: string;
  business_type: string;
  description: string;
  tone: string[];
  additional_details: string;
  system_prompt: string;
  greeting: string;
  language: string;
  languages: string[];
  voice_id: string;
  phone_id?: string;
  phone_number?: string;
  is_active: boolean;
}

export const blankDraft: Draft = {
  name: 'Vikram',
  role: 'Receptionist',
  business_type: 'Healthcare',
  description: 'Answers incoming customer calls, schedules appointments, provides basic information, and captures patient details.',
  tone: ['Professional'],
  additional_details: '',
  system_prompt: '',
  greeting: 'Hi, thanks for calling. How can I help you today?',
  language: 'en-US',
  languages: ['en-US'],
  voice_id: '',
  phone_id: '',
  phone_number: '',
  is_active: true,
};

export const CREATE_AGENT_STEPS = [
  { id: 1, key: 'identity', label: 'Identity' },
  { id: 2, key: 'instructions', label: 'Instructions' },
  { id: 3, key: 'knowledge', label: 'Knowledge' },
  { id: 4, key: 'voice', label: 'Voice & language' },
  { id: 5, key: 'deployment', label: 'Phone assignment' },
  { id: 6, key: 'test', label: 'Test' },
] as const;

export type StepKey = typeof CREATE_AGENT_STEPS[number]['key'];

export const ROLE_OPTIONS = [
  'Receptionist',
  'Sales',
  'Support',
  'Appointment coordinator',
  'Lead qualification',
  'Custom',
] as const;

export const BUSINESS_TYPE_OPTIONS = [
  'Healthcare',
  'Real Estate',
  'Education',
  'Restaurants & Hospitality',
  'Legal Services',
  'Home Services',
  'Retail',
  'Professional Services',
  'Other',
] as const;

export const TONE_OPTIONS = [
  'Professional',
  'Friendly',
  'Calm',
  'Concise',
  'Helpful',
] as const;
