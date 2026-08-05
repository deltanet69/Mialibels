'use client';

import React, { useState, useEffect } from 'react';
import { CheckCircle2, XCircle, AlertCircle, Clock, Save, Loader2, CalendarDays, BarChart2 } from 'lucide-react';
import { ClassroomAttendanceRecap } from './ClassroomAttendanceRecap';

type Student = { id: string; name: string; student_number: string };
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

  useEffect(() => {
    if (!classroomId) return;
    
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        // Fetch students
        const stdRes = await fetch(`/api/students/classroom?classroomId=${classroomId}`);
        const stdData = await stdRes.json();
        
        // Fetch attendance for selected date
        const attRes = await fetch(`/api/attendance/classroom?classroomId=${classroomId}&date=${selectedDate}`);
        const attData = await attRes.json();
        
        if (stdData.success) {
          setStudents(stdData.data);
          
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

  const getStatusButtonClass = (currentStatus: string, targetStatus: string, baseClass: string, activeClass: string) => {
    if (currentStatus === targetStatus) return activeClass;
    return `${baseClass} hover:opacity-80`;
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-slate-100 p-12 flex justify-center items-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Mode Toggle */}
      <div className="bg-slate-100 p-1 rounded-xl inline-flex mb-2">
        <button
          onClick={() => setViewMode('daily')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
            viewMode === 'daily' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <CalendarDays size={16} /> Pencatatan Harian
        </button>
        <button
          onClick={() => setViewMode('recap')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
            viewMode === 'recap' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <BarChart2 size={16} /> Rekap Bulanan
        </button>
      </div>

      {viewMode === 'recap' ? (
        <ClassroomAttendanceRecap classroomId={classroomId} />
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-2">
          <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold text-slate-800">Absensi Kelas</h3>
          <p className="text-sm text-slate-500">Pilih tanggal untuk melihat/mengubah absensi</p>
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <input 
            type="date" 
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-full sm:w-auto pl-4 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-700"
          />
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 text-red-600 text-sm font-medium">
          {error}
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[600px]">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100">
              <th className="p-4 font-semibold text-slate-600 text-sm w-40">ID Pelajar / NIS</th>
              <th className="p-4 font-semibold text-slate-600 text-sm">Nama Siswa</th>
              <th className="p-4 font-semibold text-slate-600 text-sm text-center">Jam Masuk</th>
              <th className="p-4 font-semibold text-slate-600 text-sm text-center">Jam Keluar</th>
              <th className="p-4 font-semibold text-slate-600 text-sm text-center w-80">Status Kehadiran</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {students.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-8 text-center text-slate-500">Belum ada siswa di kelas ini.</td>
              </tr>
            ) : students.map((student) => {
              const record = attendance[student.id];
              return (
                <tr key={student.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="p-4 align-top pt-5">
                    <div className="font-mono text-sm font-semibold text-slate-700 bg-slate-100 px-2 py-1 rounded-md inline-block">
                      {student.student_number || '-'}
                    </div>
                  </td>
                  <td className="p-4 align-top pt-5">
                    <div className="text-sm font-medium text-slate-800">{student.name}</div>
                    {record?.status === 'Izin' && (
                      <div className="mt-3">
                        <input 
                          type="text" 
                          placeholder="Keterangan izin..."
                          value={record.reason}
                          onChange={(e) => handleReasonChange(student.id, e.target.value)}
                          onBlur={() => handleReasonBlur(student.id)}
                          className="w-full sm:w-64 px-3 py-1.5 border border-slate-200 bg-white rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-700 placeholder-slate-400"
                        />
                      </div>
                    )}
                  </td>
                  <td className="p-4 align-top pt-5 text-center">
                    {record?.entry_time ? (
                      <div className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 text-sm font-medium border border-emerald-100">
                        <Clock className="w-3.5 h-3.5" />
                        {record.entry_time}
                      </div>
                    ) : (
                      <span className="text-slate-400 text-sm">-</span>
                    )}
                  </td>
                  <td className="p-4 align-top pt-5 text-center">
                    {record?.exit_time ? (
                      <div className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700 text-sm font-medium border border-slate-200">
                        <Clock className="w-3.5 h-3.5" />
                        {record.exit_time}
                      </div>
                    ) : (
                      <span className="text-slate-400 text-sm">-</span>
                    )}
                  </td>
                  <td className="p-4 align-top pt-4">
                    <div className="flex flex-wrap items-center justify-center gap-2">
                      <button 
                        onClick={() => handleStatusChange(student.id, 'Hadir')}
                        className={getStatusButtonClass(
                          record?.status || '', 'Hadir',
                          'px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 bg-white text-xs font-medium flex items-center gap-1.5 transition-all',
                          'px-3 py-1.5 rounded-lg border border-emerald-500 bg-emerald-50 text-emerald-700 text-xs font-medium flex items-center gap-1.5 shadow-sm ring-1 ring-emerald-500/20'
                        )}
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" /> Hadir
                      </button>
                      <button 
                        onClick={() => handleStatusChange(student.id, 'Izin')}
                        className={getStatusButtonClass(
                          record?.status || '', 'Izin',
                          'px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 bg-white text-xs font-medium flex items-center gap-1.5 transition-all',
                          'px-3 py-1.5 rounded-lg border border-amber-500 bg-amber-50 text-amber-700 text-xs font-medium flex items-center gap-1.5 shadow-sm ring-1 ring-amber-500/20'
                        )}
                      >
                        <AlertCircle className="w-3.5 h-3.5" /> Izin
                      </button>
                      <button 
                        onClick={() => handleStatusChange(student.id, 'Sakit')}
                        className={getStatusButtonClass(
                          record?.status || '', 'Sakit',
                          'px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 bg-white text-xs font-medium flex items-center gap-1.5 transition-all',
                          'px-3 py-1.5 rounded-lg border border-blue-500 bg-blue-50 text-blue-700 text-xs font-medium flex items-center gap-1.5 shadow-sm ring-1 ring-blue-500/20'
                        )}
                      >
                        <Clock className="w-3.5 h-3.5" /> Sakit
                      </button>
                      <button 
                        onClick={() => handleStatusChange(student.id, 'Alpha')}
                        className={getStatusButtonClass(
                          record?.status || '', 'Alpha',
                          'px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 bg-white text-xs font-medium flex items-center gap-1.5 transition-all',
                          'px-3 py-1.5 rounded-lg border border-rose-500 bg-rose-50 text-rose-700 text-xs font-medium flex items-center gap-1.5 shadow-sm ring-1 ring-rose-500/20'
                        )}
                      >
                        <XCircle className="w-3.5 h-3.5" /> Alpha
                      </button>
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
