'use server';

import FirecrawlApp from '@mendable/firecrawl-js';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';

export interface FirecrawlResult {
  success: boolean;
  data?: {
    title: string;
    description?: string;
    content: string;
    markdown?: string;
    html?: string;
    url: string;
    links?: Array<{ text: string; href: string }>;
    images?: Array<{ src: string; alt?: string }>;
    metadata?: {
      author?: string;
      publishedDate?: string;
      siteName?: string;
      language?: string;
      headings?: string[];
      description?: string;
      [key: string]: string | string[] | undefined;
    };
  };
  error?: string;
}

/**
 * Scrape a URL using Firecrawl
 * @param url - The URL to scrape
 * @returns Scraped content and metadata
 */
export async function scrapeUrl(url: string): Promise<FirecrawlResult> {
  try {
    // Check authentication
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return {
        success: false,
        error: 'Unauthorized. Please log in.',
      };
    }

    // Validate URL
    if (!url || typeof url !== 'string') {
      return {
        success: false,
        error: 'Invalid URL provided',
      };
    }

    // Ensure URL has protocol
    let validUrl = url.trim();
    if (!validUrl.startsWith('http://') && !validUrl.startsWith('https://')) {
      validUrl = `https://${validUrl}`;
    }

    // Get Firecrawl API key from environment
    const apiKey = process.env.FIRECRAWL_API_KEY;
    if (!apiKey) {
      return {
        success: false,
        error: 'Firecrawl API key not configured. Please set FIRECRAWL_API_KEY in your environment variables.',
      };
    }

    // Initialize Firecrawl with timeout
    const app = new FirecrawlApp({ 
      apiKey,
      timeoutMs: 30000, // 30 second timeout instead of default 60s
    });

    // Light scraping - just get basic content, headings, images, and links
    // No deep processing to avoid timeouts
    interface ScrapeResult {
      markdown?: string;
      html?: string;
      content?: string;
      title?: string;
      description?: string;
      metadata?: {
        title?: string;
        description?: string;
        author?: string;
        publishedDate?: string;
        publishedTime?: string;
        siteName?: string;
        ogSiteName?: string;
        language?: string;
      };
    }

    const result = await Promise.race([
      app.scrape(validUrl, {
        formats: ['markdown'], // Only markdown for faster processing
        onlyMainContent: false, // Don't filter - faster
        // Remove heavy options that cause delays
      }),
      new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error('Scraping timeout - page took too long to load')), 250000)
      )
    ]) as ScrapeResult | null;

    if (!result) {
      return {
        success: false,
        error: 'Failed to scrape URL - no data returned',
      };
    }

    // Extract and structure the data
    // Firecrawl returns a Document object with markdown, html, metadata, etc.
    const scrapedData: ScrapeResult = result;

    // Extract links from markdown
    const links: Array<{ text: string; href: string }> = [];
    if (scrapedData.markdown) {
      const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
      let match;
      let linkCount = 0;
      while ((match = linkRegex.exec(scrapedData.markdown)) !== null && linkCount < 15) {
        links.push({
          text: match[1],
          href: match[2],
        });
        linkCount++;
      }
    }

    // Extract images from markdown
    const images: Array<{ src: string; alt?: string }> = [];
    if (scrapedData.markdown) {
      const imageRegex = /!\[([^\]]*)\]\(([^)]+)\)/g;
      let match;
      let imageCount = 0;
      while ((match = imageRegex.exec(scrapedData.markdown)) !== null && imageCount < 8) {
        images.push({
          alt: match[1] || undefined,
          src: match[2],
        });
        imageCount++;
      }
    }

    // Extract headings for quick overview
    const headings: string[] = [];
    if (scrapedData.markdown) {
      const headingRegex = /^#{1,3}\s+(.+)$/gm;
      let match;
      let headingCount = 0;
      while ((match = headingRegex.exec(scrapedData.markdown)) !== null && headingCount < 10) {
        headings.push(match[1].trim());
        headingCount++;
      }
    }

    // Limit content length - just first 500 words or 3000 characters
    let content = scrapedData.markdown || scrapedData.content || '';
    if (content.length > 3000) {
      // Try to cut at a sentence boundary
      const truncated = content.substring(0, 3000);
      const lastPeriod = truncated.lastIndexOf('.');
      const lastNewline = truncated.lastIndexOf('\n');
      const cutPoint = Math.max(lastPeriod, lastNewline);
      content = truncated.substring(0, cutPoint > 2000 ? cutPoint : 3000) + '...';
    }

    // Extract metadata
    const metadata: Record<string, string | string[] | undefined> = {};
    if (scrapedData.metadata) {
      metadata.author = scrapedData.metadata.author;
      metadata.publishedDate = scrapedData.metadata.publishedDate || scrapedData.metadata.publishedTime;
      metadata.siteName = scrapedData.metadata.siteName || scrapedData.metadata.ogSiteName;
      metadata.language = scrapedData.metadata.language;
      metadata.description = scrapedData.metadata.description || scrapedData.description;
    }

    return {
      success: true,
      data: {
        title: scrapedData.title || scrapedData.metadata?.title || 'Untitled',
        description: scrapedData.description || scrapedData.metadata?.description || 
                     (content.substring(0, 200) + '...'),
        content: content, // Limited content
        markdown: content,
        html: scrapedData.html,
        url: validUrl,
        links: links, // Already limited to 15
        images: images, // Already limited to 8
        metadata: {
          ...metadata,
          headings: headings, // Add headings for quick overview
        },
      },
    };
  } catch (error: unknown) {
    console.error('Error scraping URL with Firecrawl:', error);
    
    // Provide user-friendly error messages
    let errorMessage = 'An unexpected error occurred while scraping the URL';
    if (error instanceof Error) {
      if (error.message?.includes('timeout') || (error as { code?: string }).code === 'ETIMEDOUT') {
        errorMessage = 'The page took too long to load. Please try a different URL or check if the site is accessible.';
      } else if (error.message) {
        errorMessage = error.message;
      }
    }
    
    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Scrape multiple URLs (for batch processing)
 * @param urls - Array of URLs to scrape
 * @returns Array of scraped results
 */
export async function scrapeUrls(urls: string[]): Promise<FirecrawlResult[]> {
  const results = await Promise.allSettled(
    urls.map(url => scrapeUrl(url))
  );

  return results.map(result => {
    if (result.status === 'fulfilled') {
      return result.value;
    } else {
      return {
        success: false,
        error: result.reason?.message || 'Failed to scrape URL',
      };
    }
  });
}

