'use client';

import { Brain, LayoutDashboard, BookmarkIcon, Tag, Settings, Plus, Search } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export function Sidebar() {
  const pathname = usePathname();
  
  const navItems = [
    { icon: LayoutDashboard, label: 'Dashboard', href: '/dashboard' },
    { icon: Search, label: 'Search', href: '/search' },
    { icon: BookmarkIcon, label: 'Collections', href: '/collections' },
    { icon: Tag, label: 'Tags', href: '/tags' },
    { icon: Settings, label: 'Settings', href: '/settings' },
  ];

  return (
    <aside className="flex h-screen w-64 flex-col bg-[#111418] p-4 sticky top-0">
      <div className="flex flex-col gap-8 h-full">
        {/* Logo */}
        <div className="flex items-center gap-3 px-3">
          <Brain className="text-[#2b8cee] w-8 h-8" />
          <h1 className="text-white text-xl font-bold">Synapse</h1>
        </div>

        <div className="flex flex-col gap-4 flex-1">
          {/* User Profile */}
          <div className="flex flex-col gap-3">
            <div 
              className="bg-center bg-no-repeat aspect-square bg-cover rounded-full w-10 h-10 mx-auto bg-linear-to-br from-blue-500 to-purple-600"
            />
            <div className="flex flex-col text-center">
              <h2 className="text-white text-base font-medium leading-normal">Guest User</h2>
              <p className="text-gray-400 text-sm font-normal leading-normal">guest@synapse.io</p>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex flex-col gap-2 mt-4">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors duration-200 ${
                    isActive
                      ? 'bg-[#2b8cee]/20 text-[#2b8cee]'
                      : 'text-gray-300 hover:bg-[#2b8cee]/10 hover:text-white'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <p className="text-sm font-medium leading-normal">{item.label}</p>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Add New Button */}
        <button className="flex min-w-[84px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 px-4 bg-[#2b8cee] text-white text-sm font-bold leading-normal tracking-[0.015em] hover:bg-[#2b8cee]/90 transition-colors duration-200">
          <Plus className="w-5 h-5 mr-2" />
          <span className="truncate">Add New</span>
        </button>
      </div>
    </aside>
  );
}
