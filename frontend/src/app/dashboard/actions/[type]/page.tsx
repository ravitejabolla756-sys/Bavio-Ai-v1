import { ActionDetailView } from '@/features/actions/ActionsView';

export default async function ActionDetailPage({ params }: { params: Promise<{ type: string }> }) {
  const { type } = await params;
  return <ActionDetailView type={decodeURIComponent(type)} />;
}
