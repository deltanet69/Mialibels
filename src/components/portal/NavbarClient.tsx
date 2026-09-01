'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Menu, Bell, CheckCircle2, User, LogOut, Sparkles, ExternalLink, HelpCircle } from 'lucide-react';
import { useSidebar } from './SidebarProvider';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';

export function NavbarClient({ user }: { user: any }) {
  const { setIsOpen } = useSidebar();
  const router = useRouter();
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [toasts, setToasts] = useState<any[]>([]);
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

  const initials = user?.name 
    ? user.name.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase() 
    : 'U';

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
    router.refresh();
  };

  return (
    <header className="h-20 bg-white/90 backdrop-blur-md border-b border-slate-200/80 flex items-center justify-between px-4 sm:px-6 sticky top-0 z-30 print:hidden transition-all shadow-[0_1px_8px_rgba(0,0,0,0.02)]">
      <div className="flex items-center gap-3">
        <button 
          onClick={() => setIsOpen(true)}
          className="p-2 hover:bg-slate-100/80 rounded-xl md:hidden text-slate-600 transition"
          aria-label="Buka Menu"
        >
          <Menu size={24} />
        </button>

        <div className="hidden sm:flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-400">Portal</span>
          <span className="text-xs text-slate-300">/</span>
          <span className="text-xs font-bold text-blue-800 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-100">
            {user?.role ? user.role.toUpperCase() : 'ADMIN'}
          </span>
        </div>
      </div>
      
      <div className="flex items-center gap-3 sm:gap-4">
        {/* Link to Live Website */}
        <Link 
          href="https://miattaqwa15.sch.id/"
          target="_blank"
          className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-50 border border-slate-200/90 text-slate-600 hover:text-blue-700 hover:border-blue-200 text-xs font-semibold transition-all"
        >
          <span>Buka Website</span>
          <ExternalLink size={12} />
        </Link>

        {/* Help / Tour Dropdown/Button for Parent */}
        {user?.role === 'parent' && (
          <button 
             onClick={() => window.dispatchEvent(new Event('start-parent-tour'))}
             className="relative p-2.5 rounded-xl transition-all text-slate-500 hover:bg-slate-100 hover:text-blue-600"
             aria-label="Panduan"
             title="Lihat Panduan Aplikasi"
          >
             <HelpCircle size={24} />
          </button>
        )}

        {/* Notifications Dropdown */}
        <div className="relative" ref={notifRef}>
          <button 
            onClick={() => setShowNotifications(!showNotifications)}
            className={`relative p-2.5 rounded-xl transition-all ${
              showNotifications 
                ? 'bg-blue-50 text-blue-700' 
                : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'
            }`}
            aria-label="Notifikasi"
          >
            <Bell size={24} />
            <span className="absolute top-2 right-2 w-2 h-2 bg-red-600 rounded-full ring-2 ring-white"></span>
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-lg shadow-slate-900/5 border border-slate-100/90 overflow-hidden py-2 animate-in fade-in slide-in-from-top-3 duration-200 z-50">
              <div className="px-4 py-3 border-b border-slate-50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-headline font-bold text-sm text-slate-800">Notifikasi</span>
                  {notifications.length > 0 && (
                    <span className="text-[10px] bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full font-bold">
                      {notifications.length} Baru
                    </span>
                  )}
                </div>
              </div>
              <div className="max-h-[320px] overflow-y-auto divide-y divide-slate-50">
                {notifications.length === 0 ? (
                  <div className="p-8 text-center text-xs text-slate-400">
                    Belum ada notifikasi baru.
                  </div>
                ) : (
                  notifications.map((notif: any) => (
                    <button key={notif.id} className="w-full text-left px-4 py-3 hover:bg-slate-50 transition-colors flex items-start gap-3">
                      <div className="p-2 bg-blue-50 text-blue-700 rounded-xl shrink-0 mt-0.5">
                        <CheckCircle2 size={15} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-slate-800 truncate">{notif.title}</p>
                        <p className="text-xs text-slate-500 mt-0.5 line-clamp-2 leading-relaxed">{notif.message}</p>
                        <p className="text-[10px] text-slate-400 mt-1">{new Date(notif.created_at).toLocaleString('id-ID')}</p>
                      </div>
                    </button>
                  ))
                )}
              </div>
              <div className="px-4 py-2 border-t border-slate-50 text-center bg-slate-50/50">
                <button className="text-xs text-blue-700 hover:text-blue-900 font-bold">Tandai Semua Dibaca</button>
              </div>
            </div>
          )}
        </div>
        
        <div className="h-6 w-px bg-slate-200"></div>

        {/* Profile Dropdown */}
        <div className="relative" ref={profileRef}>
          <div 
            className="flex items-center gap-3 cursor-pointer hover:bg-slate-100/70 p-1.5 pr-2.5 rounded-2xl transition-all"
            onClick={() => setShowProfileMenu(!showProfileMenu)}
          >
            {user?.image ? (
              <img src={user.image} alt={user?.name || 'Admin'} className="w-8 h-8 rounded-xl object-cover shadow-2xs ring-2 ring-blue-500/20" />
            ) : (
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-600 to-[#002957] flex items-center justify-center shadow-2xs text-white font-black text-xs">
                {initials}
              </div>
            )}
            <div className="hidden sm:block text-left">
              <p className="text-xs font-bold text-slate-800 leading-tight truncate max-w-[120px]">{user?.name || 'Admin'}</p>
              <p className="text-[10px] text-slate-400 capitalize font-medium">{user?.role?.toLowerCase() || 'Administrator'}</p>
            </div>
          </div>

          {showProfileMenu && (
            <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-lg shadow-slate-900/5 border border-slate-100/90 overflow-hidden py-2 animate-in fade-in slide-in-from-top-3 duration-200 z-50">
              <div className="px-4 py-3 border-b border-slate-50 mb-1">
                <p className="text-xs font-bold text-slate-800 truncate">{user?.name || 'Admin'}</p>
                <p className="text-[11px] text-slate-400 truncate">{user?.email || 'admin@miattaqwa15.sch.id'}</p>
              </div>
              <div className="px-2 space-y-0.5">
                <Link 
                  href="/profile"
                  onClick={() => setShowProfileMenu(false)}
                  className="flex items-center gap-2.5 w-full text-left px-3 py-2 hover:bg-slate-50 rounded-xl transition text-xs font-medium text-slate-700"
                >
                  <User size={15} className="text-slate-400" />
                  <span>Profil Saya</span>
                </Link>
                <button 
                  onClick={handleLogout}
                  className="flex items-center gap-2.5 w-full text-left px-3 py-2 hover:bg-rose-50 rounded-xl transition text-xs font-semibold text-rose-600"
                >
                  <LogOut size={15} />
                  <span>Keluar Akun</span>
                </button>
              </div>
            </div>
          )}
        </div>

        <button
          onClick={handleLogout}
          title="Keluar dari Akun"
          className="p-2 rounded-xl text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
        >
          <LogOut size={18} />
        </button>
      </div>

      {/* Push Notifications Toasts */}
      {toasts.length > 0 && (
        <div className="fixed top-20 right-6 z-[100] flex flex-col gap-3 pointer-events-none">
          {toasts.map(toast => (
            <div key={`toast-${toast.id}`} className="bg-white rounded-2xl shadow-xl border border-slate-100 p-4 w-80 animate-in slide-in-from-right-8 fade-in duration-300 pointer-events-auto relative overflow-hidden">
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500"></div>
              <div className="flex items-start gap-3">
                <div className="p-2 bg-blue-50 text-blue-700 rounded-xl shrink-0">
                  <Bell size={16} className="animate-pulse" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-800">{toast.title}</h4>
                  <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">{toast.message}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </header>
  );
}
