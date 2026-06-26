'use client';

import React from 'react';
import { Menu, Bell } from 'lucide-react';
import { useSidebar } from './SidebarProvider';

export function Navbar() {
  const { setIsOpen } = useSidebar();

  return (
    <header className="h-16 bg-transparent flex items-center justify-between px-6 sticky top-0 z-10">
      <div className="flex items-center gap-4">
        <button 
          onClick={() => setIsOpen(true)}
          className="p-2 hover:bg-slate-200/50 rounded-full md:hidden text-slate-500 transition"
        >
          <Menu size={20} />
        </button>
      </div>
      
      <div className="flex items-center gap-6">
        <button className="relative text-slate-500 hover:text-blue-600 transition">
          <Bell size={20} />
          <span className="absolute -top-1 -right-1 w-2 h-2 bg-blue-600 rounded-full border-2 border-slate-50"></span>
        </button>
        
        <button className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-5 py-2 rounded-lg transition shadow-sm hidden sm:block">
          Download Free
        </button>
        
        <div className="w-10 h-10 rounded-full border-2 border-blue-100 flex items-center justify-center overflow-hidden cursor-pointer">
          <div className="w-full h-full bg-blue-50 flex items-center justify-center text-blue-600 font-semibold">
            A
          </div>
        </div>
      </div>
    </header>
  );
}
