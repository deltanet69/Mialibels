import React from 'react';
import { supabase } from '@/lib/supabase';
import { getSession } from '@/lib/session';
import { DashboardCards } from '@/components/portal/dashboard/DashboardCards';
import { AttendanceChart } from '@/components/portal/dashboard/AttendanceChart';
import { TransactionsTable } from '@/components/portal/dashboard/TransactionsTable';
import { GuruDashboard } from '@/components/portal/dashboard/GuruDashboard';
import { Sparkles } from 'lucide-react';

export const dynamic = 'force-dynamic';

// Timeout wrapper — prevents any single slow Supabase query from hanging the page forever
function withTimeout<T>(promise: Promise<T> | PromiseLike<T>, ms = 5000): Promise<T> {
  return Promise.race([
    Promise.resolve(promise),
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error('Query timeout')), ms))
  ]);
}

// Safe fetch — returns fallback if query fails or times out
async function safeQuery<T>(promise: PromiseLike<any> | any, fallback: T): Promise<{ data: T; count: number }> {
  try {
    const result: any = await withTimeout(promise);
    return { data: result?.data ?? fallback, count: result?.count ?? 0 };
  } catch {
    return { data: fallback, count: 0 };
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
      {/* Welcome Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white/70 backdrop-blur-md p-6 sm:p-7 rounded-[2rem] border border-slate-200/70 shadow-sm">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-50 border border-teal-100 text-primary-dark font-body text-xs font-bold uppercase tracking-wider mb-2">
            <Sparkles className="w-3 h-3 text-accent" />
            <span>Pusat Kendali Administrasi</span>
          </div>
          <h1 className="font-headline font-black text-2xl sm:text-3xl text-secondary tracking-tight">
            Selamat Datang, {user?.name || 'Admin'} 👋
          </h1>
          <p className="font-body text-gray-500 text-xs sm:text-sm mt-1">
            Ringkasan data operasional madrasah, presensi, dan keuangan terkini MI Attaqwa 15.
          </p>
        </div>
      </div>

      {/* Top Stats Row */}
      <DashboardCards stats={stats} attendanceRates={attendanceRates} />

      {/* Bottom Section - Full Width Stacked */}
      <div className="flex flex-col gap-6">
        {/* Attendance Chart */}
        <div className="w-full">
          <AttendanceChart />
        </div>

        {/* Transactions Table */}
        <div className="w-full">
          <TransactionsTable transactions={transactions || []} />
        </div>
      </div>
    </div>
  );
}

