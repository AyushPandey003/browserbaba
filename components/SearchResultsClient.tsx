'use client';

import { useState, useMemo } from 'react';
import { Search, Filter, Calendar, Tag, SortAsc, X, Lightbulb, ExternalLink } from 'lucide-react';
import { useRouter } from 'next/navigation';
import type { Memory } from '@/lib/types';
import Link from 'next/link';

interface SearchResultsClientProps {
  initialMemories: Memory[];
  searchParams: { q?: string; type?: string; date?: string; sort?: string };
}

type FilterType = 'all' | 'article' | 'video' | 'product' | 'note' | 'todo';
type DateFilter = 'all' | 'today' | 'week' | 'month' | 'year';
type SortType = 'relevance' | 'date' | 'title';

export default function SearchResultsClient({ 
  initialMemories, 
  searchParams 
}: SearchResultsClientProps) {
  const [searchQuery, setSearchQuery] = useState(searchParams.q || '');
  const [typeFilter, setTypeFilter] = useState<FilterType>((searchParams.type as FilterType) || 'all');
  const [dateFilter, setDateFilter] = useState<DateFilter>((searchParams.date as DateFilter) || 'all');
  const [sortBy, setSortBy] = useState<SortType>((searchParams.sort as SortType) || 'relevance');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  // Get all unique tags from memories
  const allTags = useMemo(() => {
    const tags = new Set<string>();
    initialMemories.forEach(memory => {
      const memoryTags = memory.metadata?.tags || [];
      memoryTags.forEach((tag: string) => tags.add(tag));
    });
    return Array.from(tags);
  }, [initialMemories]);

  // Filter and sort memories
  const filteredMemories = useMemo(() => {
    const results = initialMemories.filter(memory => {
      // Type filter
      if (typeFilter !== 'all' && memory.type !== typeFilter) {
        return false;
      }

      // Date filter
      if (dateFilter !== 'all') {
        const memoryDate = new Date(memory.createdAt);
        const now = new Date();
        const daysDiff = Math.floor((now.getTime() - memoryDate.getTime()) / (1000 * 60 * 60 * 24));

        if (dateFilter === 'today' && daysDiff > 0) return false;
        if (dateFilter === 'week' && daysDiff > 7) return false;
        if (dateFilter === 'month' && daysDiff > 30) return false;
        if (dateFilter === 'year' && daysDiff > 365) return false;
      }

      // Tag filter
      if (selectedTags.length > 0) {
        const memoryTags = memory.metadata?.tags || [];
        if (!selectedTags.some(tag => memoryTags.includes(tag))) {
          return false;
        }
      }

      // Search query
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

    // Sort results
    if (sortBy === 'date') {
      results.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } else if (sortBy === 'title') {
      results.sort((a, b) => a.title.localeCompare(b.title));
    }
    // For 'relevance', we keep the default order

    return results;
  }, [initialMemories, typeFilter, dateFilter, selectedTags, searchQuery, sortBy]);

  const toggleTag = (tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  const clearFilters = () => {
    setTypeFilter('all');
    setDateFilter('all');
    setSelectedTags([]);
    setSortBy('relevance');
  };

  const getMatchReason = (memory: Memory): string => {
    if (!searchQuery) return 'Matched by filters';
    
    const query = searchQuery.toLowerCase();
    const reasons: string[] = [];

    if (memory.title.toLowerCase().includes(query)) {
      reasons.push('title');
    }
    if (memory.content?.toLowerCase().includes(query)) {
      reasons.push('content');
    }
    const tags = memory.metadata?.tags || [];
    if (tags.some((tag: string) => tag.toLowerCase().includes(query))) {
      reasons.push('tag');
    }

    return reasons.length > 0 
      ? `Matched '${searchQuery}' in ${reasons.join(', ')}`
      : 'Matched by filters';
  };

  const getRelativeTime = (date: Date): string => {
    const now = new Date();
    const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

    if (diffInDays === 0) return 'today';
    if (diffInDays === 1) return 'yesterday';
    if (diffInDays < 7) return 'this week';
    if (diffInDays < 30) return 'this month';
    if (diffInDays < 365) return 'this year';
    return 'over a year ago';
  };

  return (
    <div className="flex min-h-screen bg-[#101922]">
      {/* Search Results Content */}
      <div className="flex-1">
        {/* Search Bar */}
        <div className="sticky top-0 z-30 bg-[#101922] border-b border-gray-800 px-6 py-4">
          <div className="max-w-6xl mx-auto">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search your memories..."
                className="w-full pl-12 pr-4 py-3 bg-[#283039] border border-gray-700 rounded-lg text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#2b8cee] focus:border-transparent"
              />
            </div>

            {/* Filter Chips */}
            <div className="flex flex-wrap items-center gap-2 mt-4">
              {/* Date Filter */}
              <div className="relative group">
                <button className="flex items-center gap-2 px-3 py-1.5 bg-[#283039] hover:bg-[#323d48] border border-gray-700 rounded-lg text-sm text-gray-300 transition-colors">
                  <Calendar className="w-4 h-4" />
                  <span>Date: {dateFilter === 'all' ? 'All' : dateFilter}</span>
                </button>
                <div className="hidden group-hover:block absolute top-full mt-1 bg-[#1a232c] border border-gray-700 rounded-lg shadow-xl z-50 min-w-[150px]">
                  {(['all', 'today', 'week', 'month', 'year'] as DateFilter[]).map(filter => (
                    <button
                      key={filter}
                      onClick={() => setDateFilter(filter)}
                      className={`block w-full text-left px-4 py-2 text-sm hover:bg-[#283039] ${
                        dateFilter === filter ? 'text-[#2b8cee]' : 'text-gray-300'
                      }`}
                    >
                      {filter === 'all' ? 'All Time' : filter.charAt(0).toUpperCase() + filter.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Type Filter */}
              <div className="relative group">
                <button className="flex items-center gap-2 px-3 py-1.5 bg-[#283039] hover:bg-[#323d48] border border-gray-700 rounded-lg text-sm text-gray-300 transition-colors">
                  <Filter className="w-4 h-4" />
                  <span>Type: {typeFilter}</span>
                </button>
                <div className="hidden group-hover:block absolute top-full mt-1 bg-[#1a232c] border border-gray-700 rounded-lg shadow-xl z-50 min-w-[150px]">
                  {(['all', 'article', 'video', 'product', 'note', 'todo'] as FilterType[]).map(type => (
                    <button
                      key={type}
                      onClick={() => setTypeFilter(type)}
                      className={`block w-full text-left px-4 py-2 text-sm hover:bg-[#283039] capitalize ${
                        typeFilter === type ? 'text-[#2b8cee]' : 'text-gray-300'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tags Filter */}
              <div className="relative group">
                <button className="flex items-center gap-2 px-3 py-1.5 bg-[#283039] hover:bg-[#323d48] border border-gray-700 rounded-lg text-sm text-gray-300 transition-colors">
                  <Tag className="w-4 h-4" />
                  <span>Tags {selectedTags.length > 0 && `(${selectedTags.length})`}</span>
                </button>
                <div className="hidden group-hover:block absolute top-full mt-1 bg-[#1a232c] border border-gray-700 rounded-lg shadow-xl z-50 min-w-[200px] max-h-64 overflow-y-auto">
                  {allTags.map(tag => (
                    <button
                      key={tag}
                      onClick={() => toggleTag(tag)}
                      className={`block w-full text-left px-4 py-2 text-sm hover:bg-[#283039] ${
                        selectedTags.includes(tag) ? 'text-[#2b8cee]' : 'text-gray-300'
                      }`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>

              {/* Sort By */}
              <div className="relative group">
                <button className="flex items-center gap-2 px-3 py-1.5 bg-[#283039] hover:bg-[#323d48] border border-gray-700 rounded-lg text-sm text-gray-300 transition-colors">
                  <SortAsc className="w-4 h-4" />
                  <span>Sort: {sortBy}</span>
                </button>
                <div className="hidden group-hover:block absolute top-full mt-1 bg-[#1a232c] border border-gray-700 rounded-lg shadow-xl z-50 min-w-[150px]">
                  {(['relevance', 'date', 'title'] as SortType[]).map(sort => (
                    <button
                      key={sort}
                      onClick={() => setSortBy(sort)}
                      className={`block w-full text-left px-4 py-2 text-sm hover:bg-[#283039] capitalize ${
                        sortBy === sort ? 'text-[#2b8cee]' : 'text-gray-300'
                      }`}
                    >
                      {sort}
                    </button>
                  ))}
                </div>
              </div>

              {/* Clear Filters */}
              {(typeFilter !== 'all' || dateFilter !== 'all' || selectedTags.length > 0) && (
                <button
                  onClick={clearFilters}
                  className="flex items-center gap-1 px-3 py-1.5 text-sm text-gray-400 hover:text-white transition-colors"
                >
                  <X className="w-4 h-4" />
                  Clear filters
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Results */}
        <div className="max-w-6xl mx-auto px-6 py-8">
          <h2 className="text-2xl font-bold text-white mb-6">
            Found {filteredMemories.length} result{filteredMemories.length !== 1 ? 's' : ''}
          </h2>

          <div className="space-y-4">
            {filteredMemories.map((memory) => (
              <Link
                key={memory.id}
                href={`/read/${memory.id}`}
                className="block group"
              >
                <div className="flex flex-col md:flex-row gap-4 p-4 bg-[#1a232c] hover:bg-[#1f2a36] border border-gray-800 rounded-xl transition-all duration-200 hover:border-gray-700">
                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4 mb-2">
                      <h3 className="text-lg font-bold text-white leading-tight group-hover:text-[#2b8cee] transition-colors">
                        {memory.title}
                      </h3>
                      {memory.url && (
                        <ExternalLink className="w-4 h-4 text-gray-500 shrink-0" />
                      )}
                    </div>

                    <p className="text-sm text-gray-300 line-clamp-2 mb-4">
                      {memory.content || 'No description available'}
                    </p>

                    {/* Match Reason */}
                    <div className="flex items-center gap-2 p-2 rounded-md bg-[#2b8cee]/10 text-[#2b8cee] text-xs mb-3">
                      <Lightbulb className="w-4 h-4 shrink-0" />
                      <p className="line-clamp-1">
                        {getMatchReason(memory)}
                        {' • Saved '}
                        <strong className="font-semibold">{getRelativeTime(memory.createdAt)}</strong>
                      </p>
                    </div>

                    {/* Tags and Meta */}
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      {memory.source && (
                        <span className="text-gray-500">
                          {memory.source}
                        </span>
                      )}
                      <span className="text-gray-600">•</span>
                      <span className="text-gray-500">
                        {new Date(memory.createdAt).toLocaleDateString()}
                      </span>
                      {(memory.metadata?.tags || []).map((tag: string) => (
                        <span
                          key={tag}
                          className="px-2 py-0.5 bg-gray-800 text-gray-400 rounded-full"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Thumbnail */}
                  {memory.metadata?.thumbnail && (
                    <div
                      className="w-full md:w-48 h-32 bg-center bg-no-repeat bg-cover rounded-lg shrink-0"
                      style={{ backgroundImage: `url(${memory.metadata.thumbnail})` }}
                    />
                  )}
                </div>
              </Link>
            ))}

            {filteredMemories.length === 0 && (
              <div className="text-center py-16">
                <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gray-800 flex items-center justify-center">
                  <Search className="w-10 h-10 text-gray-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-400 mb-2">No results found</h3>
                <p className="text-gray-500 mb-6">
                  Try adjusting your filters or search query
                </p>
                <button
                  onClick={clearFilters}
                  className="px-4 py-2 bg-[#2b8cee] hover:bg-[#3a9cff] text-white rounded-lg transition-colors"
                >
                  Clear all filters
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
