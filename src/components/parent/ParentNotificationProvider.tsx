'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase/client';

export interface AppNotification {
  id: string;
  type: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
  action_url?: string;
  source?: 'in_app' | 'attendance'; // distinguish origin
}

export interface LatestScan {
  status: string;
  entry_time: string;
  date: string;
  scannedAt: number; // Date.now() timestamp for auto-dismiss
}

interface ParentNotificationContextType {
  notifications: AppNotification[];
  unreadCount: number;
  unpaidBillsCount: number;
  latestScan: LatestScan | null;
  markAsRead: (id: string) => void;
}

const ParentNotificationContext = createContext<ParentNotificationContextType | undefined>(undefined);

export function ParentNotificationProvider({
  children,
  studentId,
  studentName,
}: {
  children: React.ReactNode;
  studentId: string;
  studentName?: string;
}) {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unpaidBillsCount, setUnpaidBillsCount] = useState(0);
  const [latestScan, setLatestScan] = useState<LatestScan | null>(null);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const markAsRead = useCallback((id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
    );
    // Fire and forget - update in DB
    fetch('/api/notification/in-app', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    }).catch(() => {});
  }, []);

  // Initial fetch
  useEffect(() => {
    if (!studentId) return;

    const fetchAll = async () => {
      try {
        const res = await fetch('/api/notification/in-app');
        const data = await res.json();
        if (data.success && data.notifications) {
          setNotifications(
            data.notifications.map((n: any) => ({ ...n, source: 'in_app' as const }))
          );
        }
      } catch {}
    };

    const fetchUnpaid = async () => {
      try {
        const [sppRes, generalRes] = await Promise.all([
          supabase
            .from('spp_invoices')
            .select('id', { count: 'exact', head: true })
            .eq('student_id', studentId)
            .in('status', ['UNPAID', 'LATE', 'PARTIAL']),
          supabase
            .from('general_invoices')
            .select('id', { count: 'exact', head: true })
            .eq('student_id', studentId)
            .in('status', ['UNPAID', 'PARTIAL', 'PENDING_VERIFICATION']),
        ]);
        setUnpaidBillsCount((sppRes.count || 0) + (generalRes.count || 0));
      } catch {}
    };

    fetchAll();
    fetchUnpaid();

    // ── Realtime: in_app_notifications ──
    const notifChannel = supabase
      .channel(`in_app_notif_${studentId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'in_app_notifications', filter: `user_id=eq.${studentId}` },
        (payload) => {
          const n = payload.new as any;
          setNotifications((prev) => [{ ...n, source: 'in_app' as const }, ...prev]);
        }
      )
      .subscribe();

    // ── Realtime: student_attendances (RFID scan) ──
    const attendanceChannel = supabase
      .channel(`student_att_${studentId}`)
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to both INSERT and UPDATE
          schema: 'public',
          table: 'student_attendances',
          filter: `student_id=eq.${studentId}`,
        },
        (payload) => {
          const rec = payload.new as any;
          if (!rec?.entry_time) return; // Ignore if no entry time yet

          setLatestScan({
            status: rec.status || 'Hadir',
            entry_time: rec.entry_time,
            date: rec.date,
            scannedAt: Date.now(),
          });

          const syntheticId = `att_${rec.id || Date.now()}`;
          const timeLabel = rec.entry_time?.substring(0, 5) || '';
          const statusLabel = (rec.status || '').toLowerCase() === 'terlambat' ? 'Terlambat' : 'Tepat Waktu';
          
          setNotifications((prev) => {
            // Avoid duplicate synthetic notifications if UPDATE fires multiple times
            if (prev.some(n => n.id === syntheticId)) return prev;
            return [
              {
                id: syntheticId,
                type: 'ATTENDANCE',
                title: 'Kehadiran Terkonfirmasi',
                message: `${studentName || 'Siswa'} absen masuk [${statusLabel}] pukul ${timeLabel} WIB`,
                is_read: false,
                created_at: new Date().toISOString(),
                source: 'attendance' as const,
              },
              ...prev,
            ];
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(notifChannel);
      supabase.removeChannel(attendanceChannel);
    };
  }, [studentId, studentName]);

  return (
    <ParentNotificationContext.Provider
      value={{ notifications, unreadCount, unpaidBillsCount, latestScan, markAsRead }}
    >
      {children}
    </ParentNotificationContext.Provider>
  );
}

export function useParentNotifications() {
  const ctx = useContext(ParentNotificationContext);
  if (!ctx) throw new Error('useParentNotifications must be used within ParentNotificationProvider');
  return ctx;
}
