import { WorkflowExecutionView } from '@/features/workflows/WorkflowsView';

export default async function WorkflowExecutionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <WorkflowExecutionView id={decodeURIComponent(id)} />;
}
