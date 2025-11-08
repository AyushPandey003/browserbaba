'use client';

import { Brain, LayoutDashboard, BookmarkIcon, Tag, Settings, Search, LogOut } from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useSession, signOut } from '@/lib/auth-client';
import { useState } from 'react';

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session } = useSession();
  const [isSigningOut, setIsSigningOut] = useState(false);
  
  const handleSignOut = async () => {
    try {
      setIsSigningOut(true);
      await signOut();
      router.push('/login');
    } catch (error) {
      console.error('Failed to sign out:', error);
      setIsSigningOut(false);
    }
  };
  
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
          <Brain className="text-primary w-8 h-8" />
          <h1 className="text-white text-xl font-bold">Synapse</h1>
        </div>

        <div className="flex flex-col gap-4 flex-1">
          {/* User Profile */}
          <div className="flex flex-col gap-3">
            <div 
              className="bg-center bg-no-repeat aspect-square bg-cover rounded-full size-10 mx-auto"
              style={{
                backgroundImage: session?.user?.image 
                  ? `url(${session.user.image})` 
                  : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
              }}
            />
            <div className="flex flex-col text-center">
              <h2 className="text-white text-base font-medium leading-normal">
                {session?.user?.name || 'Guest User'}
              </h2>
              <p className="text-gray-400 text-sm font-normal leading-normal">
                {session?.user?.email || 'guest@synapse.io'}
              </p>
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
                      ? 'bg-primary/20 text-primary'
                      : 'text-gray-300 hover:bg-primary/10 hover:text-white'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <p className="text-sm font-medium leading-normal">{item.label}</p>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Sign Out Button */}
        <button 
          onClick={handleSignOut}
          disabled={isSigningOut}
          className="flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-gray-300 hover:bg-red-500/10 hover:text-red-400 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <LogOut className="w-5 h-5" />
          <span className="text-sm font-medium">
            {isSigningOut ? 'Signing out...' : 'Sign Out'}
          </span>
        </button>
      </div>
    </aside>
  );
}
