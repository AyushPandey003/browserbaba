'use client';

import { useState, useEffect } from 'react';
import { ArrowLeft, Tag, Calendar, ExternalLink, Clock, Share2, Bookmark } from 'lucide-react';
import { useRouter } from 'next/navigation';
import type { Memory } from '@/lib/types';

interface ReaderViewClientProps {
  memory: Memory;
}

export default function ReaderViewClient({ memory }: ReaderViewClientProps) {
  const router = useRouter();
  const [scrollProgress, setScrollProgress] = useState(0);
  const [readingTime, setReadingTime] = useState(0);

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
            {memory.url && (
              <a
                href={memory.url}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
                title="Open original"
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
          <div className="flex items-center gap-2">
            <span>by {author}</span>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            <span>{publishedDate}</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            <span>{readingTime} min read</span>
          </div>
        </div>

        {/* Article Body - Prose Styling */}
        <div className="prose prose-lg prose-invert max-w-none">
          <div 
            className="text-gray-300 leading-relaxed space-y-6"
            dangerouslySetInnerHTML={{ 
              __html: formatContent(memory.content || '') 
            }}
          />
        </div>

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
