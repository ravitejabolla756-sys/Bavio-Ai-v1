/** An opportunity record, not a durable Customer identity. */
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
export interface ContactIdentity { name: string | null; phone: string | null; label: string }
export interface LeadSummary extends Pick<Lead, 'id' | 'name' | 'phone' | 'status' | 'created_at'> {
  intent_preview: string | null;
  has_conversation: boolean;
}
export interface ConversationReference { id: string; createdAt: string | null; agentName: string | null }
export interface LeadContext {
  record: Pick<Lead, 'id' | 'name' | 'phone' | 'intent' | 'budget' | 'location' | 'notes' | 'status' | 'created_at'> & { summary: string | null };
  contact: ContactIdentity;
  conversation: ConversationReference | null;
  conversationState: 'linked' | 'unavailable' | 'not-recorded';
}
export interface LeadDraft { name: string; status: string; notes: string }
export const LEAD_STATUSES = ['new', 'contacted', 'qualified', 'converted', 'lost'] as const;

function contactValue(value: unknown): string | null {
  if (typeof value !== 'string' || !value.trim()) return null;
  const trimmed = value.trim();
  // Known stored placeholder literals are not a person's identity. Never merge.
  if (['unknown', 'n/a', 'none', 'anonymous caller', '...'].includes(trimmed.toLowerCase())) return null;
  return trimmed;
}
export function contactOf(record: Pick<Lead, 'name' | 'phone'>): ContactIdentity {
  const name = contactValue(record.name), phone = contactValue(record.phone);
  return { name, phone, label: name || phone || 'Contact not recorded' };
}
export function statusLabel(status: string | null | undefined) {
  return status?.trim() ? status.charAt(0).toUpperCase() + status.slice(1) : 'Status not recorded';
}
export function leadDate(value?: string | null) {
  if (!value || !Number.isFinite(Date.parse(value))) return 'Date not recorded';
  return new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(value));
}
export function draftOf(context: LeadContext): LeadDraft {
  return { name: context.record.name || '', status: context.record.status || '', notes: context.record.notes || '' };
}
