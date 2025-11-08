'use client';

import { useState } from 'react';
import { Memory, MemoryType } from '@/lib/types';
import { MemoryCard } from '@/components/MemoryCard';
import { SearchBar } from '@/components/SearchBar';
import { FilterDropdown } from '@/components/FilterDropdown';
import { MemoryModal } from '@/components/MemoryModal';
import { RefreshCw } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface DashboardClientProps {
  initialMemories: Memory[];
}

export function DashboardClient({ initialMemories }: DashboardClientProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<MemoryType | 'all'>('all');
  const [selectedMemory, setSelectedMemory] = useState<Memory | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Filter memories based on search and type
  const filteredMemories = initialMemories.filter((memory) => {
    const matchesSearch =
      searchQuery === '' ||
      memory.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      memory.content?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesType = filterType === 'all' || memory.type === filterType;

    return matchesSearch && matchesType;
  });

  const handleRefresh = async () => {
    setIsRefreshing(true);
    router.refresh();
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  return (
    <>
      {/* Top Bar */}
      <div className="sticky top-16 z-30 bg-white/80 backdrop-blur-md border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4 flex-wrap">
            <SearchBar
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Search your memories..."
            />
            <FilterDropdown value={filterType} onChange={setFilterType} />
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 hover:border-gray-300 transition-colors bg-white disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 text-gray-600 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span className="text-sm font-medium text-gray-700">Refresh</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats */}
        <div className="mb-8">
          <p className="text-sm text-gray-600">
            Showing <span className="font-semibold text-gray-900">{filteredMemories.length}</span>{' '}
            {filteredMemories.length === 1 ? 'memory' : 'memories'}
            {filterType !== 'all' && (
              <span className="ml-1">
                of type <span className="font-semibold text-gray-900">{filterType}</span>
              </span>
            )}
          </p>
        </div>

        {/* Memory Grid */}
        {filteredMemories.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-24 h-24 rounded-full bg-gray-100 flex items-center justify-center mb-4">
              <SearchBar value="" onChange={() => {}} />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No memories found</h3>
            <p className="text-gray-600 max-w-md">
              {searchQuery || filterType !== 'all'
                ? 'Try adjusting your search or filters'
                : 'Start capturing content with the browser extension to see it here'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredMemories.map((memory) => (
              <MemoryCard
                key={memory.id}
                memory={memory}
                onClick={() => setSelectedMemory(memory)}
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
    </>
  );
}
