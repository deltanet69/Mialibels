import React from 'react';
import { supabase } from '@/lib/supabase';
import { getSession } from '@/lib/session';
import { DashboardCards } from '@/components/portal/dashboard/DashboardCards';
import { AttendanceChart } from '@/components/portal/dashboard/AttendanceChart';
import { TransactionsTable } from '@/components/portal/dashboard/TransactionsTable';
import { GuruDashboard } from '@/components/portal/dashboard/GuruDashboard';

export const dynamic = 'force-dynamic';

// Timeout wrapper — prevents any single slow Supabase query from hanging the page forever
function withTimeout<T>(promise: Promise<T>, ms = 5000): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error('Query timeout')), ms))
  ])
}

// Safe fetch — returns fallback if query fails or times out
async function safeQuery<T>(promise: Promise<{ data: T | null; count: number | null }>, fallback: T): Promise<{ data: T; count: number }> {
  try {
    const result = await withTimeout(promise)
    return { data: result.data ?? fallback, count: result.count ?? 0 }
  } catch {
    return { data: fallback, count: 0 }
  }
}

export default async function AdminDashboardPage() {
  const user = await getSession().catch(() => null);

  const isGuru = user?.role?.toLowerCase().includes('guru');
  if (isGuru) {
    return <GuruDashboard user={user} />;
  }

  const todayStr = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta' });

  // All 8 queries run in parallel — each has a 5s timeout so page never hangs
  const [
    { count: totalStudents },
    { count: activeStudents },
    { count: inactiveStudents },
    { count: totalStaffs },
    { count: activeStaffs },
    { data: transactions },
    { count: studentHadir },
    { count: staffHadir }
  ] = await Promise.all([
    safeQuery(supabase.from('students').select('*', { count: 'exact', head: true }), null),
    safeQuery(supabase.from('students').select('*', { count: 'exact', head: true }).eq('is_active', true), null),
    safeQuery(supabase.from('students').select('*', { count: 'exact', head: true }).eq('is_active', false), null),
    safeQuery(supabase.from('staffs').select('*', { count: 'exact', head: true }), null),
    safeQuery(supabase.from('staffs').select('*', { count: 'exact', head: true }).eq('is_active', true), null),
    safeQuery(supabase.from('spp_transactions').select('*, admins(name), students(name, class), spp_invoices(title, month, year)').order('created_at', { ascending: false }).limit(5), [] as any[]),
    safeQuery(supabase.from('classroom_attendances').select('*', { count: 'exact', head: true }).eq('date', todayStr).ilike('status', '%hadir%'), null),
    safeQuery(supabase.from('staff_attendance').select('*', { count: 'exact', head: true }).eq('date', todayStr).ilike('status', '%hadir%'), null),
  ]);

  const stats = {
    students: {
      total: totalStudents || 0,
      active: activeStudents || 0,
      inactive: inactiveStudents || 0
    },
    staffs: {
      total: totalStaffs || 0,
      active: activeStaffs || 0
    }
  };

  const attendanceRates = {
    student: activeStudents ? Math.round(((studentHadir || 0) / activeStudents) * 100) : 0,
    staff: activeStaffs ? Math.round(((staffHadir || 0) / activeStaffs) * 100) : 0
  };

  return (
    <div className="space-y-6 w-full pb-10">
      {/* Welcome Message */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
          Hello {user?.name || 'Admin'}, <span className="text-2xl">👋</span>
        </h1>
        <p className="text-slate-500 mt-1">
          selamat datang di Admin portal Mialibels.
        </p>
      </div>

      {/* Top Stats Row */}
      <DashboardCards stats={stats} attendanceRates={attendanceRates} />

      {/* Bottom Section - Full Width Stacked */}
      <div className="flex flex-col gap-6 mt-6">
        {/* Attendance Chart (Full Width) */}
        <div className="w-full">
          <AttendanceChart />
        </div>

        {/* Transactions (Full Width) */}
        <div className="w-full">
          <TransactionsTable transactions={transactions || []} />
        </div>
      </div>
    </div>
  );
}

