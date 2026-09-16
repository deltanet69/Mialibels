'use client';

import React from 'react';
import Link from 'next/link';
import { 
  ChevronLeft, 
  ChevronRight, 
  UserCircle, 
  Calendar, 
  CalendarDays, 
  Award, 
  FileText, 
  Bell,
  Clock,
  CheckCircle2,
  AlertCircle,
  Download,
  BookOpen,
  Sparkles,
  TrendingUp,
  GraduationCap
} from 'lucide-react';
import { ScheduleItem, StudentInfo, AttendanceRecord, AttendanceSummary } from './types';
import { getWIBParts } from '@/lib/dateUtils';
import { 
  AnimatedBookTabIcon, 
  AnimatedAttendanceTabIcon, 
  AnimatedAwardTabIcon, 
  AnimatedReportTabIcon 
} from '@/components/parent/AnimatedNavIcons';
import { ParentNotificationBell } from '@/components/parent/notifications/ParentNotificationBell';

interface ParentClassroomMobileProps {
  student: StudentInfo;
  activeTab: 'jadwal' | 'rekap' | 'nilai' | 'raport';
  setActiveTab: (tab: 'jadwal' | 'rekap' | 'nilai' | 'raport') => void;
  selectedDay: string;
  setSelectedDay: (day: string) => void;
  filteredSchedules: ScheduleItem[];
  currentTime: Date | null;
  month: number;
  year: number;
  prevMonth: () => void;
  nextMonth: () => void;
  attendanceRecords: AttendanceRecord[];
  attendanceSummary: AttendanceSummary | null;
  loadingAttendance: boolean;
}

const DAYS = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat'];
const MONTH_NAMES = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

