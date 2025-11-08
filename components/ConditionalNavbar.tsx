'use client';

import { usePathname } from 'next/navigation';
import { Navbar } from './Navbar';

export function ConditionalNavbar() {
  const pathname = usePathname();
  
  // Only show navbar on the landing page
  if (pathname === '/') {
    return <Navbar />;
  }
  
  return null;
}
