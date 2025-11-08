'use client';

import { Memory } from '@/lib/types';
import { Folder, ChevronRight, LayoutGrid, List } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';

interface CollectionsClientProps {
    memories: Memory[];
}

export default function CollectionsClient({ memories }: CollectionsClientProps) {
    const [view, setView] = useState<'grid' | 'list'>('grid');

    // Group memories by collection
    const collections = memories.reduce((acc, memory) => {
        const collectionName = memory.collection || 'Uncategorized';
        if (!acc[collectionName]) {
            acc[collectionName] = [];
        }
        acc[collectionName].push(memory);
        return acc;
    }, {} as Record<string, Memory[]>);

    // Sort collections by name, but keep Uncategorized last if desired, or just alpha
    const sortedCollectionNames = Object.keys(collections).sort();

    return (
        <main className="flex-1 p-4 lg:p-8 w-full max-w-full bg-background min-h-screen">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-foreground mb-2">Collections</h1>
                        <p className="text-muted-foreground">Organize and browse your memories by collection</p>
                    </div>

                    <div className="flex items-center gap-2 bg-muted/50 p-1 rounded-lg self-start md:self-auto">
                        <button
                            onClick={() => setView('grid')}
                            className={`p-2 rounded-md transition-colors ${view === 'grid' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                        >
                            <LayoutGrid className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => setView('list')}
                            className={`p-2 rounded-md transition-colors ${view === 'list' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                        >
                            <List className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {/* Grid View */}
                {view === 'grid' ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {sortedCollectionNames.map((name) => {
                            const items = collections[name];
                            return (
                                <Link href={`/search?q=${encodeURIComponent(name)}`} key={name} className="group block h-full">
                                    <div className="bg-card border border-border rounded-xl p-6 hover:shadow-lg transition-all hover:border-primary/50 h-full flex flex-col relative overflow-hidden">
                                        {/* Background Gradient Effect */}
                                        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -mr-16 -mt-16 transition-opacity group-hover:opacity-100 opacity-50" />

                                        <div className="flex items-center justify-between mb-6 relative z-10">
                                            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors group-hover:scale-110 duration-300">
                                                <Folder className="w-6 h-6 text-primary" />
                                            </div>
                                            <span className="text-xs font-medium text-muted-foreground bg-muted/50 px-2.5 py-1 rounded-full border border-border/50">
                                                {items.length} items
                                            </span>
                                        </div>

                                        <h3 className="text-xl font-bold text-foreground mb-2 group-hover:text-primary transition-colors line-clamp-1 relative z-10">
                                            {name}
                                        </h3>

                                        <p className="text-muted-foreground text-sm mb-6 line-clamp-2 relative z-10">
                                            {items.length > 0 ? `Contains ${items.slice(0, 3).map(i => i.title).join(', ')}...` : 'Empty collection'}
                                        </p>

                                        <div className="mt-auto pt-4 border-t border-border/50 flex items-center justify-between relative z-10">
                                            <div className="flex -space-x-2 overflow-hidden">
                                                {items.slice(0, 4).map((item) => (
                                                    <div
                                                        key={item.id}
                                                        className="w-8 h-8 rounded-full border-2 border-card bg-muted flex items-center justify-center overflow-hidden text-[10px] text-muted-foreground font-medium uppercase"
                                                        title={item.title}
                                                    >
                                                        {item.metadata?.thumbnail ? (
                                                            <Image src={item.metadata.thumbnail} alt={item.title} width={32} height={32} className="w-full h-full object-cover" />
                                                        ) : (
                                                            item.title.substring(0, 2)
                                                        )}
                                                    </div>
                                                ))}
                                                {items.length > 4 && (
                                                    <div className="w-8 h-8 rounded-full border-2 border-card bg-muted flex items-center justify-center text-[10px] text-muted-foreground font-medium">
                                                        +{items.length - 4}
                                                    </div>
                                                )}
                                            </div>

                                            <div className="w-8 h-8 rounded-full bg-muted/50 flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground transition-all opacity-0 group-hover:opacity-100 transform translate-x-2 group-hover:translate-x-0">
                                                <ChevronRight className="w-4 h-4" />
                                            </div>
                                        </div>
                                    </div>
                                </Link>
                            );
                        })}
                    </div>
                ) : (
                    /* List View */
                    <div className="flex flex-col gap-3">
                        {sortedCollectionNames.map((name) => {
                            const items = collections[name];
                            return (
                                <Link href={`/search?q=${encodeURIComponent(name)}`} key={name} className="group">
                                    <div className="bg-card border border-border rounded-xl p-4 hover:shadow-md transition-all hover:border-primary/50 flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                                            <Folder className="w-5 h-5 text-primary" />
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <h3 className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors truncate">
                                                {name}
                                            </h3>
                                            <p className="text-muted-foreground text-sm truncate">
                                                {items.length} items • Last updated {new Date(Math.max(...items.map(i => new Date(i.createdAt).getTime()))).toLocaleDateString()}
                                            </p>
                                        </div>

                                        <div className="flex -space-x-2 overflow-hidden mr-4 hidden sm:flex">
                                            {items.slice(0, 3).map((item) => (
                                                <div
                                                    key={item.id}
                                                    className="w-8 h-8 rounded-full border-2 border-card bg-muted flex items-center justify-center overflow-hidden text-[10px] text-muted-foreground font-medium uppercase"
                                                >
                                                    {item.metadata?.thumbnail ? (
                                                        <Image src={item.metadata.thumbnail} alt={item.title} width={32} height={32} className="w-full h-full object-cover" />
                                                    ) : (
                                                        item.title.substring(0, 2)
                                                    )}
                                                </div>
                                            ))}
                                        </div>

                                        <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                                    </div>
                                </Link>
                            );
                        })}
                    </div>
                )}

                {sortedCollectionNames.length === 0 && (
                    <div className="text-center py-20">
                        <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
                            <Folder className="w-10 h-10 text-muted-foreground" />
                        </div>
                        <h3 className="text-xl font-semibold text-foreground mb-2">No collections yet</h3>
                        <p className="text-muted-foreground max-w-md mx-auto">
                            Start adding memories to collections to organize your content better.
                        </p>
                    </div>
                )}
            </div>
        </main>
    );
}
