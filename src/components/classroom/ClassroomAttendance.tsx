'use client';

import React, { useState, useEffect } from 'react';
import { CheckCircle2, XCircle, AlertCircle, Clock, Save, Loader2 } from 'lucide-react';

type Student = { id: string; name: string; student_number: string };
type AttendanceStatus = 'Hadir' | 'Izin' | 'Sakit' | 'Alpha' | '';
type StudentAttendance = {
  student_id: string;
  status: AttendanceStatus;
  reason: string;
};

export function ClassroomAttendance({ classroomId }: { classroomId: string }) {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [students, setStudents] = useState<Student[]>([]);
  const [attendance, setAttendance] = useState<Record<string, StudentAttendance>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
                  reason: record.reason || ''
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

  const handleStatusChange = (studentId: string, status: AttendanceStatus) => {
    setAttendance(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        status,
        reason: status !== 'Izin' ? '' : prev[studentId].reason
      }
    }));
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

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = Object.values(attendance).map(a => ({
        classroom_id: classroomId,
        student_id: a.student_id,
        date: selectedDate,
        status: a.status,
        reason: a.reason
      })).filter(a => a.status !== ''); // only save if status is set
      
      const res = await fetch('/api/attendance/classroom', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          classroomId,
          date: selectedDate,
          attendances: payload
        })
      });
      
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      
      alert('Data absensi berhasil disimpan!');
    } catch (e: any) {
      alert(e.message || 'Gagal menyimpan absensi');
    } finally {
      setSaving(false);
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
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
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
          <button 
            onClick={handleSave}
            disabled={saving}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-medium transition-colors disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {saving ? 'Menyimpan...' : 'Simpan'}
          </button>
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
              <th className="p-4 font-semibold text-slate-600 text-sm w-32">NIS</th>
              <th className="p-4 font-semibold text-slate-600 text-sm">Nama Siswa</th>
              <th className="p-4 font-semibold text-slate-600 text-sm text-center">Status Kehadiran</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {students.length === 0 ? (
              <tr>
                <td colSpan={3} className="p-8 text-center text-slate-500">Belum ada siswa di kelas ini.</td>
              </tr>
            ) : students.map((student) => {
              const record = attendance[student.id];
              return (
                <tr key={student.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="p-4 text-sm text-slate-500 align-top pt-5">{student.student_number || '-'}</td>
                  <td className="p-4 align-top pt-5">
                    <div className="text-sm font-medium text-slate-800">{student.name}</div>
                    {record?.status === 'Izin' && (
                      <div className="mt-3">
                        <input 
                          type="text" 
                          placeholder="Keterangan izin..."
                          value={record.reason}
                          onChange={(e) => handleReasonChange(student.id, e.target.value)}
                          className="w-full sm:w-64 px-3 py-1.5 border border-amber-200 bg-amber-50 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 text-amber-900 placeholder-amber-400"
                        />
                      </div>
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
  );
}
