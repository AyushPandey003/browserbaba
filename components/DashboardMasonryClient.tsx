'use client';

import { useState } from 'react';
import { Memory, MemoryType } from '@/lib/types';
import { MasonryMemoryCard } from '@/components/MasonryMemoryCard';
import { MemoryModal } from '@/components/MemoryModal';
import { Search, SlidersHorizontal, Plus } from 'lucide-react';

interface DashboardMasonryClientProps {
  initialMemories: Memory[];
}

export function DashboardMasonryClient({ initialMemories }: DashboardMasonryClientProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType] = useState<MemoryType | 'all'>('all');
  const [selectedMemory, setSelectedMemory] = useState<Memory | null>(null);

  // Filter memories based on search and type
  const filteredMemories = initialMemories.filter((memory) => {
    const matchesSearch =
      searchQuery === '' ||
      memory.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      memory.content?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesType = filterType === 'all' || memory.type === filterType;

    return matchesSearch && matchesType;
  });

  return (
    <>
      <main className="flex-1 bg-background-dark">
        <div className="p-8">
          {/* Search Bar - Sticky */}
          <div className="px-4 py-3 sticky top-0 bg-background-dark/80 backdrop-blur-sm z-10 mb-8 -mx-8 -mt-8 pt-8">
            <div className="max-w-3xl mx-auto">
              <label className="flex flex-col min-w-40 h-12 w-full">
                <div className="flex w-full flex-1 items-stretch rounded-lg h-full">
                  <div className="text-gray-400 flex border-none bg-[#283039] items-center justify-center pl-4 rounded-l-lg border-r-0">
                    <Search className="w-5 h-5" />
                  </div>
                  <input
                    className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-r-lg text-white focus:outline-0 focus:ring-2 focus:ring-primary border-none bg-[#283039] focus:border-none h-full placeholder:text-gray-400 px-4 text-base font-normal leading-normal"
                    placeholder="Search like you think..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  <button className="ml-2 flex items-center justify-center px-4 rounded-lg bg-[#283039] text-gray-400 hover:text-white transition-colors duration-200">
                    <SlidersHorizontal className="w-5 h-5" />
                  </button>
                </div>
              </label>
            </div>
          </div>

          {/* Masonry Grid */}
          {filteredMemories.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-24 h-24 rounded-full bg-[#283039] flex items-center justify-center mb-6">
                <Search className="w-12 h-12 text-gray-500" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">No memories found</h3>
              <p className="text-gray-400 max-w-md">
                {searchQuery
                  ? 'Try adjusting your search query'
                  : 'Start capturing content with the browser extension to see it here'}
              </p>
            </div>
          ) : (
            <div className="columns-1 md:columns-2 lg:columns-3 xl:columns-4 gap-6 space-y-6">
              {filteredMemories.map((memory) => (
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
