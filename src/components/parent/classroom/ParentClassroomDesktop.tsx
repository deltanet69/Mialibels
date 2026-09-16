'use client';

import React from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  BookOpen, 
  CalendarDays, 
  Sparkles, 
  FileText 
} from 'lucide-react';
import { ScheduleItem, StudentInfo, AttendanceRecord, AttendanceSummary } from './types';

interface ParentClassroomDesktopProps {
  student: StudentInfo;
  activeTab: 'jadwal' | 'rekap' | 'nilai' | 'raport';
  setActiveTab: (tab: 'jadwal' | 'rekap' | 'nilai' | 'raport') => void;
  selectedDay: string;
  setSelectedDay: (day: string) => void;
  filteredSchedules: ScheduleItem[];
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

export function ParentClassroomDesktop({
  student,
  activeTab,
  setActiveTab,
  selectedDay,
  setSelectedDay,
  filteredSchedules,
  month,
  year,
  prevMonth,
  nextMonth,
  attendanceRecords,
  attendanceSummary,
}: ParentClassroomDesktopProps) {
  const now = new Date();

  return (
    <div className="space-y-5 max-w-5xl mx-auto font-sans">
      {/* Header Banner */}
      <div 
        className="rounded-2xl py-6 px-6 text-white shadow-md relative overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, #002957 0%, #002957 50%, #002957 100%)',
          backgroundColor: '#002957',
          color: '#ffffff',
        }}
      >
        <div className="relative z-10">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest mb-2" style={{ color: '#bfdbfe' }}>
            <span className="px-2.5 py-0.5 rounded-full" style={{ backgroundColor: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.2)' }}>
              Kelas {student.className}
            </span>
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight leading-none mb-2" style={{ color: '#ffffff' }}>
            Classroom
          </h1>
          <p className="text-sm" style={{ color: '#dbeafe' }}>
            Data kelas & rekap akademik {student.name.split(' ')[0]}
          </p>
        </div>
      </div>

      {/* Desktop Tabs */}
      <div className="flex items-center gap-1.5 p-1.5 bg-slate-200/70 rounded-2xl">
        {[
          { id: 'jadwal', label: 'Jadwal Pelajaran', icon: BookOpen },
          { id: 'rekap', label: 'Rekap Absensi', icon: CalendarDays },
          { id: 'nilai', label: 'Penilaian Akademik', icon: Sparkles },
          { id: 'raport', label: 'Buku Raport', icon: FileText },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                isActive
                  ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/30'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Icon size={16} strokeWidth={isActive ? 2.5 : 2} className={isActive ? 'text-white' : 'text-slate-400'} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Desktop Tab 1: Jadwal */}
      {activeTab === 'jadwal' && (
        <div className="space-y-4 bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-slate-800 text-lg">Jadwal Pelajaran Kelas {student.className}</h3>
              <p className="text-xs text-slate-400">Silakan pilih hari untuk melihat jadwal.</p>
            </div>
            <div className="flex gap-2">
              {DAYS.map((day) => (
                <button
                  key={day}
                  onClick={() => setSelectedDay(day)}
                  className={`px-4 py-2 rounded-full text-xs font-bold transition-all border ${
                    selectedDay === day
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {day}
                </button>
              ))}
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {filteredSchedules.length > 0 ? filteredSchedules.map((item, idx) => {
              const timeStart = item.time_start || item.time?.split('-')[0]?.trim() || '';
              const timeEnd = item.time_end || item.time?.split('-')[1]?.trim() || '';
              const isRest = item.name.toLowerCase().includes('istirahat');
              
              return (
                <div key={item.id || idx} className={`p-4 rounded-xl border flex items-center justify-between ${
                  isRest ? 'bg-amber-50/40 border-amber-100' : 'bg-slate-50/50 border-slate-100'
                }`}>
                  <div>
                    <span className="text-xs font-bold text-blue-600 block mb-1">{timeStart} - {timeEnd}</span>
                    <h4 className="font-bold text-sm text-slate-800">{item.name}</h4>
                    {!isRest && (
                      <p className="text-xs text-slate-500 mt-0.5">{item.teacher?.name || '-'}</p>
                    )}
                  </div>
                </div>
              );
            }) : (
              <div className="col-span-2 py-8 text-center border border-dashed border-slate-200 rounded-xl bg-slate-50">
                <p className="text-slate-500 text-sm">Tidak ada jadwal tercatat untuk hari {selectedDay}.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Desktop Tab 2: Absensi */}
      {activeTab === 'rekap' && (
        <div className="space-y-4 bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-800 text-lg">Rekapitulasi Kehadiran</h3>
              <p className="text-xs text-slate-400">Bulan {MONTH_NAMES[month - 1]} {year}</p>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={prevMonth} className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 transition cursor-pointer">
                <ChevronLeft size={16} />
              </button>
              <button onClick={nextMonth} disabled={year === now.getFullYear() && month === now.getMonth() + 1} className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 transition disabled:opacity-30 cursor-pointer">
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
          <div className="grid grid-cols-4 gap-4 my-4">
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-700 text-center font-bold">Hadir: {attendanceSummary?.hadir ?? 0}</div>
            <div className="p-4 rounded-xl bg-amber-50 border border-amber-100 text-amber-700 text-center font-bold">Sakit: {attendanceSummary?.sakit ?? 0}</div>
            <div className="p-4 rounded-xl bg-sky-50 border border-sky-100 text-sky-700 text-center font-bold">Izin: {attendanceSummary?.izin ?? 0}</div>
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-100 text-rose-700 text-center font-bold">Alpha: {attendanceSummary?.alpha ?? 0}</div>
          </div>
        </div>
      )}

      {/* Desktop Tab 3: Nilai */}
      {activeTab === 'nilai' && (
        <div className="space-y-4 bg-white rounded-2xl p-8 border border-slate-100 shadow-sm text-center">
          <span className="text-4xl block mb-2">🚀</span>
          <h3 className="font-bold text-slate-800 text-lg">Dalam Pengembangan</h3>
          <p className="text-sm text-slate-500 max-w-md mx-auto">
            Laporan penilaian berkala sedang dalam masa penyusunan integrasi raport digital. Segera hadir.
          </p>
        </div>
      )}

      {/* Desktop Tab 4: Raport */}
      {activeTab === 'raport' && (
        <div className="space-y-4 bg-white rounded-2xl p-8 border border-slate-100 shadow-sm text-center">
          <span className="text-4xl block mb-2">📜</span>
          <h3 className="font-bold text-slate-800 text-lg">Buku Raport Digital</h3>
          <p className="text-sm text-slate-500 max-w-md mx-auto">
            Tersedia setelah proses evaluasi dan validasi nilai semester selesai dilaksanakan.
          </p>
        </div>
      )}
    </div>
  );
}
