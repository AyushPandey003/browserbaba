'use client';

import { Search, Sparkles } from 'lucide-react';
import { useState } from 'react';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  showNLPHint?: boolean;
}

export function SearchBar({ value, onChange, placeholder = 'Search memories...', showNLPHint = true }: SearchBarProps) {
  const [showHint, setShowHint] = useState(false);
  
  const nlpExamples = [
    "articles about AI last month",
    "videos I saved this week",
    "notes tagged with cooking",
    "products from amazon"
  ];

  return (
    <div className="relative flex-1 max-w-md">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 z-10" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setShowHint(true)}
        onBlur={() => setTimeout(() => setShowHint(false), 200)}
        placeholder={placeholder || "Try: 'articles about AI last month'"}
        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all outline-none"
      />
      {showNLPHint && showHint && !value && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg p-3 z-20">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-4 h-4 text-blue-600" />
            <span className="text-xs font-medium text-gray-700">Natural Language Search</span>
          </div>
          <div className="space-y-1">
            {nlpExamples.map((example, idx) => (
              <button
                key={idx}
                onClick={() => onChange(example)}
                className="block w-full text-left text-xs text-gray-600 hover:text-blue-600 hover:bg-blue-50 px-2 py-1 rounded transition-colors"
              >
                &ldquo;{example}&rdquo;
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
