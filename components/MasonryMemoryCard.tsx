'use client';

import { Memory } from '@/lib/types';
import { Play } from 'lucide-react';

interface MasonryMemoryCardProps {
  memory: Memory;
  onClick: () => void;
}

export function MasonryMemoryCard({ memory, onClick }: MasonryMemoryCardProps) {
  const renderCardContent = () => {
    switch (memory.type) {
      case 'video':
        return (
          <div className="break-inside-avoid bg-[#1a232c] p-4 rounded-xl shadow-lg cursor-pointer hover:shadow-2xl transition-shadow duration-200" onClick={onClick}>
            <div className="p-0">
              <div 
                className="relative flex items-center justify-center bg-white bg-cover bg-center aspect-video rounded-lg"
                style={{ backgroundImage: memory.metadata?.thumbnail ? `url(${memory.metadata.thumbnail})` : 'none' }}
              >
                <button className="flex shrink-0 items-center justify-center rounded-full w-16 h-16 bg-black/50 text-white hover:bg-black/70 transition-colors duration-200">
                  <Play className="w-8 h-8 fill-current" />
                </button>
              </div>
            </div>
            <div className="mt-3">
              <p className="text-white text-base font-medium leading-normal line-clamp-2">{memory.title}</p>
              <p className="text-gray-400 text-sm font-normal leading-normal mt-1">
                {memory.metadata?.source || 'YouTube'}
              </p>
              {memory.metadata?.duration && (
                <p className="text-gray-400 text-xs font-normal leading-normal mt-1">
                  {memory.metadata.duration}
                </p>
              )}
            </div>
          </div>
        );

      case 'product':
        return (
          <div className="flex flex-col gap-3 pb-3 break-inside-avoid bg-[#1a232c] p-4 rounded-xl shadow-lg cursor-pointer hover:shadow-2xl transition-shadow duration-200" onClick={onClick}>
            {memory.metadata?.thumbnail ? (
              <div 
                className="w-full bg-center bg-no-repeat aspect-video bg-cover rounded-lg"
                style={{ backgroundImage: `url(${memory.metadata.thumbnail})` }}
              />
            ) : (
              <div className="w-full bg-linear-to-br from-green-500 to-green-700 aspect-video rounded-lg flex items-center justify-center">
                <span className="text-white text-4xl">🛍️</span>
              </div>
            )}
            <div>
              <p className="text-white text-base font-medium leading-normal line-clamp-2">{memory.title}</p>
              {memory.metadata?.source && (
                <p className="text-gray-400 text-sm font-normal leading-normal">{memory.metadata.source}</p>
              )}
              {memory.metadata?.price && (
                <p className="text-gray-400 text-sm font-semibold leading-normal">{memory.metadata.price}</p>
              )}
            </div>
          </div>
        );

      case 'article':
        return (
          <div className="flex flex-col gap-3 pb-3 break-inside-avoid bg-[#1a232c] p-4 rounded-xl shadow-lg cursor-pointer hover:shadow-2xl transition-shadow duration-200" onClick={onClick}>
            {memory.metadata?.thumbnail && (
              <div 
                className="w-full bg-center bg-no-repeat aspect-video bg-cover rounded-lg"
                style={{ backgroundImage: `url(${memory.metadata.thumbnail})` }}
              />
            )}
            <div>
              <p className="text-white text-base font-medium leading-normal line-clamp-2">{memory.title}</p>
              {memory.metadata?.source && (
                <p className="text-gray-400 text-sm font-normal leading-normal mt-1">{memory.metadata.source}</p>
              )}
              {memory.content && (
                <p className="text-gray-300 text-sm font-normal leading-normal mt-2 line-clamp-3">{memory.content}</p>
              )}
            </div>
          </div>
        );

      case 'note':
        return (
          <div className="break-inside-avoid bg-[#1a232c] p-4 rounded-xl shadow-lg cursor-pointer hover:shadow-2xl transition-shadow duration-200" onClick={onClick}>
            <div className="flex flex-col items-stretch justify-start">
              <div className="flex w-full grow flex-col items-stretch justify-center gap-1 py-4">
                <p className="text-gray-400 text-sm font-normal leading-normal">Note</p>
                <p className="text-white text-lg font-bold leading-tight tracking-[-0.015em] line-clamp-2">{memory.title}</p>
                <div className="flex items-end gap-3 justify-between mt-2">
                  <div className="flex flex-col gap-1">
                    <p className="text-gray-300 text-base font-normal leading-normal line-clamp-4">
                      {memory.content || 'No content'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 'todo':
        return (
          <div className="break-inside-avoid bg-[#1a232c] p-4 rounded-xl shadow-lg cursor-pointer hover:shadow-2xl transition-shadow duration-200" onClick={onClick}>
            <div className="flex flex-col items-stretch justify-start">
              <div className="flex w-full grow flex-col items-stretch justify-center gap-1 py-4">
                <p className="text-gray-400 text-sm font-normal leading-normal">To-Do</p>
                <p className="text-white text-lg font-bold leading-tight tracking-[-0.015em] line-clamp-2">{memory.title}</p>
                <div className="flex items-end gap-3 justify-between mt-2">
                  <div className="flex flex-col gap-1 w-full">
                    <div className="text-gray-300 text-sm font-normal leading-normal space-y-1">
                      {memory.content?.split('\n').slice(0, 4).map((line, i) => (
                        <div key={i} className="flex items-start gap-2">
                          <span className="text-[#2b8cee] mt-0.5">•</span>
                          <span className="line-clamp-1">{line.replace(/^[-•]\s*/, '')}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return (
          <div className="break-inside-avoid bg-[#1a232c] p-4 rounded-xl shadow-lg cursor-pointer hover:shadow-2xl transition-shadow duration-200" onClick={onClick}>
            <p className="text-white text-base font-medium leading-normal">{memory.title}</p>
          </div>
        );
    }
  };

  return renderCardContent();
}
