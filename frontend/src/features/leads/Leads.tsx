'use client';
import { useSearchParams } from 'next/navigation';
import LeadList from './LeadList';
import LeadDetail from './LeadDetail';

export default function Leads() {
  const query = useSearchParams();
  const leadId = query.get('lead');
  return leadId ? <LeadDetail key={leadId} id={leadId} /> : <LeadList />;
}
