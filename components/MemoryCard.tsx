'use client';

import { Memory } from '@/lib/types';
import { motion } from 'framer-motion';
import { 
  FileText, 
  ShoppingBag, 
  Video, 
  CheckSquare, 
  StickyNote,
  ExternalLink,
  Clock,
  Link as LinkIcon,
  Image as ImageIcon,
  RefreshCw
} from 'lucide-react';
import { useState } from 'react';
import { scrapeUrl, type FirecrawlResult } from '@/lib/actions/firecrawl-actions';
import Image from 'next/image';

interface MemoryCardProps {
  memory: Memory;
  onClick: () => void;
}

export function MemoryCard({ memory, onClick }: MemoryCardProps) {
  const [isScraping, setIsScraping] = useState(false);
  const [scrapedData, setScrapedData] = useState<FirecrawlResult['data'] | null>(null);

  // Format time helper
  const formatTime = (seconds: number) => {
    if (!seconds) return '0:00';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    if (hours > 0) {
      return `${hours}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    }
    return `${minutes}:${String(secs).padStart(2, '0')}`;
  };

  // Build YouTube URL with timestamp
  const getVideoUrlWithTimestamp = (url: string | null, timestamp?: number) => {
    if (!url || !timestamp) return url;
    
    try {
      const urlObj = new URL(url);
      if (urlObj.hostname.includes('youtube.com') || urlObj.hostname.includes('youtu.be')) {
        urlObj.searchParams.set('t', Math.floor(timestamp).toString());
        return urlObj.toString();
      }
      if (urlObj.hostname.includes('vimeo.com')) {
        urlObj.hash = `#t=${Math.floor(timestamp)}`;
        return urlObj.toString();
      }
      urlObj.searchParams.set('t', Math.floor(timestamp).toString());
      return urlObj.toString();
    } catch {
      return url;
    }
  };

  const handleScrapeClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!memory.url || isScraping) return;
    
    setIsScraping(true);
    try {
      const result = await scrapeUrl(memory.url);
      if (result.success && result.data) {
        setScrapedData(result.data);
      }
    } catch (error) {
      console.error('Error scraping:', error);
    } finally {
      setIsScraping(false);
    }
  };

  const getIcon = () => {
    switch (memory.type) {
      case 'article':
        return <FileText className="w-5 h-5" />;
      case 'product':
        return <ShoppingBag className="w-5 h-5" />;
      case 'video':
        return <Video className="w-5 h-5" />;
      case 'todo':
        return <CheckSquare className="w-5 h-5" />;
      case 'note':
        return <StickyNote className="w-5 h-5" />;
      default:
        return <FileText className="w-5 h-5" />;
    }
  };

  const getTypeColor = () => {
    switch (memory.type) {
      case 'article':
        return 'bg-blue-100 text-blue-700';
      case 'product':
        return 'bg-green-100 text-green-700';
      case 'video':
        return 'bg-purple-100 text-purple-700';
      case 'todo':
        return 'bg-orange-100 text-orange-700';
      case 'note':
        return 'bg-yellow-100 text-yellow-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const renderCardContent = () => {
    switch (memory.type) {
      case 'video':
        const videoUrl = memory.videoUrl || memory.url;
        const videoTimestamp = memory.videoTimestamp;
        const timestampedUrl = videoUrl && videoTimestamp 
          ? getVideoUrlWithTimestamp(videoUrl, videoTimestamp) 
          : videoUrl;
        const thumbnail = memory.thumbnailUrl || memory.mainImage || memory.metadata?.thumbnail;
        
        return (
          <div className="relative space-y-2">
            {thumbnail ? (
              <div className="relative w-full h-48 bg-gray-200 rounded-lg overflow-hidden group">
                <Image
                  src={thumbnail}
                  alt={memory.title}
                  fill
                  className="object-cover"
                  unoptimized
                />
                <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/30 transition-colors">
                  <div className="w-16 h-16 rounded-full bg-white/90 flex items-center justify-center">
                    <Video className="w-8 h-8 text-purple-600" />
                  </div>
                </div>
                {videoTimestamp && (
                  <div className="absolute bottom-2 left-2 right-2">
                    <a
                      href={timestampedUrl || '#'}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="flex bg-purple-600 hover:bg-purple-700 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors items-center gap-2"
                    >
                      <Clock className="w-4 h-4" />
                      <span>Watch at {memory.formattedTimestamp || `${Math.floor(videoTimestamp)}s`}</span>
                      <ExternalLink className="w-3 h-3 ml-auto" />
                    </a>
                  </div>
                )}
              </div>
            ) : (
              <div className="w-full h-48 bg-linear-to-br from-purple-100 to-purple-50 rounded-lg flex items-center justify-center">
                <Video className="w-16 h-16 text-purple-400" />
              </div>
            )}
            {memory.description && (
              <p className="text-sm text-gray-600 line-clamp-2">{memory.description}</p>
            )}
            {memory.videoDuration && (
              <div className="flex items-center gap-1 text-xs text-gray-500">
                <Clock className="w-3 h-3" />
                <span>Duration: {formatTime(memory.videoDuration)}</span>
              </div>
            )}
          </div>
        );

      case 'product':
        const productImage = memory.mainImage || memory.thumbnailUrl || memory.metadata?.thumbnail;
        
        return (
          <div className="relative space-y-2">
            {productImage ? (
              <div className="relative w-full h-48 bg-gray-200 rounded-lg overflow-hidden">
                <Image
                  src={productImage}
                  alt={memory.title}
                  fill
                  className="object-contain p-4"
                  unoptimized
                />
              </div>
            ) : (
              <div className="w-full h-48 bg-linear-to-br from-green-100 to-green-50 rounded-lg flex items-center justify-center">
                <ShoppingBag className="w-16 h-16 text-green-400" />
              </div>
            )}
            
            {/* Product Info */}
            <div className="space-y-2">
              {memory.price && (
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold text-green-600">
                    {memory.price}
                  </span>
                  {memory.availability && (
                    <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded-full">
                      {memory.availability}
                    </span>
                  )}
                </div>
              )}
              
              {memory.brand && (
                <div className="text-sm text-gray-600">
                  <span className="font-semibold">Brand:</span> {memory.brand}
                </div>
              )}
              
              {memory.rating && (
                <div className="flex items-center gap-1 text-sm">
                  <span className="text-yellow-500">⭐</span>
                  <span className="font-medium">{memory.rating}</span>
                </div>
              )}
              
              {memory.description && (
                <p className="text-sm text-gray-600 line-clamp-2">{memory.description}</p>
              )}
            </div>
            
            {memory.url && (
              <a
                href={memory.url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="block text-center bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                View Product
              </a>
            )}
          </div>
        );

      case 'article':
        const isRecipe = memory.category === 'recipe' || 
                        memory.title.toLowerCase().includes('recipe') || 
                        memory.content?.toLowerCase().includes('ingredients');
        const articleImage = memory.mainImage || memory.metadata?.thumbnail;
        
        return (
          <div className="space-y-2">
            {articleImage && (
              <div className="relative w-full h-32 bg-gray-200 rounded-lg overflow-hidden">
                <Image
                  src={articleImage}
                  alt={memory.title}
                  fill
                  className="object-cover"
                  unoptimized
                />
              </div>
            )}
            
            {/* Article Meta */}
            <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500">
              {memory.author && (
                <span className="flex items-center gap-1">
                  👤 {memory.author}
                </span>
              )}
              {memory.readingTime && (
                <span className="flex items-center gap-1">
                  📖 {memory.readingTime}
                </span>
              )}
              {memory.wordCount && memory.wordCount > 0 && (
                <span>{memory.wordCount} words</span>
              )}
            </div>
            
            {isRecipe && (
              <div className="bg-orange-50 border-l-4 border-orange-400 rounded-lg p-2">
                <div className="flex items-center gap-2 text-xs text-orange-700 font-medium mb-1">
                  <span>🍳</span>
                  <span>Recipe</span>
                </div>
              </div>
            )}
            
            {memory.description ? (
              <p className="text-sm text-gray-600 line-clamp-3">{memory.description}</p>
            ) : memory.content ? (
              <p className="text-sm text-gray-600 line-clamp-3">{memory.content}</p>
            ) : null}
            
            {scrapedData && (
              <div className="bg-blue-50 rounded-lg p-3 space-y-2">
                <div className="flex items-center gap-2 text-xs text-blue-700 font-medium">
                  <ImageIcon className="w-3 h-3" />
                  <span>Scraped Content Available</span>
                </div>
                {scrapedData.description && (
                  <p className="text-xs text-gray-600 line-clamp-2">{scrapedData.description}</p>
                )}
                {scrapedData.links && scrapedData.links.length > 0 && (
                  <div className="flex items-center gap-1 text-xs text-blue-600">
                    <LinkIcon className="w-3 h-3" />
                    <span>{scrapedData.links.length} links found</span>
                  </div>
                )}
              </div>
            )}
            
            {memory.url && !scrapedData && (
              <button
                onClick={handleScrapeClick}
                disabled={isScraping}
                className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1 disabled:opacity-50"
              >
                {isScraping ? (
                  <>
                    <RefreshCw className="w-3 h-3 animate-spin" />
                    <span>Scraping...</span>
                  </>
                ) : (
                  <>
                    <ExternalLink className="w-3 h-3" />
                    <span>Get more details</span>
                  </>
                )}
              </button>
            )}
          </div>
        );

      case 'todo':
        return (
          <div className="space-y-2">
            {memory.content && (
              <div className="bg-orange-50 rounded-lg p-3 border-l-4 border-orange-400">
                <div className="flex items-start gap-2">
                  <CheckSquare className="w-4 h-4 text-orange-600 mt-0.5 shrink-0" />
                  <p className="text-sm text-gray-700 whitespace-pre-wrap flex-1">
                    {memory.content}
                  </p>
                </div>
              </div>
            )}
            {memory.metadata?.notes && (
              <div className="bg-orange-50/50 rounded-lg p-2 text-xs text-gray-600">
                <strong>Notes:</strong> {memory.metadata.notes}
              </div>
            )}
          </div>
        );

      case 'note':
        return (
          <div className="space-y-2">
            {memory.content && (
              <div className="bg-yellow-50 rounded-lg p-3 border-l-4 border-yellow-400">
                <div className="flex items-start gap-2">
                  <StickyNote className="w-4 h-4 text-yellow-600 mt-0.5 shrink-0" />
                  <p className="text-sm text-gray-700 line-clamp-4 whitespace-pre-wrap flex-1">
                    {memory.content}
                  </p>
                </div>
              </div>
            )}
            {memory.selectedText && memory.selectedText !== memory.content && (
              <div className="bg-yellow-50/50 rounded-lg p-2 text-xs text-gray-600 italic">
                &ldquo;{memory.selectedText.substring(0, 100)}...&rdquo;
              </div>
            )}
            {memory.metadata?.notes && (
              <div className="bg-yellow-50/50 rounded-lg p-2 text-xs text-gray-600">
                <strong>Additional Notes:</strong> {memory.metadata.notes}
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
      onClick={onClick}
      className="bg-white rounded-2xl shadow-sm hover:shadow-xl transition-shadow cursor-pointer overflow-hidden border border-gray-100"
    >
      <div className="p-5 space-y-3">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className={`p-2 rounded-lg ${getTypeColor()}`}>
              {getIcon()}
            </div>
            <span className={`text-xs font-medium px-2 py-1 rounded-full ${getTypeColor()}`}>
              {memory.type}
            </span>
          </div>
          {memory.url && (
            <ExternalLink className="w-4 h-4 text-gray-400 shrink-0" />
          )}
        </div>

        {/* Title */}
        <h3 className="font-semibold text-gray-900 line-clamp-2 text-lg">
          {memory.title}
        </h3>

        {/* Content */}
        {renderCardContent()}

        {/* Footer */}
        <div className="flex items-center justify-between text-xs text-gray-500 pt-2 border-t border-gray-100">
          <span>
            {new Date(memory.createdAt).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            })}
          </span>
          <span className="capitalize">{memory.source || 'extension'}</span>
        </div>
      </div>
    </motion.div>
  );
}
