import { Suspense } from 'react';
import SearchResultsClient from '@/components/SearchResultsClient';
import { getMemories } from '@/lib/actions/memory-actions';

export default async function SearchPage({
  searchParams,
}: {
  searchParams: { q?: string; type?: string; date?: string; sort?: string };
}) {
  const memories = await getMemories();

  return (
    <Suspense fallback={<div className="text-white p-8">Loading search results...</div>}>
      <SearchResultsClient 
        initialMemories={memories} 
        searchParams={searchParams} 
      />
    </Suspense>
  );
}
