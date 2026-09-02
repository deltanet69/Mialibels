'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  Clock, 
  Loader2, 
  CalendarDays, 
  BarChart2, 
  Sparkles,
  Search,
  CheckCheck,
  RotateCcw,
  UserCheck,
  UserX,
  HeartPulse,
  Filter
} from 'lucide-react';
import { ClassroomAttendanceRecap } from './ClassroomAttendanceRecap';
import { supabase } from '@/lib/supabase/client';

type Student = { id: string; name: string; student_number: string; nisn?: string };
type AttendanceStatus = 'Hadir' | 'Izin' | 'Sakit' | 'Alpha' | '';
type StudentAttendance = {
  student_id: string;
  status: AttendanceStatus;
  reason: string;
  entry_time?: string;
  exit_time?: string;
};

export function ClassroomAttendance({ classroomId }: { classroomId: string }) {
  const getLocalDateString = () => {
    const d = new Date();
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().split('T')[0];
  };

  const [selectedDate, setSelectedDate] = useState(getLocalDateString());
  const [students, setStudents] = useState<Student[]>([]);
  const [attendance, setAttendance] = useState<Record<string, StudentAttendance>>({});
  const [loading, setLoading] = useState(true);
  const [savingStatus, setSavingStatus] = useState<Record<string, boolean>>({});
  const [savedTick, setSavedTick] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'daily' | 'recap'>('daily');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  useEffect(() => {
    if (!classroomId) return;
    
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        // Fetch students in this classroom
        const stdRes = await fetch(`/api/students/classroom?classroomId=${classroomId}&_t=` + Date.now());
        const stdData = await stdRes.json();
        
        // Fetch attendance for selected date
        const attRes = await fetch(`/api/attendance/classroom?classroomId=${classroomId}&date=${selectedDate}&_t=` + Date.now());
        const attData = await attRes.json();
        
        if (stdData.success) {
          setStudents(stdData.data || []);
          
          // Initialize attendance records
          const currentAtt: Record<string, StudentAttendance> = {};
          
          stdData.data.forEach((s: Student) => {
            currentAtt[s.id] = { student_id: s.id, status: '', reason: '' };
          });
          
          // Merge with fetched attendance
          if (attData.success && attData.data) {
            attData.data.forEach((record: any) => {
              if (currentAtt[record.student_id]) {
                currentAtt[record.student_id] = {
                  student_id: record.student_id,
                  status: record.status as AttendanceStatus,
                  reason: record.reason || '',
                  entry_time: record.entry_time,
                  exit_time: record.exit_time
                };
              }
            });
          }
          
          setAttendance(currentAtt);
        } else {
          setError('Gagal memuat data siswa.');
        }
      } catch (e: any) {
        setError(e.message || 'Terjadi kesalahan jaringan.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [classroomId, selectedDate]);

  // Realtime subscription from RFID pos scanner
  useEffect(() => {
    try {
      const channel = supabase.channel(`mia-classroom-att-${classroomId}`)
      channel
        .on(
          'broadcast',
          { event: 'scan_result_siswa' },
          async () => {
            // Re-fetch attendance on RFID scan event
            try {
              const attRes = await fetch(`/api/attendance/classroom?classroomId=${classroomId}&date=${selectedDate}&_t=` + Date.now());
              const attData = await attRes.json();
              if (attData.success && attData.data) {
                setAttendance(prev => {
                  const updated = { ...prev };
                  attData.data.forEach((record: any) => {
                    if (updated[record.student_id]) {
                      updated[record.student_id] = {
                        student_id: record.student_id,
                        status: record.status as AttendanceStatus,
                        reason: record.reason || '',
                        entry_time: record.entry_time,
                        exit_time: record.exit_time
                      };
                    }
                  });
                  return updated;
                });
              }
            } catch (e) {}
          }
        )
        .subscribe()

      return () => {
        supabase.removeChannel(channel)
      }
    } catch (e) {
      console.error('Realtime classroom att sync error', e)
    }
  }, [classroomId, selectedDate]);

  const autoSaveStudent = async (studentId: string, status: AttendanceStatus, reason: string) => {
    setSavingStatus(prev => ({ ...prev, [studentId]: true }));
    try {
      await fetch('/api/attendance/classroom/auto-save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          classroomId,
          date: selectedDate,
          studentId,
          status,
          reason
        })
      });

      // Show brief saved tick
      setSavedTick(prev => ({ ...prev, [studentId]: true }));
      setTimeout(() => {
        setSavedTick(prev => ({ ...prev, [studentId]: false }));
      }, 2000);
    } catch (e) {
      console.error('Failed to auto-save', e);
    } finally {
      setSavingStatus(prev => ({ ...prev, [studentId]: false }));
    }
  };

  const handleStatusChange = (studentId: string, status: AttendanceStatus) => {
    const reason = status !== 'Izin' ? '' : attendance[studentId]?.reason || '';
    setAttendance(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        status,
        reason
      }
    }));
    autoSaveStudent(studentId, status, reason);
  };

  const handleReasonChange = (studentId: string, reason: string) => {
    setAttendance(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        reason
      }
    }));
  };

  const handleReasonBlur = (studentId: string) => {
    const record = attendance[studentId];
    if (record && record.status) {
      autoSaveStudent(studentId, record.status, record.reason);
    }
  };

  // Bulk mark all unassigned or all students as Hadir
  const handleMarkAllHadir = async () => {
    const updated = { ...attendance };
    const promises: Promise<any>[] = [];

    students.forEach(s => {
      if (updated[s.id]?.status !== 'Hadir') {
        updated[s.id] = { ...updated[s.id], status: 'Hadir', reason: '' };
        promises.push(
          fetch('/api/attendance/classroom/auto-save', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              classroomId,
              date: selectedDate,
              studentId: s.id,
              status: 'Hadir',
              reason: ''
            })
          })
        );
      }
    });

    setAttendance(updated);
    try {
      await Promise.all(promises);
    } catch (e) {
      console.error('Failed bulk mark all hadir', e);
    }
  };

  // Helper avatar generator
  const getInitials = (name: string) => {
    const parts = name.trim().split(' ');
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  const getAvatarBg = (name: string) => {
    const colors = [
      'bg-blue-100 text-blue-700 border-blue-200',
      'bg-indigo-100 text-indigo-700 border-indigo-200',
      'bg-emerald-100 text-emerald-700 border-emerald-200',
      'bg-amber-100 text-amber-700 border-amber-200',
      'bg-purple-100 text-purple-700 border-purple-200',
      'bg-rose-100 text-rose-700 border-rose-200',
      'bg-teal-100 text-teal-700 border-teal-200',
    ];
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash += name.charCodeAt(i);
    return colors[hash % colors.length];
  };

  // Computed metrics
  const countHadir = useMemo(() => Object.values(attendance).filter(a => a.status === 'Hadir').length, [attendance]);
  const countIzin = useMemo(() => Object.values(attendance).filter(a => a.status === 'Izin').length, [attendance]);
  const countSakit = useMemo(() => Object.values(attendance).filter(a => a.status === 'Sakit').length, [attendance]);
  const countAlpha = useMemo(() => Object.values(attendance).filter(a => a.status === 'Alpha').length, [attendance]);
  const countBelum = useMemo(() => students.length - (countHadir + countIzin + countSakit + countAlpha), [students, countHadir, countIzin, countSakit, countAlpha]);
  
  const presentPercentage = students.length > 0 ? Math.round((countHadir / students.length) * 100) : 0;

  // Filtered student list
  const filteredStudents = useMemo(() => {
    return students.filter(s => {
      // Search query
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch = !q || s.name.toLowerCase().includes(q) || (s.student_number && s.student_number.includes(q)) || (s.nisn && s.nisn.includes(q));
      if (!matchesSearch) return false;

      // Status filter
      if (statusFilter === 'ALL') return true;
      const attStatus = attendance[s.id]?.status || '';
      if (statusFilter === 'BELUM') return !attStatus;
      return attStatus === statusFilter;
    });
  }, [students, searchQuery, statusFilter, attendance]);

  if (loading) {
    return (
      <div className="bg-white rounded-3xl border border-slate-200/80 p-16 flex flex-col justify-center items-center gap-3 shadow-xs">
        <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 shadow-inner">
          <Loader2 className="w-6 h-6 animate-spin" />
        </div>
        <span className="text-sm font-bold text-slate-600">Memuat Presensi Siswa...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* ──────────────────────────────────────────────────────────── */}
      {/* TOP HEADER CONTROLS & TAB SWITCHER */}
      {/* ──────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        
        {/* Main View Switcher */}
        <div className="bg-slate-100/90 p-1 rounded-2xl border border-slate-200/80 inline-flex shadow-2xs">
          <button
            onClick={() => setViewMode('daily')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
              viewMode === 'daily'
                ? 'bg-white text-blue-600 shadow-sm border border-slate-200/60'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <CalendarDays size={14} className={viewMode === 'daily' ? 'text-blue-600' : 'text-slate-400'} /> 
            <span>Pencatatan Harian</span>
          </button>

          <button
            onClick={() => setViewMode('recap')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
              viewMode === 'recap'
                ? 'bg-white text-blue-600 shadow-sm border border-slate-200/60'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <BarChart2 size={14} className={viewMode === 'recap' ? 'text-blue-600' : 'text-slate-400'} /> 
            <span>Rekap Bulanan</span>
          </button>
        </div>

        {/* Date Selector with Shortcuts (Daily Mode) */}
        {viewMode === 'daily' && (
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setSelectedDate(getLocalDateString())}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                selectedDate === getLocalDateString()
                  ? 'bg-blue-50 text-blue-700 border-blue-200 shadow-2xs'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
            >
              Hari Ini
            </button>

            <div className="flex items-center gap-2 bg-white border border-slate-200/90 rounded-xl px-3 py-1.5 shadow-2xs">
              <CalendarDays size={14} className="text-slate-400" />
              <input 
                type="date" 
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="bg-transparent text-xs font-bold text-slate-700 outline-none cursor-pointer"
              />
            </div>
          </div>
        )}

      </div>

      {viewMode === 'recap' ? (
        <ClassroomAttendanceRecap classroomId={classroomId} />
      ) : (
        <div className="space-y-5">

          {/* ──────────────────────────────────────────────────────────── */}
          {/* PLAYFUL METRIC SUMMARY CARDS */}
          {/* ──────────────────────────────────────────────────────────── */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            
            {/* Hadir */}
            <div 
              onClick={() => setStatusFilter(statusFilter === 'Hadir' ? 'ALL' : 'Hadir')}
              className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                statusFilter === 'Hadir'
                  ? 'bg-emerald-100/80 border-emerald-400 shadow-sm ring-2 ring-emerald-300'
                  : 'bg-emerald-50/70 border-emerald-200/80 hover:bg-emerald-100/60'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-extrabold text-emerald-800 uppercase tracking-wider">Hadir</span>
                <div className="w-6 h-6 rounded-lg bg-emerald-200/60 flex items-center justify-center text-emerald-700">
                  <CheckCircle2 size={13} />
                </div>
              </div>
              <div className="mt-2 flex items-baseline justify-between">
                <span className="text-2xl font-black text-emerald-950">{countHadir}</span>
                <span className="text-[11px] font-extrabold text-emerald-700">{presentPercentage}%</span>
              </div>
            </div>

            {/* Izin */}
            <div 
              onClick={() => setStatusFilter(statusFilter === 'Izin' ? 'ALL' : 'Izin')}
              className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                statusFilter === 'Izin'
                  ? 'bg-amber-100/80 border-amber-400 shadow-sm ring-2 ring-amber-300'
                  : 'bg-amber-50/70 border-amber-200/80 hover:bg-amber-100/60'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-extrabold text-amber-800 uppercase tracking-wider">Izin</span>
                <div className="w-6 h-6 rounded-lg bg-amber-200/60 flex items-center justify-center text-amber-700">
                  <AlertCircle size={13} />
                </div>
              </div>
              <div className="mt-2">
                <span className="text-2xl font-black text-amber-950">{countIzin}</span>
              </div>
            </div>

            {/* Sakit */}
            <div 
              onClick={() => setStatusFilter(statusFilter === 'Sakit' ? 'ALL' : 'Sakit')}
              className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                statusFilter === 'Sakit'
                  ? 'bg-blue-100/80 border-blue-400 shadow-sm ring-2 ring-blue-300'
                  : 'bg-blue-50/70 border-blue-200/80 hover:bg-blue-100/60'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-extrabold text-blue-800 uppercase tracking-wider">Sakit</span>
                <div className="w-6 h-6 rounded-lg bg-blue-200/60 flex items-center justify-center text-blue-700">
                  <HeartPulse size={13} />
                </div>
              </div>
              <div className="mt-2">
                <span className="text-2xl font-black text-blue-950">{countSakit}</span>
              </div>
            </div>

            {/* Alpha */}
            <div 
              onClick={() => setStatusFilter(statusFilter === 'Alpha' ? 'ALL' : 'Alpha')}
              className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                statusFilter === 'Alpha'
                  ? 'bg-rose-100/80 border-rose-400 shadow-sm ring-2 ring-rose-300'
                  : 'bg-rose-50/70 border-rose-200/80 hover:bg-rose-100/60'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-extrabold text-rose-800 uppercase tracking-wider">Alpha</span>
                <div className="w-6 h-6 rounded-lg bg-rose-200/60 flex items-center justify-center text-rose-700">
                  <XCircle size={13} />
                </div>
              </div>
              <div className="mt-2">
                <span className="text-2xl font-black text-rose-950">{countAlpha}</span>
              </div>
            </div>

            {/* Belum Absen */}
            <div 
              onClick={() => setStatusFilter(statusFilter === 'BELUM' ? 'ALL' : 'BELUM')}
              className={`p-3.5 rounded-2xl border transition-all cursor-pointer col-span-2 sm:col-span-1 flex flex-col justify-between ${
                statusFilter === 'BELUM'
                  ? 'bg-slate-200 border-slate-400 shadow-sm ring-2 ring-slate-300'
                  : 'bg-slate-50 border-slate-200/80 hover:bg-slate-100'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-extrabold text-slate-600 uppercase tracking-wider">Belum Presensi</span>
                <div className="w-6 h-6 rounded-lg bg-slate-200 flex items-center justify-center text-slate-600">
                  <Clock size={13} />
                </div>
              </div>
              <div className="mt-2">
                <span className="text-2xl font-black text-slate-800">{countBelum}</span>
              </div>
            </div>

          </div>

          {/* ──────────────────────────────────────────────────────────── */}
          {/* MAIN ATTENDANCE CARD & TABLE */}
          {/* ──────────────────────────────────────────────────────────── */}
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
            
            {/* Card Toolbar */}
            <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-50/40">
              
              <div className="flex items-center gap-3">
                <div className="relative flex-1 sm:w-72">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                  <input
                    type="text"
                    placeholder="Cari nama / NISN siswa..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200/90 rounded-xl text-xs font-medium text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all shadow-2xs"
                  />
                </div>

                {statusFilter !== 'ALL' && (
                  <button
                    onClick={() => setStatusFilter('ALL')}
                    className="px-2.5 py-1.5 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold flex items-center gap-1 transition"
                  >
                    <span>Filter: {statusFilter}</span>
                    <XCircle size={12} />
                  </button>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2.5">
                <button
                  onClick={handleMarkAllHadir}
                  className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-extrabold shadow-sm transition-all flex items-center gap-1.5 cursor-pointer active:scale-98"
                >
                  <CheckCheck size={14} />
                  <span>Tandai Semua Hadir</span>
                </button>
              </div>

            </div>

            {error && (
              <div className="p-4 bg-rose-50 border-b border-rose-100 text-rose-700 text-xs font-semibold flex items-center gap-2">
                <AlertCircle size={14} />
                <span>{error}</span>
              </div>
            )}

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[720px]">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-100 text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">
                    <th className="py-3 px-4 w-12 text-center">No</th>
                    <th className="py-3 px-4 w-36">NIS / NISN</th>
                    <th className="py-3 px-4">Nama Siswa</th>
                    <th className="py-3 px-4 text-center w-28">Jam Masuk</th>
                    <th className="py-3 px-4 text-center w-28">Jam Keluar</th>
                    <th className="py-3 px-6 text-center w-84">Status Kehadiran</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredStudents.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-400 text-xs font-medium">
                        {searchQuery ? 'Tidak ada siswa yang sesuai pencarian.' : 'Belum ada siswa di kelas ini.'}
                      </td>
                    </tr>
                  ) : filteredStudents.map((student, index) => {
                    const record = attendance[student.id];
                    const isSaving = savingStatus[student.id];
                    const isSaved = savedTick[student.id];
                    const avatarStyle = getAvatarBg(student.name);

                    return (
                      <tr key={student.id} className="hover:bg-slate-50/70 transition-colors">
                        
                        {/* No */}
                        <td className="py-3.5 px-4 text-center text-xs font-bold text-slate-400">
                          {index + 1}
                        </td>

                        {/* NIS / NISN */}
                        <td className="py-3.5 px-4">
                          <span className="font-mono font-bold text-[11px] text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200/80 inline-block">
                            {student.nisn || student.student_number || '—'}
                          </span>
                        </td>

                        {/* Nama Siswa */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs border ${avatarStyle} flex-shrink-0 shadow-2xs`}>
                              {getInitials(student.name)}
                            </div>
                            <div className="min-w-0">
                              <div className="font-bold text-xs text-slate-800 tracking-tight">{student.name}</div>
                              {record?.status === 'Izin' && (
                                <div className="mt-1.5">
                                  <input 
                                    type="text" 
                                    placeholder="Tulis alasan izin..."
                                    value={record.reason}
                                    onChange={(e) => handleReasonChange(student.id, e.target.value)}
                                    onBlur={() => handleReasonBlur(student.id)}
                                    className="w-full sm:w-64 px-2.5 py-1 border border-amber-300 bg-amber-50/50 rounded-lg text-xs font-medium focus:outline-none focus:bg-white focus:border-amber-500 text-slate-700 placeholder-slate-400 transition"
                                  />
                                </div>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Jam Masuk */}
                        <td className="py-3.5 px-4 text-center">
                          {record?.entry_time ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 text-[11px] font-bold font-mono border border-emerald-200">
                              <Clock className="w-3 h-3 text-emerald-600" />
                              <span>{record.entry_time}</span>
                            </span>
                          ) : (
                            <span className="text-slate-300 text-xs font-mono">—</span>
                          )}
                        </td>

                        {/* Jam Keluar */}
                        <td className="py-3.5 px-4 text-center">
                          {record?.exit_time ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 text-[11px] font-bold font-mono border border-amber-200">
                              <Clock className="w-3 h-3 text-amber-600" />
                              <span>{record.exit_time}</span>
                            </span>
                          ) : (
                            <span className="text-slate-300 text-xs font-mono">—</span>
                          )}
                        </td>

                        {/* Status Kehadiran Segmented Pill Buttons */}
                        <td className="py-3.5 px-6">
                          <div className="flex items-center justify-center gap-1.5">
                            
                            {/* Hadir */}
                            <button 
                              onClick={() => handleStatusChange(student.id, 'Hadir')}
                              className={`px-3 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer ${
                                record?.status === 'Hadir'
                                  ? 'bg-emerald-600 text-white shadow-xs scale-102 ring-2 ring-emerald-300/40'
                                  : 'bg-slate-50 text-slate-600 border border-slate-200/80 hover:bg-emerald-50 hover:text-emerald-700'
                              }`}
                            >
                              <CheckCircle2 size={13} />
                              <span>Hadir</span>
                            </button>

                            {/* Izin */}
                            <button 
                              onClick={() => handleStatusChange(student.id, 'Izin')}
                              className={`px-3 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer ${
                                record?.status === 'Izin'
                                  ? 'bg-amber-500 text-white shadow-xs scale-102 ring-2 ring-amber-300/40'
                                  : 'bg-slate-50 text-slate-600 border border-slate-200/80 hover:bg-amber-50 hover:text-amber-700'
                              }`}
                            >
                              <AlertCircle size={13} />
                              <span>Izin</span>
                            </button>

                            {/* Sakit */}
                            <button 
                              onClick={() => handleStatusChange(student.id, 'Sakit')}
                              className={`px-3 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer ${
                                record?.status === 'Sakit'
                                  ? 'bg-blue-600 text-white shadow-xs scale-102 ring-2 ring-blue-300/40'
                                  : 'bg-slate-50 text-slate-600 border border-slate-200/80 hover:bg-blue-50 hover:text-blue-700'
                              }`}
                            >
                              <HeartPulse size={13} />
                              <span>Sakit</span>
                            </button>

                            {/* Alpha */}
                            <button 
                              onClick={() => handleStatusChange(student.id, 'Alpha')}
                              className={`px-3 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer ${
                                record?.status === 'Alpha'
                                  ? 'bg-rose-600 text-white shadow-xs scale-102 ring-2 ring-rose-300/40'
                                  : 'bg-slate-50 text-slate-600 border border-slate-200/80 hover:bg-rose-50 hover:text-rose-700'
                              }`}
                            >
                              <XCircle size={13} />
                              <span>Alpha</span>
                            </button>

                            {/* Auto-Save Indicator */}
                            <div className="w-5 text-center ml-1">
                              {isSaving && <Loader2 size={12} className="animate-spin text-blue-600" />}
                              {!isSaving && isSaved && <CheckCircle2 size={12} className="text-emerald-600 animate-in zoom-in" />}
                            </div>

                          </div>
                        </td>

                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Table Footer */}
            <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs font-semibold text-slate-500">
              <span>Total Siswa di Kelas: <strong className="text-slate-800">{students.length} Siswa</strong></span>
              <span className="text-slate-400">Presensi otomatis tersimpan setiap tombol diklik</span>
            </div>

          </div>

        </div>
      )}

    </div>
  );
}
