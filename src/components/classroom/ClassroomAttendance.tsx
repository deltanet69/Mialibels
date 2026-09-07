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
  Filter,
  Edit3,
  Trash2,
  X,
  Save
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

  // Edit Modal State
  const [editingStudent, setEditingStudent] = useState<{
    student: Student;
    status: AttendanceStatus;
    reason: string;
    entry_time: string;
    exit_time: string;
  } | null>(null);

  // Bulk Reset confirmation state
  const [showBulkResetModal, setShowBulkResetModal] = useState(false);
  const [isBulkResetting, setIsBulkResetting] = useState(false);

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
                  status: (record.status || '') as AttendanceStatus,
                  reason: record.reason || '',
                  entry_time: record.entry_time || undefined,
                  exit_time: record.exit_time || undefined
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
                        status: (record.status || '') as AttendanceStatus,
                        reason: record.reason || '',
                        entry_time: record.entry_time || undefined,
                        exit_time: record.exit_time || undefined
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

  const autoSaveStudent = async (
    studentId: string, 
    status: AttendanceStatus, 
    reason: string,
    entry_time?: string | null,
    exit_time?: string | null,
    action?: 'save' | 'delete' | 'reset'
  ) => {
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
          reason,
          entry_time,
          exit_time,
          action: action || (!status ? 'reset' : 'save')
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

  const handleStatusChange = (studentId: string, targetStatus: AttendanceStatus) => {
    const current = attendance[studentId]?.status;
    // Toggle: if clicking the already selected status, deselect to '' (Belum Presensi)
    const nextStatus = current === targetStatus ? '' : targetStatus;
    const reason = nextStatus !== 'Izin' ? '' : attendance[studentId]?.reason || '';

    setAttendance(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        status: nextStatus,
        reason,
        entry_time: nextStatus ? prev[studentId]?.entry_time : undefined,
        exit_time: nextStatus ? prev[studentId]?.exit_time : undefined,
      }
    }));
    autoSaveStudent(studentId, nextStatus, reason, nextStatus ? attendance[studentId]?.entry_time : null);
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
      autoSaveStudent(studentId, record.status, record.reason, record.entry_time, record.exit_time);
    }
  };

  // Soft delete / Reset attendance for a single student
  const handleResetStudentAttendance = (studentId: string) => {
    setAttendance(prev => ({
      ...prev,
      [studentId]: {
        student_id: studentId,
        status: '',
        reason: '',
        entry_time: undefined,
        exit_time: undefined
      }
    }));
    autoSaveStudent(studentId, '', '', null, null, 'reset');
  };

  // Open Edit Modal for a student
  const handleOpenEditModal = (student: Student) => {
    const record = attendance[student.id] || { student_id: student.id, status: '', reason: '' };
    setEditingStudent({
      student,
      status: record.status || '',
      reason: record.reason || '',
      entry_time: record.entry_time || '',
      exit_time: record.exit_time || ''
    });
  };

  // Save changes from Edit Modal
  const handleSaveEditModal = async () => {
    if (!editingStudent) return;
    const { student, status, reason, entry_time, exit_time } = editingStudent;

    setAttendance(prev => ({
      ...prev,
      [student.id]: {
        student_id: student.id,
        status,
        reason: status === 'Izin' ? reason : '',
        entry_time: status ? (entry_time || undefined) : undefined,
        exit_time: status ? (exit_time || undefined) : undefined,
      }
    }));

    await autoSaveStudent(
      student.id, 
      status, 
      status === 'Izin' ? reason : '', 
      status ? (entry_time || null) : null, 
      status ? (exit_time || null) : null,
      status ? 'save' : 'reset'
    );

    setEditingStudent(null);
  };

  // Delete attendance from within Edit Modal
  const handleDeleteFromModal = async () => {
    if (!editingStudent) return;
    const studentId = editingStudent.student.id;
    handleResetStudentAttendance(studentId);
    setEditingStudent(null);
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

  // Bulk reset all attendance for today
  const handleConfirmBulkReset = async () => {
    setIsBulkResetting(true);
    try {
      await fetch('/api/attendance/classroom/auto-save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          classroomId,
          date: selectedDate,
          action: 'bulk-reset',
          studentIds: students.map(s => s.id)
        })
      });

      // Clear local state
      const resetAtt: Record<string, StudentAttendance> = {};
      students.forEach(s => {
        resetAtt[s.id] = { student_id: s.id, status: '', reason: '' };
      });
      setAttendance(resetAtt);
      setShowBulkResetModal(false);
    } catch (e) {
      console.error('Failed bulk reset', e);
    } finally {
      setIsBulkResetting(false);
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
                    className="px-2.5 py-1.5 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold flex items-center gap-1 transition cursor-pointer"
                  >
                    <span>Filter: {statusFilter}</span>
                    <XCircle size={12} />
                  </button>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2.5 flex-wrap">
                <button
                  onClick={() => setShowBulkResetModal(true)}
                  className="px-3.5 py-2 bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-600 rounded-xl text-xs font-bold border border-slate-200/90 transition-all flex items-center gap-1.5 cursor-pointer active:scale-98 shadow-2xs"
                  title="Reset seluruh presensi hari ini kembali ke Belum Presensi"
                >
                  <RotateCcw size={13} />
                  <span>Reset Semua</span>
                </button>

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
              <table className="w-full text-left border-collapse min-w-[760px]">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-100 text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">
                    <th className="py-3 px-4 w-12 text-center">No</th>
                    <th className="py-3 px-4 w-36">NIS / NISN</th>
                    <th className="py-3 px-4">Nama Siswa</th>
                    <th className="py-3 px-4 text-center w-28">Jam Masuk</th>
                    <th className="py-3 px-4 text-center w-28">Jam Keluar</th>
                    <th className="py-3 px-4 text-center w-[340px]">Status Kehadiran</th>
                    <th className="py-3 px-3 text-center w-16">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredStudents.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-400 text-xs font-medium">
                        {searchQuery ? 'Tidak ada siswa yang sesuai pencarian.' : 'Belum ada siswa di kelas ini.'}
                      </td>
                    </tr>
                  ) : filteredStudents.map((student, index) => {
                    const record = attendance[student.id];
                    const isSaving = savingStatus[student.id];
                    const isSaved = savedTick[student.id];
                    const avatarStyle = getAvatarBg(student.name);
                    const hasAttendance = !!(record?.status || record?.entry_time || record?.exit_time);

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
                            <div className="min-w-0 flex-1">
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
                            <button
                              onClick={() => handleOpenEditModal(student)}
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-[11px] font-bold font-mono border border-emerald-200 transition cursor-pointer"
                              title="Klik untuk ubah jam/keterangan"
                            >
                              <Clock className="w-3 h-3 text-emerald-600" />
                              <span>{record.entry_time}</span>
                            </button>
                          ) : (
                            <span className="text-slate-300 text-xs font-mono">—</span>
                          )}
                        </td>

                        {/* Jam Keluar */}
                        <td className="py-3.5 px-4 text-center">
                          {record?.exit_time ? (
                            <button
                              onClick={() => handleOpenEditModal(student)}
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 hover:bg-amber-100 text-amber-700 text-[11px] font-bold font-mono border border-amber-200 transition cursor-pointer"
                              title="Klik untuk ubah jam/keterangan"
                            >
                              <Clock className="w-3 h-3 text-amber-600" />
                              <span>{record.exit_time}</span>
                            </button>
                          ) : (
                            <span className="text-slate-300 text-xs font-mono">—</span>
                          )}
                        </td>

                        {/* Status Kehadiran Segmented Pill Buttons */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center justify-center gap-1.5">
                            
                            {/* Hadir */}
                            <button 
                              onClick={() => handleStatusChange(student.id, 'Hadir')}
                              className={`px-2.5 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer ${
                                record?.status === 'Hadir'
                                  ? 'bg-emerald-600 text-white shadow-xs scale-102 ring-2 ring-emerald-300/40'
                                  : 'bg-slate-50 text-slate-600 border border-slate-200/80 hover:bg-emerald-50 hover:text-emerald-700'
                              }`}
                              title={record?.status === 'Hadir' ? 'Klik untuk batalkan (Kembali ke Belum Presensi)' : 'Tandai Hadir'}
                            >
                              <CheckCircle2 size={13} />
                              <span>Hadir</span>
                            </button>

                            {/* Izin */}
                            <button 
                              onClick={() => handleStatusChange(student.id, 'Izin')}
                              className={`px-2.5 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer ${
                                record?.status === 'Izin'
                                  ? 'bg-amber-500 text-white shadow-xs scale-102 ring-2 ring-amber-300/40'
                                  : 'bg-slate-50 text-slate-600 border border-slate-200/80 hover:bg-amber-50 hover:text-amber-700'
                              }`}
                              title={record?.status === 'Izin' ? 'Klik untuk batalkan (Kembali ke Belum Presensi)' : 'Tandai Izin'}
                            >
                              <AlertCircle size={13} />
                              <span>Izin</span>
                            </button>

                            {/* Sakit */}
                            <button 
                              onClick={() => handleStatusChange(student.id, 'Sakit')}
                              className={`px-2.5 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer ${
                                record?.status === 'Sakit'
                                  ? 'bg-blue-600 text-white shadow-xs scale-102 ring-2 ring-blue-300/40'
                                  : 'bg-slate-50 text-slate-600 border border-slate-200/80 hover:bg-blue-50 hover:text-blue-700'
                              }`}
                              title={record?.status === 'Sakit' ? 'Klik untuk batalkan (Kembali ke Belum Presensi)' : 'Tandai Sakit'}
                            >
                              <HeartPulse size={13} />
                              <span>Sakit</span>
                            </button>

                            {/* Alpha */}
                            <button 
                              onClick={() => handleStatusChange(student.id, 'Alpha')}
                              className={`px-2.5 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer ${
                                record?.status === 'Alpha'
                                  ? 'bg-rose-600 text-white shadow-xs scale-102 ring-2 ring-rose-300/40'
                                  : 'bg-slate-50 text-slate-600 border border-slate-200/80 hover:bg-rose-50 hover:text-rose-700'
                              }`}
                              title={record?.status === 'Alpha' ? 'Klik untuk batalkan (Kembali ke Belum Presensi)' : 'Tandai Alpha'}
                            >
                              <XCircle size={13} />
                              <span>Alpha</span>
                            </button>

                            {/* Reset / Soft Delete Button */}
                            {hasAttendance && (
                              <button
                                onClick={() => handleResetStudentAttendance(student.id)}
                                className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200 transition-all cursor-pointer ml-0.5"
                                title="Hapus / Reset presensi siswa ini"
                              >
                                <Trash2 size={13} />
                              </button>
                            )}

                            {/* Auto-Save Indicator */}
                            <div className="w-4 text-center">
                              {isSaving && <Loader2 size={12} className="animate-spin text-blue-600" />}
                              {!isSaving && isSaved && <CheckCircle2 size={12} className="text-emerald-600 animate-in zoom-in" />}
                            </div>

                          </div>
                        </td>

                        {/* Quick Edit Modal Button */}
                        <td className="py-3.5 px-3 text-center">
                          <button
                            onClick={() => handleOpenEditModal(student)}
                            className="p-1.5 rounded-xl text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition cursor-pointer"
                            title="Edit detail presensi & jam"
                          >
                            <Edit3 size={14} />
                          </button>
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
              <span className="text-slate-400">Klik tombol status yang sedang aktif atau tombol ikon tempat sampah untuk mereset presensi</span>
            </div>

          </div>

        </div>
      )}

      {/* ──────────────────────────────────────────────────────────── */}
      {/* EDIT ATTENDANCE DETAIL MODAL */}
      {/* ──────────────────────────────────────────────────────────── */}
      {editingStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div 
            className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-200 space-y-5"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-black text-sm border ${getAvatarBg(editingStudent.student.name)} shadow-2xs`}>
                  {getInitials(editingStudent.student.name)}
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-800">{editingStudent.student.name}</h3>
                  <p className="text-xs text-slate-400 font-mono">
                    {editingStudent.student.nisn || editingStudent.student.student_number || 'Siswa'}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setEditingStudent(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {/* Status Selection */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Status Kehadiran</label>
              <div className="grid grid-cols-4 gap-2">
                {(['Hadir', 'Izin', 'Sakit', 'Alpha'] as AttendanceStatus[]).map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setEditingStudent(prev => prev ? { ...prev, status: prev.status === st ? '' : st } : null)}
                    className={`py-2 px-1 rounded-xl text-xs font-black transition-all cursor-pointer border text-center ${
                      editingStudent.status === st
                        ? st === 'Hadir' ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs' :
                          st === 'Izin' ? 'bg-amber-500 text-white border-amber-500 shadow-xs' :
                          st === 'Sakit' ? 'bg-blue-600 text-white border-blue-600 shadow-xs' :
                          'bg-rose-600 text-white border-rose-600 shadow-xs'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>

            {/* Time Adjustments */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-500 uppercase">Jam Masuk</label>
                <input 
                  type="text" 
                  placeholder="06:45:00"
                  value={editingStudent.entry_time}
                  onChange={(e) => setEditingStudent(prev => prev ? { ...prev, entry_time: e.target.value } : null)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-700 outline-none focus:bg-white focus:border-blue-500"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-500 uppercase">Jam Keluar</label>
                <input 
                  type="text" 
                  placeholder="12:30:00"
                  value={editingStudent.exit_time}
                  onChange={(e) => setEditingStudent(prev => prev ? { ...prev, exit_time: e.target.value } : null)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-700 outline-none focus:bg-white focus:border-blue-500"
                />
              </div>
            </div>

            {/* Reason / Notes Input */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-500 uppercase">Alasan / Catatan Guru</label>
              <textarea 
                rows={2}
                placeholder="Contoh: Izin acara keluarga, Sakit demam..."
                value={editingStudent.reason}
                onChange={(e) => setEditingStudent(prev => prev ? { ...prev, reason: e.target.value } : null)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 outline-none focus:bg-white focus:border-blue-500 resize-none"
              />
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-between gap-3 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={handleDeleteFromModal}
                className="px-3.5 py-2.5 rounded-xl text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Trash2 size={13} />
                <span>Hapus Presensi</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setEditingStudent(null)}
                  className="px-3 py-2.5 rounded-xl text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleSaveEditModal}
                  className="px-4 py-2.5 rounded-xl text-xs font-black text-white bg-blue-600 hover:bg-blue-500 shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Save size={13} />
                  <span>Simpan</span>
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ──────────────────────────────────────────────────────────── */}
      {/* BULK RESET CONFIRMATION MODAL */}
      {/* ──────────────────────────────────────────────────────────── */}
      {showBulkResetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div 
            className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-200 space-y-4 text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center mx-auto shadow-inner">
              <RotateCcw size={22} />
            </div>

            <div>
              <h3 className="text-base font-black text-slate-800">Reset Semua Presensi?</h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Seluruh presensi siswa di kelas ini pada tanggal <strong className="text-slate-700">{selectedDate}</strong> akan dikembalikan ke status <strong>Belum Presensi</strong>.
              </p>
            </div>

            <div className="flex items-center justify-center gap-2.5 pt-2">
              <button
                type="button"
                disabled={isBulkResetting}
                onClick={() => setShowBulkResetModal(false)}
                className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition cursor-pointer disabled:opacity-50"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={isBulkResetting}
                onClick={handleConfirmBulkReset}
                className="px-4 py-2.5 rounded-xl text-xs font-black text-white bg-rose-600 hover:bg-rose-500 shadow-sm transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {isBulkResetting ? (
                  <>
                    <Loader2 size={13} className="animate-spin" />
                    <span>Mereset...</span>
                  </>
                ) : (
                  <span>Ya, Reset Semua</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
