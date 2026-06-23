'use client';

import React from 'react';
import { Bell, UserCircle, Menu } from 'lucide-react';
import { usePathname } from 'next/navigation';

export function ParentNavbar() {
  const pathname = usePathname();

  const getPageTitle = () => {
    if (pathname === '/parent/dashboard') return 'Beranda Utama';
    if (pathname.includes('/profile')) return 'Profil Anak';
    if (pathname.includes('/attendance')) return 'Kehadiran & Kegiatan';
    if (pathname.includes('/spp')) return 'Tagihan SPP';
    if (pathname.includes('/savings')) return 'Tabungan Siswa';
    return 'Portal Wali Murid';
  };

  return (
    <header className="h-16 md:h-20 bg-white border-b border-slate-100 flex items-center justify-between px-4 md:px-8 sticky top-0 z-30">
      
      {/* Mobile Title & Menu */}
      <div className="flex items-center gap-3 md:hidden">
        <h1 className="font-headline font-bold text-lg text-slate-800">{getPageTitle()}</h1>
      </div>

      {/* Desktop Title */}
      <div className="hidden md:block">
        <h1 className="font-headline font-black text-2xl text-slate-800">{getPageTitle()}</h1>
        <p className="text-sm text-slate-500 font-medium mt-0.5">Pantau aktivitas dan tagihan anak dengan mudah.</p>
      </div>

      {/* Right Side Icons */}
      <div className="flex items-center gap-2 md:gap-4">
        <button className="w-10 h-10 rounded-full hover:bg-slate-50 flex items-center justify-center text-slate-600 transition relative">
          <Bell size={20} />
          <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
        </button>
        
        <div className="hidden md:flex items-center gap-3 pl-4 border-l border-slate-200">
          <div className="text-right">
            <p className="text-sm font-bold text-slate-800">Wali Murid</p>
            <p className="text-xs text-slate-500">Tahun Ajaran 2026/2027</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
            <UserCircle size={24} />
          </div>
        </div>
      </div>
    </header>
  );
}
