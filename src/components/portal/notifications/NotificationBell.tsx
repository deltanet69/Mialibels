"use client";

import React, { useState, useEffect, useRef } from "react";
import { Bell, CheckCircle2, X, ExternalLink } from "lucide-react";
import { useNotifications } from "@/hooks/useNotifications";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

function formatTimeAgo(dateStr: string): string {
  try {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Baru saja';
    if (mins < 60) return `${mins} mnt lalu`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours} jam lalu`;
    const days = Math.floor(hours / 24);
    return `${days} hari lalu`;
  } catch {
    return '';
  }
}

export function NotificationBell({ userId }: { userId: string }) {
  const { notifications, unreadCount, markAsRead } = useNotifications(userId);
  const [open, setOpen] = useState(false);
  const [toasts, setToasts] = useState<any[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!userId) return;
    const channel = supabase
      .channel(`toast_notifs_${userId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'in_app_notifications', filter: `user_id=eq.${userId}` },
        (payload) => {
          const newNotif = payload.new;
          setToasts(prev => [...prev, newNotif]);
          setTimeout(() => setToasts(prev => prev.filter(t => t.id !== newNotif.id)), 5000);
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [userId]);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2.5 rounded-xl text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition cursor-pointer"
        aria-label="Notifikasi"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white ring-2 ring-white">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-[340px] sm:w-[380px] bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150 font-sans">
          <div className="flex items-center justify-between px-4 py-3 bg-slate-50/70 border-b border-slate-100">
            <h3 className="font-bold text-sm text-slate-800">Notifikasi</h3>
            {unreadCount > 0 && (
              <span className="text-[11px] bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full font-bold">
                {unreadCount} baru
              </span>
            )}
          </div>
          
          <div className="max-h-[380px] overflow-y-auto divide-y divide-slate-50">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center text-slate-400">
                <Bell className="h-9 w-9 mb-2 opacity-30 text-slate-400" />
                <p className="text-xs">Belum ada notifikasi baru.</p>
              </div>
            ) : (
              notifications.map((notif) => (
                <div
                  key={notif.id}
                  onClick={() => !notif.is_read && markAsRead(notif.id)}
                  className={`flex flex-col gap-1 p-4 transition-colors cursor-pointer ${
                    !notif.is_read ? "bg-blue-50/40 hover:bg-blue-50/60" : "bg-white hover:bg-slate-50"
                  }`}
                >
                  <div className="flex justify-between items-start gap-3">
                    <h4 className={`text-xs sm:text-sm font-bold ${!notif.is_read ? "text-slate-900" : "text-slate-700"}`}>
                      {notif.title}
                    </h4>
                    {!notif.is_read && <span className="h-2 w-2 rounded-full bg-blue-600 mt-1.5 shrink-0" />}
                  </div>
                  <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed mt-0.5">
                    {notif.message}
                  </p>
                  
                  <div className="flex justify-between items-center mt-2 pt-1">
                    <span className="text-[10px] text-slate-400 font-medium">
                      {formatTimeAgo(notif.created_at)}
                    </span>
                    {notif.action_url && (
                      <Link 
                        href={notif.action_url} 
                        className="text-xs font-bold text-blue-600 hover:underline inline-flex items-center gap-1"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (!notif.is_read) markAsRead(notif.id);
                        }}
                      >
                        <span>Buka</span>
                        <ExternalLink size={11} />
                      </Link>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
      
      {/* Toast Popups */}
      {toasts.length > 0 && (
        <div className="fixed top-20 right-6 z-[100] flex flex-col gap-3 pointer-events-none">
          {toasts.map(toast => (
            <div key={`toast-${toast.id}`} className="bg-white rounded-2xl shadow-xl border border-slate-100 p-4 w-80 animate-in slide-in-from-right-8 fade-in duration-300 pointer-events-auto relative overflow-hidden">
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-600"></div>
              <div className="flex items-start gap-3">
                <div className="p-2 bg-blue-50 text-blue-700 rounded-xl shrink-0">
                  <Bell className="h-4 w-4 animate-pulse" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-800">{toast.title}</h4>
                  <p className="text-xs text-slate-600 mt-0.5 leading-relaxed line-clamp-2">{toast.message}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
