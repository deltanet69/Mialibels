'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  Home, 
  UserCircle, 
  ClipboardCheck, 
  CreditCard, 
  PiggyBank, 
  LogOut,
  Hexagon
} from 'lucide-react';

export function ParentSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const isActive = (path: string) => pathname === path || pathname.startsWith(path + '/');

  const navItems = [
    { label: 'Beranda', href: '/parent/dashboard', icon: Home, exact: true },
    { label: 'Profil Anak', href: '/parent/dashboard/profile', icon: UserCircle },
    { label: 'Kehadiran & Kegiatan', href: '/parent/dashboard/attendance', icon: ClipboardCheck },
    { label: 'Tagihan SPP', href: '/parent/dashboard/spp', icon: CreditCard },
    { label: 'Tabungan Siswa', href: '/parent/dashboard/savings', icon: PiggyBank },
  ];

  const handleLogout = async () => {
    setIsLoggingOut(true);
    await fetch('/api/auth/logout', { method: 'POST' }); // Wait, is there a specific logout for parents? Reusing admin logout is fine if it clears all cookies or we can clear parent_session
    // Let's call a specific parent logout or just clear the cookie on client side if we don't have one
    document.cookie = 'parent_session=; Max-Age=0; path=/';
    router.push('/parent/login');
  };

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 bg-white border-r border-slate-100 min-h-screen p-4 flex-col gap-6 justify-between fixed lg:sticky top-0 h-screen z-40">
        <div className="flex flex-col gap-6">
          {/* Brand */}
          <div className="flex items-center gap-2 mb-2 px-2">
            <div className="bg-[#002957] text-white p-1.5 rounded-lg">
              <Hexagon size={24} className="fill-current" />
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-bold text-[#002957] leading-tight">MI Attaqwa 15</span>
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Portal Wali Murid</span>
            </div>
          </div>
          
          {/* Navigation */}
          <nav className="flex flex-col gap-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = item.exact ? pathname === item.href : isActive(item.href);
              
              return (
                <Link 
                  key={item.href} 
                  href={item.href} 
                  className={`flex items-center gap-3 px-3 py-3 rounded-xl transition font-medium ${
                    active 
                      ? 'bg-[#002957] text-white shadow-md' 
                      : 'text-slate-500 hover:bg-slate-50 hover:text-[#002957]'
                  }`}
                >
                  <Icon size={20} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Logout button */}
        <div className="border-t border-slate-100 pt-4 mt-auto">
          <button 
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="flex items-center gap-3 px-3 py-3 rounded-xl text-red-600 hover:bg-red-50 transition w-full text-left font-medium"
          >
            <LogOut size={20} />
            <span>{isLoggingOut ? 'Keluar...' : 'Keluar'}</span>
          </button>
        </div>
      </aside>

      {/* Mobile Bottom Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 px-2 py-2 flex items-center justify-around pb-safe">
        {navItems.slice(0, 4).map((item) => {
          const Icon = item.icon;
          const active = item.exact ? pathname === item.href : isActive(item.href);
          
          return (
            <Link 
              key={item.href} 
              href={item.href} 
              className={`flex flex-col items-center justify-center p-2 rounded-xl min-w-[4rem] transition-colors ${
                active ? 'text-[#002957]' : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <Icon size={20} className={active ? 'mb-1' : 'mb-1 opacity-70'} />
              <span className={`text-[10px] font-bold ${active ? 'opacity-100' : 'opacity-70'}`}>
                {item.label.split(' ')[0]} {/* Shorten label for mobile */}
              </span>
            </Link>
          );
        })}
      </div>
    </>
  );
}
