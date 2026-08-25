import React from 'react';
import { supabase } from '@/lib/supabase';
import { Clock, BookOpen, CheckCircle, Users, AlertCircle, Calendar as CalendarIcon, Sparkles } from 'lucide-react';
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
  
  let homeroomClass: any = null;
  let activeStudents = 0;
  let studentHadir = 0;

  const staffObj = staff as any;

  if (staffObj) {
    // 1. Fetch Today's Schedules for this teacher
    const { data: schedules } = await supabase
      .from('classroom_schedules')
      .select('*, classroom:classrooms(name)')
      .eq('teacher_id', staffObj.id)
      .ilike('day_of_week', dayOfWeek)
      .order('start_time', { ascending: true });
    
    todaySchedules = schedules || [];

    // 2. Fetch Personal Attendance for today
    const { data: attToday } = await supabase
      .from('staff_attendance')
      .select('status')
      .eq('staff_id', staffObj.id)
      .eq('date', todayStr)
      .single();
    
    attendanceToday = attToday;

    // 3. Handle homeroom teacher data
    if (staffObj.classrooms && staffObj.classrooms.length > 0) {
      homeroomClass = staffObj.classrooms[0];
      
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
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    return s.start_time >= timeStr;
  }) || todaySchedules[0];

  return (
    <div className="space-y-6 w-full pb-10">
      {/* Welcome Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white/70 backdrop-blur-md p-6 sm:p-7 rounded-[2rem] border border-slate-200/70 shadow-sm">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-50 border border-teal-100 text-primary-dark font-body text-xs font-bold uppercase tracking-wider mb-2">
            <Sparkles className="w-3 h-3 text-accent" />
            <span>Portal Pendidik</span>
          </div>
          <h1 className="font-headline font-black text-2xl sm:text-3xl text-secondary tracking-tight">
            Selamat Datang, {user?.name || 'Bapak/Ibu Guru'} 👋
          </h1>
          <p className="font-body text-gray-500 text-xs sm:text-sm mt-1">
            Pantau presensi kelas perwalian dan agenda jadwal mengajar Anda hari ini ({dayOfWeek}).
          </p>
        </div>
      </div>

      {/* Top Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Class Attendance Card */}
        <div className="lg:col-span-2 bg-gradient-to-br from-[#002957] via-[#0f2744] to-[#004d40] p-6 sm:p-7 rounded-[2rem] shadow-xl shadow-slate-900/10 relative overflow-hidden flex flex-col justify-between min-h-[170px] border border-white/10 text-white">
          <div className="absolute top-0 right-0 w-64 h-64 bg-teal-400/20 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
          <div className="absolute bottom-0 left-1/4 w-48 h-48 bg-amber-400/10 rounded-full blur-2xl -mb-16 pointer-events-none"></div>
          
          <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 h-full">
            {/* Kehadiran Info */}
            <div className="flex-1 w-full">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/15 text-slate-200 text-xs font-semibold uppercase tracking-wider mb-2">
                <Users size={13} className="text-teal-300" />
                <span>
                  {homeroomClass ? `Wali Kelas ${homeroomClass.name}` : 'Guru Mata Pelajaran'}
                </span>
              </div>
              {homeroomClass ? (
                <div className="flex flex-col gap-3 mt-3">
                  <div>
                    <div className="flex justify-between items-end mb-1.5">
                      <span className="text-xs font-semibold text-slate-200">Presensi Siswa Kelas</span>
                      <span className="text-xs font-black text-teal-300">{studentAttendanceRate}%</span>
                    </div>
                    <div className="w-full bg-black/30 rounded-full h-2 overflow-hidden p-0.5">
                      <div 
                        className="bg-gradient-to-r from-teal-400 to-emerald-300 h-full rounded-full transition-all duration-500 shadow-sm" 
                        style={{ width: `${studentAttendanceRate}%` }}
                      ></div>
                    </div>
                  </div>
                  <p className="text-xs text-slate-300">
                    <strong className="text-white">{studentHadir}</strong> dari {activeStudents} siswa hadir hari ini.
                  </p>
                </div>
              ) : (
                <div className="text-slate-300 text-xs mt-3">
                  Informasi kehadiran terpusat di dashboard masing-masing wali kelas.
                </div>
              )}
            </div>
            
            {/* Vertical Divider */}
            <div className="hidden sm:block w-px h-28 bg-white/15"></div>
            
            {/* Personal Status */}
            <div className="flex-1 w-full flex flex-col justify-center items-start sm:pl-2">
              <p className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">Status Presensi Anda</p>
              <div className="flex items-center gap-3">
                <div className={`p-2.5 rounded-2xl ${attendanceToday ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/30' : 'bg-amber-500/20 text-amber-300 border border-amber-400/30'}`}>
                  {attendanceToday ? <CheckCircle size={22} /> : <AlertCircle size={22} />}
                </div>
                <div>
                  <h3 className="font-headline font-black text-xl text-white">
                    {attendanceToday ? attendanceToday.status : 'Belum Presensi'}
                  </h3>
                  <p className="text-[11px] text-slate-300 mt-0.5">{todayStr}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Next Schedule Alert Card */}
        <div className="lg:col-span-2 bg-white p-6 sm:p-7 rounded-[2rem] shadow-sm border border-slate-200/80 flex flex-col justify-between hover:shadow-md transition-all">
          <div className="flex items-start justify-between mb-4">
            <div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Jadwal Mengajar Terdekat</span>
              {nextSchedule ? (
                <div>
                  <p className="font-headline font-black text-2xl text-secondary">{nextSchedule.subject}</p>
                  <p className="font-body text-xs font-semibold text-teal-700 bg-teal-50 px-2.5 py-0.5 rounded-md inline-block mt-1">
                    Kelas {nextSchedule.classroom?.name}
                  </p>
                </div>
              ) : (
                <p className="font-headline font-bold text-base text-slate-400 mt-1">Tidak ada jadwal tersisa hari ini</p>
              )}
            </div>
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-700 shadow-2xs">
              <Clock size={22} />
            </div>
          </div>
          <div className="flex gap-4 border-t border-slate-100 pt-4">
            <div className="flex items-center gap-2 flex-1">
              <BookOpen size={16} className="text-indigo-500" />
              <div className="flex flex-col">
                <span className="text-[11px] text-slate-400 uppercase tracking-wider font-bold">Total Sesi</span>
                <span className="text-sm font-bold text-slate-800">{todaySchedules.length} Sesi Hari Ini</span>
              </div>
            </div>
            {nextSchedule && (
              <>
                <div className="w-px bg-slate-100"></div>
                <div className="flex items-center gap-2 flex-1">
                  <CalendarIcon size={16} className="text-emerald-500" />
                  <div className="flex flex-col">
                    <span className="text-[11px] text-slate-400 uppercase tracking-wider font-bold">Waktu</span>
                    <span className="text-sm font-bold text-slate-800">{nextSchedule.start_time.substring(0, 5)} - {nextSchedule.end_time.substring(0, 5)}</span>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Main Content Area (Chart + Schedule) */}
      <div className="flex flex-col gap-6">
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
