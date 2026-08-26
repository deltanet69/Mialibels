import React from 'react';
import { supabase } from '@/lib/supabase';
import { 
  Clock, 
  BookOpen, 
  CheckCircle, 
  Users, 
  AlertCircle, 
  Calendar as CalendarIcon, 
  Sparkles,
  ArrowRight,
  ExternalLink,
  PlayCircle
} from 'lucide-react';
import Link from 'next/link';
import { GuruScheduleClient } from './GuruScheduleClient';
import { AttendanceChart } from './AttendanceChart';

export const dynamic = 'force-dynamic';

function parseTimeString(timeStr?: string) {
  if (!timeStr) return { start: '', end: '', startMins: 0, endMins: 0, durationStr: '' };
  const parts = timeStr.split('-').map(s => s.trim());
  const start = parts[0] || '';
  const end = parts[1] || '';

  const [sh, sm] = start.split(':').map(Number);
  const [eh, em] = end.split(':').map(Number);

  const startMins = (!isNaN(sh) && !isNaN(sm)) ? sh * 60 + sm : 0;
  const endMins = (!isNaN(eh) && !isNaN(em)) ? eh * 60 + em : 0;

  const diffMins = Math.max(0, endMins - startMins);
  const h = Math.floor(diffMins / 60);
  const m = diffMins % 60;
  const durationStr = h > 0 && m > 0 ? `${h}j ${m}m` : (h > 0 ? `${h} jam` : `${m} mnt`);

  return { start, end, startMins, endMins, durationStr };
}

