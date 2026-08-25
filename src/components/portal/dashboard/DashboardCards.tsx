'use client';

import React, { useEffect, useState } from 'react';
import { Users, Clock, Calendar as CalendarIcon, Briefcase, Sparkles, TrendingUp, UserCheck, ShieldCheck } from 'lucide-react';

interface DashboardStats {
  students: {
    total: number;
    active: number;
    inactive: number;
  };
  staffs: {
    total: number;
    active: number;
  };
  attendanceRates?: {
    student: number;
    staff: number;
  };
}

export function DashboardCards({ stats, attendanceRates = { student: 0, staff: 0 } }: { stats: DashboardStats, attendanceRates?: DashboardStats['attendanceRates'] }) {
  const [time, setTime] = useState<Date | null>(null);

  useEffect(() => {
    setTime(new Date());
    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('id-ID', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    }).format(date);
  };

  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    }).format(date);
  };

  const studentAttendanceRate = attendanceRates.student;
  const staffAttendanceRate = attendanceRates.staff;

  const studentActivePercent = stats.students.total > 0 
    ? Math.round((stats.students.active / stats.students.total) * 100) 
    : 100;
  
  const studentTeacherRatio = stats.staffs.total > 0 
    ? Math.round(stats.students.total / stats.staffs.total) 
    : 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
      {/* Realtime Clock & Attendance Card */}
      <div className="lg:col-span-2 bg-gradient-to-br from-[#002957] via-[#0c3868] to-[#1d4ed8] p-6 sm:p-7 rounded-[2rem] shadow-sm relative overflow-hidden flex flex-col justify-between min-h-[175px] border border-white/10 text-white">
        {/* Subtle background glow */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-400/15 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
        <div className="absolute bottom-0 left-1/4 w-48 h-48 bg-amber-400/10 rounded-full blur-2xl -mb-16 pointer-events-none"></div>
        
        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 h-full">
          {/* Time & Date */}
          <div className="flex-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/15 text-blue-100 text-xs font-semibold uppercase tracking-wider mb-3">
              <Clock size={13} className="text-blue-300" />
              <span>Waktu Server (WIB)</span>
            </div>
            {time ? (
              <>
                <div className="font-headline font-black text-3xl sm:text-4xl text-white tracking-tight mb-1">
                  {formatTime(time)}
                </div>
                <div className="font-body text-blue-100 text-xs sm:text-sm flex items-center gap-1.5 font-medium">
                  <CalendarIcon size={14} className="text-blue-300 shrink-0" />
                  <span>{formatDate(time)}</span>
                </div>
              </>
            ) : (
              <div className="h-[68px] flex items-center">
                <div className="w-36 h-8 bg-white/20 rounded-xl animate-pulse"></div>
              </div>
            )}
          </div>

          {/* Vertical Divider */}
          <div className="hidden sm:block w-px h-28 bg-white/15"></div>

          {/* Quick Attendance Bars */}
          <div className="flex-1 w-full flex flex-col gap-4">
            <div>
              <div className="flex justify-between items-end mb-1.5">
                <span className="text-xs font-semibold text-blue-100">Presensi Siswa Hari Ini</span>
                <span className="text-xs font-black text-cyan-300">{studentAttendanceRate}%</span>
              </div>
              <div className="w-full bg-black/30 rounded-full h-2.5 overflow-hidden p-0.5">
                <div 
                  className="bg-gradient-to-r from-cyan-400 to-blue-300 h-full rounded-full transition-all duration-500 shadow-sm" 
                  style={{ width: `${studentAttendanceRate}%` }}
                ></div>
              </div>
            </div>
            
            <div>
              <div className="flex justify-between items-end mb-1.5">
                <span className="text-xs font-semibold text-blue-100">Presensi Guru &amp; Staff</span>
                <span className="text-xs font-black text-amber-300">{staffAttendanceRate}%</span>
              </div>
              <div className="w-full bg-black/30 rounded-full h-2.5 overflow-hidden p-0.5">
                <div 
                  className="bg-gradient-to-r from-amber-400 to-orange-300 h-full rounded-full transition-all duration-500 shadow-sm" 
                  style={{ width: `${staffAttendanceRate}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Total Siswa Card */}
      <div className="bg-white p-6 sm:p-7 rounded-[2rem] shadow-sm border border-slate-200/80 flex flex-col justify-between hover:shadow-[0_4px_20px_-4px_rgba(15,39,68,0.06)] transition-all">
        <div>
          <div className="flex items-start justify-between mb-3">
            <div>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Total Siswa Terdata</span>
              <p className="font-headline font-black text-3xl sm:text-4xl text-secondary">{stats.students.total}</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shadow-2xs">
              <Users size={22} />
            </div>
          </div>

          {/* Micro ratio bar */}
          <div className="space-y-1 my-2">
            <div className="flex justify-between items-center text-[11px]">
              <span className="text-slate-400 font-medium">Tingkat Keaktifan</span>
              <span className="font-bold text-blue-600">{studentActivePercent}%</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
              <div 
                className="bg-blue-600 h-full rounded-full transition-all" 
                style={{ width: `${studentActivePercent}%` }}
              ></div>
            </div>
          </div>
        </div>

        <div className="flex gap-4 border-t border-slate-100 pt-3.5 mt-2">
          <div className="flex items-center gap-2 flex-1">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.3)]"></div>
            <div className="flex flex-col">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Aktif</span>
              <span className="text-sm font-bold text-slate-800">{stats.students.active}</span>
            </div>
          </div>
          <div className="w-px bg-slate-100"></div>
          <div className="flex items-center gap-2 flex-1">
            <div className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.3)]"></div>
            <div className="flex flex-col">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Nonaktif</span>
              <span className="text-sm font-bold text-slate-800">{stats.students.inactive}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Total Guru Card */}
      <div className="bg-white p-6 sm:p-7 rounded-[2rem] shadow-sm border border-slate-200/80 flex flex-col justify-between hover:shadow-[0_4px_20px_-4px_rgba(15,39,68,0.06)] transition-all">
        <div>
          <div className="flex items-start justify-between mb-3">
            <div>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Total Guru &amp; Tenaga</span>
              <p className="font-headline font-black text-3xl sm:text-4xl text-secondary">{stats.staffs.total}</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shadow-2xs">
              <Briefcase size={22} />
            </div>
          </div>

          {/* Micro ratio info */}
          <div className="space-y-1 my-2">
            <div className="flex justify-between items-center text-[11px]">
              <span className="text-slate-400 font-medium">Rasio Murid per Guru</span>
              <span className="font-bold text-indigo-600">1 : {studentTeacherRatio}</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
              <div 
                className="bg-indigo-600 h-full rounded-full transition-all" 
                style={{ width: `${Math.min(stats.staffs.active * 2, 100)}%` }}
              ></div>
            </div>
          </div>
        </div>

        <div className="flex gap-4 border-t border-slate-100 pt-3.5 mt-2">
          <div className="flex items-center gap-2 flex-1">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.3)]"></div>
            <div className="flex flex-col">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Aktif Mengajar</span>
              <span className="text-sm font-bold text-slate-800">{stats.staffs.active}</span>
            </div>
          </div>
          <div className="w-px bg-slate-100"></div>
          <div className="flex items-center gap-2 flex-1">
            <div className="w-2.5 h-2.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(37,99,235,0.3)]"></div>
            <div className="flex flex-col">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Status</span>
              <span className="text-sm font-bold text-blue-700">Tercatat</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
