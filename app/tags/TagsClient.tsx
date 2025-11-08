'use client';

import { useState, useMemo } from 'react';
import { Search, Loader2, ExternalLink, Tag, Calendar, User, Globe, Link as LinkIcon, Sparkles, X, Hash, ChevronRight } from 'lucide-react';
import { scrapeUrl } from '@/lib/actions/firecrawl-actions';
import type { FirecrawlResult } from '@/lib/actions/firecrawl-actions';
import type { Memory } from '@/lib/types';
import Link from 'next/link';

interface TagsClientProps {
  memories?: Memory[];
}

export default function TagsClient({ memories = [] }: TagsClientProps) {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<FirecrawlResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');

  // Extract unique tags from memories
  const allTags = useMemo(() => {
    const tagCounts: Record<string, number> = {};
    memories?.forEach(memory => {
      // Check both metadata.tags and top-level tags field if it exists in your type
      // Based on types.ts, it's in metadata.tags
      memory.metadata?.tags?.forEach(tag => {
        const normalizedTag = tag.trim();
        if (normalizedTag) {
          tagCounts[normalizedTag] = (tagCounts[normalizedTag] || 0) + 1;
        }
      });
    });
    return Object.entries(tagCounts)
      .sort((a, b) => b[1] - a[1]) // Sort by count desc
      .map(([name, count]) => ({ name, count }));
  }, [memories]);

  const handleScrape = async () => {
    if (!url.trim()) {
      setError('Please enter a URL');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const scrapeResult = await scrapeUrl(url);

      if (scrapeResult.success && scrapeResult.data) {
        setResult(scrapeResult);
        // Extract potential tags from content (simple keyword extraction)
        const extractedTags = extractTags(scrapeResult.data);
        setTags(extractedTags);
      } else {
        setError(scrapeResult.error || 'Failed to scrape URL');
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred while scraping';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const extractTags = (data: FirecrawlResult['data']): string[] => {
    if (!data) return [];

    const tags: string[] = [];
    const content = (data.markdown || data.content || '').toLowerCase();

    // Common topic keywords
    const keywords = [
      'technology', 'design', 'programming', 'ai', 'machine learning',
      'web development', 'productivity', 'business', 'startup', 'marketing',
      'health', 'fitness', 'travel', 'food', 'lifestyle', 'education',
      'science', 'research', 'innovation', 'finance', 'investment'
    ];

    keywords.forEach(keyword => {
      if (content.includes(keyword)) {
        tags.push(keyword);
      }
    });

    // Extract from metadata
    if (data.metadata?.siteName) {
      tags.push(data.metadata.siteName);
    }

    return tags.slice(0, 8); // Limit to 8 tags
  };

  const addTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()]);
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const formatContent = (content: string): string => {
    if (!content) return '';

    // Convert markdown to HTML
    let html = content
      // Headers
      .replace(/^### (.*$)/gim, '<h3 class="text-xl font-semibold text-foreground mt-6 mb-3">$1</h3>')
      .replace(/^## (.*$)/gim, '<h2 class="text-2xl font-semibold text-foreground mt-8 mb-4">$1</h2>')
      .replace(/^# (.*$)/gim, '<h1 class="text-3xl font-bold text-foreground mt-10 mb-5">$1</h1>')
      // Bold
      .replace(/\*\*(.*?)\*\*/gim, '<strong class="font-semibold text-foreground">$1</strong>')
      // Italic
      .replace(/\*(.*?)\*/gim, '<em class="italic text-muted-foreground">$1</em>')
      // Links
      .replace(/\[([^\]]+)\]\(([^)]+)\)/gim, '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-primary hover:underline">$1</a>')
      // Images
      .replace(/!\[([^\]]*)\]\(([^)]+)\)/gim, '<img src="$2" alt="$1" class="rounded-lg my-4 max-w-full" />')
      // Code blocks
      .replace(/```([\s\S]*?)```/gim, '<pre class="bg-muted p-4 rounded-lg overflow-x-auto my-4"><code>$1</code></pre>')
      // Inline code
      .replace(/`([^`]+)`/gim, '<code class="bg-muted px-2 py-1 rounded text-sm">$1</code>')
      // Blockquotes
      .replace(/^> (.*$)/gim, '<blockquote class="border-l-4 border-primary/50 pl-4 italic my-4 text-muted-foreground">$1</blockquote>')
      // Lists
      .replace(/^\* (.*$)/gim, '<li class="ml-4">$1</li>')
      .replace(/^- (.*$)/gim, '<li class="ml-4">$1</li>')
      // Paragraphs
      .split('\n\n')
      .map(para => {
        if (para.trim() && !para.match(/^<[h|u|o|b|p|d]/)) {
          return `<p class="text-muted-foreground leading-relaxed mb-4">${para.trim()}</p>`;
        }
        return para;
      })
      .join('\n');

    // Wrap list items in ul tags
    html = html.replace(/(<li.*<\/li>)/gim, '<ul class="list-disc ml-6 my-4 space-y-2">$1</ul>');

    return html;
  };

  return (
    <main className="flex-1 bg-background p-4 lg:p-8 w-full max-w-full">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Tags & Content Scraper</h1>
          <p className="text-muted-foreground">Scrape and analyze web content with AI-powered context</p>
        </div>

        {/* URL Input Section */}
        <div className="mb-8">
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="flex flex-col min-w-40 h-12 w-full">
                <div className="flex w-full flex-1 items-stretch rounded-lg h-full">
                  <div className="text-muted-foreground flex bg-muted/50 items-center justify-center pl-4 rounded-l-lg">
                    <Globe className="w-5 h-5" />
                  </div>
                  <input
                    type="text"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !loading) {
                        handleScrape();
                      }
                    }}
                    className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-none text-foreground focus:outline-0 focus:ring-2 focus:ring-primary border-none bg-muted/50 h-full placeholder:text-muted-foreground px-4 text-base font-normal leading-normal"
                    placeholder="Enter URL to scrape (e.g., https://example.com/article)"
                    disabled={loading}
                  />
                  {url && (
                    <div className="flex items-center justify-center rounded-r-lg border-l-0 border-none bg-muted/50 pr-4">
                      <button
                        onClick={() => {
                          setUrl('');
                          setResult(null);
                          setError(null);
                        }}
                        className="flex cursor-pointer items-center justify-center overflow-hidden rounded-lg text-muted-foreground hover:text-foreground"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  )}
                </div>
              </label>
            </div>
            <button
              onClick={handleScrape}
              disabled={loading || !url.trim()}
              className="px-6 py-3 bg-primary hover:bg-primary/90 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Scraping...
                </>
              ) : (
                <>
                  <Search className="w-5 h-5" />
                  Scrape
                </>
              )}
            </button>
          </div>
          {error && (
            <div className="mt-4 p-4 bg-red-500/10 border border-red-500/50 rounded-lg text-red-400">
              {error}
            </div>
          )}
        </div>

        {/* Results Section */}
        {result && result.success && result.data && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Content */}
            <div className="lg:col-span-2 flex flex-col gap-6">
              {/* Title & Meta */}
              <div>
                <h1 className="text-foreground tracking-tight text-[32px] font-bold leading-tight text-left mb-2">
                  {result.data.title}
                </h1>
                <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                  {result.data.metadata?.siteName && (
                    <div className="flex items-center gap-2">
                      <Globe className="w-4 h-4" />
                      <span>{result.data.metadata.siteName}</span>
                    </div>
                  )}
                  {result.data.metadata?.author && (
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4" />
                      <span>{result.data.metadata.author}</span>
                    </div>
                  )}
                  {result.data.metadata?.publishedDate && (
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      <span>{new Date(result.data.metadata.publishedDate).toLocaleDateString()}</span>
                    </div>
                  )}
                  <a
                    href={result.data.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-primary hover:text-primary/80"
                  >
                    <ExternalLink className="w-4 h-4" />
                    <span>View Original</span>
                  </a>
                </div>
              </div>

              {/* Content Card */}
              <div className="flex flex-col items-stretch justify-start rounded-xl bg-card p-6 border border-border">
                {result.data.images && result.data.images.length > 0 && (
                  <div
                    className="w-full bg-center bg-no-repeat aspect-[16/9] bg-cover rounded-lg mb-4"
                    style={{ backgroundImage: `url(${result.data.images[0].src})` }}
                  />
                )}
                {result.data.description && (
                  <p className="text-muted-foreground text-base font-normal leading-normal mb-4">
                    {result.data.description}
                  </p>
                )}
                <div
                  className="prose prose-invert max-w-none"
                  dangerouslySetInnerHTML={{ __html: formatContent(result.data.markdown || result.data.content) }}
                />
              </div>

              {/* Tags Section */}
              <div>
                <h2 className="text-foreground text-lg font-semibold mb-3 px-1">Tags</h2>
                <div className="flex gap-3 flex-wrap">
                  {tags.map((tag, index) => (
                    <div
                      key={index}
                      className="flex h-8 shrink-0 items-center justify-center gap-x-2 rounded-full bg-primary/20 pl-3 pr-2 border border-primary/50"
                    >
                      <Tag className="w-3 h-3 text-primary" />
                      <p className="text-primary text-sm font-medium leading-normal">{tag}</p>
                      <button
                        onClick={() => removeTag(tag)}
                        className="text-primary/70 hover:text-primary"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          addTag();
                        }
                      }}
                      className="flex h-8 shrink-0 items-center justify-center gap-x-2 rounded-full bg-muted/50 hover:bg-muted pl-3 pr-3 border border-dashed border-border text-muted-foreground hover:text-foreground text-sm font-medium leading-normal focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="Add Tag"
                    />
                    <button
                      onClick={addTag}
                      className="flex h-8 shrink-0 items-center justify-center gap-x-2 rounded-full bg-muted/50 hover:bg-muted pl-3 pr-3 border border-dashed border-border text-muted-foreground hover:text-foreground text-sm font-medium leading-normal"
                    >
                      <Tag className="w-4 h-4" />
                      Add
                    </button>
                  </div>
                </div>
              </div>

              {/* Headings Section */}
              {result.data.metadata?.headings && result.data.metadata.headings.length > 0 && (
                <div>
                  <h2 className="text-foreground text-lg font-semibold mb-3 px-1">Page Structure</h2>
                  <div className="flex flex-col gap-2">
                    {result.data.metadata.headings.map((heading: string, index: number) => (
                      <div
                        key={index}
                        className="flex items-center gap-2 p-2 bg-card rounded-lg border border-border"
                      >
                        <span className="text-primary text-xs font-medium">#{index + 1}</span>
                        <span className="text-muted-foreground text-sm">{heading}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Links Section */}
              {result.data.links && result.data.links.length > 0 && (
                <div>
                  <h2 className="text-foreground text-lg font-semibold mb-3 px-1">Related Links</h2>
                  <div className="flex flex-col gap-2">
                    {result.data.links.slice(0, 10).map((link, index) => (
                      <a
                        key={index}
                        href={link.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 p-3 bg-card hover:bg-muted/50 rounded-lg border border-border transition-colors"
                      >
                        <LinkIcon className="w-4 h-4 text-primary" />
                        <span className="text-muted-foreground text-sm">{link.text || link.href}</span>
                        <ExternalLink className="w-3 h-3 text-muted-foreground ml-auto" />
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Right Column: AI Insights Panel */}
            <div className="lg:col-span-1 h-fit lg:sticky lg:top-24">
              <div className="flex flex-col gap-4 rounded-xl border border-border bg-card p-4 backdrop-blur-xl">
                <div className="flex items-center gap-3">
                  <Sparkles className="text-primary text-2xl" />
                  <h2 className="text-foreground text-lg font-semibold">AI Insights</h2>
                </div>

                {/* Summary */}
                <div className="flex flex-col gap-3 text-muted-foreground text-sm font-normal leading-relaxed">
                  <p className="text-foreground font-medium mb-2">Summary</p>
                  <p>
                    {result.data.description ||
                      (result.data.content.length > 200
                        ? result.data.content.substring(0, 200) + '...'
                        : result.data.content)}
                  </p>
                </div>

                {/* Metadata */}
                {result.data.metadata && (
                  <div className="flex flex-col gap-2 text-sm">
                    <p className="text-foreground font-medium mb-2">Metadata</p>
                    {result.data.metadata.language && (
                      <div className="text-muted-foreground">
                        <span className="text-muted-foreground/70">Language:</span> {result.data.metadata.language}
                      </div>
                    )}
                    {result.data.metadata.siteName && (
                      <div className="text-muted-foreground">
                        <span className="text-muted-foreground/70">Site:</span> {result.data.metadata.siteName}
                      </div>
                    )}
                  </div>
                )}

                {/* Images Count */}
                {result.data.images && result.data.images.length > 0 && (
                  <div className="flex flex-col gap-2">
                    <p className="text-foreground font-medium mb-2">Images</p>
                    <div className="grid grid-cols-2 gap-2">
                      {result.data.images.slice(0, 4).map((image, index) => (
                        <div
                          key={index}
                          className="aspect-square bg-center bg-cover rounded-lg border border-border"
                          style={{ backgroundImage: `url(${image.src})` }}
                        />
                      ))}
                    </div>
                    {result.data.images.length > 4 && (
                      <p className="text-muted-foreground text-xs">+{result.data.images.length - 4} more images</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!result && !loading && (
          <div className="text-center py-16">
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
              <Search className="w-10 h-10 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold text-muted-foreground mb-2">Start Scraping</h3>
            <p className="text-muted-foreground mb-6">
              Enter a URL above to scrape and analyze web content
            </p>
          </div>
        )}
      </div>

      {/* Browse Tags Section */}
      <div className="max-w-7xl mx-auto mt-16 border-t border-border pt-12">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-foreground mb-2">Browse Tags</h2>
            <p className="text-muted-foreground">Explore your content by tags ({allTags.length} tags found)</p>
          </div>
        </div>

        {allTags.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {allTags.map(({ name, count }) => (
              <Link
                href={`/search?q=${encodeURIComponent(name)}`}
                key={name}
                className="group bg-card hover:bg-muted/50 border border-border rounded-xl p-4 transition-all hover:shadow-md hover:border-primary/50 flex items-center justify-between"
              >
                <div className="flex items-center gap-3 overflow-hidden">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors shrink-0">
                    <Hash className="w-5 h-5 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-medium text-foreground group-hover:text-primary transition-colors truncate pr-2">
                      {name}
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      {count} {count === 1 ? 'memory' : 'memories'}
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors opacity-0 group-hover:opacity-100" />
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-card/50 rounded-xl border border-border border-dashed">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
              <Tag className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium text-foreground mb-1">No tags found</h3>
            <p className="text-muted-foreground">
              Start adding tags to your memories to see them here.
            </p>
          </div>
        )}
      </div>
    </main>
  );
}