export function ParentClassroomMobile({
  student,
  activeTab,
  setActiveTab,
  selectedDay,
  setSelectedDay,
  filteredSchedules,
  currentTime,
  month,
  year,
  prevMonth,
  nextMonth,
  attendanceRecords,
  attendanceSummary,
  loadingAttendance,
}: ParentClassroomMobileProps) {
  const now = new Date();

  const parseTimeToMin = (tStr?: string | null) => {
    if (!tStr) return null;
    const cleaned = tStr.replace('.', ':').trim();
    const parts = cleaned.split(':');
    if (parts.length < 2) return null;
    const h = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10);
    if (isNaN(h) || isNaN(m)) return null;
    return h * 60 + m;
  };

  const TAB_ITEMS = [
    { id: 'jadwal', label: 'Jadwal', Icon: AnimatedBookTabIcon },
    { id: 'rekap', label: 'Absensi', Icon: AnimatedAttendanceTabIcon },
    { id: 'nilai', label: 'Nilai', Icon: AnimatedAwardTabIcon },
    { id: 'raport', label: 'Raport', Icon: AnimatedReportTabIcon },
  ];

  return (
    <div className="w-full pb-28 font-sans bg-[#f4f7fb] min-h-screen" style={{ backgroundColor: '#f4f7fb' }}>
      {/* 1. Header Banner (Consistent Dashboard/Profile Deep Navy Gradient + Glow + School Badge) */}
      <div 
        className="bg-gradient-to-b from-[#0d3880] via-[#1557bf] to-[#1d6bf0] pt-10 pb-20 px-5 text-white relative overflow-hidden"
        style={{
          background: 'linear-gradient(180deg, #163364ff 0%, #1e4480ff 55%, #1557bf 100%)',
          backgroundColor: '#163364',
          paddingTop: '32px',
          paddingBottom: '82px',
          paddingLeft: '20px',
          paddingRight: '20px',
          color: '#ffffff',
        }}
      >
        {/* Ambient Glow */}
        <div 
          className="absolute top-0 right-0 w-48 h-48 rounded-full pointer-events-none -mr-12 -mt-12 opacity-20" 
          style={{ background: 'radial-gradient(circle, #38bdf8 0%, rgba(255,255,255,0) 70%)' }} 
        />

        {/* Top Row: Title + Notification Bell */}
        <div className="flex justify-between items-start relative z-10">
          <div>
            <h1 className="text-[22px] font-extrabold text-white tracking-tight leading-snug m-0" style={{ fontSize: '22px', fontWeight: 800, color: '#ffffff' }}>
              Classroom
            </h1>
            <p className="text-xs text-white/80 mt-1 mb-0" style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.8)' }}>
              Data kelas & rekap akademik {student.name.split(' ')[0]}
            </p>
          </div>

          {/* Notification Bell */}
          <ParentNotificationBell />
        </div>
      </div>

      {/* 2. Floating Sub-Tab Segmented Card (-mt-14) */}
      <div 
        className="-mt-14 px-4 relative z-20"
        style={{ marginTop: '-56px', paddingLeft: '16px', paddingRight: '16px', position: 'relative', zIndex: 20 }}
      >
        <div className="bg-white rounded-2xl p-1.5 shadow-[0_12px_32px_-6px_rgba(22,51,100,0.12)] border border-slate-100 flex items-center justify-between gap-1 relative overflow-hidden">
          {TAB_ITEMS.map((tab) => {
            const isActive = activeTab === tab.id;
            const TabIcon = tab.Icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex-1 py-2 px-1 rounded-xl transition-all duration-200 flex flex-col items-center justify-center gap-1 cursor-pointer active:scale-95 ${
                  isActive
                    ? 'bg-blue-50/90 text-blue-700 border border-blue-200/70 shadow-2xs font-extrabold'
                    : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50/80 border border-transparent font-semibold'
                }`}
              >
                <div className="h-6 w-6 flex items-center justify-center">
                  <TabIcon isActive={isActive} />
                </div>
                <span className={`text-[11px] tracking-tight transition-colors ${isActive ? 'text-blue-700 font-black' : 'text-slate-500'}`}>
                  {tab.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── TAB 1: JADWAL PELAJARAN ── */}
      {activeTab === 'jadwal' && (
        <div className="px-4 mt-5 space-y-4">
          {/* Day Selector Bar (Clean, no visible scrollbar) */}
          <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 snap-x [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
            {DAYS.map((day) => {
              const isSelected = selectedDay === day;
              const isTodayWIB = currentTime && getWIBParts(currentTime).dayOfWeek >= 1 && DAYS[getWIBParts(currentTime).dayOfWeek - 1] === day;
              return (
                <button
                  key={day}
                  onClick={() => setSelectedDay(day)}
                  className={`snap-center shrink-0 px-4 py-2 rounded-full text-xs transition-all border cursor-pointer active:scale-95 ${
                    isSelected
                      ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-600/20 font-black'
                      : isTodayWIB
                      ? 'bg-blue-50 text-blue-700 border-blue-200 font-bold'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 font-semibold shadow-2xs'
                  }`}
                >
                  {day}
                  {isTodayWIB && <span className="ml-1.5 opacity-90 font-normal text-[10px]">(Hari Ini)</span>}
                </button>
              );
            })}
          </div>

          {/* Section Header */}
          <div className="flex items-center justify-between px-1 pt-1">
            <div className="flex items-center gap-1.5">
              <Clock size={14} className="text-blue-600" />
              <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-600 m-0">
                JADWAL PELAJARAN • {selectedDay.toUpperCase()}
              </h2>
            </div>
            <span className="text-[10px] font-bold text-slate-400">
              {filteredSchedules.length} Sesi Pelajaran
            </span>
          </div>

          {/* Schedule List */}
          {filteredSchedules.length > 0 ? (
            <div className="space-y-3">
              {filteredSchedules.map((item, idx) => {
                const colors = [
                  'bg-purple-50 text-purple-700 border-purple-200',
                  'bg-blue-50 text-blue-700 border-blue-200',
                  'bg-emerald-50 text-emerald-700 border-emerald-200',
                  'bg-cyan-50 text-cyan-700 border-cyan-200',
                  'bg-pink-50 text-pink-700 border-pink-200',
                ];
                const isRest = item.name.toLowerCase().includes('istirahat');
                const badgeClass = isRest ? 'bg-amber-50 text-amber-700 border-amber-200' : colors[idx % colors.length];

                const timeStart = item.time_start || item.time?.split('-')[0]?.trim() || '';
                const timeEnd = item.time_end || item.time?.split('-')[1]?.trim() || '';
                
                // Realtime Ongoing Logic
                let isOngoing = false;
                if (currentTime && timeStart && timeEnd) {
                  const currentParts = getWIBParts(currentTime);
                  const isTodayWIB = currentParts.dayOfWeek >= 1 && DAYS[currentParts.dayOfWeek - 1] === selectedDay;
                  
                  if (isTodayWIB) {
                    const currentWibMin = currentParts.hours * 60 + currentParts.minutes;
                    const startMin = parseTimeToMin(timeStart);
                    const endMin = parseTimeToMin(timeEnd);
                    if (startMin !== null && endMin !== null && currentWibMin >= startMin && currentWibMin < endMin) {
                      isOngoing = true;
                    }
                  }
                }

                return (
                  <div 
                    key={item.id || `sch-${idx}`}
                    className={`rounded-2xl border transition-all ${
                      isOngoing
                        ? 'border-blue-400 shadow-md ring-2 ring-blue-500/20 bg-gradient-to-br from-blue-50/80 to-indigo-50/60'
                        : isRest
                        ? 'bg-amber-50/40 border-amber-100'
                        : 'bg-white border-slate-100/90 shadow-[0_2px_8px_rgba(15,23,42,0.03)]'
                    }`}
                  >
                    {/* Ongoing Live Status Badge — inside card, top row */}
                    {isOngoing && (
                      <div className="flex items-center px-3 pt-2.5 pb-0">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-600 text-white shadow-xs">
                          <span className="w-1.5 h-1.5 rounded-full bg-cyan-300 animate-ping" />
                          <span>Sedang Berlangsung</span>
                        </span>
                      </div>
                    )}

                    {/* Time + Subject Row */}
                    <div className="flex items-center gap-3.5 p-3.5 pt-2">
                      {/* Time Column */}
                      <div className={`flex flex-col items-center justify-center w-12 text-[11px] font-bold rounded-xl py-1.5 shrink-0 border ${
                        isOngoing
                          ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                          : 'text-slate-500 bg-slate-50 border-slate-100'
                      }`}>
                        <span className="font-mono">{timeStart}</span>
                        <div className={`w-1.5 h-0.5 my-0.5 rounded-full ${isOngoing ? 'bg-blue-300' : 'bg-slate-300'}`} />
                        <span className="font-mono">{timeEnd}</span>
                      </div>

                      {/* Subject Info */}
                      <div className="flex-1 min-w-0">
                        <span className={`inline-block text-[10px] font-extrabold px-2.5 py-0.5 rounded-md border mb-1 ${badgeClass}`}>
                          {item.name}
                        </span>
                        {item.teacher?.name && !isRest && (
                          <p className="text-xs text-slate-500 mt-1 font-medium truncate flex items-center gap-1 m-0">
                            <UserCircle size={13} className="text-slate-400 shrink-0" />
                            <span className="truncate">{item.teacher.name}</span>
                          </p>
                        )}
                        {isRest && (
                          <p className="text-[11px] text-amber-700 mt-0.5 font-medium m-0">
                            Istirahat & pengisian energi siswa
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-white rounded-2xl p-8 border border-slate-100 shadow-[0_2px_12px_rgba(15,23,42,0.04)] text-center mt-4">
              <Calendar className="w-10 h-10 text-slate-300 mx-auto mb-2" strokeWidth={1.5} />
              <p className="font-bold text-slate-800 text-sm mt-2">Tidak Ada Jadwal</p>
              <p className="text-xs text-slate-400 mt-1">Belum ada jadwal pelajaran untuk hari {selectedDay}.</p>
            </div>
          )}
        </div>
      )}

      {/* ── TAB 2: REKAP ABSENSI ── */}
      {activeTab === 'rekap' && (
        <div className="px-4 mt-5 space-y-4">
          {/* Section Header */}
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-1.5">
              <CalendarDays size={14} className="text-blue-600" />
              <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-600 m-0">
                REKAPITULASI PRESENSI
              </h2>
            </div>
            <span className="text-[10px] font-bold text-slate-400">
              {MONTH_NAMES[month - 1]} {year}
            </span>
          </div>

          {/* Month Selector Card */}
          <div className="bg-white rounded-2xl p-3 shadow-sm border border-slate-100 flex items-center justify-between">
            <button
              onClick={prevMonth}
              className="w-9 h-9 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200/80 flex items-center justify-center text-slate-600 font-bold active:scale-95 transition-transform cursor-pointer"
            >
              <ChevronLeft size={18} />
            </button>
            <div className="text-center">
              <p className="font-black text-slate-800 text-sm m-0">
                {MONTH_NAMES[month - 1]} {year}
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5 m-0">
                {attendanceRecords.length} hari presensi tercatat
              </p>
            </div>
            <button
              onClick={nextMonth}
              disabled={year === now.getFullYear() && month === now.getMonth() + 1}
              className="w-9 h-9 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200/80 flex items-center justify-center text-slate-600 font-bold disabled:opacity-30 active:scale-95 transition-transform cursor-pointer"
            >
              <ChevronRight size={18} />
            </button>
          </div>

          {/* 4 Stat Summary Cards */}
          <div className="grid grid-cols-4 gap-2">
            <div className="bg-emerald-50/60 border border-emerald-200/80 rounded-2xl p-2.5 flex flex-col items-center shadow-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500 mb-1"></span>
              <span className="text-lg font-black text-emerald-700">{attendanceSummary?.hadir ?? 0}</span>
              <span className="text-[10px] font-bold text-emerald-800">Hadir</span>
            </div>
            <div className="bg-amber-50/60 border border-amber-200/80 rounded-2xl p-2.5 flex flex-col items-center shadow-xs">
              <span className="w-2 h-2 rounded-full bg-amber-500 mb-1"></span>
              <span className="text-lg font-black text-amber-700">{attendanceSummary?.sakit ?? 0}</span>
              <span className="text-[10px] font-bold text-amber-800">Sakit</span>
            </div>
            <div className="bg-sky-50/60 border border-sky-200/80 rounded-2xl p-2.5 flex flex-col items-center shadow-xs">
              <span className="w-2 h-2 rounded-full bg-sky-500 mb-1"></span>
              <span className="text-lg font-black text-sky-700">{attendanceSummary?.izin ?? 0}</span>
              <span className="text-[10px] font-bold text-sky-800">Izin</span>
            </div>
            <div className="bg-rose-50/60 border border-rose-200/80 rounded-2xl p-2.5 flex flex-col items-center shadow-xs">
              <span className="w-2 h-2 rounded-full bg-rose-500 mb-1"></span>
              <span className="text-lg font-black text-rose-700">{attendanceSummary?.alpha ?? 0}</span>
              <span className="text-[10px] font-bold text-rose-800">Alpha</span>
            </div>
          </div>

          {/* Attendance Log List */}
          {loadingAttendance ? (
            <div className="bg-white rounded-2xl p-8 border border-slate-100 text-center flex flex-col items-center justify-center">
              <div className="w-7 h-7 border-3 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-xs text-slate-400 mt-2 font-medium">Memuat data kehadiran...</p>
            </div>
          ) : attendanceRecords.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 shadow-xs border border-slate-100 flex flex-col items-center text-center">
              <CalendarDays className="w-10 h-10 text-slate-300 mx-auto mb-2" strokeWidth={1.5} />
              <p className="font-bold text-slate-800 text-sm mt-2">Belum Ada Data Presensi</p>
              <p className="text-xs text-slate-400 mt-1">Data absensi belum tercatat untuk bulan {MONTH_NAMES[month - 1]} {year}.</p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 divide-y divide-slate-100 overflow-hidden">
              {attendanceRecords.map((rec) => (
                <div key={rec.id} className="p-3.5 flex items-center justify-between">
                  <div>
                    <p className="font-bold text-xs text-slate-800 m-0">
                      {new Date(rec.date + 'T00:00:00').toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                    {rec.reason && <p className="text-[10px] text-slate-400 mt-0.5 m-0 font-medium">{rec.reason}</p>}
                  </div>
                  <span className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full border ${
                    rec.status === 'Hadir' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                    rec.status === 'Sakit' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                    rec.status === 'Izin' ? 'bg-sky-50 text-sky-700 border-sky-200' :
                    'bg-rose-50 text-rose-700 border-rose-200'
                  }`}>
                    {rec.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── TAB 3: NILAI AKADEMIK ── */}
      {activeTab === 'nilai' && (
        <div className="px-4 mt-5 space-y-4">
          {/* Section Header */}
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-1.5">
              <Award size={14} className="text-blue-600" />
              <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-600 m-0">
                NILAI & PERKEMBANGAN BELAJAR
              </h2>
            </div>
            <span className="text-[10px] font-bold text-slate-400">
              Semester Ganjil 2025/2026
            </span>
          </div>

          {/* Hero GPA Card */}
          <div 
            className="rounded-2xl p-5 text-white shadow-md relative overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, #1e40af 0%, #0284c7 100%)',
            }}
          >
            <div className="flex items-center justify-between relative z-10">
              <div>
                <p className="text-[10px] font-bold text-blue-100 uppercase tracking-wider m-0">
                  RATA-RATA NILAI SISWA
                </p>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-3xl font-black text-white">89.4</span>
                  <span className="text-xs font-extrabold text-cyan-200 bg-white/20 px-2 py-0.5 rounded-full">
                    Predikat A (Sangat Baik)
                  </span>
                </div>
                <p className="text-[11px] text-white/80 mt-1.5 m-0">
                  Total 11 Mata Pelajaran • Kurikulum Merdeka
                </p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30 shrink-0 shadow-sm">
                <Sparkles size={24} className="text-yellow-300" />
              </div>
            </div>
          </div>

          {/* Subject Scores List */}
          <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm space-y-3.5">
            <h3 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider m-0">
              Daftar Nilai Per Mata Pelajaran
            </h3>

            {[
              { subject: "Al-Qur'an Hadits", score: 94, teacher: 'Ust. Ahmad Fauzi, S.Pd.I', color: 'emerald' },
              { subject: 'Fikih Ibadah', score: 91, teacher: 'Ust. Ridwan Kamil, S.Ag', color: 'emerald' },
              { subject: 'Matematika', score: 88, teacher: 'Dewi Puspita, S.Pd', color: 'blue' },
              { subject: 'Bahasa Indonesia', score: 90, teacher: 'Siti Aminah, M.Pd', color: 'emerald' },
              { subject: 'IPAS (Sains & Sosial)', score: 86, teacher: 'Budi Santoso, S.Pd', color: 'blue' },
              { subject: 'Bahasa Arab', score: 87, teacher: 'Ust. Fauzan Azim, Lc', color: 'blue' },
            ].map((item, idx) => (
              <div key={idx} className="pb-3 border-b border-slate-100 last:border-0 last:pb-0">
                <div className="flex items-center justify-between mb-1">
                  <div>
                    <span className="text-xs font-black text-slate-800 block">{item.subject}</span>
                    <span className="text-[10px] text-slate-400 font-medium">{item.teacher}</span>
                  </div>
                  <span className={`text-sm font-black ${item.score >= 90 ? 'text-emerald-600' : 'text-blue-600'}`}>
                    {item.score}
                  </span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden mt-1">
                  <div 
                    className={`h-1.5 rounded-full ${item.score >= 90 ? 'bg-emerald-500' : 'bg-blue-500'}`}
                    style={{ width: `${item.score}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── TAB 4: RAPORT ELEKTRONIK ── */}
      {activeTab === 'raport' && (
        <div className="px-4 mt-5 space-y-4">
          {/* Section Header */}
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-1.5">
              <FileText size={14} className="text-blue-600" />
              <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-600 m-0">
                LAPORAN HASIL BELAJAR (RAPORT)
              </h2>
            </div>
            <span className="text-[10px] font-bold text-slate-400">
              T.A. 2025/2026
            </span>
          </div>

          {/* Raport Status Card */}
          <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm relative overflow-hidden">
            <div className="flex items-start gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center shrink-0">
                <GraduationCap size={24} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <CheckCircle2 size={10} className="text-emerald-600" />
                    Terverifikasi
                  </span>
                </div>
                <h3 className="font-black text-slate-800 text-sm m-0">
                  Raport Semester Ganjil 2025/2026
                </h3>
                <p className="text-[11px] text-slate-500 mt-1 m-0">
                  Wali Kelas: <span className="font-bold text-slate-700">{student.homeroomTeacher?.name || 'Dewi Puspitasari, S.Pd'}</span>
                </p>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between gap-2">
              <div className="text-[11px] text-slate-500 font-medium">
                Format: <span className="font-bold text-slate-700">PDF Resmi Madrasah</span>
              </div>
              <button 
                onClick={() => alert('Raport digital semester ganjil dapat diunduh setelah pengesahan rapat pleno dewan guru.')}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition cursor-pointer active:scale-95 shadow-sm"
              >
                <Download size={13} />
                <span>Unduh Raport</span>
              </button>
            </div>
          </div>

          {/* Catatan Wali Kelas */}
          <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm">
            <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider mb-2 m-0 flex items-center gap-1.5">
              <Sparkles size={13} className="text-amber-500" />
              Catatan Wali Kelas
            </h4>
            <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100 italic m-0">
              &quot;Ananda {student.name.split(' ')[0]} menunjukkan perkembangan akademik dan akhlak yang sangat membanggakan di kelas. Terus pertahankan semangat belajar dan aktif berpartisipasi dalam setiap kegiatan madrasah.&quot;
            </p>
          </div>
        </div>
      )}
      
      {/* Whitespace spacer for Floating Bottom Nav */}
      <div className="h-12 w-full shrink-0" aria-hidden="true" />
    </div>
  );
}
