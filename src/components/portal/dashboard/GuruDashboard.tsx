import React from 'react';
import { supabase } from '@/lib/supabase';
import { Clock, BookOpen, CheckCircle, Users, AlertCircle } from 'lucide-react';
import { GuruScheduleClient } from './GuruScheduleClient';

export const dynamic = 'force-dynamic';

export async function GuruDashboard({ user }: { user: any }) {
  const todayStr = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta' });
  const dayOfWeek = new Date().toLocaleDateString('id-ID', { weekday: 'long', timeZone: 'Asia/Jakarta' });

  // Fetch staff data based on session email
  const { data: staff } = await supabase
    .from('staffs')
    .select('id, name')
    .eq('email', user.email)
    .single();

  let todaySchedules: any[] = [];
  let attendanceToday: any = null;
  let activeStaffs = 0;
  let staffHadir = 0;
  let personalStats = { hadir: 0, izin: 0, sakit: 0, total: 0 };

  if (staff) {
    // 1. Fetch Today's Schedules for this teacher
    const { data: schedules } = await supabase
      .from('classroom_schedules')
      .select('*, classroom:classrooms(name)')
      .eq('teacher_id', staff.id)
      .ilike('day_of_week', dayOfWeek)
      .order('start_time', { ascending: true });
    
    todaySchedules = schedules || [];

    // 2. Fetch Personal Attendance for today
    const { data: attToday } = await supabase
      .from('staff_attendance')
      .select('status')
      .eq('staff_id', staff.id)
      .eq('date', todayStr)
      .single();
    
    attendanceToday = attToday;

    // 3. Fetch Personal Attendance Recap for current month
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    const startStr = startOfMonth.toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta' });

    const { data: monthAtt } = await supabase
      .from('staff_attendance')
      .select('status')
      .eq('staff_id', staff.id)
      .gte('date', startStr);

    if (monthAtt) {
      personalStats.total = monthAtt.length;
      monthAtt.forEach(att => {
        const s = att.status?.toLowerCase() || '';
        if (s.includes('hadir')) personalStats.hadir++;
        else if (s.includes('izin')) personalStats.izin++;
        else if (s.includes('sakit')) personalStats.sakit++;
      });
    }

    // 4. Fetch Total Staffs overview
    const [staffRes, hadirRes] = await Promise.all([
      supabase.from('staffs').select('*', { count: 'exact', head: true }).eq('is_active', true),
      supabase.from('staff_attendance').select('*', { count: 'exact', head: true }).eq('date', todayStr).ilike('status', '%hadir%')
    ]);
    activeStaffs = staffRes.count || 0;
    staffHadir = hadirRes.count || 0;
  }

  return (
    <div className="space-y-6 w-full pb-10">
      {/* Welcome Message */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
          Selamat datang, {user?.name || 'Guru'} <span className="text-2xl">👋</span>
        </h1>
        <p className="text-slate-500 mt-1">
          Pantau jadwal mengajar dan kehadiran Anda hari ini.
        </p>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Personal Attendance Status */}
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] relative overflow-hidden group hover:border-blue-100 transition-colors">
          <div className="absolute -right-6 -top-6 w-24 h-24 bg-blue-50 rounded-full group-hover:scale-110 transition-transform duration-500 ease-out" />
          <div className="relative">
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-1">Status Hari Ini</p>
                <h3 className="text-2xl font-bold text-slate-800">
                  {attendanceToday ? attendanceToday.status : 'Belum Absen'}
                </h3>
              </div>
              <div className={`p-3 rounded-2xl ${attendanceToday ? 'bg-green-100 text-green-600' : 'bg-orange-100 text-orange-600'}`}>
                {attendanceToday ? <CheckCircle size={24} /> : <AlertCircle size={24} />}
              </div>
            </div>
          </div>
        </div>

        {/* Schedule Count */}
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] relative overflow-hidden group hover:border-indigo-100 transition-colors">
          <div className="absolute -right-6 -top-6 w-24 h-24 bg-indigo-50 rounded-full group-hover:scale-110 transition-transform duration-500 ease-out" />
          <div className="relative">
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-1">Jadwal Hari Ini</p>
                <h3 className="text-2xl font-bold text-slate-800">
                  {todaySchedules.length} <span className="text-sm text-slate-500 font-normal">Sesi</span>
                </h3>
              </div>
              <div className="p-3 bg-indigo-100 text-indigo-600 rounded-2xl">
                <BookOpen size={24} />
              </div>
            </div>
          </div>
        </div>

        {/* Personal Recap */}
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] relative overflow-hidden group hover:border-emerald-100 transition-colors">
          <div className="absolute -right-6 -top-6 w-24 h-24 bg-emerald-50 rounded-full group-hover:scale-110 transition-transform duration-500 ease-out" />
          <div className="relative">
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-1">Kehadiran (Bulan Ini)</p>
                <h3 className="text-2xl font-bold text-slate-800">
                  {personalStats.hadir} <span className="text-sm text-slate-500 font-normal">/ {personalStats.total}</span>
                </h3>
              </div>
              <div className="p-3 bg-emerald-100 text-emerald-600 rounded-2xl">
                <Clock size={24} />
              </div>
            </div>
            <div className="flex gap-3 text-xs font-medium text-slate-500">
              <span className="text-orange-500">Izin: {personalStats.izin}</span>
              <span className="text-red-500">Sakit: {personalStats.sakit}</span>
            </div>
          </div>
        </div>

        {/* Staff Overview */}
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] relative overflow-hidden group hover:border-purple-100 transition-colors">
          <div className="absolute -right-6 -top-6 w-24 h-24 bg-purple-50 rounded-full group-hover:scale-110 transition-transform duration-500 ease-out" />
          <div className="relative">
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-1">Staff Hadir</p>
                <h3 className="text-2xl font-bold text-slate-800">
                  {staffHadir} <span className="text-sm text-slate-500 font-normal">/ {activeStaffs}</span>
                </h3>
              </div>
              <div className="p-3 bg-purple-100 text-purple-600 rounded-2xl">
                <Users size={24} />
              </div>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2">
              <div 
                className="bg-purple-500 h-1.5 rounded-full transition-all duration-1000"
                style={{ width: `${activeStaffs ? Math.round((staffHadir / activeStaffs) * 100) : 0}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Schedule Section */}
      <div className="mt-8">
        <GuruScheduleClient schedules={todaySchedules} />
      </div>
    </div>
  );
}
