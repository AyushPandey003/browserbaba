'use client';

import { Memory } from '@/lib/types';
import { motion } from 'framer-motion';
import { 
  FileText, 
  ShoppingBag, 
  Video, 
  CheckSquare, 
  StickyNote,
  ExternalLink 
} from 'lucide-react';

interface MemoryCardProps {
  memory: Memory;
  onClick: () => void;
}

export function MemoryCard({ memory, onClick }: MemoryCardProps) {
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
        return (
          <div className="relative">
            {memory.metadata?.thumbnail ? (
              <div className="relative w-full h-48 bg-gray-200 rounded-lg overflow-hidden">
                <img
                  src={memory.metadata.thumbnail}
                  alt={memory.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                  <div className="w-16 h-16 rounded-full bg-white/90 flex items-center justify-center">
                    <Video className="w-8 h-8 text-purple-600" />
                  </div>
                </div>
              </div>
            ) : (
              <div className="w-full h-48 bg-linear-to-br from-purple-100 to-purple-50 rounded-lg flex items-center justify-center">
                <Video className="w-16 h-16 text-purple-400" />
              </div>
            )}
          </div>
        );

      case 'product':
        return (
          <div className="relative">
            {memory.metadata?.thumbnail ? (
              <div className="w-full h-48 bg-gray-200 rounded-lg overflow-hidden">
                <img
                  src={memory.metadata.thumbnail}
                  alt={memory.title}
                  className="w-full h-full object-contain p-4"
                />
              </div>
            ) : (
              <div className="w-full h-48 bg-linear-to-br from-green-100 to-green-50 rounded-lg flex items-center justify-center">
                <ShoppingBag className="w-16 h-16 text-green-400" />
              </div>
            )}
            {memory.metadata?.price && (
              <div className="absolute top-2 right-2 bg-green-600 text-white px-3 py-1 rounded-full text-sm font-semibold">
                {memory.metadata.price}
              </div>
            )}
          </div>
        );

      case 'article':
        return (
          <div className="space-y-2">
            {memory.metadata?.thumbnail && (
              <div className="w-full h-32 bg-gray-200 rounded-lg overflow-hidden">
                <img
                  src={memory.metadata.thumbnail}
                  alt={memory.title}
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            {memory.content && (
              <p className="text-sm text-gray-600 line-clamp-3">
                {memory.content}
              </p>
            )}
            {memory.metadata?.source && (
              <p className="text-xs text-gray-500">
                Source: {memory.metadata.source}
              </p>
            )}
          </div>
        );

      case 'todo':
        return (
          <div className="space-y-2">
            {memory.content && (
              <div className="bg-orange-50 rounded-lg p-3">
                <p className="text-sm text-gray-700 whitespace-pre-wrap">
                  {memory.content}
                </p>
              </div>
            )}
          </div>
        );

      case 'note':
        return (
          <div className="space-y-2">
            {memory.content && (
              <div className="bg-yellow-50 rounded-lg p-3">
                <p className="text-sm text-gray-700 line-clamp-4 whitespace-pre-wrap">
                  {memory.content}
                </p>
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
