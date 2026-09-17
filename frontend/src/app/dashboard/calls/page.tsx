import { Suspense } from 'react';
import ConversationList from '@/features/conversations/ConversationList';
export default function ConversationsPage() {
  return <Suspense fallback={<p role="status">Loading conversations…</p>}><ConversationList /></Suspense>;
}
