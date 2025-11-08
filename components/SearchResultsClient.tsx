'use client';

import { useState, useMemo } from 'react';
import { Search } from 'lucide-react';
import type { Memory, MemoryType } from '@/lib/types';
import { FiltersHeader } from './FiltersHeader';
import { MasonryMemoryCard } from './MasonryMemoryCard';
import { KanbanBoard } from './KanbanBoard';
import { MemoryModal } from './MemoryModal';

interface SearchResultsClientProps {
  initialMemories: Memory[];
  searchParams: { q?: string; type?: string; date?: string; sort?: string };
}

export default function SearchResultsClient({
  initialMemories,
  searchParams
}: SearchResultsClientProps) {
  const [searchQuery, setSearchQuery] = useState(searchParams.q || '');
  const [filterType, setFilterType] = useState<MemoryType | 'all'>((searchParams.type as MemoryType) || 'all');
  const [layout, setLayout] = useState<'grid' | 'list' | 'board'>('grid');
  const [selectedMemory, setSelectedMemory] = useState<Memory | null>(null);

  // Semantic search toggle (mock for now as search page uses server params mostly, but we can enable client filtering)
  const [useSemanticSearch, setUseSemanticSearch] = useState(false);
  const [isSearching] = useState(false);

  // Filter memories client-side for immediate feedback
  const filteredMemories = useMemo(() => {
    return initialMemories.filter(memory => {
      // Type filter
      if (filterType !== 'all' && memory.type !== filterType) {
        return false;
      }

      // Search query (client-side refinement)
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const titleMatch = memory.title.toLowerCase().includes(query);
        const contentMatch = memory.content?.toLowerCase().includes(query);
        const tagsMatch = (memory.metadata?.tags || []).some((tag: string) =>
          tag.toLowerCase().includes(query)
        );
        return titleMatch || contentMatch || tagsMatch;
      }

      return true;
    });
  }, [initialMemories, filterType, searchQuery]);

  return (
    <div className="flex flex-col h-full w-full">
      <FiltersHeader
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        filterType={filterType}
        onFilterTypeChange={setFilterType}
        layout={layout}
        onLayoutChange={setLayout}
        useSemanticSearch={useSemanticSearch}
        onSemanticSearchToggle={() => setUseSemanticSearch(!useSemanticSearch)}
        isSearching={isSearching}
        totalMemories={initialMemories.length}
        filteredCount={filteredMemories.length}
        title="Search Results"
        icon={<Search className="w-6 h-6 text-primary" />}
      />

      <div className="flex-1 p-4 md:p-8 w-full max-w-full">
        {filteredMemories.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center mb-6">
              <Search className="w-12 h-12 text-muted-foreground" />
            </div>
            <h3 className="text-2xl font-bold text-foreground mb-2">No results found</h3>
            <p className="text-muted-foreground max-w-md">
              Try adjusting your filters or search query
            </p>
          </div>
        ) : layout === 'board' ? (
          <KanbanBoard
            memories={filteredMemories}
            onMemoryClick={(memory) => setSelectedMemory(memory)}
            onMemoriesChange={() => { }}
          />
        ) : (
          <div className={layout === 'grid'
            ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 md:gap-6 w-full auto-rows-max"
            : "flex flex-col gap-4"
          }>
            {filteredMemories.map((memory) => (
              <MasonryMemoryCard
                key={memory.id}
                memory={memory}
                onClick={() => setSelectedMemory(memory)}
                layout={layout}
              />
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      {selectedMemory && (
        <MemoryModal
          memory={selectedMemory}
          onClose={() => setSelectedMemory(null)}
        />
      )}
    </div>
  );
}
