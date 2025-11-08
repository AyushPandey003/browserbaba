'use client';

import { Brain } from 'lucide-react';

export function Navbar() {
  return (
    <nav className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-linear-to-br from-blue-600 to-purple-600">
              <Brain className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Project Synapse</h1>
              <p className="text-xs text-gray-500">Your Second Brain</p>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
