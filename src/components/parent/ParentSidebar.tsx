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
  Receipt,
  X,
  Sparkles
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
    const active = isActive(path);
    return `flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs font-bold transition-all active:scale-95 ${
      active
        ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/25'
        : 'text-slate-600 hover:bg-slate-50 hover:text-blue-700'
    }`;
  };

  return (
    <>
      {/* Overlay for mobile */}
      <div 
        className={`fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-40 md:hidden transition-opacity duration-300 ${
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setIsOpen(false)}
        aria-hidden="true"
      />

      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-slate-100 p-5 flex flex-col gap-6 justify-between overflow-y-auto transform transition-transform duration-300 ease-in-out md:translate-x-0 md:static md:inset-auto ${
        isOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'
      }`}>
        <div className="flex flex-col gap-6">
          {/* Brand */}
          <div className="flex items-center justify-between px-1 sticky top-0 bg-white z-10">
            <Link href="/parent/dashboard" className="flex items-center gap-2">
              <Image 
                src="/logosmart/smartlogover.png" 
                alt="Logo MI Attaqwa 15" 
                width={140} 
                height={140} 
                className="object-contain"
                priority
              />
            </Link>
            <button 
              onClick={() => setIsOpen(false)}
              className="md:hidden p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition"
            >
              <X size={18} />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex flex-col gap-6 flex-grow">
            <div>
              <h4 className="text-[11px] font-black uppercase tracking-wider text-slate-400 mb-2.5 px-3">
                MENU UTAMA
              </h4>
              <div className="flex flex-col gap-1">
                <Link href="/parent/dashboard" className={linkClass('/parent/dashboard')} onClick={() => setIsOpen(false)}>
                  <LayoutDashboard size={17} /> <span>Dashboard</span>
                </Link>
                <Link href="/parent/dashboard/profile" className={linkClass('/parent/dashboard/profile')} onClick={() => setIsOpen(false)}>
                  <UserCircle size={17} /> <span>Profil Anak</span>
                </Link>
                <Link href="/parent/dashboard/attendance" className={linkClass('/parent/dashboard/attendance')} onClick={() => setIsOpen(false)}>
                  <ClipboardCheck size={17} /> <span>Kehadiran</span>
                </Link>
              </div>
            </div>

            <div>
              <h4 className="text-[11px] font-black uppercase tracking-wider text-slate-400 mb-2.5 px-3">
                ADMINISTRASI & KEUANGAN
              </h4>
              <div className="flex flex-col gap-1">
                <Link href="/parent/dashboard/spp" className={linkClass('/parent/dashboard/spp')} onClick={() => setIsOpen(false)}>
                  <CreditCard size={17} /> <span>Tagihan SPP</span>
                </Link>
                <Link href="/parent/dashboard/general" className={linkClass('/parent/dashboard/general')} onClick={() => setIsOpen(false)}>
                  <Receipt size={17} /> <span>Tagihan Umum</span>
                </Link>
                <Link href="/parent/dashboard/savings" className={linkClass('/parent/dashboard/savings')} onClick={() => setIsOpen(false)}>
                  <PiggyBank size={17} /> <span>Tabungan Siswa</span>
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
            className="flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-rose-600 hover:bg-rose-50 hover:text-rose-700 transition w-full text-left text-xs font-bold cursor-pointer disabled:opacity-50"
          >
            <LogOut size={17} />
            <span>{isLoggingOut ? 'Keluar...' : 'Keluar dari Akun'}</span>
          </button>
        </div>
      </aside>
    </>
  );
}
