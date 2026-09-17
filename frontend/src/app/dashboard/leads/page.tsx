import { Suspense } from 'react';
import Leads from '@/features/leads/Leads';

export default function LeadsPage() {
  return <Suspense fallback={<p role="status">Loading leads…</p>}><Leads /></Suspense>;
}
