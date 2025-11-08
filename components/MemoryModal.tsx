'use client';

import { Memory } from '@/lib/types';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  ExternalLink,
  Calendar,
  Tag,
  Trash2,
  Archive
} from 'lucide-react';
import { deleteMemory } from '@/lib/actions/memory-actions';
import { useState } from 'react';

interface MemoryModalProps {
  memory: Memory | null;
  onClose: () => void;
}

export function MemoryModal({ memory, onClose }: MemoryModalProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  if (!memory) return null;

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

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this memory?')) return;

    setIsDeleting(true);
    try {
      await deleteMemory(memory.id);
      onClose();
    } catch (error) {
      console.error('Failed to delete memory', error);
      alert('Failed to delete memory');
      setIsDeleting(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative bg-background rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-border"
        >
          {/* Header */}
          <div className="sticky top-0 bg-background/95 backdrop-blur-sm border-b border-border px-6 py-4 flex items-start justify-between z-10">
            <div className="flex-1 pr-4">
              <h2 className="text-2xl font-bold text-foreground">{memory.title}</h2>
              <div className="flex items-center gap-3 mt-2 flex-wrap">
                <span className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full bg-primary/10 text-primary">
                  <Tag className="w-3 h-3" />
                  {memory.type}
                </span>
                <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                  <Calendar className="w-3 h-3" />
                  {new Date(memory.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })} {new Date(memory.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="shrink-0 p-2 rounded-lg hover:bg-muted transition-colors"
            >
              <X className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>

          {/* Content */}
          <div className="px-6 py-6 space-y-6">
            {/* YouTube Video or Thumbnail/Image */}
            {isYouTubeVideo ? (
              <div className="relative rounded-xl overflow-hidden bg-muted w-full aspect-video">
                <iframe
                  src={`https://www.youtube.com/embed/${isYouTubeVideo}`}
                  title={memory.title}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="w-full h-full"
                />
              </div>
            ) : memory.metadata?.thumbnail && (
              <div className="relative rounded-xl overflow-hidden bg-muted w-full h-96">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={memory.metadata.thumbnail}
                  alt={memory.title}
                  className="w-full h-full object-contain"
                />
              </div>
            )}

            {/* URL */}
            {memory.url && (
              <div>
                <h3 className="text-sm font-semibold text-muted-foreground mb-2">URL</h3>
                <a
                  href={memory.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-primary hover:text-primary/80 hover:underline"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span className="break-all">{memory.url}</span>
                </a>
              </div>
            )}

            {/* Content */}
            {memory.content && (
              <div>
                <h3 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wider">Content</h3>
                <div className="bg-muted/30 rounded-xl p-6 border border-border">
                  <p className="text-foreground text-base leading-relaxed whitespace-pre-wrap font-normal">
                    {memory.content}
                  </p>
                </div>
              </div>
            )}

            {/* Metadata */}
            {memory.metadata && Object.keys(memory.metadata).length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-muted-foreground mb-2">Metadata</h3>
                <div className="bg-muted/30 rounded-xl p-4 space-y-2 border border-border">
                  {Object.entries(memory.metadata).map(([key, value]) => {
                    if (key === 'thumbnail') return null;
                    return (
                      <div key={key} className="flex gap-2">
                        <span className="text-sm font-medium text-muted-foreground capitalize">
                          {key}:
                        </span>
                        <span className="text-sm text-foreground">
                          {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="sticky bottom-0 bg-background/95 backdrop-blur-sm border-t border-border px-6 py-4 flex items-center justify-between z-10">
            <div className="text-xs text-muted-foreground">
              Source: <span className="capitalize text-foreground">{memory.source || 'extension'}</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => alert('Archive feature coming soon!')}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              >
                <Archive className="w-4 h-4" />
                Archive
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Trash2 className="w-4 h-4" />
                {isDeleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
