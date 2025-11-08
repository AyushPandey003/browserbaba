'use client';

import { MemoryType } from '@/lib/types';
import { Search, Sparkles, LayoutGrid, List, SlidersHorizontal, Play, FileText, ShoppingBag, StickyNote, CheckSquare, SquareKanban } from 'lucide-react';

interface FiltersHeaderProps {
    searchQuery: string;
    onSearchChange: (query: string) => void;
    filterType: MemoryType | 'all';
    onFilterTypeChange: (type: MemoryType | 'all') => void;
    layout: 'grid' | 'list' | 'board';
    onLayoutChange: (layout: 'grid' | 'list' | 'board') => void;
    useSemanticSearch: boolean;
    onSemanticSearchToggle: () => void;
    isSearching: boolean;
    totalMemories: number;
    filteredCount: number;
    title?: string;
    icon?: React.ReactNode;
}

export function FiltersHeader({
    searchQuery,
    onSearchChange,
    filterType,
    onFilterTypeChange,
    layout,
    onLayoutChange,
    useSemanticSearch,
    onSemanticSearchToggle,
    isSearching,
    filteredCount,
    title = "My Memories",
    icon
}: FiltersHeaderProps) {
    const filters: { id: MemoryType | 'all'; label: string; icon?: React.ReactNode }[] = [
        { id: 'all', label: 'All Memories', icon: <LayoutGrid className="w-4 h-4" /> },
        { id: 'video', label: 'Videos', icon: <Play className="w-4 h-4" /> },
        { id: 'article', label: 'Articles', icon: <FileText className="w-4 h-4" /> },
        { id: 'product', label: 'Products', icon: <ShoppingBag className="w-4 h-4" /> },
        { id: 'note', label: 'Notes', icon: <StickyNote className="w-4 h-4" /> },
        { id: 'todo', label: 'To-Do', icon: <CheckSquare className="w-4 h-4" /> },
    ];

    return (
        <div className="sticky top-0 bg-background/95 backdrop-blur-md z-20 border-b border-border shadow-sm w-full">
            <div className="w-full px-4 md:px-8 py-4 space-y-4">
                {/* Top Row: Title & Layout Toggle */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
                            {icon || <SlidersHorizontal className="w-6 h-6 text-primary" />}
                            {title}
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            {filteredCount} items
                        </p>
                    </div>

                    <div className="flex items-center bg-muted/50 rounded-lg p-1 border border-border/50">
                        <button
                            onClick={() => onLayoutChange('grid')}
                            className={`p-2 rounded-md transition-all ${layout === 'grid'
                                ? 'bg-background text-foreground shadow-sm'
                                : 'text-muted-foreground hover:text-foreground'
                                }`}
                            title="Grid View"
                        >
                            <LayoutGrid className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => onLayoutChange('list')}
                            className={`p-2 rounded-md transition-all ${layout === 'list'
                                ? 'bg-background text-foreground shadow-sm'
                                : 'text-muted-foreground hover:text-foreground'
                                }`}
                            title="List View"
                        >
                            <List className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => onLayoutChange('board')}
                            className={`p-2 rounded-md transition-all ${layout === 'board'
                                ? 'bg-background text-foreground shadow-sm'
                                : 'text-muted-foreground hover:text-foreground'
                                }`}
                            title="Board View"
                        >
                            <SquareKanban className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {/* Bottom Row: Filter Tabs & Compact Search */}
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    {/* Filter Tabs */}
                    <div className="flex items-center gap-2 overflow-x-auto no-scrollbar w-full md:w-auto pb-2 md:pb-0">
                        {filters.map((filter) => (
                            <button
                                key={filter.id}
                                onClick={() => onFilterTypeChange(filter.id)}
                                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap border ${filterType === filter.id
                                    ? 'bg-primary text-primary-foreground border-primary shadow-md'
                                    : 'bg-card text-muted-foreground border-border hover:border-primary/50 hover:text-foreground'
                                    }`}
                            >
                                {filter.icon}
                                {filter.label}
                            </button>
                        ))}
                    </div>

                    {/* Compact Search */}
                    <div className="relative group w-full md:w-72 shrink-0">
                        <div className={`flex items-center rounded-full border transition-all duration-200 overflow-hidden ${isSearching ? 'border-primary ring-1 ring-primary/20' : 'border-border bg-muted/30 hover:bg-muted/50 focus-within:bg-background focus-within:border-primary focus-within:ring-1 focus-within:ring-primary/20'
                            }`}>
                            <div className="pl-3 text-muted-foreground">
                                {isSearching ? (
                                    <div className="animate-spin"><Search className="w-4 h-4" /></div>
                                ) : (
                                    <Search className="w-4 h-4" />
                                )}
                            </div>
                            <input
                                type="text"
                                className="flex-1 px-3 py-2 bg-transparent text-sm focus:outline-none placeholder:text-muted-foreground/70"
                                placeholder={useSemanticSearch ? "AI Search..." : "Search..."}
                                value={searchQuery}
                                onChange={(e) => onSearchChange(e.target.value)}
                            />
                            <button
                                onClick={onSemanticSearchToggle}
                                className={`p-2 mr-1 rounded-full transition-colors ${useSemanticSearch
                                    ? 'text-primary bg-primary/10'
                                    : 'text-muted-foreground hover:text-primary hover:bg-primary/5'
                                    }`}
                                title="Toggle AI Search"
                            >
                                <Sparkles className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
