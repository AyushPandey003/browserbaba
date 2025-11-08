'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Memory, MemoryType } from '@/lib/types';
import { MasonryMemoryCard } from '@/components/MasonryMemoryCard';
import { MemoryModal } from '@/components/MemoryModal';
import { Search, Plus } from 'lucide-react';
import debounce from 'lodash.debounce';
import { FiltersHeader } from './FiltersHeader';
import { KanbanBoard } from './KanbanBoard';

interface DashboardMasonryClientProps {
  initialMemories: Memory[];
}

export function DashboardMasonryClient({ initialMemories }: DashboardMasonryClientProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<MemoryType | 'all'>('all');
  const [selectedMemory, setSelectedMemory] = useState<Memory | null>(null);

  // Filter and sort initial memories
  const processedInitialMemories = useMemo(() => {
    return initialMemories
      .filter(m => m.id && m.title) // Filter out invalid memories
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()); // Sort by newest first
  }, [initialMemories]);

  const [memories, setMemories] = useState<Memory[]>(processedInitialMemories);
  const [isSearching, setIsSearching] = useState(false);
  const [useSemanticSearch, setUseSemanticSearch] = useState(false);
  const [layout, setLayout] = useState<'grid' | 'list' | 'board'>('grid');

  // Semantic search function
  const performSemanticSearchInternal = useCallback(async (query: string) => {
    if (!query.trim() || query.length < 3) {
      setMemories(processedInitialMemories);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    try {
      const response = await fetch('/api/semantic-search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: query,
          searchType: 'hybrid',
          limit: 50,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setMemories(data.results || []);
      } else {
        console.error('Search failed');
        setMemories(processedInitialMemories);
      }
    } catch (error) {
      console.error('Search error:', error);
      setMemories(processedInitialMemories);
    } finally {
      setIsSearching(false);
    }
  }, [processedInitialMemories]);

  // Debounced semantic search
  const performSemanticSearch = useMemo(
    () => debounce(performSemanticSearchInternal, 500),
    [performSemanticSearchInternal]
  );

  // Local filtering for simple searches
  const performLocalSearch = useCallback(() => {
    const filtered = processedInitialMemories.filter((memory) => {
      const matchesSearch =
        !searchQuery.trim() ||
        memory.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        memory.content?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesType = filterType === 'all' || memory.type === filterType;

      return matchesSearch && matchesType;
    });

    setMemories(filtered);
  }, [searchQuery, filterType, processedInitialMemories]);

  // Handle search
  useEffect(() => {
    if (useSemanticSearch && searchQuery.length >= 3) {
      performSemanticSearch(searchQuery);
    } else {
      performLocalSearch();
    }
  }, [searchQuery, useSemanticSearch, performSemanticSearch, performLocalSearch]);

  return (
    <>
      <main className="flex-1 bg-background text-foreground w-full max-w-full overflow-x-hidden">
        <div className="w-full max-w-full h-full flex flex-col">
          {/* Filters Header */}
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
            totalMemories={processedInitialMemories.length}
            filteredCount={memories.length}
          />

          <div className="p-4 md:p-8 w-full max-w-full flex-1">

            {/* Content */}
            {memories.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center mb-6">
                  <Search className="w-12 h-12 text-muted-foreground" />
                </div>
                <h3 className="text-2xl font-bold text-foreground mb-2">No Memories Found</h3>
                <p className="text-muted-foreground max-w-md">
                  {searchQuery
                    ? 'Try a different search term or use AI search for broader results.'
                    : 'Your captured content will appear here. Use the browser extension to save pages, notes, and more.'}
                </p>
              </div>
            ) : (
              layout === 'board' ? (
                <KanbanBoard
                  memories={memories}
                  onMemoryClick={setSelectedMemory}
                  onMemoriesChange={setMemories}
                />
              ) : (
                <div className={layout === 'grid'
                  ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 md:gap-6 w-full auto-rows-max"
                  : "flex flex-col gap-4"
                }>
                  {memories.map((memory) => (
                    <MasonryMemoryCard
                      key={memory.id}
                      memory={memory}
                      onClick={() => setSelectedMemory(memory)}
                      layout={layout}
                    />
                  ))}
                </div>
              )
            )}
          </div>
        </div>
      </main>

      {/* Floating Action Button */}
      <button className="fixed bottom-8 right-8 flex items-center justify-center size-14 bg-primary text-primary-foreground rounded-full shadow-lg hover:bg-primary/90 transition-all duration-300 transform hover:scale-110 z-20">
        <Plus className="w-8 h-8" />
      </button>

      {/* Modal */}
      {selectedMemory && (
        <MemoryModal
          memory={selectedMemory}
          onClose={() => setSelectedMemory(null)}
        />
      )}
    </>
  );
}
