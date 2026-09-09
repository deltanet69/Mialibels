"use client";

import { useState } from "react";
import { Bell } from "lucide-react";
import { useNotifications } from "@/hooks/useNotifications";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatDistanceToNow } from "date-fns";
import { id } from "date-fns/locale";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase/client";

export function NotificationBell({ userId }: { userId: string }) {
  const { notifications, unreadCount, markAsRead } = useNotifications(userId);
  const [open, setOpen] = useState(false);
  const [toasts, setToasts] = useState<any[]>([]);

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
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative text-muted-foreground hover:text-foreground transition-colors">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white shadow-[0_0_0_2px_hsl(var(--background))] animate-in zoom-in">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[380px] p-0 rounded-xl shadow-lg border-muted/50 overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 bg-muted/30 border-b border-border/50">
          <h3 className="font-semibold text-sm">Notifikasi</h3>
          {unreadCount > 0 && (
            <span className="text-xs text-muted-foreground bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">
              {unreadCount} baru
            </span>
          )}
        </div>
        
        <ScrollArea className="h-[400px]">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full py-12 text-center text-muted-foreground">
              <Bell className="h-10 w-10 mb-3 opacity-20" />
              <p className="text-sm">Belum ada notifikasi.</p>
            </div>
          ) : (
            <div className="flex flex-col">
              {notifications.map((notif) => (
                <div
                  key={notif.id}
                  onClick={() => !notif.is_read && markAsRead(notif.id)}
                  className={cn(
                    "flex flex-col gap-1 p-4 border-b border-border/50 transition-colors cursor-pointer",
                    !notif.is_read ? "bg-primary/[0.03] hover:bg-primary/[0.05]" : "bg-transparent hover:bg-muted/40"
                  )}
                >
                  <div className="flex justify-between items-start gap-4">
                    <h4 className={cn("text-sm font-semibold", !notif.is_read && "text-foreground")}>
                      {notif.title}
                    </h4>
                    {!notif.is_read && <span className="h-2 w-2 rounded-full bg-primary mt-1.5 flex-shrink-0" />}
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                    {notif.message}
                  </p>
                  
                  <div className="flex justify-between items-center mt-2">
                    <span className="text-[10px] text-muted-foreground/70 font-medium uppercase tracking-wider">
                      {formatDistanceToNow(new Date(notif.created_at), { addSuffix: true, locale: id })}
                    </span>
                    {notif.action_url && (
                      <Link 
                        href={notif.action_url} 
                        className="text-xs font-medium text-primary hover:underline"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (!notif.is_read) markAsRead(notif.id);
                        }}
                      >
                        Lihat Detail
                      </Link>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
      
      {/* Toast Popups */}
      {toasts.length > 0 && (
        <div className="fixed top-20 right-6 z-[100] flex flex-col gap-3 pointer-events-none">
          {toasts.map(toast => (
            <div key={`toast-${toast.id}`} className="bg-white rounded-2xl shadow-xl border border-border/50 p-4 w-80 animate-in slide-in-from-right-8 fade-in duration-300 pointer-events-auto relative overflow-hidden">
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary"></div>
              <div className="flex items-start gap-3">
                <div className="p-2 bg-primary/10 text-primary rounded-xl shrink-0">
                  <Bell className="h-4 w-4 animate-pulse" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-foreground">{toast.title}</h4>
                  <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed line-clamp-2">{toast.message}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </Popover>
  );
}
