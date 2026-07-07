'use client';

import React, { useEffect, useState } from 'react';
import { Users, UserCheck, UserX, Clock, Calendar as CalendarIcon, Briefcase } from 'lucide-react';

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

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {/* Realtime Clock & Attendance Card */}
      <div className="lg:col-span-2 bg-gradient-to-r from-blue-500 to-cyan-400 p-6 rounded-2xl shadow-lg shadow-blue-500/20 relative overflow-hidden flex flex-col justify-between min-h-[160px] border border-blue-400/30">
        {/* Decorative background shapes */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/20 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none mix-blend-overlay"></div>
        <div className="absolute bottom-0 left-1/4 w-48 h-48 bg-white/10 rounded-full blur-2xl -mb-20 pointer-events-none mix-blend-overlay"></div>
        
        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 h-full">
          {/* Time & Date */}
          <div className="flex-1">
            <div className="flex items-center gap-2 text-blue-100 mb-2">
              <Clock size={16} />
              <span className="text-sm font-medium tracking-wider opacity-90">WAKTU SAAT INI</span>
            </div>
            {time ? (
              <>
                <div className="text-3xl sm:text-4xl font-bold text-white tracking-tight mb-1">
                  {formatTime(time)}
                </div>
                <div className="text-blue-100 text-sm flex items-center gap-1.5 opacity-90">
                  <CalendarIcon size={14} className="text-blue-200" />
                  {formatDate(time)}
                </div>
              </>
            ) : (
              <div className="h-[68px] flex items-center">
                <div className="w-32 h-8 bg-white/20 rounded animate-pulse"></div>
              </div>
            )}
          </div>

          {/* Vertical Divider */}
          <div className="hidden sm:block w-px h-full bg-white/20"></div>

          {/* Quick Attendance Bars */}
          <div className="flex-1 w-full flex flex-col gap-4">
            <div>
              <div className="flex justify-between items-end mb-1.5">
                <span className="text-xs font-medium text-blue-100">Kehadiran Siswa</span>
                <span className="text-xs font-bold text-white">{studentAttendanceRate}%</span>
              </div>
              <div className="w-full bg-black/20 rounded-full h-2 overflow-hidden shadow-inner">
                <div className="bg-teal-400 h-2 rounded-full shadow-[0_0_10px_rgba(45,212,191,0.6)]" style={{ width: `${studentAttendanceRate}%` }}></div>
              </div>
            </div>
            
            <div>
              <div className="flex justify-between items-end mb-1.5">
                <span className="text-xs font-medium text-blue-100">Kehadiran Guru</span>
                <span className="text-xs font-bold text-white">{staffAttendanceRate}%</span>
              </div>
              <div className="w-full bg-black/20 rounded-full h-2 overflow-hidden shadow-inner">
                <div className="bg-blue-300 h-2 rounded-full shadow-[0_0_10px_rgba(147,197,253,0.6)]" style={{ width: `${staffAttendanceRate}%` }}></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Total Siswa Card */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-slate-500 text-sm font-medium mb-1">Total Siswa</h3>
            <p className="text-3xl font-bold text-slate-800">{stats.students.total}</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 shadow-sm border border-blue-100">
            <Users size={24} />
          </div>
        </div>
        <div className="flex gap-4 border-t border-slate-50 pt-4">
          <div className="flex items-center gap-1.5 flex-1">
            <UserCheck size={14} className="text-emerald-500" />
            <div className="flex flex-col">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Aktif</span>
              <span className="text-sm font-bold text-slate-700">{stats.students.active}</span>
            </div>
          </div>
          <div className="w-px bg-slate-100"></div>
          <div className="flex items-center gap-1.5 flex-1">
            <UserX size={14} className="text-rose-500" />
            <div className="flex flex-col">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Nonaktif</span>
              <span className="text-sm font-bold text-slate-700">{stats.students.inactive}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Total Guru Card */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-slate-500 text-sm font-medium mb-1">Total Guru/Staff</h3>
            <p className="text-3xl font-bold text-slate-800">{stats.staffs.total}</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 shadow-sm border border-indigo-100">
            <Briefcase size={24} />
          </div>
        </div>
        <div className="flex gap-4 border-t border-slate-50 pt-4">
          <div className="flex items-center gap-1.5 flex-1">
            <UserCheck size={14} className="text-emerald-500" />
            <div className="flex flex-col">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Aktif</span>
              <span className="text-sm font-bold text-slate-700">{stats.staffs.active}</span>
            </div>
          </div>
          <div className="w-px bg-slate-100"></div>
          <div className="flex items-center gap-1.5 flex-1 opacity-0 pointer-events-none">
            {/* Placeholder to keep layout symmetrical to Siswa card */}
          </div>
        </div>
      </div>
    </div>
  );
}
