'use client';

import React, { useState, useEffect } from 'react';
import { 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  Clock, 
  Save, 
  Loader2, 
  CalendarDays, 
  BarChart2, 
  Sparkles,
  Search
} from 'lucide-react';
import { ClassroomAttendanceRecap } from './ClassroomAttendanceRecap';

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
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'daily' | 'recap'>('daily');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (!classroomId) return;
    
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        // Fetch students
        const stdRes = await fetch(`/api/students/classroom?classroomId=${classroomId}&_t=` + Date.now());
        const stdData = await stdRes.json();
        
        // Fetch attendance for selected date
        const attRes = await fetch(`/api/attendance/classroom?classroomId=${classroomId}&date=${selectedDate}&_t=` + Date.now());
        const attData = await attRes.json();
        
        if (stdData.success) {
          setStudents(stdData.data || []);
          
          // Initialize attendance record
          const currentAtt: Record<string, StudentAttendance> = {};
          
          // Populate default empty status
          stdData.data.forEach((s: Student) => {
            currentAtt[s.id] = { student_id: s.id, status: '', reason: '' };
          });
          
          // Override with fetched attendance
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
        setError(e.message || 'Terjadi kesalahan.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
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

  const filteredStudents = students.filter(s => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return s.name.toLowerCase().includes(q) || (s.student_number && s.student_number.includes(q)) || (s.nisn && s.nisn.includes(q));
  });

  const countHadir = Object.values(attendance).filter(a => a.status === 'Hadir').length;
  const countIzin = Object.values(attendance).filter(a => a.status === 'Izin').length;
  const countSakit = Object.values(attendance).filter(a => a.status === 'Sakit').length;
  const countAlpha = Object.values(attendance).filter(a => a.status === 'Alpha').length;

  if (loading) {
    return (
      <div className="bg-white rounded-[2rem] border border-slate-200/80 p-16 flex flex-col justify-center items-center gap-3 shadow-sm">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <span className="text-xs font-semibold text-slate-500">Memuat Data Presensi...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Mode Selector Tabs */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="bg-slate-100/90 p-1 rounded-2xl border border-slate-200/60 inline-flex">
          <button
            onClick={() => setViewMode('daily')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              viewMode === 'daily' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <CalendarDays size={14} /> 
            <span>Pencatatan Harian</span>
          </button>
          <button
            onClick={() => setViewMode('recap')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              viewMode === 'recap' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <BarChart2 size={14} /> 
            <span>Rekap Bulanan</span>
          </button>
        </div>

        {viewMode === 'daily' && (
          <div className="flex items-center gap-2 text-xs font-bold flex-wrap">
            <span className="px-3 py-1 bg-emerald-50 text-emerald-800 rounded-full border border-emerald-200">
              Hadir: {countHadir}
            </span>
            <span className="px-3 py-1 bg-amber-50 text-amber-800 rounded-full border border-amber-200">
              Izin: {countIzin}
            </span>
            <span className="px-3 py-1 bg-blue-50 text-blue-800 rounded-full border border-blue-200">
              Sakit: {countSakit}
            </span>
            <span className="px-3 py-1 bg-rose-50 text-rose-800 rounded-full border border-rose-200">
              Alpha: {countAlpha}
            </span>
          </div>
        )}
      </div>

      {viewMode === 'recap' ? (
        <ClassroomAttendanceRecap classroomId={classroomId} />
      ) : (
        <div className="bg-white rounded-[2rem] border border-slate-200/80 shadow-sm overflow-hidden animate-in fade-in">
          {/* Header Controls */}
          <div className="p-6 sm:p-7 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-headline font-black text-lg text-slate-800">Presensi Harian Siswa</h3>
              <p className="text-xs text-slate-500 mt-0.5">Status otomatis tersimpan ke sistem saat diklik.</p>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                <input
                  type="text"
                  placeholder="Cari nama / NISN..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 pr-3 py-2 bg-slate-50/80 border border-slate-200/90 rounded-xl text-xs font-medium text-slate-800 outline-none focus:bg-white focus:border-blue-500"
                />
              </div>

              <input 
                type="date" 
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="px-4 py-2 bg-slate-50/80 border border-slate-200/90 rounded-xl text-xs font-bold text-slate-700 outline-none focus:bg-white focus:border-blue-500 cursor-pointer"
              />
            </div>
          </div>

          {error && (
            <div className="p-4 bg-rose-50 border-b border-rose-100 text-rose-700 text-xs font-semibold">
              {error}
            </div>
          )}

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[700px]">
              <thead>
                <tr className="bg-slate-50/70 border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="py-3.5 pr-4 pl-6 w-36">NIS / NISN</th>
                  <th className="py-3.5 pr-4">Nama Siswa</th>
                  <th className="py-3.5 pr-4 text-center">Jam Masuk</th>
                  <th className="py-3.5 pr-4 text-center">Jam Keluar</th>
                  <th className="py-3.5 pr-6 text-center w-80">Status Kehadiran</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredStudents.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-slate-400 text-xs">
                      {searchQuery ? 'Tidak ada siswa yang sesuai pencarian.' : 'Belum ada siswa di kelas ini.'}
                    </td>
                  </tr>
                ) : filteredStudents.map((student) => {
                  const record = attendance[student.id];
                  const isSaving = savingStatus[student.id];

                  return (
                    <tr key={student.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-4 pr-4 pl-6 align-top">
                        <span className="font-headline font-bold text-xs text-blue-800 bg-blue-50 px-2.5 py-0.5 rounded-md border border-blue-100 inline-block">
                          {student.nisn || student.student_number || '—'}
                        </span>
                      </td>

                      <td className="py-4 pr-4 align-top">
                        <div className="font-headline font-bold text-xs text-slate-800">{student.name}</div>
                        {record?.status === 'Izin' && (
                          <div className="mt-2">
                            <input 
                              type="text" 
                              placeholder="Tulis alasan izin..."
                              value={record.reason}
                              onChange={(e) => handleReasonChange(student.id, e.target.value)}
                              onBlur={() => handleReasonBlur(student.id)}
                              className="w-full sm:w-64 px-3 py-1 border border-slate-200 bg-white rounded-lg text-xs font-medium focus:outline-none focus:border-amber-500 text-slate-700 placeholder-slate-400"
                            />
                          </div>
                        )}
                      </td>

                      <td className="py-4 pr-4 align-top text-center">
                        {record?.entry_time ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 text-xs font-semibold border border-emerald-100">
                            <Clock className="w-3 h-3" />
                            <span>{record.entry_time}</span>
                          </span>
                        ) : (
                          <span className="text-slate-400 text-xs">—</span>
                        )}
                      </td>

                      <td className="py-4 pr-4 align-top text-center">
                        {record?.exit_time ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 text-xs font-semibold border border-slate-200">
                            <Clock className="w-3 h-3" />
                            <span>{record.exit_time}</span>
                          </span>
                        ) : (
                          <span className="text-slate-400 text-xs">—</span>
                        )}
                      </td>

                      <td className="py-4 pr-6 align-top">
                        <div className="flex items-center justify-center gap-1.5 flex-wrap">
                          <button 
                            onClick={() => handleStatusChange(student.id, 'Hadir')}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                              record?.status === 'Hadir'
                                ? 'bg-emerald-600 text-white shadow-xs'
                                : 'bg-slate-50 text-slate-600 border border-slate-200/80 hover:bg-emerald-50 hover:text-emerald-700'
                            }`}
                          >
                            <CheckCircle2 size={13} />
                            <span>Hadir</span>
                          </button>

                          <button 
                            onClick={() => handleStatusChange(student.id, 'Izin')}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                              record?.status === 'Izin'
                                ? 'bg-amber-500 text-white shadow-xs'
                                : 'bg-slate-50 text-slate-600 border border-slate-200/80 hover:bg-amber-50 hover:text-amber-700'
                            }`}
                          >
                            <AlertCircle size={13} />
                            <span>Izin</span>
                          </button>

                          <button 
                            onClick={() => handleStatusChange(student.id, 'Sakit')}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                              record?.status === 'Sakit'
                                ? 'bg-blue-600 text-white shadow-xs'
                                : 'bg-slate-50 text-slate-600 border border-slate-200/80 hover:bg-blue-50 hover:text-blue-700'
                            }`}
                          >
                            <Clock size={13} />
                            <span>Sakit</span>
                          </button>

                          <button 
                            onClick={() => handleStatusChange(student.id, 'Alpha')}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                              record?.status === 'Alpha'
                                ? 'bg-rose-600 text-white shadow-xs'
                                : 'bg-slate-50 text-slate-600 border border-slate-200/80 hover:bg-rose-50 hover:text-rose-700'
                            }`}
                          >
                            <XCircle size={13} />
                            <span>Alpha</span>
                          </button>

                          {isSaving && (
                            <Loader2 size={12} className="animate-spin text-blue-600 ml-1" />
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
