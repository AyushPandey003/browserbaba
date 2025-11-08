'use client';

import { MemoryType } from '@/lib/types';
import { Filter } from 'lucide-react';
import { useState } from 'react';

interface FilterDropdownProps {
  value: MemoryType | 'all';
  onChange: (value: MemoryType | 'all') => void;
}

const filterOptions: { value: MemoryType | 'all'; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'article', label: 'Articles' },
  { value: 'product', label: 'Products' },
  { value: 'video', label: 'Videos' },
  { value: 'todo', label: 'To-Dos' },
  { value: 'note', label: 'Notes' },
];

export function FilterDropdown({ value, onChange }: FilterDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);

  const selectedLabel = filterOptions.find((opt) => opt.value === value)?.label || 'All';

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 hover:border-gray-300 transition-colors bg-white"
      >
        <Filter className="w-4 h-4 text-gray-600" />
        <span className="text-sm font-medium text-gray-700">{selectedLabel}</span>
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-200 py-1 z-20">
            {filterOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                }}
                className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                  value === option.value
                    ? 'bg-blue-50 text-blue-700 font-medium'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
