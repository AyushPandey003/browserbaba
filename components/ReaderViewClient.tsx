'use client';

import { useState, useEffect } from 'react';
import { ArrowLeft, Tag, Calendar, ExternalLink, Clock, Share2, Bookmark, RefreshCw, Sparkles } from 'lucide-react';
import { useRouter } from 'next/navigation';
import type { Memory } from '@/lib/types';
import { scrapeUrl, type FirecrawlResult } from '@/lib/actions/firecrawl-actions';
import Image from 'next/image';

interface ReaderViewClientProps {
  memory: Memory;
}

export default function ReaderViewClient({ memory }: ReaderViewClientProps) {
  const router = useRouter();
  const [scrollProgress, setScrollProgress] = useState(0);
  const [readingTime, setReadingTime] = useState(0);
  const [isScraping, setIsScraping] = useState(false);
  const [scrapedData, setScrapedData] = useState<FirecrawlResult['data'] | null>(null);

  useEffect(() => {
    // Calculate reading time (assuming 200 words per minute)
    const content = memory.content || '';
    const words = content.split(/\s+/).length;
    setReadingTime(Math.ceil(words / 200));

    // Track scroll progress
    const handleScroll = () => {
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight - windowHeight;
      const scrolled = window.scrollY;
      const progress = (scrolled / documentHeight) * 100;
      setScrollProgress(Math.min(100, Math.max(0, progress)));
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [memory.content]);

  // Parse tags from metadata
  const tags = memory.metadata?.tags || ['Uncategorized'];
  const source = memory.source || 'Unknown Source';
  const author = memory.metadata?.author || 'Unknown Author';
  const publishedDate = memory.metadata?.publishedDate || memory.createdAt.toLocaleDateString();
  
  // Video-specific handling
  const isVideo = memory.type === 'video' || memory.metadata?.videoPlatform;
  const videoTimestamp = memory.metadata?.videoTimestamp;
  const videoUrl = memory.metadata?.videoUrl || memory.url;
  
  // Build video URL with timestamp
  const getVideoUrlWithTimestamp = () => {
    if (!videoUrl || !videoTimestamp) return videoUrl;
    
    try {
      const url = new URL(videoUrl);
      
      // YouTube
      if (url.hostname.includes('youtube.com') || url.hostname.includes('youtu.be')) {
        url.searchParams.set('t', Math.floor(videoTimestamp).toString());
        return url.toString();
      }
      
      // Vimeo
      if (url.hostname.includes('vimeo.com')) {
        url.hash = `#t=${Math.floor(videoTimestamp)}`;
        return url.toString();
      }
      
      // Generic - add timestamp as query param
      url.searchParams.set('t', Math.floor(videoTimestamp).toString());
      return url.toString();
    } catch {
      return videoUrl;
    }
  };
  
  const finalUrl = isVideo && videoTimestamp ? getVideoUrlWithTimestamp() : memory.url;

  // Scrape URL for more content
  const handleScrape = async () => {
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

  // Auto-scrape if no content (only once on mount)
  useEffect(() => {
    if (memory.url && !memory.content && !memory.selectedText && !scrapedData && !isScraping) {
      handleScrape();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [memory.url]);

  return (
    <div className="min-h-screen bg-[#101922] relative">
      {/* Reading Progress Bar */}
      <div
        className="fixed top-0 left-0 h-1 bg-[#4A6C8C] transition-all duration-150 z-50"
        style={{ width: `${scrollProgress}%` }}
      />

      {/* Toolbar */}
      <div className="sticky top-0 z-40 bg-[#101922]/95 backdrop-blur-sm border-b border-gray-800">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="hidden sm:inline">Back</span>
          </button>

          <div className="flex items-center gap-3">
            <button className="p-2 hover:bg-gray-800 rounded-lg transition-colors" title="Share">
              <Share2 className="w-5 h-5 text-gray-400" />
            </button>
            <button className="p-2 hover:bg-gray-800 rounded-lg transition-colors" title="Bookmark">
              <Bookmark className="w-5 h-5 text-gray-400" />
            </button>
            {finalUrl && (
              <a
                href={finalUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
                title={isVideo && videoTimestamp ? `Open video at ${memory.metadata?.formattedTimestamp || `${Math.floor(videoTimestamp)}s`}` : "Open original"}
              >
                <ExternalLink className="w-5 h-5 text-gray-400" />
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Article Content */}
      <article className="max-w-4xl mx-auto px-4 py-12">
        {/* Tags */}
        <div className="flex flex-wrap gap-2 mb-6">
          {tags.map((tag: string, index: number) => (
            <span
              key={index}
              className="inline-flex items-center gap-1 px-3 py-1 bg-[#4A6C8C]/20 text-[#7BA7CC] rounded-full text-sm border border-[#4A6C8C]/30"
            >
              <Tag className="w-3 h-3" />
              {tag}
            </span>
          ))}
        </div>

        {/* Title */}
        <h1 className="font-serif text-4xl sm:text-5xl font-bold text-white mb-6 leading-tight">
          {memory.title}
        </h1>

        {/* Meta Information */}
        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-400 mb-8 pb-8 border-b border-gray-800">
          <div className="flex items-center gap-2">
            <ExternalLink className="w-4 h-4" />
            <span>{source}</span>
          </div>
          {author && (
            <div className="flex items-center gap-2">
              <span>by {author}</span>
            </div>
          )}
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            <span>{publishedDate}</span>
          </div>
          {isVideo && videoTimestamp && (
            <div className="flex items-center gap-2 px-3 py-1 bg-[#4A6C8C]/20 rounded-full">
              <Clock className="w-4 h-4" />
              <span>Saved at {memory.metadata?.formattedTimestamp || `${Math.floor(videoTimestamp)}s`}</span>
            </div>
          )}
          {!isVideo && (
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              <span>{readingTime} min read</span>
            </div>
          )}
        </div>
        
        {/* Video Player Embed (if video) */}
        {isVideo && videoUrl && (
          <div className="mb-8">
            <div className="aspect-video bg-gray-900 rounded-lg overflow-hidden">
              {videoUrl.includes('youtube.com') || videoUrl.includes('youtu.be') ? (
                <iframe
                  src={getVideoUrlWithTimestamp() || videoUrl}
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <a
                    href={getVideoUrlWithTimestamp() || videoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-6 py-3 bg-[#4A6C8C] hover:bg-[#5A7C9C] text-white rounded-lg font-medium transition-colors"
                  >
                    Watch Video {videoTimestamp ? `at ${memory.metadata?.formattedTimestamp || `${Math.floor(videoTimestamp)}s`}` : ''}
                  </a>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Scraped Content Section */}
        {scrapedData && (
          <div className="mb-8 p-6 bg-white/5 rounded-xl border border-white/10">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-5 h-5 text-primary" />
              <h2 className="text-xl font-semibold text-white">Enhanced Content</h2>
            </div>
            {scrapedData.description && (
              <p className="text-gray-300 mb-4 leading-relaxed">{scrapedData.description}</p>
            )}
            {scrapedData.metadata?.headings && scrapedData.metadata.headings.length > 0 && (
              <div className="mb-4">
                <h3 className="text-sm font-medium text-gray-400 mb-2">Page Structure</h3>
                <div className="flex flex-wrap gap-2">
                  {scrapedData.metadata.headings.slice(0, 8).map((heading: string, idx: number) => (
                    <span key={idx} className="px-3 py-1 bg-white/5 rounded-lg text-sm text-gray-300">
                      {heading}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {scrapedData.images && scrapedData.images.length > 0 && (
              <div className="mb-4">
                <h3 className="text-sm font-medium text-gray-400 mb-2">Images ({scrapedData.images.length})</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {scrapedData.images.slice(0, 4).map((img, idx) => (
                    <div key={idx} className="relative w-full h-24 rounded-lg overflow-hidden">
                      <Image
                        src={img.src}
                        alt={img.alt || 'Image'}
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Scrape Button */}
        {memory.url && !scrapedData && !isScraping && (
          <div className="mb-8">
            <button
              onClick={handleScrape}
              className="flex items-center gap-2 px-4 py-2 bg-primary/20 hover:bg-primary/30 text-primary rounded-lg transition-colors"
            >
              <Sparkles className="w-4 h-4" />
              <span>Scrape more content from URL</span>
            </button>
          </div>
        )}

        {isScraping && (
          <div className="mb-8 flex items-center gap-2 text-gray-400">
            <RefreshCw className="w-4 h-4 animate-spin" />
            <span>Scraping content...</span>
          </div>
        )}

        {/* Recipe Detection */}
        {(() => {
          const content = scrapedData?.content || scrapedData?.markdown || memory.content || '';
          const isRecipe = memory.title.toLowerCase().includes('recipe') || 
                          content.toLowerCase().includes('ingredients') ||
                          content.toLowerCase().includes('instructions') ||
                          memory.metadata?.tags?.some(tag => tag.toLowerCase().includes('recipe') || tag.toLowerCase().includes('cooking'));
          
          if (isRecipe) {
            // Extract ingredients and instructions
            const ingredientsMatch = content.match(/(?:ingredients?|what you need)[:\s]*\n([\s\S]*?)(?:\n\n|instructions?|directions?|method|steps)/i);
            const instructionsMatch = content.match(/(?:instructions?|directions?|method|steps)[:\s]*\n([\s\S]*?)(?:\n\n|serves|yields|prep time|cook time|$)/i);
            
            return (
              <div className="space-y-8">
                {ingredientsMatch && (
                  <div className="bg-white/5 rounded-xl p-6 border border-white/10">
                    <h2 className="text-2xl font-semibold text-white mb-4 flex items-center gap-2">
                      <span>🥘</span>
                      Ingredients
                    </h2>
                    <div 
                      className="text-gray-300 leading-relaxed prose prose-invert"
                      dangerouslySetInnerHTML={{ 
                        __html: formatContent(ingredientsMatch[1]) 
                      }}
                    />
                  </div>
                )}
                {instructionsMatch && (
                  <div className="bg-white/5 rounded-xl p-6 border border-white/10">
                    <h2 className="text-2xl font-semibold text-white mb-4 flex items-center gap-2">
                      <span>👨‍🍳</span>
                      Instructions
                    </h2>
                    <div 
                      className="text-gray-300 leading-relaxed prose prose-invert"
                      dangerouslySetInnerHTML={{ 
                        __html: formatContent(instructionsMatch[1]) 
                      }}
                    />
                  </div>
                )}
                {(!ingredientsMatch || !instructionsMatch) && (
                  <div className="prose prose-lg prose-invert max-w-none">
                    <div 
                      className="text-gray-300 leading-relaxed space-y-6"
                      dangerouslySetInnerHTML={{ 
                        __html: formatContent(content) 
                      }}
                    />
                  </div>
                )}
              </div>
            );
          }
          
          return (
            <div className="prose prose-lg prose-invert max-w-none">
              <div 
                className="text-gray-300 leading-relaxed space-y-6"
                dangerouslySetInnerHTML={{ 
                  __html: formatContent(content) 
                }}
              />
            </div>
          );
        })()}

        {/* Related Links */}
        {memory.links && memory.links.length > 0 && (
          <div className="mt-12 pt-8 border-t border-gray-800">
            <h2 className="text-2xl font-semibold text-white mb-4">Related Links</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {memory.links.map((link, index) => (
                <a
                  key={link.id || index}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-4 bg-white/5 hover:bg-white/10 rounded-lg border border-white/10 transition-colors group"
                >
                  <ExternalLink className="w-5 h-5 text-[#4A6C8C] group-hover:text-[#7BA7CC] flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-medium truncate">{link.linkTitle || link.text || 'Link'}</p>
                    <p className="text-gray-400 text-sm truncate">{link.href}</p>
                  </div>
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="mt-16 pt-8 border-t border-gray-800">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-500">
              Saved on {memory.createdAt.toLocaleDateString('en-US', { 
                month: 'long', 
                day: 'numeric', 
                year: 'numeric' 
              })}
            </div>
            <button
              onClick={() => router.back()}
              className="text-[#4A6C8C] hover:text-[#7BA7CC] font-medium transition-colors"
            >
              ← Back to Dashboard
            </button>
          </div>
        </div>
      </article>

      {/* Custom Styles for Serif Font */}
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Lora:wght@400;600;700&display=swap');
        
        .font-serif {
          font-family: 'Lora', Georgia, serif;
        }
        
        .prose h1, .prose h2, .prose h3, .prose h4, .prose h5, .prose h6 {
          font-family: 'Lora', Georgia, serif;
          color: #fff;
          font-weight: 600;
          margin-top: 2rem;
          margin-bottom: 1rem;
        }
        
        .prose h2 {
          font-size: 2rem;
          line-height: 1.3;
        }
        
        .prose h3 {
          font-size: 1.5rem;
          line-height: 1.4;
        }
        
        .prose p {
          margin-bottom: 1.5rem;
          line-height: 1.8;
        }
        
        .prose blockquote {
          border-left: 4px solid #4A6C8C;
          padding-left: 1.5rem;
          margin: 2rem 0;
          font-style: italic;
          color: #9CA3AF;
          background: #1a232c;
          padding: 1.5rem;
          border-radius: 0.5rem;
        }
        
        .prose ul, .prose ol {
          margin: 1.5rem 0;
          padding-left: 2rem;
        }
        
        .prose li {
          margin: 0.5rem 0;
        }
        
        .prose a {
          color: #4A6C8C;
          text-decoration: underline;
        }
        
        .prose a:hover {
          color: #7BA7CC;
        }
        
        .prose code {
          background: #1a232c;
          padding: 0.25rem 0.5rem;
          border-radius: 0.25rem;
          font-size: 0.9em;
          color: #7BA7CC;
        }
        
        .prose pre {
          background: #1a232c;
          padding: 1.5rem;
          border-radius: 0.5rem;
          overflow-x: auto;
          margin: 1.5rem 0;
        }
        
        .prose img {
          border-radius: 0.5rem;
          margin: 2rem 0;
        }
      `}</style>
    </div>
  );
}

// Helper function to format content with basic HTML structure
function formatContent(content: string): string {
  // Split content into paragraphs
  const paragraphs = content.split('\n\n');
  
  return paragraphs
    .map(para => {
      // Skip empty paragraphs
      if (!para.trim()) return '';
      
      // Check if it's a heading (starts with # or is all caps and short)
      if (para.startsWith('#')) {
        const level = para.match(/^#+/)?.[0].length || 2;
        const text = para.replace(/^#+\s*/, '');
        return `<h${Math.min(level, 6)}>${text}</h${Math.min(level, 6)}>`;
      }
      
      // Check if it's a list item
      if (para.trim().match(/^[-*•]\s/)) {
        const items = para.split('\n').map(line => {
          const text = line.replace(/^[-*•]\s+/, '');
          return `<li>${text}</li>`;
        }).join('');
        return `<ul>${items}</ul>`;
      }
      
      // Check if it's a blockquote
      if (para.trim().startsWith('>')) {
        const text = para.replace(/^>\s*/, '');
        return `<blockquote>${text}</blockquote>`;
      }
      
      // Regular paragraph
      return `<p>${para}</p>`;
    })
    .filter(Boolean)
    .join('');
}
