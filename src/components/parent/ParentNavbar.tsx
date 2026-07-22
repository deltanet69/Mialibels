'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Bell, Menu, CheckCircle2, DollarSign } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { useParentSidebar } from './ParentSidebarProvider';

export function ParentNavbar({ studentName, parentName }: { studentName?: string; parentName?: string }) {
  const { setIsOpen } = useParentSidebar();
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const notifRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    
    // Fetch notifications
    const fetchNotifs = async () => {
      try {
        const res = await fetch('/api/notifications');
        const data = await res.json();
        if (data.success) {
          setNotifications(data.data);
        }
      } catch (err) {}
    };
    fetchNotifs();
    
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const initials = parentName
    ? parentName.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase()
    : 'WM';

  return (
    <header className="h-16 bg-white/80 backdrop-blur-md border-b border-slate-100 flex items-center justify-between px-6 sticky top-0 z-30 shrink-0">
      <div className="flex items-center gap-4">
        <button 
          onClick={() => setIsOpen(true)}
          className="p-2 hover:bg-slate-100 rounded-xl md:hidden text-slate-500 transition"
        >
          <Menu size={20} />
        </button>
      </div>
      
      <div className="flex items-center gap-5">
        <div className="relative" ref={notifRef}>
          <button 
            onClick={() => setShowNotifications(!showNotifications)}
            className={`relative p-2 rounded-xl transition ${showNotifications ? 'bg-blue-50 text-blue-600' : 'text-slate-500 hover:bg-slate-100'}`}
          >
            <Bell size={20} />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full border-2 border-white"></span>
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden py-2 animate-in fade-in slide-in-from-top-4 duration-200">
              <div className="px-4 py-2 border-b border-slate-50 flex items-center justify-between">
                <span className="font-semibold text-slate-800">Notifikasi</span>
                {notifications.length > 0 && (
                  <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">{notifications.length} Baru</span>
                )}
              </div>
              <div className="max-h-[300px] overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="p-4 text-center text-sm text-slate-500">Tidak ada notifikasi</div>
                ) : (
                  notifications.map((notif: any) => (
                    <button key={notif.id} className="w-full text-left px-4 py-3 hover:bg-slate-50 transition flex items-start gap-3 border-b border-slate-50 last:border-0">
                      <div className="p-2 bg-blue-50 text-blue-600 rounded-xl shrink-0">
                        <CheckCircle2 size={16} />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-800">{notif.title}</p>
                        <p className="text-xs text-slate-500 mt-0.5">{notif.message}</p>
                        <p className="text-[10px] text-slate-400 mt-1">{new Date(notif.created_at).toLocaleString('id-ID')}</p>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
        
        <div className="h-8 w-px bg-slate-200"></div>

        <div className="flex items-center gap-3">
          <div className="hidden sm:block text-right">
            <p className="text-sm font-semibold text-slate-800 leading-tight">{parentName || 'Wali Murid'}</p>
            <p className="text-xs text-slate-500 capitalize">{studentName || 'Portal Orang Tua'}</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center overflow-hidden cursor-pointer shadow-sm text-white font-bold text-sm">
            {initials}
          </div>
        </div>
      </div>
    </header>
  );
}
