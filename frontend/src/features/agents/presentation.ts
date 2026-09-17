export function languageLabel(value?: string) {
  const labels: Record<string, string> = { 'en-US': 'English', 'hi-IN': 'Hindi' };
  return value ? labels[value] || value : 'Language not set';
}
export function updatedLabel(value?: string) {
  if (!value || !Number.isFinite(Date.parse(value))) return null;
  return new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(value));
}
