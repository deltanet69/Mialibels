import React from 'react';
import { supabase } from '@/lib/supabase';
import { getSession } from '@/lib/session';
import { Calendar, BookOpen, Clock, GraduationCap } from 'lucide-react';

export const dynamic = 'force-dynamic';

// Color palette for subjects — cycling through for visual variety
const SUBJECT_COLORS = [
  { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-800', badge: 'bg-blue-100 text-blue-700', dot: 'bg-blue-500' },
  { bg: 'bg-violet-50', border: 'border-violet-200', text: 'text-violet-800', badge: 'bg-violet-100 text-violet-700', dot: 'bg-violet-500' },
  { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-800', badge: 'bg-emerald-100 text-emerald-700', dot: 'bg-emerald-500' },
  { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-800', badge: 'bg-amber-100 text-amber-700', dot: 'bg-amber-500' },
  { bg: 'bg-rose-50', border: 'border-rose-200', text: 'text-rose-800', badge: 'bg-rose-100 text-rose-700', dot: 'bg-rose-500' },
  { bg: 'bg-cyan-50', border: 'border-cyan-200', text: 'text-cyan-800', badge: 'bg-cyan-100 text-cyan-700', dot: 'bg-cyan-500' },
  { bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-800', badge: 'bg-orange-100 text-orange-700', dot: 'bg-orange-500' },
];

const DAYS = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

function getSubjectColor(subjectName: string, index: number) {
  return SUBJECT_COLORS[index % SUBJECT_COLORS.length];
}

function formatTime(timeStr: string) {
  if (!timeStr) return '--:--';
  return timeStr.slice(0, 5);
}

function calcDuration(start: string, end: string): string {
  if (!start || !end) return '';
  const [sh, sm] = start.split(':').map(Number);
  const [eh, em] = end.split(':').map(Number);
  const totalMins = (eh * 60 + em) - (sh * 60 + sm);
  if (totalMins <= 0) return '';
  const h = Math.floor(totalMins / 60);
  const m = totalMins % 60;
  if (h > 0 && m > 0) return `${h}j ${m}m`;
  if (h > 0) return `${h} jam`;
  return `${m} mnt`;
}

export default async function JadwalMengajarPage() {
  const user = await getSession().catch(() => null);

  if (!user || !user.role?.toLowerCase().includes('guru')) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh]">
        <h1 className="text-2xl font-bold text-slate-800">Akses Ditolak</h1>
        <p className="text-slate-500 mt-2">Halaman ini khusus untuk guru.</p>
      </div>
    );
  }

  // Fetch staff data by email
  const { data: staff } = await supabase
    .from('staffs')
    .select('id, name, position')
    .eq('email', user.email)
    .single();

  let schedules: any[] = [];

  if (staff) {
    const staffData = staff as any;
    const { data } = await supabase
      .from('classroom_schedules')
      .select('*, classroom:classrooms(name)')
      .eq('teacher_id', staffData.id)
      .order('start_time', { ascending: true });

    schedules = data || [];
  }

  const todayDay = new Date().toLocaleDateString('id-ID', { weekday: 'long', timeZone: 'Asia/Jakarta' });

  // Build a map: day -> schedules[], with unique color per subject name
  const subjectColorMap: Record<string, number> = {};
  let colorIdx = 0;
  schedules.forEach(s => {
    const key = (s.name || '').toLowerCase();
    if (subjectColorMap[key] === undefined) {
      subjectColorMap[key] = colorIdx++;
    }
  });

  const schedulesByDay: Record<string, any[]> = {};
  DAYS.forEach(d => { schedulesByDay[d] = []; });
  schedules.forEach(s => {
    const day = (s.day_of_week || '').trim();
    // Try to match the day case-insensitively
    const matchedDay = DAYS.find(d => d.toLowerCase() === day.toLowerCase());
    if (matchedDay) {
      schedulesByDay[matchedDay].push(s);
    }
  });

  // Total hours per week
  const totalMinutes = schedules.reduce((acc, s) => {
    if (!s.start_time || !s.end_time) return acc;
    const [sh, sm] = s.start_time.split(':').map(Number);
    const [eh, em] = s.end_time.split(':').map(Number);
    return acc + Math.max(0, (eh * 60 + em) - (sh * 60 + sm));
  }, 0);
  const totalH = Math.floor(totalMinutes / 60);
  const totalM = totalMinutes % 60;

  const activeDays = DAYS.filter(d => schedulesByDay[d].length > 0);

  return (
    <div className="space-y-6 w-full pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Calendar className="text-blue-600" size={28} />
            Jadwal Mengajar Saya
          </h1>
          <p className="text-slate-500 mt-1">
            Timetable lengkap jadwal mengajar di seluruh kelas.
          </p>
        </div>

        {/* Stats mini */}
        <div className="flex items-center gap-3">
          <div className="bg-white border border-slate-200 rounded-2xl px-4 py-3 flex items-center gap-3 shadow-sm">
            <div className="w-9 h-9 bg-blue-50 rounded-xl flex items-center justify-center">
              <BookOpen className="text-blue-600" size={18} />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium">Total Pelajaran</p>
              <p className="text-xl font-black text-slate-800">{schedules.length}</p>
            </div>
          </div>
          <div className="bg-white border border-slate-200 rounded-2xl px-4 py-3 flex items-center gap-3 shadow-sm">
            <div className="w-9 h-9 bg-violet-50 rounded-xl flex items-center justify-center">
              <Clock className="text-violet-600" size={18} />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium">Jam / Minggu</p>
              <p className="text-xl font-black text-slate-800">
                {totalH > 0 ? `${totalH}j` : ''}{totalM > 0 ? ` ${totalM}m` : ''}{totalMinutes === 0 ? '0' : ''}
              </p>
            </div>
          </div>
        </div>
      </div>

      {schedules.length === 0 ? (
        <div className="bg-white border-2 border-dashed border-slate-200 rounded-3xl text-center py-20">
          <BookOpen className="mx-auto text-slate-300 mb-4" size={56} />
          <h3 className="text-lg font-bold text-slate-600 mb-1">Belum Ada Jadwal</h3>
          <p className="text-sm text-slate-400">Anda belum ditugaskan mengajar di kelas manapun.</p>
        </div>
      ) : (
        <>
          {/* ──────── TIMETABLE per Hari ──────── */}
          <div className="space-y-4">
            {DAYS.map((day) => {
              const daySchedules = schedulesByDay[day];
              if (daySchedules.length === 0) return null;
              const isToday = todayDay.toLowerCase() === day.toLowerCase();

              return (
                <div
                  key={day}
                  className={`bg-white rounded-3xl border shadow-sm overflow-hidden transition-all ${
                    isToday ? 'border-blue-200 ring-2 ring-blue-500/15' : 'border-slate-100'
                  }`}
                >
                  {/* Day Header */}
                  <div className={`flex items-center gap-3 px-6 py-4 border-b ${
                    isToday ? 'bg-blue-600 border-blue-500' : 'bg-slate-50 border-slate-100'
                  }`}>
                    <div className={`w-2 h-8 rounded-full ${isToday ? 'bg-white/60' : 'bg-blue-400'}`} />
                    <h3 className={`text-base font-bold ${isToday ? 'text-white' : 'text-slate-800'}`}>
                      {day}
                    </h3>
                    {isToday && (
                      <span className="ml-1 bg-white/20 text-white text-xs font-bold px-2.5 py-0.5 rounded-full border border-white/30">
                        HARI INI
                      </span>
                    )}
                    <span className={`ml-auto text-xs font-bold ${isToday ? 'text-white/70' : 'text-slate-400'}`}>
                      {daySchedules.length} pelajaran
                    </span>
                  </div>

                  {/* Schedule Grid */}
                  <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                    {daySchedules.map((s, idx) => {
                      const colorKey = (s.name || '').toLowerCase();
                      const colorIdx = subjectColorMap[colorKey] ?? 0;
                      const color = SUBJECT_COLORS[colorIdx % SUBJECT_COLORS.length];
                      const duration = calcDuration(s.start_time, s.end_time);

                      return (
                        <div
                          key={s.id || idx}
                          className={`${color.bg} border ${color.border} rounded-2xl p-4 flex flex-col gap-2 hover:shadow-sm transition-shadow`}
                        >
                          {/* Time badge */}
                          <div className="flex items-center justify-between">
                            <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md ${color.badge}`}>
                              {formatTime(s.start_time)} – {formatTime(s.end_time)}
                            </span>
                            {duration && (
                              <span className="text-[10px] font-semibold text-slate-400">{duration}</span>
                            )}
                          </div>

                          {/* Subject name */}
                          <h4 className={`font-bold text-[15px] leading-tight ${color.text}`}>
                            {s.name}
                          </h4>

                          {/* Class name */}
                          <div className="flex items-center gap-1.5 mt-auto pt-1">
                            <GraduationCap size={13} className="text-slate-400 shrink-0" />
                            <span className="text-xs font-semibold text-slate-600">
                              Kelas {s.classroom?.name || '-'}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          {/* ──────── Summary Table ──────── */}
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
              <BookOpen size={18} className="text-slate-400" />
              <h3 className="font-bold text-slate-800">Rekap Lengkap Jadwal</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    <th className="text-left px-6 py-3">Hari</th>
                    <th className="text-left px-4 py-3">Mata Pelajaran</th>
                    <th className="text-left px-4 py-3">Kelas</th>
                    <th className="text-left px-4 py-3">Waktu</th>
                    <th className="text-left px-4 py-3">Durasi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {DAYS.map(day => {
                    const daySchedules = schedulesByDay[day];
                    if (daySchedules.length === 0) return null;
                    const isToday = todayDay.toLowerCase() === day.toLowerCase();

                    return daySchedules.map((s, idx) => {
                      const colorKey = (s.name || '').toLowerCase();
                      const cIdx = subjectColorMap[colorKey] ?? 0;
                      const color = SUBJECT_COLORS[cIdx % SUBJECT_COLORS.length];
                      return (
                        <tr
                          key={s.id || `${day}-${idx}`}
                          className={`hover:bg-slate-50 transition ${isToday ? 'bg-blue-50/30' : ''}`}
                        >
                          {idx === 0 && (
                            <td
                              className={`px-6 py-3 font-bold align-top ${isToday ? 'text-blue-700' : 'text-slate-700'}`}
                              rowSpan={daySchedules.length}
                            >
                              {day}
                              {isToday && (
                                <span className="block text-[10px] font-bold text-blue-500 mt-0.5">Hari Ini</span>
                              )}
                            </td>
                          )}
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <span className={`w-2 h-2 rounded-full shrink-0 ${color.dot}`} />
                              <span className="font-semibold text-slate-800">{s.name}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-slate-600 font-medium">{s.classroom?.name || '-'}</td>
                          <td className="px-4 py-3 font-mono text-slate-700 text-xs">
                            {formatTime(s.start_time)} – {formatTime(s.end_time)}
                          </td>
                          <td className="px-4 py-3 text-slate-500 text-xs font-medium">
                            {calcDuration(s.start_time, s.end_time)}
                          </td>
                        </tr>
                      );
                    });
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
