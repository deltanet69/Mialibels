'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Menu, Bell, CheckCircle2, DollarSign, User, LogOut } from 'lucide-react';
import { useSidebar } from './SidebarProvider';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';

export function NavbarClient({ user }: { user: any }) {
  const { setIsOpen } = useSidebar();
  const router = useRouter();
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setShowProfileMenu(false);
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

    // Setup Realtime for Notifications
    const notifChannel = supabase
      .channel('admin-notifications-navbar')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `role=eq.admin`
        },
        (payload) => {
          const newNotif = payload.new;
          setNotifications((prev) => [newNotif, ...prev]);
          setToasts((prev) => [...prev, newNotif]);
          
          setTimeout(() => {
            setToasts((prev) => prev.filter(t => t.id !== newNotif.id));
          }, 5000);
        }
      )
      .subscribe();
    
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      supabase.removeChannel(notifChannel);
    };
  }, []);

  const [toasts, setToasts] = useState<any[]>([]);

  const initials = user?.name 
    ? user.name.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase() 
    : 'U';

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
    router.refresh();
  };

  return (
    <header className="h-16 bg-white/80 backdrop-blur-md border-b border-slate-100 flex items-center justify-between px-6 sticky top-0 z-30 print:hidden">
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
              <div className="px-4 py-2 border-t border-slate-50 text-center">
                <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">Tandai Semua Dibaca</button>
              </div>
            </div>
          )}
        </div>
        
        <div className="h-8 w-px bg-slate-200"></div>

        <div className="relative" ref={profileRef}>
          <div 
            className="flex items-center gap-3 cursor-pointer hover:bg-slate-50 p-1.5 rounded-xl transition"
            onClick={() => setShowProfileMenu(!showProfileMenu)}
          >
            <div className="hidden sm:block text-right">
              <p className="text-sm font-semibold text-slate-800 leading-tight">{user?.name || 'Admin'}</p>
              <p className="text-xs text-slate-500 capitalize">{user?.role?.toLowerCase() || 'Administrator'}</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center overflow-hidden shadow-sm text-white font-bold text-sm">
              {initials}
            </div>
          </div>

          {showProfileMenu && (
            <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden py-2 animate-in fade-in slide-in-from-top-4 duration-200">
              <div className="px-4 py-3 border-b border-slate-50 mb-1">
                <p className="text-sm font-bold text-slate-800">{user?.name || 'Admin'}</p>
                <p className="text-xs text-slate-500 truncate">{user?.email || 'admin@miattaqwa15.sch.id'}</p>
              </div>
              <div className="px-2">
                <Link 
                  href="/profile"
                  onClick={() => setShowProfileMenu(false)}
                  className="flex items-center gap-3 w-full text-left px-3 py-2.5 hover:bg-slate-50 rounded-xl transition text-sm font-medium text-slate-700"
                >
                  <User size={18} className="text-slate-400" />
                  Profil Saya
                </Link>
                <button 
                  onClick={handleLogout}
                  className="flex items-center gap-3 w-full text-left px-3 py-2.5 hover:bg-red-50 rounded-xl transition text-sm font-medium text-red-600 mt-1"
                >
                  <LogOut size={18} />
                  Keluar
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Push Notifications Toasts */}
      {toasts.length > 0 && (
        <div className="fixed top-20 right-6 z-[100] flex flex-col gap-3 pointer-events-none">
          {toasts.map(toast => (
            <div key={`toast-${toast.id}`} className="bg-white rounded-xl shadow-2xl border border-slate-100 p-4 w-80 animate-in slide-in-from-right-8 fade-in duration-300 pointer-events-auto relative overflow-hidden">
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500"></div>
              <div className="flex items-start gap-3">
                <div className="p-2 bg-blue-50 text-blue-600 rounded-xl shrink-0">
                  <Bell size={18} className="animate-pulse" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-800">{toast.title}</h4>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">{toast.message}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </header>
  );
}
