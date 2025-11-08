import { Suspense } from 'react';
import SearchResultsClient from '@/components/SearchResultsClient';
import { getMemories } from '@/lib/actions/memory-actions';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';

export default async function SearchPage({
  searchParams,
}: {
  searchParams: { q?: string; type?: string; date?: string; sort?: string };
}) {
  // Check authentication
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect('/login?from=/search');
  }

  // Fetch memories for the authenticated user only
  const memories = await getMemories({ userId: session.user.id });

  return (
    <Suspense fallback={<div className="text-white p-8">Loading search results...</div>}>
      <SearchResultsClient 
        initialMemories={memories} 
        searchParams={searchParams} 
      />
    </Suspense>
  );
}
