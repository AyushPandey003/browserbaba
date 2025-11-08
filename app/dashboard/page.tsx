import { getMemories } from '@/lib/actions/memory-actions';
import { DashboardMasonryClient } from '@/components/DashboardMasonryClient';
import { Suspense } from 'react';
import { Brain } from 'lucide-react';

// This is a Server Component
export default async function DashboardPage() {
  const result = await getMemories();
  const memories = result ?? [];

  return (
    <Suspense fallback={<DashboardLoading />}>
      <DashboardMasonryClient initialMemories={memories} />
    </Suspense>
  );
}

function DashboardLoading() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-[#101922]">
      <div className="flex flex-col items-center gap-4">
        <Brain className="w-16 h-16 text-[#2b8cee] animate-pulse" />
        <p className="text-gray-400">Loading your memories...</p>
      </div>
    </div>
  );
}
