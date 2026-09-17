import { ExecutionDetailView } from '@/features/actions/ActionsView';

export default async function ExecutionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ExecutionDetailView id={decodeURIComponent(id)} />;
}
