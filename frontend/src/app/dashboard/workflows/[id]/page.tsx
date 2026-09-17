import { WorkflowDetailView } from '@/features/workflows/WorkflowsView';

export default async function WorkflowPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <WorkflowDetailView id={decodeURIComponent(id)} />;
}