export async function GuruDashboard({ user }: { user: any }) {
  const todayStr = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta' });
  const dayOfWeek = new Intl.DateTimeFormat('id-ID', { weekday: 'long', timeZone: 'Asia/Jakarta' }).format(new Date());

  // 1. Resolve Staff Account (triple fallback: staffId -> email -> name)
  let staff: any = null;

  if (user?.staffId) {
    const { data } = await supabase
      .from('staffs')
      .select('id, name, email, position, rfid, classrooms!homeroom_teacher_id(id, name)')
      .eq('id', user.staffId)
      .maybeSingle();
    staff = data;
  }

  if (!staff && user?.email) {
    const { data } = await supabase
      .from('staffs')
      .select('id, name, email, position, rfid, classrooms!homeroom_teacher_id(id, name)')
      .ilike('email', user.email)
      .maybeSingle();
    staff = data;
  }

  if (!staff && user?.name) {
    const { data } = await supabase
      .from('staffs')
      .select('id, name, email, position, rfid, classrooms!homeroom_teacher_id(id, name)')
      .ilike('name', user.name)
      .maybeSingle();
    staff = data;
  }

  let allSchedules: any[] = [];
  let todaySchedules: any[] = [];
  let attendanceToday: any = null;
  
  let homeroomClass: any = null;
  let activeStudents = 0;
  let studentHadir = 0;

  const staffObj = staff as any;

  if (staffObj) {
    // 2. Fetch all schedules for this teacher
    const { data: schedules } = await supabase
      .from('classroom_schedules')
      .select('*, classroom:classrooms(id, name)')
      .eq('teacher_id', staffObj.id);

    allSchedules = schedules || [];

    // Filter today's schedules (case-insensitive day match)
    todaySchedules = allSchedules
      .filter(s => (s.day || '').trim().toLowerCase() === dayOfWeek.toLowerCase())
      .sort((a, b) => {
        const aMins = parseTimeString(a.time).startMins;
        const bMins = parseTimeString(b.time).startMins;
        return aMins - bMins;
      });

    // 3. Fetch Personal Attendance for today
    const { data: attToday } = await supabase
      .from('staff_attendance')
      .select('status, check_in_time, check_out_time, notes')
      .eq('staff_id', staffObj.id)
      .eq('date', todayStr)
      .maybeSingle();
    
    attendanceToday = attToday;

    // 4. Handle homeroom teacher data (Wali Kelas)
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

  // Calculate current time in Jakarta for next schedule detection
  const nowInJakarta = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Jakarta' }));
  const currentMinutes = nowInJakarta.getHours() * 60 + nowInJakarta.getMinutes();

  const activeSchedule = todaySchedules.find(s => {
    const { startMins, endMins } = parseTimeString(s.time);
    return currentMinutes >= startMins && currentMinutes <= endMins;
  });

  const nextUpcomingSchedule = todaySchedules.find(s => {
    const { startMins } = parseTimeString(s.time);
    return startMins > currentMinutes;
  });

  const nextSchedule = activeSchedule || nextUpcomingSchedule || todaySchedules[0] || null;
  const isCurrentlyActive = Boolean(activeSchedule);
  const isAllFinishedToday = todaySchedules.length > 0 && !activeSchedule && !nextUpcomingSchedule;

  // Next teaching day preview if no schedule today
  let nextDayPreview: string | null = null;
  if (todaySchedules.length === 0 && allSchedules.length > 0) {
    const DAYS = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    const currentDayIdx = DAYS.findIndex(d => d.toLowerCase() === dayOfWeek.toLowerCase());
    for (let i = 1; i <= 6; i++) {
      const targetDay = DAYS[(currentDayIdx + i) % 6];
      const match = allSchedules.find(s => (s.day || '').toLowerCase() === targetDay.toLowerCase());
      if (match) {
        nextDayPreview = `${targetDay} (${match.name} di Kelas ${match.classroom?.name || '-'})`;
        break;
      }
    }
  }

  return (
    <div className="space-y-6 w-full pb-10">
      {/* Welcome Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white/80 backdrop-blur-md p-6 sm:p-7 rounded-[2rem] border border-slate-200/70 shadow-sm">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-blue-700 font-body text-xs font-bold uppercase tracking-wider mb-2">
            <Sparkles className="w-3.5 h-3.5 text-accent" />
            <span>Portal Pendidik</span>
          </div>
          <h1 className="font-headline font-black text-2xl sm:text-3xl text-secondary tracking-tight">
            Selamat Datang, {staffObj?.name || user?.name || 'Bapak/Ibu Guru'} 👋
          </h1>
          <p className="font-body text-slate-500 text-xs sm:text-sm mt-1">
            Pantau presensi kehadiran Anda, agenda mengajar hari ini ({dayOfWeek}), dan ruang kelas perwalian.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/jadwal-mengajar"
            className="btn-tactile inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition shadow-sm"
          >
            <CalendarIcon size={14} />
            <span>Jadwal Mengajar</span>
          </Link>
        </div>
      </div>

      {/* Top Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Class Attendance & Personal Attendance Card */}
        <div className="lg:col-span-2 bg-gradient-to-br from-[#002957] via-[#0c3868] to-[#1d4ed8] p-6 sm:p-7 rounded-[2rem] shadow-sm relative overflow-hidden flex flex-col justify-between min-h-[185px] border border-white/10 text-white">
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-400/20 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
          <div className="absolute bottom-0 left-1/4 w-48 h-48 bg-amber-400/10 rounded-full blur-2xl -mb-16 pointer-events-none"></div>
          
          <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 h-full">
            {/* Homeroom / Teaching Info */}
            <div className="flex-1 w-full">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/15 text-blue-100 text-xs font-semibold uppercase tracking-wider mb-2">
                <Users size={13} className="text-blue-300" />
                <span>
                  {homeroomClass ? `Wali Kelas ${homeroomClass.name}` : (staffObj?.position || 'Guru Mata Pelajaran')}
                </span>
              </div>
              {homeroomClass ? (
                <div className="flex flex-col gap-3 mt-3">
                  <div>
                    <div className="flex justify-between items-end mb-1.5">
                      <span className="text-xs font-semibold text-blue-100">Presensi Siswa Kelas {homeroomClass.name}</span>
                      <span className="text-xs font-black text-cyan-300">{studentAttendanceRate}%</span>
                    </div>
                    <div className="w-full bg-black/30 rounded-full h-2.5 overflow-hidden p-0.5">
                      <div 
                        className="bg-gradient-to-r from-cyan-400 to-blue-300 h-full rounded-full transition-all duration-500 shadow-sm" 
                        style={{ width: `${studentAttendanceRate}%` }}
                      ></div>
                    </div>
                  </div>
                  <p className="text-xs text-blue-100">
                    <strong className="text-white">{studentHadir}</strong> dari {activeStudents} siswa hadir hari ini.
                  </p>
                </div>
              ) : (
                <div className="text-blue-100 text-xs mt-3 flex flex-col gap-1">
                  <p className="font-semibold text-white">Total Jam Mengajar: {allSchedules.length} Sesi Mingguan</p>
                  <p className="text-blue-200">Presensi dan aktivitas mengajar tercatat secara otomatis.</p>
                </div>
              )}
            </div>
            
            {/* Vertical Divider */}
            <div className="hidden sm:block w-px h-28 bg-white/15"></div>
            
            {/* Personal Status */}
            <div className="flex-1 w-full flex flex-col justify-center items-start sm:pl-2">
              <p className="text-xs font-bold text-blue-200 uppercase tracking-wider mb-2">Status Presensi Anda</p>
              <div className="flex items-center gap-3">
                <div className={`p-2.5 rounded-2xl ${
                  attendanceToday 
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/30' 
                    : 'bg-amber-500/20 text-amber-300 border border-amber-400/30'
                }`}>
                  {attendanceToday ? <CheckCircle size={22} /> : <AlertCircle size={22} />}
                </div>
                <div>
                  <h3 className="font-headline font-black text-xl text-white">
                    {attendanceToday ? (attendanceToday.status || 'HADIR') : 'Belum Presensi'}
                  </h3>
                  <p className="text-[11px] text-blue-200 mt-0.5">
                    {attendanceToday?.check_in_time 
                      ? `Masuk: ${new Date(attendanceToday.check_in_time).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB`
                      : todayStr}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Next Schedule Alert Card */}
        <div className={`lg:col-span-2 bg-white p-6 sm:p-7 rounded-[2rem] shadow-sm border flex flex-col justify-between transition-all ${
          isCurrentlyActive 
            ? 'border-emerald-300 ring-2 ring-emerald-500/20 shadow-emerald-500/10' 
            : 'border-slate-200/80 hover:shadow-md'
        }`}>
          <div className="flex items-start justify-between mb-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                  Jadwal Mengajar Terdekat
                </span>
                {isCurrentlyActive && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-300 px-2 py-0.5 rounded-full animate-pulse">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
                    Sedang Berlangsung
                  </span>
                )}
              </div>

              {nextSchedule ? (
                <div>
                  <p className="font-headline font-black text-xl sm:text-2xl text-secondary">{nextSchedule.name}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <p className="font-body text-xs font-bold text-blue-700 bg-blue-50 border border-blue-100 px-2.5 py-0.5 rounded-md inline-block">
                      Kelas {nextSchedule.classroom?.name || '-'}
                    </p>
                    {nextSchedule.type && nextSchedule.type !== 'Pelajaran' && (
                      <span className="text-xs font-semibold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md border border-purple-100">
                        {nextSchedule.type}
                      </span>
                    )}
                  </div>
                </div>
              ) : isAllFinishedToday ? (
                <div>
                  <p className="font-headline font-bold text-base text-emerald-700">Semua sesi hari ini telah selesai 👍</p>
                  <p className="text-xs text-slate-400 mt-0.5">{todaySchedules.length} sesi telah selesai diajar.</p>
                </div>
              ) : (
                <div>
                  <p className="font-headline font-bold text-base text-slate-400 mt-1">Tidak ada jadwal tersisa hari ini</p>
                  {nextDayPreview && (
                    <p className="text-xs text-blue-600 font-semibold mt-1">Jadwal berikutnya: {nextDayPreview}</p>
                  )}
                </div>
              )}
            </div>

            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-2xs ${
              isCurrentlyActive ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' : 'bg-indigo-50 border border-indigo-100 text-indigo-700'
            }`}>
              {isCurrentlyActive ? <PlayCircle size={24} className="animate-pulse" /> : <Clock size={22} />}
            </div>
          </div>

          <div className="flex gap-4 border-t border-slate-100 pt-4">
            <div className="flex items-center gap-2 flex-1">
              <BookOpen size={16} className="text-indigo-500 shrink-0" />
              <div className="flex flex-col">
                <span className="text-[11px] text-slate-400 uppercase tracking-wider font-bold">Total Sesi</span>
                <span className="text-sm font-bold text-slate-800">{todaySchedules.length} Sesi Hari Ini</span>
              </div>
            </div>

            {nextSchedule && (
              <>
                <div className="w-px bg-slate-100"></div>
                <div className="flex items-center gap-2 flex-1">
                  <CalendarIcon size={16} className="text-emerald-500 shrink-0" />
                  <div className="flex flex-col">
                    <span className="text-[11px] text-slate-400 uppercase tracking-wider font-bold">Alokasi Waktu</span>
                    <span className="text-sm font-bold text-slate-800 font-mono">
                      {nextSchedule.time || '--:--'}
                    </span>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Main Content Area (Personal Chart + Today's Schedule) */}
      <div className="flex flex-col gap-6">
        {/* Attendance Chart (Personal Teacher Attendance with Homeroom toggle if Wali Kelas) */}
        <div className="w-full">
          <AttendanceChart 
            guruStaffId={staffObj?.id}
            guruName={staffObj?.name}
            guruClassId={homeroomClass?.id}
            guruClassName={homeroomClass?.name}
          />
        </div>

        {/* Schedule Section */}
        <div className="w-full">
          <GuruScheduleClient 
            schedules={todaySchedules} 
            staffId={staffObj?.id}
          />
        </div>
      </div>
    </div>
  );
}
