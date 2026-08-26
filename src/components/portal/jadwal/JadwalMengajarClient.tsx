'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import {
  Calendar,
  Clock,
  BookOpen,
  GraduationCap,
  AlertTriangle,
  ExternalLink,
  Printer,
  Search,
  LayoutGrid,
  CalendarDays,
  Table as TableIcon,
  CheckCircle2,
  Sparkles,
  Layers,
  Info
} from 'lucide-react';

export interface ScheduleItem {
  id: string;
  name: string;
  time: string;
  day: string;
  type?: string;
  classroom_id?: string;
  classroom?: {
    id?: string;
    name?: string;
  };
  startMinutes: number;
  endMinutes: number;
  startTime: string;
  endTime: string;
  durationStr: string;
}

const DAYS = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

// Balanced harmonic color palette
const SUBJECT_COLORS = [
  { bg: 'bg-blue-50/90', border: 'border-blue-200', text: 'text-blue-900', badge: 'bg-blue-100 text-blue-800', dot: 'bg-blue-600', ring: 'ring-blue-500/20' },
  { bg: 'bg-indigo-50/90', border: 'border-indigo-200', text: 'text-indigo-900', badge: 'bg-indigo-100 text-indigo-800', dot: 'bg-indigo-600', ring: 'ring-indigo-500/20' },
  { bg: 'bg-teal-50/90', border: 'border-teal-200', text: 'text-teal-900', badge: 'bg-teal-100 text-teal-800', dot: 'bg-teal-600', ring: 'ring-teal-500/20' },
  { bg: 'bg-amber-50/90', border: 'border-amber-200', text: 'text-amber-900', badge: 'bg-amber-100 text-amber-800', dot: 'bg-amber-600', ring: 'ring-amber-500/20' },
  { bg: 'bg-rose-50/90', border: 'border-rose-200', text: 'text-rose-900', badge: 'bg-rose-100 text-rose-800', dot: 'bg-rose-600', ring: 'ring-rose-500/20' },
  { bg: 'bg-purple-50/90', border: 'border-purple-200', text: 'text-purple-900', badge: 'bg-purple-100 text-purple-800', dot: 'bg-purple-600', ring: 'ring-purple-500/20' },
  { bg: 'bg-cyan-50/90', border: 'border-cyan-200', text: 'text-cyan-900', badge: 'bg-cyan-100 text-cyan-800', dot: 'bg-cyan-600', ring: 'ring-cyan-500/20' },
];

