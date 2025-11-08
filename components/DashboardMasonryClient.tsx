'use client';

import { useState, useEffect, useCallback } from 'react';
import { Memory, MemoryType } from '@/lib/types';
import { MasonryMemoryCard } from '@/components/MasonryMemoryCard';
import { MemoryModal } from '@/components/MemoryModal';
import { Search, SlidersHorizontal, Plus, Sparkles } from 'lucide-react';
import debounce from 'lodash.debounce';

interface DashboardMasonryClientProps {
  initialMemories: Memory[];
}

export function DashboardMasonryClient({ initialMemories }: DashboardMasonryClientProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType] = useState<MemoryType | 'all'>('all');
  const [selectedMemory, setSelectedMemory] = useState<Memory | null>(null);
  const [memories, setMemories] = useState<Memory[]>(initialMemories);
  const [isSearching, setIsSearching] = useState(false);
  const [useSemanticSearch, setUseSemanticSearch] = useState(false);

  // Debounced semantic search
  const performSemanticSearch = useCallback(
    debounce(async (query: string) => {
      if (!query.trim() || query.length < 3) {
        setMemories(initialMemories);
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
          setMemories(initialMemories);
        }
      } catch (error) {
        console.error('Search error:', error);
        setMemories(initialMemories);
      } finally {
        setIsSearching(false);
      }
    }, 500),
    [initialMemories]
  );

  // Local filtering for simple searches
  const performLocalSearch = useCallback(() => {
    if (!searchQuery.trim()) {
      setMemories(initialMemories);
      return;
    }

    const filtered = initialMemories.filter((memory) => {
      const matchesSearch =
        memory.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        memory.content?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesType = filterType === 'all' || memory.type === filterType;

      return matchesSearch && matchesType;
    });

    setMemories(filtered);
  }, [searchQuery, filterType, initialMemories]);

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
      <main className="flex-1 bg-background-dark w-full max-w-full overflow-x-hidden">
        <div className="p-4 md:p-8 w-full max-w-full">
          {/* Search Bar - Sticky */}
          <div className="px-4 py-3 sticky top-0 bg-background-dark/80 backdrop-blur-sm z-10 mb-8 -mx-4 md:-mx-8 -mt-4 md:-mt-8 pt-4 md:pt-8">
            <div className="max-w-3xl mx-auto w-full">
              <label className="flex flex-col min-w-40 h-12 w-full">
                <div className="flex w-full flex-1 items-stretch rounded-lg h-full max-w-full overflow-hidden">
                  <div className="text-gray-400 flex border-none bg-[#283039] items-center justify-center pl-4 rounded-l-lg border-r-0">
                    {isSearching ? (
                      <div className="animate-spin">
                        <Search className="w-5 h-5" />
                      </div>
                    ) : (
                      <Search className="w-5 h-5" />
                    )}
                  </div>
                  <input
                    className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden text-white focus:outline-0 focus:ring-2 focus:ring-primary border-none bg-[#283039] focus:border-none h-full placeholder:text-gray-400 px-4 text-base font-normal leading-normal"
                    placeholder={useSemanticSearch ? "Search with AI... (e.g., 'videos about cooking')" : "Search like you think..."}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  <button 
                    onClick={() => setUseSemanticSearch(!useSemanticSearch)}
                    className={`ml-2 flex items-center justify-center px-4 rounded-lg transition-all duration-200 ${
                      useSemanticSearch 
                        ? 'bg-primary text-white' 
                        : 'bg-[#283039] text-gray-400 hover:text-white'
                    }`}
                    title={useSemanticSearch ? "AI Search Enabled" : "Enable AI Search"}
                  >
                    <Sparkles className="w-5 h-5" />
                  </button>
                  <button className="ml-2 flex items-center justify-center px-4 rounded-lg bg-[#283039] text-gray-400 hover:text-white transition-colors duration-200">
                    <SlidersHorizontal className="w-5 h-5" />
                  </button>
                </div>
              </label>
              {useSemanticSearch && searchQuery.length >= 3 && (
                <p className="text-xs text-gray-400 mt-2 ml-1">
                  🤖 AI-powered semantic search active
                </p>
              )}
            </div>
          </div>

          {/* Masonry Grid */}
          {memories.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-24 h-24 rounded-full bg-[#283039] flex items-center justify-center mb-6">
                <Search className="w-12 h-12 text-gray-500" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">No memories found</h3>
              <p className="text-gray-400 max-w-md">
                {searchQuery
                  ? 'Try adjusting your search query or toggle AI search'
                  : 'Start capturing content with the browser extension to see it here'}
              </p>
            </div>
          ) : (
            <div className="columns-1 md:columns-2 lg:columns-3 xl:columns-4 gap-4 md:gap-6 space-y-4 md:space-y-6 w-full">
              {memories.map((memory) => (
                <MasonryMemoryCard
                  key={memory.id}
                  memory={memory}
                  onClick={() => setSelectedMemory(memory)}
                />
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Floating Action Button */}
      <button className="fixed bottom-8 right-8 flex items-center justify-center size-14 bg-primary text-white rounded-full shadow-lg hover:bg-primary/90 transition-all duration-200 z-20">
        <Plus className="w-7 h-7" />
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
