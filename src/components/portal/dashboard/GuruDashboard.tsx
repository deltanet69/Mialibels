import React from 'react';
import { supabase } from '@/lib/supabase';
import { Clock, BookOpen, CheckCircle, Users, AlertCircle, Calendar as CalendarIcon } from 'lucide-react';
import { GuruScheduleClient } from './GuruScheduleClient';
import { AttendanceChart } from './AttendanceChart';

export const dynamic = 'force-dynamic';

export async function GuruDashboard({ user }: { user: any }) {
  const todayStr = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta' });
  const dayOfWeek = new Date().toLocaleDateString('id-ID', { weekday: 'long', timeZone: 'Asia/Jakarta' });

  // Fetch staff data based on session email with homeroom class
  const { data: staff } = await supabase
    .from('staffs')
    .select('id, name, classrooms!homeroom_teacher_id(id, name)')
    .eq('email', user.email)
    .single();

  let todaySchedules: any[] = [];
  let attendanceToday: any = null;
  
  let homeroomClass = null;
  let activeStudents = 0;
  let studentHadir = 0;

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

    // 3. Handle homeroom teacher data
    if (staff.classrooms && staff.classrooms.length > 0) {
      homeroomClass = staff.classrooms[0];
      
      const [studentRes, hadirRes] = await Promise.all([
        supabase.from('students').select('*', { count: 'exact', head: true }).eq('classroom_id', homeroomClass.id).eq('is_active', true),
        supabase.from('classroom_attendances').select('*', { count: 'exact', head: true }).eq('classroom_id', homeroomClass.id).eq('date', todayStr).ilike('status', '%hadir%')
      ]);
      
      activeStudents = studentRes.count || 0;
      studentHadir = hadirRes.count || 0;
    }
  }

  const studentAttendanceRate = activeStudents ? Math.round((studentHadir / activeStudents) * 100) : 0;
  const nextSchedule = todaySchedules.find(s => {
    // Basic check for next schedule based on time string comparison
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    return s.start_time >= timeStr;
  }) || todaySchedules[0]; // fallback to first if none later today

  return (
    <div className="space-y-6 w-full pb-10">
      {/* Welcome Message */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
          Selamat datang, {user?.name || 'Guru'} <span className="text-2xl">👋</span>
        </h1>
        <p className="text-slate-500 mt-1">
          Pantau jadwal mengajar dan kelas Anda hari ini.
        </p>
      </div>

      {/* Top Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Class Attendance Card (Superadmin style but for homeroom) */}
        <div className="lg:col-span-2 bg-gradient-to-r from-blue-500 to-cyan-400 p-6 rounded-2xl shadow-lg shadow-blue-500/20 relative overflow-hidden flex flex-col justify-between min-h-[160px] border border-blue-400/30">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/20 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none mix-blend-overlay"></div>
          <div className="absolute bottom-0 left-1/4 w-48 h-48 bg-white/10 rounded-full blur-2xl -mb-20 pointer-events-none mix-blend-overlay"></div>
          
          <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 h-full">
            {/* Kehadiran Info */}
            <div className="flex-1 w-full">
              <div className="flex items-center gap-2 text-blue-100 mb-2">
                <Users size={16} />
                <span className="text-sm font-medium tracking-wider opacity-90 uppercase">
                  {homeroomClass ? `Wali Kelas ${homeroomClass.name}` : 'Bukan Wali Kelas'}
                </span>
              </div>
              {homeroomClass ? (
                <div className="flex flex-col gap-4 mt-4">
                  <div>
                    <div className="flex justify-between items-end mb-1.5">
                      <span className="text-md font-medium text-blue-100">Kehadiran Siswa</span>
                      <span className="text-md font-bold text-white">{studentAttendanceRate}%</span>
                    </div>
                    <div className="w-full bg-black/20 rounded-full h-2 overflow-hidden shadow-inner">
                      <div className="bg-teal-400 h-2 rounded-full shadow-[0_0_10px_rgba(45,212,191,0.6)]" style={{ width: `${studentAttendanceRate}%` }}></div>
                    </div>
                  </div>
                  <div className="text-sm text-blue-100 opacity-90">
                    {studentHadir} dari {activeStudents} siswa hadir hari ini.
                  </div>
                </div>
              ) : (
                <div className="text-white font-medium mt-4">
                  Tidak ada data kelas perwalian.
                </div>
              )}
            </div>
            
            {/* Vertical Divider */}
            <div className="hidden sm:block w-px h-full bg-white/20"></div>
            
            {/* Personal Status */}
            <div className="flex-1 w-full flex flex-col justify-center items-center sm:items-start pl-0 sm:pl-4">
              <p className="text-sm font-semibold text-blue-100 uppercase tracking-wider mb-2">Status Kehadiran Anda</p>
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-xl ${attendanceToday ? 'bg-white/20 text-white' : 'bg-white/10 text-blue-100'}`}>
                  {attendanceToday ? <CheckCircle size={24} /> : <AlertCircle size={24} />}
                </div>
                <h3 className="text-2xl font-bold text-white">
                  {attendanceToday ? attendanceToday.status : 'Belum Absen'}
                </h3>
              </div>
            </div>
          </div>
        </div>

        {/* Next Schedule Alert Card */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="text-slate-500 text-sm font-medium mb-1 uppercase tracking-wider">Jadwal Mengajar Selanjutnya</h3>
              {nextSchedule ? (
                <div>
                  <p className="text-2xl font-bold text-slate-800">{nextSchedule.subject}</p>
                  <p className="text-md text-slate-600 font-medium mt-1">Kelas {nextSchedule.classroom?.name}</p>
                </div>
              ) : (
                <p className="text-xl font-bold text-slate-400 mt-2">Tidak ada jadwal</p>
              )}
            </div>
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 shadow-sm border border-indigo-100">
              <Clock size={24} />
            </div>
          </div>
          <div className="flex gap-4 border-t border-slate-50 pt-4">
            <div className="flex items-center gap-2 flex-1">
              <BookOpen size={18} className="text-indigo-500" />
              <div className="flex flex-col">
                <span className="text-[12px] text-slate-400 uppercase tracking-wider font-semibold">Total Sesi</span>
                <span className="text-lg font-bold text-slate-700">{todaySchedules.length} Sesi Hari Ini</span>
              </div>
            </div>
            {nextSchedule && (
              <>
                <div className="w-px bg-slate-100"></div>
                <div className="flex items-center gap-2 flex-1">
                  <CalendarIcon size={18} className="text-emerald-500" />
                  <div className="flex flex-col">
                    <span className="text-[12px] text-slate-400 uppercase tracking-wider font-semibold">Waktu</span>
                    <span className="text-lg font-bold text-slate-700">{nextSchedule.start_time.substring(0, 5)} - {nextSchedule.end_time.substring(0, 5)}</span>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Main Content Area (Chart + Schedule) */}
      <div className="flex flex-col gap-6 mt-6">
        {homeroomClass && (
          <div className="w-full">
            <AttendanceChart guruClassId={homeroomClass.id} />
          </div>
        )}

        {/* Schedule Section */}
        <div className="w-full">
          <GuruScheduleClient schedules={todaySchedules} />
        </div>
      </div>
    </div>
  );
}
