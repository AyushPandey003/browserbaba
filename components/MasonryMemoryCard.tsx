'use client';

import { Memory } from '@/lib/types';
import { Play, FileText, ShoppingBag, CheckSquare, StickyNote, Clock, User, Star, Link2, MonitorPlay, Newspaper } from 'lucide-react';

interface MasonryMemoryCardProps {
  memory: Memory;
  onClick: () => void;
  layout: 'grid' | 'list';
}

const typeIconMap = {
  video: <Play className="w-4 h-4" />,
  article: <FileText className="w-4 h-4" />,
  product: <ShoppingBag className="w-4 h-4" />,
  note: <StickyNote className="w-4 h-4" />,
  todo: <CheckSquare className="w-4 h-4" />,
};

// Utility functions
const formatDuration = (seconds: number): string => {
  if (seconds < 60) return `${seconds}s`;
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return secs > 0 ? `${mins}m ${secs}s` : `${mins}m`;
};

const formatRelativeDate = (date: Date): string => {
  const now = new Date();
  const diffMs = now.getTime() - new Date(date).getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
  return `${Math.floor(diffDays / 365)} years ago`;
};

const renderStarRating = (rating: string | null): React.ReactElement | null => {
  if (!rating) return null;
  const numRating = parseFloat(rating);
  if (isNaN(numRating)) return null;

  const fullStars = Math.floor(numRating);
  const hasHalfStar = numRating % 1 >= 0.5;

  return (
    <div className="flex items-center gap-1">
      {[...Array(5)].map((_, i) => (
        <Star
          key={i}
          className={`w-3 h-3 ${i < fullStars
            ? 'fill-yellow-400 text-yellow-400'
            : i === fullStars && hasHalfStar
              ? 'fill-yellow-400/50 text-yellow-400'
              : 'text-gray-300'
            }`}
        />
      ))}
      <span className="text-xs text-muted-foreground ml-1">({rating})</span>
    </div>
  );
};

