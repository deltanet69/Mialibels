'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { 
  LayoutDashboard, 
  UserCircle, 
  ClipboardCheck, 
  CreditCard, 
  PiggyBank, 
  LogOut,
  X
} from 'lucide-react';
import { useParentSidebar } from './ParentSidebarProvider';

export function ParentSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { isOpen, setIsOpen } = useParentSidebar();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    document.cookie = 'parent_session=; Max-Age=0; path=/';
    router.push('/parent/login');
  };

  const isActive = (path: string) => {
    if (path === '/parent/dashboard') {
      return pathname === path;
    }
    return pathname === path || pathname.startsWith(path + '/');
  };

  const linkClass = (path: string) => {
    return `flex items-center gap-3 px-3 py-2.5 rounded-xl transition ${isActive(path)
        ? 'bg-blue-600 text-white shadow-sm'
        : 'text-slate-600 hover:bg-slate-50 hover:text-blue-600'
      }`;
  };

  return (
    <>
      {/* Overlay for mobile */}
      <div 
        className={`fixed inset-0 bg-black/50 z-40 md:hidden transition-opacity duration-300 ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        onClick={() => setIsOpen(false)}
        aria-hidden="true"
      />

      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-slate-100 p-4 flex flex-col gap-6 justify-between overflow-y-auto transform transition-transform duration-300 ease-in-out md:translate-x-0 md:static md:inset-auto ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex flex-col gap-6">
          {/* Brand */}
          <div className="flex items-center justify-between mb-2 px-2 sticky top-0 bg-white py-2 z-10">
            <Link href="/parent/dashboard" className="flex items-center gap-2">
              <Image 
                src="/logomi.png" 
                alt="Logo MI Attaqwa 15" 
                width={140} 
                height={140} 
                className="object-contain"
                priority
              />
            </Link>
            <button 
              onClick={() => setIsOpen(false)}
              className="md:hidden p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-lg transition"
            >
              <X size={20} />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex flex-col gap-6 flex-grow">
            <div>
              <h4 className="text-xs font-semibold text-slate-400 mb-3 px-2">MAIN</h4>
              <div className="flex flex-col gap-1">
                <Link href="/parent/dashboard" className={linkClass('/parent/dashboard')} onClick={() => setIsOpen(false)}>
                  <LayoutDashboard size={20} /> <span className="font-medium">Dashboard</span>
                </Link>
                <Link href="/parent/dashboard/profile" className={linkClass('/parent/dashboard/profile')} onClick={() => setIsOpen(false)}>
                  <UserCircle size={20} /> <span className="font-medium">Profil Anak</span>
                </Link>
                <Link href="/parent/dashboard/attendance" className={linkClass('/parent/dashboard/attendance')} onClick={() => setIsOpen(false)}>
                  <ClipboardCheck size={20} /> <span className="font-medium">Kehadiran</span>
                </Link>
              </div>
            </div>

            <div>
              <h4 className="text-xs font-semibold text-slate-400 mb-3 px-2">FINANCE</h4>
              <div className="flex flex-col gap-1">
                <Link href="/parent/dashboard/spp" className={linkClass('/parent/dashboard/spp')} onClick={() => setIsOpen(false)}>
                  <CreditCard size={20} /> <span className="font-medium">Tagihan SPP</span>
                </Link>
                <Link href="/parent/dashboard/general" className={linkClass('/parent/dashboard/general')} onClick={() => setIsOpen(false)}>
                  <CreditCard size={20} /> <span className="font-medium">Tagihan Umum</span>
                </Link>
                <Link href="/parent/dashboard/savings" className={linkClass('/parent/dashboard/savings')} onClick={() => setIsOpen(false)}>
                  <PiggyBank size={20} /> <span className="font-medium">Tabungan Siswa</span>
                </Link>
              </div>
            </div>
          </nav>
        </div>

        {/* Logout button at the bottom */}
        <div className="border-t border-slate-100 pt-4 mt-auto">
          <button
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-red-600 hover:bg-red-50 transition w-full text-left font-medium"
          >
            <LogOut size={20} />
            <span>{isLoggingOut ? 'Keluar...' : 'Keluar'}</span>
          </button>
        </div>
      </aside>
    </>
  );
}
