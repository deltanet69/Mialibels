import React from 'react';
import { supabase } from '@/lib/supabase';
import { getSession } from '@/lib/session';
import { DashboardCards } from '@/components/portal/dashboard/DashboardCards';
import { AttendanceChart } from '@/components/portal/dashboard/AttendanceChart';
import { TransactionsTable } from '@/components/portal/dashboard/TransactionsTable';

export default async function AdminDashboardPage() {
  const user = await getSession();

  // Get today's date string (local timezone approximation)
  // To avoid UTC offset issues, we format based on Indonesia timezone if possible
  // For simplicity on edge/server, we just use ISO string prefix.
  const todayStr = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta' });

  // Parallel data fetching for performance
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
    supabase.from('students').select('*', { count: 'exact', head: true }),
    supabase.from('students').select('*', { count: 'exact', head: true }).eq('is_active', true),
    supabase.from('students').select('*', { count: 'exact', head: true }).eq('is_active', false),
    supabase.from('staffs').select('*', { count: 'exact', head: true }),
    supabase.from('staffs').select('*', { count: 'exact', head: true }).eq('is_active', true),
    supabase.from('spp_transactions').select('*, admins(name)').order('created_at', { ascending: false }).limit(5),
    supabase.from('classroom_attendances').select('*', { count: 'exact', head: true }).eq('date', todayStr).ilike('status', '%hadir%'),
    supabase.from('staff_attendance').select('*', { count: 'exact', head: true }).eq('date', todayStr).ilike('status', '%hadir%')
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