export function MasonryMemoryCard({ memory, onClick, layout }: MasonryMemoryCardProps) {
  const Icon = typeIconMap[memory.type] || <FileText className="w-4 h-4" />;

  // Extract YouTube video ID from URL
  const getYouTubeVideoId = (url: string): string | null => {
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
      /youtube\.com\/shorts\/([^&\n?#]+)/
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) return match[1];
    }
    return null;
  };

  const isYouTubeVideo = memory.url ? getYouTubeVideoId(memory.url) : null;

  if (layout === 'list') {
    return (
      <div
        className="bg-card border border-border p-4 rounded-lg shadow-sm cursor-pointer hover:shadow-md transition-all duration-200 flex items-center gap-4"
        onClick={onClick}
      >
        <div className="shrink-0 w-12 h-12 flex items-center justify-center bg-muted rounded-lg text-muted-foreground">
          {Icon}
        </div>
        <div className="grow">
          <p className="text-card-foreground text-base font-medium leading-normal line-clamp-1">{memory.title}</p>
          <p className="text-muted-foreground text-sm font-normal leading-normal mt-1 line-clamp-1">
            {memory.metadata?.source || memory.content?.substring(0, 50) || 'No additional content'}
          </p>
        </div>
        <div className="text-muted-foreground text-xs self-start">
          {formatRelativeDate(memory.createdAt)}
        </div>
      </div>
    );
  }

  // Grid layout rendering
  const renderGridContent = () => {
    switch (memory.type) {
      case 'video':
        const thumbnail = memory.thumbnailUrl || memory.mainImage || memory.metadata?.thumbnail;
        const videoDuration = memory.videoDuration || memory.metadata?.videoDuration;

        return (
          <div className="flex flex-col h-full bg-zinc-950 border border-zinc-800 rounded-xl shadow-sm cursor-pointer hover:shadow-lg hover:-translate-y-1 hover:border-red-500/50 transition-all duration-300 overflow-hidden group" onClick={onClick}>
            <div className="relative">
              <div
                className="relative flex items-center justify-center bg-zinc-900 bg-cover bg-center aspect-video group-hover:scale-105 transition-transform duration-500"
                style={{
                  backgroundImage: `url(${thumbnail ||
                    (isYouTubeVideo ? `https://img.youtube.com/vi/${isYouTubeVideo}/maxresdefault.jpg` : '')
                    })`
                }}
              >
                <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors duration-300" />
                <div className="relative z-10 flex shrink-0 items-center justify-center rounded-full w-12 h-12 bg-red-600 text-white shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <Play className="w-5 h-5 fill-current ml-0.5" />
                </div>

                {/* Duration Badge */}
                {videoDuration && (
                  <div className="absolute bottom-2 right-2 bg-black/80 px-2 py-0.5 rounded text-white text-xs font-medium backdrop-blur-sm">
                    {formatDuration(videoDuration)}
                  </div>
                )}
              </div>
            </div>

            <div className="p-4 flex-1 flex flex-col bg-zinc-950">
              <div className="flex items-center gap-2 mb-2">
                <span className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-wider font-bold text-red-500">
                  <MonitorPlay className="w-3 h-3" />
                  Video
                </span>
                {memory.videoPlatform && (
                  <span className="text-[10px] text-zinc-500 px-1.5 py-0.5 bg-zinc-900 rounded border border-zinc-800">
                    {memory.videoPlatform}
                  </span>
                )}
              </div>

              <p className="text-zinc-100 text-base font-semibold leading-snug line-clamp-2 mb-2 group-hover:text-red-400 transition-colors">{memory.title}</p>

              <div className="mt-auto pt-3 flex items-center justify-between border-t border-zinc-900">
                <div className="flex items-center gap-2 text-zinc-500 text-xs">
                  {memory.author && (
                    <span className="flex items-center gap-1">
                      <User className="w-3 h-3" />
                      {memory.author}
                    </span>
                  )}
                </div>
                <span className="text-zinc-600 text-xs">{formatRelativeDate(memory.createdAt)}</span>
              </div>
            </div>
          </div>
        );

      case 'product':
        const productImage = memory.mainImage || memory.thumbnailUrl || memory.metadata?.thumbnail;

        return (
          <div className="flex flex-col h-full bg-white border border-slate-200 rounded-xl shadow-sm cursor-pointer hover:shadow-xl hover:-translate-y-1 hover:border-emerald-400 transition-all duration-300 overflow-hidden group" onClick={onClick}>
            <div className="relative aspect-square overflow-hidden bg-slate-50">
              {productImage ? (
                <div
                  className="w-full h-full bg-center bg-contain bg-no-repeat group-hover:scale-105 transition-transform duration-500"
                  style={{ backgroundImage: `url(${productImage})` }}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-slate-100 text-slate-300">
                  <ShoppingBag className="w-16 h-16" />
                </div>
              )}

              {/* Price Tag */}
              {memory.price && (
                <div className="absolute top-3 right-3 bg-emerald-600 text-white px-3 py-1 rounded-full font-bold shadow-lg text-sm transform group-hover:scale-110 transition-transform duration-300">
                  {memory.price}
                </div>
              )}

              {/* Sale/Availability Badge */}
              {memory.availability && (
                <div className="absolute bottom-3 left-3 px-2 py-1 bg-white/90 backdrop-blur-sm rounded text-[10px] font-bold uppercase tracking-wide border border-slate-200 shadow-sm">
                  {memory.availability}
                </div>
              )}
            </div>

            <div className="p-4 flex-1 flex flex-col">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">Product</span>
                {memory.brand && (
                  <span className="text-xs text-slate-500 font-medium">• {memory.brand}</span>
                )}
              </div>

              <p className="text-slate-900 text-base font-bold leading-tight line-clamp-2 mb-2 group-hover:text-emerald-700 transition-colors">{memory.title}</p>

              <div className="mt-auto space-y-3">
                {memory.rating && (
                  <div className="flex items-center justify-between">
                    {renderStarRating(memory.rating)}
                  </div>
                )}

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-xs text-slate-400 flex items-center gap-1">
                    <Link2 className="w-3 h-3" />
                    {memory.domain || 'Store'}
                  </span>
                  <button className="text-xs font-bold text-emerald-600 hover:text-emerald-700">
                    View Details →
                  </button>
                </div>
              </div>
            </div>
          </div>
        );

      case 'article':
        const articleImage = memory.mainImage || memory.metadata?.thumbnail;
        const publishedDate = memory.publishedDate ? new Date(memory.publishedDate) : null;

        return (
          <div className="flex flex-col h-full bg-stone-50 border border-stone-200 rounded-xl shadow-sm cursor-pointer hover:shadow-lg hover:-translate-y-1 hover:border-stone-300 transition-all duration-300 overflow-hidden group" onClick={onClick}>
            <div className="relative h-48 overflow-hidden bg-stone-200">
              {articleImage ? (
                <div
                  className="w-full h-full bg-center bg-cover transition-transform duration-700 group-hover:scale-105"
                  style={{ backgroundImage: `url(${articleImage})` }}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-stone-100 text-stone-300">
                  <Newspaper className="w-16 h-16" />
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-stone-900/60 to-transparent opacity-60" />
              <div className="absolute bottom-3 left-3 right-3">
                {memory.category && (
                  <span className="inline-block px-2 py-0.5 bg-white/90 backdrop-blur-md text-stone-800 text-[10px] font-bold uppercase tracking-wider rounded-sm mb-1">
                    {memory.category}
                  </span>
                )}
              </div>
            </div>

            <div className="p-5 flex-1 flex flex-col">
              <p className="text-stone-900 text-lg font-serif font-bold leading-tight line-clamp-3 mb-3 group-hover:text-stone-600 transition-colors">
                {memory.title}
              </p>

              <div className="mt-auto space-y-4">
                {memory.description && (
                  <p className="text-stone-600 text-sm leading-relaxed line-clamp-3 font-serif">
                    {memory.description}
                  </p>
                )}

                <div className="pt-4 border-t border-stone-200 flex items-center justify-between text-xs text-stone-500">
                  <div className="flex items-center gap-3">
                    {memory.author && (
                      <span className="font-medium text-stone-700">{memory.author}</span>
                    )}
                    {memory.readingTime && (
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {memory.readingTime}
                      </span>
                    )}
                  </div>
                  {publishedDate && (
                    <span>{publishedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        );

      case 'note':
        const wordCount = memory.content ? memory.content.split(/\s+/).length : 0;

        return (
          <div className="flex flex-col h-full bg-[#fef3c7] border-none rounded-sm shadow-md cursor-pointer hover:shadow-xl hover:-translate-y-1 hover:rotate-1 transition-all duration-300 p-6 relative group" onClick={onClick}>
            {/* Tape effect */}
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-16 h-6 bg-yellow-200/50 backdrop-blur-sm rotate-2 shadow-sm z-10" />

            <div className="flex items-center justify-between mb-4 opacity-60 group-hover:opacity-100 transition-opacity">
              <div className="flex items-center gap-2 text-yellow-800">
                <StickyNote className="w-4 h-4" />
                <p className="text-xs font-bold uppercase tracking-wider">Note</p>
              </div>
              <span className="text-xs text-yellow-800 font-mono">{formatRelativeDate(memory.createdAt)}</span>
            </div>

            <p className="text-yellow-950 text-xl font-handwriting font-bold leading-tight mb-4 line-clamp-2">
              {memory.title}
            </p>

            <div className="relative flex-1">
              <p className="text-yellow-900/80 text-base font-handwriting leading-relaxed line-clamp-6 whitespace-pre-wrap">
                {memory.content || 'No content'}
              </p>
            </div>

            <div className="mt-4 pt-4 border-t border-yellow-800/10 flex items-center justify-between">
              <span className="text-xs text-yellow-800/60 font-medium">{wordCount} words</span>
              {memory.metadata?.tags && (
                <div className="flex -space-x-1">
                  {memory.metadata.tags.slice(0, 3).map((tag, i) => (
                    <div key={i} className="w-2 h-2 rounded-full bg-yellow-400 border border-yellow-200" title={tag} />
                  ))}
                </div>
              )}
            </div>
          </div>
        );

      case 'todo':
        const isCompleted = memory.status?.toLowerCase() === 'completed';
        const priority = memory.priority?.toLowerCase();
        const priorityColors = {
          high: 'bg-rose-100 text-rose-700 border-rose-200',
          medium: 'bg-amber-100 text-amber-700 border-amber-200',
          low: 'bg-emerald-100 text-emerald-700 border-emerald-200',
        };

        return (
          <div className="flex flex-col h-full bg-white border border-slate-200 rounded-xl shadow-sm cursor-pointer hover:shadow-lg hover:-translate-y-1 hover:border-blue-400 transition-all duration-300 p-0 overflow-hidden group" onClick={onClick}>
            {/* Thumbnail Area for Todo */}
            <div className="h-32 w-full bg-slate-100 flex items-center justify-center relative overflow-hidden">
              <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:16px_16px]"></div>
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-sm ${isCompleted ? 'bg-blue-100 text-blue-600' : 'bg-white text-slate-400'}`}>
                <CheckSquare className="w-6 h-6" />
              </div>
              {priority && priorityColors[priority as keyof typeof priorityColors] && (
                <div className={`absolute top-3 right-3 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wide shadow-sm ${priorityColors[priority as keyof typeof priorityColors]}`}>
                  {priority}
                </div>
              )}
            </div>

            <div className="p-5 flex-1 flex flex-col">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Task</span>
              </div>

              <p className={`text-slate-800 text-lg font-bold leading-tight mb-3 transition-all ${isCompleted ? 'line-through opacity-50' : ''}`}>
                {memory.title}
              </p>

              {memory.content && (
                <div className="space-y-2 mb-4">
                  {memory.content.split('\n').slice(0, 3).map((line, i) => {
                    const cleanLine = line.replace(/^[-•]\s*/, '').trim();
                    if (!cleanLine) return null;
                    return (
                      <div key={i} className="flex items-start gap-2 text-sm text-slate-600">
                        <div className="w-1.5 h-1.5 rounded-full bg-slate-300 mt-1.5 shrink-0" />
                        <span className="line-clamp-1">{cleanLine}</span>
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="mt-auto pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs text-slate-400 font-medium">{formatRelativeDate(memory.createdAt)}</span>
                {isCompleted ? (
                  <span className="text-xs font-bold text-blue-600">Done</span>
                ) : (
                  <span className="text-xs font-bold text-slate-400 group-hover:text-blue-500 transition-colors">View</span>
                )}
              </div>
            </div>
          </div>
        );

      default:
        return (
          <div className="flex flex-col h-full bg-card border border-border p-4 rounded-xl shadow-sm cursor-pointer hover:shadow-lg hover:-translate-y-1 hover:border-primary/50 transition-all duration-300" onClick={onClick}>
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
              {Icon}
              <p className="text-sm font-medium capitalize">{memory.type}</p>
            </div>
            <p className="text-card-foreground text-base font-semibold leading-snug">{memory.title}</p>
            {memory.content && (
              <p className="text-muted-foreground text-sm mt-2 line-clamp-3">{memory.content}</p>
            )}
          </div>
        );
    }
  };

  return renderGridContent();
}
