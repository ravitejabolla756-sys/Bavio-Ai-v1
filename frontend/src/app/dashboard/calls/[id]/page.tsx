import { Suspense } from 'react';
import ConversationDetail from '@/features/conversations/ConversationDetail';

export default async function ConversationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <Suspense fallback={<p role="status">Loading conversation…</p>}><ConversationDetail id={id} /></Suspense>;
}