export function JadwalMengajarClient({
  schedules = [],
  staffName
}: {
  schedules: ScheduleItem[];
  staffName?: string;
}) {
  const [viewMode, setViewMode] = useState<'matrix' | 'tabs' | 'table'>('matrix');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentTime, setCurrentTime] = useState(new Date());

  // Current Jakarta Day
  const todayDay = new Intl.DateTimeFormat('id-ID', { weekday: 'long', timeZone: 'Asia/Jakarta' }).format(new Date());
  const initialSelectedDay = DAYS.includes(todayDay) ? todayDay : 'Senin';
  const [selectedDayTab, setSelectedDayTab] = useState(initialSelectedDay);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 30000);
    return () => clearInterval(timer);
  }, []);

  // 1. Detect Clashing / Conflicting Schedules
  const conflicts = useMemo(() => {
    const map: Record<string, { conflictWith: string; message: string }> = {};
    const byDay: Record<string, ScheduleItem[]> = {};

    schedules.forEach(s => {
      const d = (s.day || '').trim();
      if (!byDay[d]) byDay[d] = [];
      byDay[d].push(s);
    });

    Object.entries(byDay).forEach(([day, dayScheds]) => {
      for (let i = 0; i < dayScheds.length; i++) {
        for (let j = i + 1; j < dayScheds.length; j++) {
          const a = dayScheds[i];
          const b = dayScheds[j];
          if (a.startMinutes < b.endMinutes && a.endMinutes > b.startMinutes) {
            map[a.id] = {
              conflictWith: b.id,
              message: `Bentrok waktu dengan ${b.name} (${b.classroom?.name || 'Kelas'}) [${b.time}]`
            };
            map[b.id] = {
              conflictWith: a.id,
              message: `Bentrok waktu dengan ${a.name} (${a.classroom?.name || 'Kelas'}) [${a.time}]`
            };
          }
        }
      }
    });

    return map;
  }, [schedules]);

  const hasConflicts = Object.keys(conflicts).length > 0;

  // 2. Color assignment per subject
  const subjectColorMap = useMemo(() => {
    const map: Record<string, number> = {};
    let idx = 0;
    schedules.forEach(s => {
      const key = (s.name || '').toLowerCase();
      if (map[key] === undefined) {
        map[key] = idx++;
      }
    });
    return map;
  }, [schedules]);

  // 3. Filtered schedules by search query
  const filteredSchedules = useMemo(() => {
    if (!searchQuery.trim()) return schedules;
    const q = searchQuery.toLowerCase();
    return schedules.filter(s => 
      s.name.toLowerCase().includes(q) ||
      (s.classroom?.name || '').toLowerCase().includes(q) ||
      (s.day || '').toLowerCase().includes(q) ||
      (s.type || '').toLowerCase().includes(q)
    );
  }, [schedules, searchQuery]);

  // 4. Group by Day
  const schedulesByDay = useMemo(() => {
    const group: Record<string, ScheduleItem[]> = {};
    DAYS.forEach(d => { group[d] = []; });

    filteredSchedules.forEach(s => {
      const day = (s.day || '').trim();
      const matched = DAYS.find(d => d.toLowerCase() === day.toLowerCase());
      if (matched) {
        group[matched].push(s);
      }
    });

    // Sort chronologically per day
    DAYS.forEach(d => {
      group[d].sort((a, b) => a.startMinutes - b.startMinutes);
    });

    return group;
  }, [filteredSchedules]);

  // 5. Calculate Weekly Stats
  const totalMinutes = useMemo(() => {
    return schedules.reduce((acc, s) => acc + Math.max(0, s.endMinutes - s.startMinutes), 0);
  }, [schedules]);

  const totalHours = Math.floor(totalMinutes / 60);
  const remainingMins = totalMinutes % 60;

  const uniqueClasses = useMemo(() => {
    const set = new Set(schedules.map(s => s.classroom?.name).filter(Boolean));
    return Array.from(set);
  }, [schedules]);

  const todayCount = (schedulesByDay[todayDay] || []).length;

  const currentMinutes = currentTime.getHours() * 60 + currentTime.getMinutes();

  return (
    <div className="space-y-6 w-full pb-12">
      {/* ── HEADER & TOP STATS ── */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 bg-white/90 backdrop-blur-md p-6 sm:p-7 rounded-[2rem] border border-slate-200/80 shadow-sm print:hidden">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-blue-700 text-xs font-bold uppercase tracking-wider mb-2">
            <Sparkles className="w-3.5 h-3.5 text-accent" />
            <span>Manajemen Akademik</span>
          </div>
          <h1 className="font-headline font-black text-2xl sm:text-3xl text-secondary tracking-tight">
            Jadwal Mengajar {staffName ? `• ${staffName}` : 'Saya'}
          </h1>
          <p className="font-body text-slate-500 text-xs sm:text-sm mt-1">
            Timetable terintegrasi seluruh sesi pelajaran, alokasi jam, dan pemantauan jadwal bebas bentrok.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => window.print()}
            className="btn-tactile inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white border border-slate-200/90 text-slate-700 hover:bg-slate-50 text-xs font-bold transition shadow-2xs cursor-pointer"
          >
            <Printer size={15} />
            <span>Cetak Jadwal</span>
          </button>

          <Link
            href="/classroom"
            className="btn-tactile inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition shadow-sm cursor-pointer"
          >
            <GraduationCap size={15} />
            <span>Buka Menu Classroom</span>
          </Link>
        </div>
      </div>

      {/* ── BENTO STATS CARDS ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 print:hidden">
        {/* Total Pelajaran */}
        <div className="bg-white border border-slate-200/80 rounded-[1.75rem] p-5 shadow-2xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shrink-0">
            <BookOpen size={22} />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Pelajaran</p>
            <p className="text-2xl font-black text-slate-800 font-headline">{schedules.length} Sesi</p>
          </div>
        </div>

        {/* Jam / Minggu */}
        <div className="bg-white border border-slate-200/80 rounded-[1.75rem] p-5 shadow-2xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
            <Clock size={22} />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Beban Mengajar</p>
            <p className="text-2xl font-black text-slate-800 font-headline">
              {totalHours > 0 ? `${totalHours}j` : ''}{remainingMins > 0 ? ` ${remainingMins}m` : ''}
              {totalMinutes === 0 ? '0 jam' : ' / mg'}
            </p>
          </div>
        </div>

        {/* Total Kelas */}
        <div className="bg-white border border-slate-200/80 rounded-[1.75rem] p-5 shadow-2xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-teal-50 border border-teal-100 flex items-center justify-center text-teal-600 shrink-0">
            <Layers size={22} />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Ruang Kelas</p>
            <p className="text-2xl font-black text-slate-800 font-headline">{uniqueClasses.length} Kelas</p>
          </div>
        </div>

        {/* Jadwal Hari Ini */}
        <div className={`border rounded-[1.75rem] p-5 shadow-2xs flex items-center gap-4 transition-all ${
          todayCount > 0 
            ? 'bg-gradient-to-br from-emerald-50 to-teal-50/50 border-emerald-200' 
            : 'bg-white border-slate-200/80'
        }`}>
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
            todayCount > 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-50 text-slate-400'
          }`}>
            <Calendar size={22} />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Hari Ini ({todayDay})</p>
            <p className={`text-2xl font-black font-headline ${todayCount > 0 ? 'text-emerald-800' : 'text-slate-700'}`}>
              {todayCount} Sesi
            </p>
          </div>
        </div>
      </div>

      {/* ── CONFLICT ALERT BANNER ── */}
      {hasConflicts && (
        <div className="bg-rose-50 border-2 border-rose-200 p-4 sm:p-5 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-rose-900 shadow-sm animate-pulse print:hidden">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-100 flex items-center justify-center text-rose-600 shrink-0 mt-0.5">
              <AlertTriangle size={22} />
            </div>
            <div>
              <h4 className="font-bold text-sm sm:text-base">Peringatan Jadwal Bentrok Terdeteksi!</h4>
              <p className="text-xs text-rose-700 mt-0.5">
                Terdapat {Object.keys(conflicts).length} mata pelajaran dengan alokasi jam yang saling bertabrakan pada hari yang sama. Harap sesuaikan jam pelajaran di menu Classroom terkait.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── CONTROLS: SEARCH & VIEW SWITCHER ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-2xs print:hidden">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Cari mata pelajaran, kelas, hari..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200/90 rounded-xl text-xs font-medium focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 text-slate-800 transition outline-none"
          />
        </div>

        {/* View Switcher Buttons */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100/90 rounded-2xl border border-slate-200/60 self-start sm:self-auto">
          <button
            onClick={() => setViewMode('matrix')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              viewMode === 'matrix' ? 'bg-white text-blue-700 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <LayoutGrid size={14} />
            <span>Matriks Mingguan</span>
          </button>

          <button
            onClick={() => setViewMode('tabs')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              viewMode === 'tabs' ? 'bg-white text-blue-700 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <CalendarDays size={14} />
            <span>Tab Harian</span>
          </button>

          <button
            onClick={() => setViewMode('table')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              viewMode === 'table' ? 'bg-white text-blue-700 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <TableIcon size={14} />
            <span>Tabel Rekap</span>
          </button>
        </div>
      </div>

      {/* ── PRINT HEADER (Visible only in print) ── */}
      <div className="hidden print:block mb-6 text-center border-b pb-4">
        <h1 className="text-xl font-bold text-slate-900">JADWAL MENGAJAR GURU</h1>
        <h2 className="text-base font-semibold text-slate-700">MI ATTAQWA 15 BEKASI</h2>
        <p className="text-xs text-slate-500 mt-1">Nama Guru: {staffName || '-'} | Tahun Ajaran 2025/2026</p>
      </div>

      {/* ── MAIN CONTENT ACCORDING TO VIEW MODE ── */}
      {schedules.length === 0 ? (
        <div className="bg-white border-2 border-dashed border-slate-200 rounded-[2rem] text-center py-20 px-4">
          <BookOpen className="mx-auto text-slate-300 mb-4" size={54} />
          <h3 className="text-lg font-bold text-slate-700 mb-1">Belum Ada Jadwal Mengajar</h3>
          <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto">
            Anda belum ditugaskan mengajar di kelas manapun. Jadwal akan muncul otomatis setelah admin atau wali kelas menambahkan nama Anda pada jadwal mata pelajaran kelas di menu Classroom.
          </p>
          <Link
            href="/classroom"
            className="btn-tactile inline-flex items-center gap-2 px-5 py-2.5 mt-5 rounded-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition shadow-sm"
          >
            <GraduationCap size={15} />
            <span>Lihat Daftar Kelas</span>
          </Link>
        </div>
      ) : (
        <>
          {/* ══════════ VIEW MODE 1: MATRIX MINGGUAN (Default) ══════════ */}
          {viewMode === 'matrix' && (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
              {DAYS.map(day => {
                const daySchedules = schedulesByDay[day] || [];
                const isToday = todayDay.toLowerCase() === day.toLowerCase();

                return (
                  <div
                    key={day}
                    className={`bg-white rounded-[2rem] border shadow-2xs flex flex-col overflow-hidden transition-all ${
                      isToday 
                        ? 'border-blue-300 ring-2 ring-blue-500/20 shadow-blue-500/5' 
                        : 'border-slate-200/80 hover:shadow-md'
                    }`}
                  >
                    {/* Day Column Header */}
                    <div className={`px-5 py-4 flex items-center justify-between border-b ${
                      isToday 
                        ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white border-blue-600' 
                        : 'bg-slate-50/80 border-slate-100 text-slate-800'
                    }`}>
                      <div className="flex items-center gap-2.5">
                        <div className={`w-2.5 h-7 rounded-full ${isToday ? 'bg-white' : 'bg-blue-600'}`} />
                        <h3 className="font-headline font-bold text-base tracking-tight">{day}</h3>
                        {isToday && (
                          <span className="bg-white/20 text-white text-[10px] font-black px-2 py-0.5 rounded-full border border-white/30 tracking-wider">
                            HARI INI
                          </span>
                        )}
                      </div>
                      <span className={`text-xs font-bold ${isToday ? 'text-blue-100' : 'text-slate-400'}`}>
                        {daySchedules.length} Sesi
                      </span>
                    </div>

                    {/* Schedule Cards for the Day */}
                    <div className="p-4 flex-1 flex flex-col gap-3 min-h-[160px]">
                      {daySchedules.length === 0 ? (
                        <div className="flex-1 flex flex-col items-center justify-center text-center py-8 text-slate-300">
                          <p className="text-xs font-semibold text-slate-400">Tidak ada jadwal</p>
                        </div>
                      ) : (
                        daySchedules.map((s, idx) => {
                          const colorKey = (s.name || '').toLowerCase();
                          const colorIdx = subjectColorMap[colorKey] ?? 0;
                          const color = SUBJECT_COLORS[colorIdx % SUBJECT_COLORS.length];
                          const conflictInfo = conflicts[s.id];

                          const isRunningNow = isToday && (currentMinutes >= s.startMinutes && currentMinutes <= s.endMinutes);

                          return (
                            <div
                              key={s.id || idx}
                              className={`p-4 rounded-2xl border transition-all flex flex-col gap-2.5 relative group ${
                                conflictInfo 
                                  ? 'bg-rose-50/90 border-rose-300 ring-2 ring-rose-500/20' 
                                  : isRunningNow
                                  ? 'bg-emerald-50/90 border-emerald-300 ring-2 ring-emerald-500/20 shadow-sm'
                                  : `${color.bg} ${color.border} hover:shadow-2xs`
                              }`}
                            >
                              {/* Time + Status */}
                              <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-1.5">
                                  <span className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded-md ${
                                    conflictInfo ? 'bg-rose-200 text-rose-900' : color.badge
                                  }`}>
                                    {s.startTime} – {s.endTime}
                                  </span>
                                  {s.durationStr && (
                                    <span className="text-[10px] font-semibold text-slate-400">({s.durationStr})</span>
                                  )}
                                </div>

                                {isRunningNow && (
                                  <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-300 px-2 py-0.5 rounded-full animate-pulse">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
                                    Berlangsung
                                  </span>
                                )}

                                {conflictInfo && (
                                  <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-wider bg-rose-200 text-rose-900 px-2 py-0.5 rounded-full">
                                    <AlertTriangle size={10} />
                                    Bentrok
                                  </span>
                                )}
                              </div>

                              {/* Subject Name */}
                              <div>
                                <h4 className={`font-headline font-black text-sm leading-snug ${
                                  conflictInfo ? 'text-rose-900' : color.text
                                }`}>
                                  {s.name}
                                </h4>
                                {conflictInfo && (
                                  <p className="text-[10px] text-rose-700 font-bold mt-1">
                                    {conflictInfo.message}
                                  </p>
                                )}
                              </div>

                              {/* Classroom + Link */}
                              <div className="flex items-center justify-between pt-1 border-t border-black/5 mt-auto">
                                <span className="inline-flex items-center gap-1 text-xs font-bold text-slate-700">
                                  <GraduationCap size={13} className="text-slate-400 shrink-0" />
                                  Kelas {s.classroom?.name || '-'}
                                </span>

                                {s.classroom_id && (
                                  <Link
                                    href={`/classroom/${s.classroom_id}`}
                                    className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-700 hover:text-blue-900 bg-white/80 hover:bg-white px-2 py-0.5 rounded-lg transition border border-black/5 print:hidden"
                                    title="Masuk Ruang Kelas"
                                  >
                                    <span>Kelas</span>
                                    <ExternalLink size={10} />
                                  </Link>
                                )}
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* ══════════ VIEW MODE 2: TAB HARIAN INTERAKTIF ══════════ */}
          {viewMode === 'tabs' && (
            <div className="bg-white rounded-[2rem] border border-slate-200/80 shadow-sm overflow-hidden flex flex-col">
              {/* Day Tabs */}
              <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center gap-2 overflow-x-auto hide-scrollbar">
                {DAYS.map(day => {
                  const isSelected = selectedDayTab === day;
                  const count = (schedulesByDay[day] || []).length;
                  const isToday = todayDay.toLowerCase() === day.toLowerCase();

                  return (
                    <button
                      key={day}
                      onClick={() => setSelectedDayTab(day)}
                      className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-2 active:scale-95 shrink-0 ${
                        isSelected 
                          ? 'bg-blue-600 text-white shadow-xs' 
                          : 'bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                      }`}
                    >
                      <span>{day}</span>
                      {isToday && (
                        <span className={`text-[9px] px-1.5 py-0.2 rounded-full font-black uppercase ${
                          isSelected ? 'bg-white/25 text-white' : 'bg-blue-100 text-blue-700'
                        }`}>
                          Hari Ini
                        </span>
                      )}
                      <span className={`text-[10px] px-1.5 rounded-full font-extrabold leading-5 ${
                        isSelected ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-600'
                      }`}>
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Schedules in Selected Day */}
              <div className="p-6 sm:p-7 divide-y divide-slate-100">
                {(schedulesByDay[selectedDayTab] || []).length === 0 ? (
                  <div className="text-center py-14 text-slate-400">
                    <Clock size={40} className="mx-auto mb-2 text-slate-300" />
                    <p className="font-bold text-slate-700 text-sm">Tidak ada jadwal mengajar pada hari {selectedDayTab}</p>
                    <p className="text-xs text-slate-400 mt-0.5">Pilih hari lain di atas untuk melihat agenda belajar.</p>
                  </div>
                ) : (
                  (schedulesByDay[selectedDayTab] || []).map((s, idx) => {
                    const colorKey = (s.name || '').toLowerCase();
                    const colorIdx = subjectColorMap[colorKey] ?? 0;
                    const color = SUBJECT_COLORS[colorIdx % SUBJECT_COLORS.length];
                    const conflictInfo = conflicts[s.id];
                    const isToday = todayDay.toLowerCase() === selectedDayTab.toLowerCase();
                    const isRunningNow = isToday && (currentMinutes >= s.startMinutes && currentMinutes <= s.endMinutes);

                    return (
                      <div 
                        key={s.id || idx}
                        className={`py-4 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-4`}
                      >
                        <div className="flex items-start sm:items-center gap-4">
                          {/* Time block */}
                          <div className={`w-28 sm:w-32 p-3 rounded-2xl text-center border ${
                            isRunningNow ? 'bg-emerald-50 border-emerald-200' : 'bg-slate-50 border-slate-200/80'
                          }`}>
                            <p className="text-sm font-black text-slate-800 font-mono">{s.startTime}</p>
                            <p className="text-[10px] font-bold text-slate-400 uppercase">s.d</p>
                            <p className="text-xs font-bold text-slate-600 font-mono">{s.endTime}</p>
                          </div>

                          {/* Subject details */}
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="font-headline font-black text-base text-slate-800">{s.name}</h3>
                              {isRunningNow && (
                                <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase bg-emerald-100 text-emerald-800 border border-emerald-300 px-2 py-0.5 rounded-full animate-pulse">
                                  Sedang Berlangsung
                                </span>
                              )}
                              {conflictInfo && (
                                <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase bg-rose-100 text-rose-800 border border-rose-200 px-2 py-0.5 rounded-full">
                                  Bentrok
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-3 mt-1.5 text-xs text-slate-500">
                              <span className="font-bold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-lg border border-blue-100 flex items-center gap-1">
                                <GraduationCap size={13} /> Kelas {s.classroom?.name || '-'}
                              </span>
                              {s.durationStr && (
                                <span className="font-medium text-slate-400">Durasi: {s.durationStr}</span>
                              )}
                            </div>

                            {conflictInfo && (
                              <p className="text-xs text-rose-600 font-bold mt-1.5 flex items-center gap-1">
                                <AlertTriangle size={13} /> {conflictInfo.message}
                              </p>
                            )}
                          </div>
                        </div>

                        {s.classroom_id && (
                          <Link
                            href={`/classroom/${s.classroom_id}`}
                            className="btn-tactile inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-50 hover:bg-blue-50 hover:text-blue-700 border border-slate-200 text-slate-700 text-xs font-bold transition shadow-2xs self-start sm:self-auto"
                          >
                            <span>Buka Ruang Kelas</span>
                            <ExternalLink size={13} />
                          </Link>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* ══════════ VIEW MODE 3: TABEL REKAP LENGKAP ══════════ */}
          {viewMode === 'table' && (
            <div className="bg-white rounded-[2rem] border border-slate-200/80 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <BookOpen size={18} className="text-blue-600" />
                  <h3 className="font-headline font-bold text-base text-slate-800">Rekapitulasi Lengkap Jadwal Mengajar</h3>
                </div>
                <span className="text-xs font-bold text-slate-400">{filteredSchedules.length} Sesi Terjadwal</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/80 text-xs font-bold text-slate-500 uppercase tracking-wider">
                      <th className="px-6 py-3.5">Hari</th>
                      <th className="px-4 py-3.5">Mata Pelajaran</th>
                      <th className="px-4 py-3.5">Kelas</th>
                      <th className="px-4 py-3.5">Waktu Belajar</th>
                      <th className="px-4 py-3.5">Durasi</th>
                      <th className="px-4 py-3.5 text-center print:hidden">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {DAYS.map(day => {
                      const daySchedules = schedulesByDay[day] || [];
                      if (daySchedules.length === 0) return null;
                      const isToday = todayDay.toLowerCase() === day.toLowerCase();

                      return daySchedules.map((s, idx) => {
                        const colorKey = (s.name || '').toLowerCase();
                        const cIdx = subjectColorMap[colorKey] ?? 0;
                        const color = SUBJECT_COLORS[cIdx % SUBJECT_COLORS.length];
                        const conflictInfo = conflicts[s.id];

                        return (
                          <tr
                            key={s.id || `${day}-${idx}`}
                            className={`hover:bg-slate-50/60 transition ${
                              conflictInfo ? 'bg-rose-50/40' : isToday ? 'bg-blue-50/20' : ''
                            }`}
                          >
                            {idx === 0 && (
                              <td
                                className={`px-6 py-3.5 font-bold align-top ${isToday ? 'text-blue-700' : 'text-slate-800'}`}
                                rowSpan={daySchedules.length}
                              >
                                <span>{day}</span>
                                {isToday && (
                                  <span className="block text-[10px] font-black text-blue-600 mt-0.5 uppercase">
                                    Hari Ini
                                  </span>
                                )}
                              </td>
                            )}

                            <td className="px-4 py-3.5">
                              <div className="flex items-center gap-2">
                                <span className={`w-2 h-2 rounded-full shrink-0 ${conflictInfo ? 'bg-rose-500' : color.dot}`} />
                                <span className="font-bold text-slate-800">{s.name}</span>
                                {conflictInfo && (
                                  <span className="text-[10px] font-bold text-rose-700 bg-rose-100 px-2 py-0.5 rounded-full">
                                    Bentrok
                                  </span>
                                )}
                              </div>
                            </td>

                            <td className="px-4 py-3.5 font-semibold text-slate-700">
                              Kelas {s.classroom?.name || '-'}
                            </td>

                            <td className="px-4 py-3.5 font-mono text-xs font-bold text-slate-800">
                              {s.startTime} – {s.endTime}
                            </td>

                            <td className="px-4 py-3.5 text-xs text-slate-500 font-medium">
                              {s.durationStr}
                            </td>

                            <td className="px-4 py-3.5 text-center print:hidden">
                              {s.classroom_id && (
                                <Link
                                  href={`/classroom/${s.classroom_id}`}
                                  className="inline-flex items-center gap-1 px-3 py-1 bg-slate-100 hover:bg-blue-600 hover:text-white rounded-lg text-xs font-bold text-slate-700 transition"
                                >
                                  <span>Buka</span>
                                  <ExternalLink size={11} />
                                </Link>
                              )}
                            </td>
                          </tr>
                        );
                      });
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {/* Print styles */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          body {
            background: white !important;
          }
          .print\\:hidden {
            display: none !important;
          }
          table {
            border-collapse: collapse !important;
            width: 100% !important;
          }
          th, td {
            border: 1px solid #cbd5e1 !important;
            padding: 8px !important;
          }
        }
      `}} />
    </div>
  );
}
