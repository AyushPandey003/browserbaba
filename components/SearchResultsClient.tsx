'use client';

import { useState, useMemo } from 'react';
import { Search, X, Lightbulb } from 'lucide-react';
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
    <main className="flex-1 p-6 lg:p-10 bg-background-dark">
      <div className="max-w-4xl mx-auto">
        {/* Search Bar */}
        <div className="mb-8">
          <label className="flex flex-col min-w-40 h-12 w-full">
            <div className="flex w-full flex-1 items-stretch rounded-lg h-full">
              <div className="text-gray-400 dark:text-gray-500 flex bg-gray-200 dark:bg-gray-800 items-center justify-center pl-4 rounded-l-lg">
                <Search className="w-5 h-5" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-none text-gray-900 dark:text-white focus:outline-0 focus:ring-2 focus:ring-primary border-none bg-gray-200 dark:bg-gray-800 h-full placeholder:text-gray-500 dark:placeholder:text-gray-400 px-4 text-base font-normal leading-normal"
                placeholder="Search your memories..."
              />
              {searchQuery && (
                <div className="flex items-center justify-center rounded-r-lg border-l-0 border-none bg-gray-200 dark:bg-gray-800 pr-4">
                  <button
                    onClick={() => setSearchQuery('')}
                    className="flex cursor-pointer items-center justify-center overflow-hidden rounded-lg text-gray-400 dark:text-gray-500 hover:text-gray-900 dark:hover:text-white"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              )}
            </div>
          </label>
        </div>

        {/* Page Heading */}
        <div className="flex flex-wrap justify-between gap-3 mb-6">
          <div className="flex flex-col gap-2">
            <p className="text-gray-900 dark:text-white tracking-tight text-3xl font-bold leading-tight">Search results</p>
            <p className="text-gray-500 dark:text-gray-400 text-sm font-normal leading-normal">
              Found {filteredMemories.length} result{filteredMemories.length !== 1 ? 's' : ''}{searchQuery && ` for: '${searchQuery}'`}
            </p>
          </div>
        </div>

        {/* Chips/Filters */}
        <div className="flex gap-2 p-1 overflow-x-auto mb-8">
          {/* Date Filter */}
          <div className="relative group">
            <button className="flex h-8 shrink-0 items-center justify-center gap-x-2 rounded-full bg-gray-200 dark:bg-gray-800 pl-3 pr-2 text-gray-800 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-700">
              <p className="text-sm font-medium leading-normal">Date</p>
              <span className="text-base">▼</span>
            </button>
            <div className="hidden group-hover:block absolute top-full mt-1 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg shadow-xl z-50 min-w-[150px]">
              {(['all', 'today', 'week', 'month', 'year'] as DateFilter[]).map(filter => (
                <button
                  key={filter}
                  onClick={() => setDateFilter(filter)}
                  className={`block w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-800 ${
                    dateFilter === filter ? 'text-primary' : 'text-gray-700 dark:text-gray-300'
                  }`}
                >
                  {filter === 'all' ? 'All Time' : filter.charAt(0).toUpperCase() + filter.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Type Filter */}
          <div className="relative group">
            <button className="flex h-8 shrink-0 items-center justify-center gap-x-2 rounded-full bg-gray-200 dark:bg-gray-800 pl-3 pr-2 text-gray-800 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-700">
              <p className="text-sm font-medium leading-normal">Type</p>
              <span className="text-base">▼</span>
            </button>
            <div className="hidden group-hover:block absolute top-full mt-1 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg shadow-xl z-50 min-w-[150px]">
              {(['all', 'article', 'video', 'product', 'note', 'todo'] as FilterType[]).map(type => (
                <button
                  key={type}
                  onClick={() => setTypeFilter(type)}
                  className={`block w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-800 capitalize ${
                    typeFilter === type ? 'text-primary' : 'text-gray-700 dark:text-gray-300'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          {/* Tags Filter */}
          <div className="relative group">
            <button className="flex h-8 shrink-0 items-center justify-center gap-x-2 rounded-full bg-gray-200 dark:bg-gray-800 pl-3 pr-2 text-gray-800 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-700">
              <p className="text-sm font-medium leading-normal">Tags</p>
              <span className="text-base">▼</span>
            </button>
            <div className="hidden group-hover:block absolute top-full mt-1 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg shadow-xl z-50 min-w-[200px] max-h-64 overflow-y-auto">
              {allTags.map(tag => (
                <button
                  key={tag}
                  onClick={() => toggleTag(tag)}
                  className={`block w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-800 ${
                    selectedTags.includes(tag) ? 'text-primary' : 'text-gray-700 dark:text-gray-300'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          <div className="grow"></div>

          {/* Sort By */}
          <div className="relative group">
            <button className="flex h-8 shrink-0 items-center justify-center gap-x-2 rounded-full bg-gray-200 dark:bg-gray-800 pl-3 pr-2 text-gray-800 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-700">
              <p className="text-sm font-medium leading-normal">Sort by: {sortBy.charAt(0).toUpperCase() + sortBy.slice(1)}</p>
              <span className="text-base">▼</span>
            </button>
            <div className="hidden group-hover:block absolute top-full mt-1 right-0 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg shadow-xl z-50 min-w-[150px]">
              {(['relevance', 'date', 'title'] as SortType[]).map(sort => (
                <button
                  key={sort}
                  onClick={() => setSortBy(sort)}
                  className={`block w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-800 capitalize ${
                    sortBy === sort ? 'text-primary' : 'text-gray-700 dark:text-gray-300'
                  }`}
                >
                  {sort}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Result Cards */}
        <div className="space-y-6">
          {filteredMemories.map((memory) => (
            <Link
              key={memory.id}
              href={`/read/${memory.id}`}
              className="block"
            >
              <div className="p-4 bg-white dark:bg-gray-900/50 rounded-xl border border-gray-200 dark:border-gray-800 hover:shadow-lg hover:border-primary/50 dark:hover:border-primary/50 transition-all duration-200">
                <div className="flex flex-col md:flex-row items-stretch justify-between gap-6">
                  <div className="flex flex-[2_2_0px] flex-col gap-4">
                    <div className="flex flex-col gap-1">
                      <p className="text-gray-500 dark:text-gray-400 text-sm font-normal leading-normal">
                        {memory.type ? (memory.type.charAt(0).toUpperCase() + memory.type.slice(1)) : 'Item'} from {memory.metadata?.source || memory.source || 'Unknown'} • Saved {new Date(memory.createdAt).toLocaleDateString()}
                      </p>
                      <p className="text-gray-900 dark:text-white text-lg font-bold leading-tight">
                        {memory.title}
                      </p>
                      <p className="text-gray-600 dark:text-gray-300 text-sm font-normal leading-normal mt-1">
                        {memory.content || 'No description available'}
                      </p>
                    </div>
                    <div className="mt-auto flex flex-col gap-2">
                      <div className="flex items-center gap-2 p-2 rounded-md bg-primary/10 text-primary/80 dark:text-primary/90 text-xs">
                        <Lightbulb className="w-4 h-4" />
                        <p>
                          {getMatchReason(memory)}
                          {' and saved '}
                          <strong className="font-semibold">{getRelativeTime(memory.createdAt)}</strong>
                        </p>
                      </div>
                      <div className="flex gap-2">
                        {(memory.metadata?.tags || []).map((tag: string) => (
                          <span
                            key={tag}
                            className="text-xs font-medium text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded-full"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                  {memory.metadata?.thumbnail && (
                    <div
                      className="w-full md:w-auto bg-center bg-no-repeat aspect-video bg-cover rounded-lg flex-1 min-w-[200px]"
                      style={{ backgroundImage: `url(${memory.metadata.thumbnail})` }}
                    />
                  )}
                </div>
              </div>
            </Link>
          ))}

          {filteredMemories.length === 0 && (
            <div className="text-center py-16">
              <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gray-200 dark:bg-gray-800 flex items-center justify-center">
                <Search className="w-10 h-10 text-gray-400 dark:text-gray-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-400 mb-2">No results found</h3>
              <p className="text-gray-500 dark:text-gray-500 mb-6">
                Try adjusting your filters or search query
              </p>
              <button
                onClick={clearFilters}
                className="px-4 py-2 bg-primary hover:bg-primary/90 text-white rounded-lg transition-colors"
              >
                Clear all filters
              </button>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
