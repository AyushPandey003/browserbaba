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
          className="relative bg-[#1a232c] rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        >
          {/* Header */}
          <div className="sticky top-0 bg-[#1a232c] border-b border-gray-700 px-6 py-4 flex items-start justify-between">
            <div className="flex-1 pr-4">
              <h2 className="text-2xl font-bold text-white">{memory.title}</h2>
              <div className="flex items-center gap-3 mt-2 flex-wrap">
                <span className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full bg-[#2b8cee]/20 text-[#2b8cee]">
                  <Tag className="w-3 h-3" />
                  {memory.type}
                </span>
                <span className="inline-flex items-center gap-1 text-xs text-gray-400">
                  <Calendar className="w-3 h-3" />
                  {new Date(memory.createdAt).toLocaleDateString('en-US', {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="shrink-0 p-2 rounded-lg hover:bg-gray-700 transition-colors"
            >
              <X className="w-5 h-5 text-gray-400" />
            </button>
          </div>

          {/* Content */}
          <div className="px-6 py-6 space-y-6">
            {/* Thumbnail/Image */}
            {memory.metadata?.thumbnail && (
              <div className="rounded-xl overflow-hidden bg-gray-800">
                <img
                  src={memory.metadata.thumbnail}
                  alt={memory.title}
                  className="w-full h-auto max-h-96 object-contain"
                />
              </div>
            )}

            {/* URL */}
            {memory.url && (
              <div>
                <h3 className="text-sm font-semibold text-gray-400 mb-2">URL</h3>
                <a
                  href={memory.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-[#2b8cee] hover:text-[#2b8cee]/80 hover:underline"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span className="break-all">{memory.url}</span>
                </a>
              </div>
            )}

            {/* Content */}
            {memory.content && (
              <div>
                <h3 className="text-sm font-semibold text-gray-400 mb-2">Content</h3>
                <div className="bg-gray-800/50 rounded-xl p-4">
                  <p className="text-gray-300 whitespace-pre-wrap">{memory.content}</p>
                </div>
              </div>
            )}

            {/* Metadata */}
            {memory.metadata && Object.keys(memory.metadata).length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-gray-400 mb-2">Metadata</h3>
                <div className="bg-gray-800/50 rounded-xl p-4 space-y-2">
                  {Object.entries(memory.metadata).map(([key, value]) => {
                    if (key === 'thumbnail') return null;
                    return (
                      <div key={key} className="flex gap-2">
                        <span className="text-sm font-medium text-gray-400 capitalize">
                          {key}:
                        </span>
                        <span className="text-sm text-gray-300">
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
          <div className="sticky bottom-0 bg-gray-800/50 border-t border-gray-700 px-6 py-4 flex items-center justify-between">
            <div className="text-xs text-gray-400">
              Source: <span className="capitalize text-gray-300">{memory.source || 'extension'}</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => alert('Archive feature coming soon!')}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-gray-300 hover:bg-gray-700 transition-colors"
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
