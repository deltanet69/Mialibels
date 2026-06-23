'use client';

import React, { useState, useEffect } from 'react';
import { dummyStudents, StudentAttendance } from '@/data/dummyClassroom';
import { CheckCircle2, XCircle, AlertCircle, Clock, Save } from 'lucide-react';

export function ClassroomAttendance() {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  
  // State to store records by date
  const [attendanceByDate, setAttendanceByDate] = useState<Record<string, StudentAttendance[]>>({
    [new Date().toISOString().split('T')[0]]: dummyStudents // Pre-populate today for demo
  });
  const [izinReasonsByDate, setIzinReasonsByDate] = useState<Record<string, Record<string, string>>>({});

  useEffect(() => {
    // Initialize empty attendance for new dates
    if (!attendanceByDate[selectedDate]) {
      setAttendanceByDate(prev => ({
        ...prev,
        [selectedDate]: dummyStudents.map(s => ({ ...s, status: '' as const }))
      }));
    }
  }, [selectedDate, attendanceByDate]);

  const students = attendanceByDate[selectedDate] || [];
  const izinReasons = izinReasonsByDate[selectedDate] || {};

  const handleStatusChange = (id: string, status: StudentAttendance['status']) => {
    const updatedStudents = students.map(s => s.id === id ? { ...s, status } : s);
    setAttendanceByDate({ ...attendanceByDate, [selectedDate]: updatedStudents });

    if (status !== 'Izin') {
      const newReasons = { ...izinReasons };
      delete newReasons[id];
      setIzinReasonsByDate({ ...izinReasonsByDate, [selectedDate]: newReasons });
    }
  };

  const handleReasonChange = (id: string, reason: string) => {
    setIzinReasonsByDate({ 
      ...izinReasonsByDate, 
      [selectedDate]: { ...izinReasons, [id]: reason } 
    });
  };

  const getStatusButtonClass = (currentStatus: string, targetStatus: string, baseClass: string, activeClass: string) => {
    if (currentStatus === targetStatus) return activeClass;
    return `${baseClass} hover:opacity-80`;
  };

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
          <button className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-medium transition-colors">
            <Save className="w-4 h-4" />
            Simpan
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[600px]">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100">
              <th className="p-4 font-semibold text-slate-600 text-sm w-24">NIS</th>
              <th className="p-4 font-semibold text-slate-600 text-sm">Nama Siswa</th>
              <th className="p-4 font-semibold text-slate-600 text-sm text-center">Status Kehadiran</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {students.map((student) => (
              <tr key={student.id} className="hover:bg-slate-50/50 transition-colors">
                <td className="p-4 text-sm text-slate-500 align-top pt-5">{student.nis}</td>
                <td className="p-4 align-top pt-5">
                  <div className="text-sm font-medium text-slate-800">{student.name}</div>
                  {student.status === 'Izin' && (
                    <div className="mt-3">
                      <input 
                        type="text" 
                        placeholder="Keterangan izin..."
                        value={izinReasons[student.id] || ''}
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
                        student.status, 'Hadir',
                        'px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 bg-white text-xs font-medium flex items-center gap-1.5 transition-all',
                        'px-3 py-1.5 rounded-lg border border-emerald-500 bg-emerald-50 text-emerald-700 text-xs font-medium flex items-center gap-1.5 shadow-sm ring-1 ring-emerald-500/20'
                      )}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" /> Hadir
                    </button>
                    <button 
                      onClick={() => handleStatusChange(student.id, 'Izin')}
                      className={getStatusButtonClass(
                        student.status, 'Izin',
                        'px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 bg-white text-xs font-medium flex items-center gap-1.5 transition-all',
                        'px-3 py-1.5 rounded-lg border border-amber-500 bg-amber-50 text-amber-700 text-xs font-medium flex items-center gap-1.5 shadow-sm ring-1 ring-amber-500/20'
                      )}
                    >
                      <AlertCircle className="w-3.5 h-3.5" /> Izin
                    </button>
                    <button 
                      onClick={() => handleStatusChange(student.id, 'Sakit')}
                      className={getStatusButtonClass(
                        student.status, 'Sakit',
                        'px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 bg-white text-xs font-medium flex items-center gap-1.5 transition-all',
                        'px-3 py-1.5 rounded-lg border border-blue-500 bg-blue-50 text-blue-700 text-xs font-medium flex items-center gap-1.5 shadow-sm ring-1 ring-blue-500/20'
                      )}
                    >
                      <Clock className="w-3.5 h-3.5" /> Sakit
                    </button>
                    <button 
                      onClick={() => handleStatusChange(student.id, 'Alpha')}
                      className={getStatusButtonClass(
                        student.status, 'Alpha',
                        'px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 bg-white text-xs font-medium flex items-center gap-1.5 transition-all',
                        'px-3 py-1.5 rounded-lg border border-rose-500 bg-rose-50 text-rose-700 text-xs font-medium flex items-center gap-1.5 shadow-sm ring-1 ring-rose-500/20'
                      )}
                    >
                      <XCircle className="w-3.5 h-3.5" /> Alpha
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
