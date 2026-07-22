'use client';

import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Loader2, Printer } from 'lucide-react';

type RecapRecord = {
  student_id: string;
  name: string;
  student_number: string;
  hadir: number;
  sakit: number;
  izin: number;
  alpha: number;
  total_days: number;
  percentage: number;
};

export function ClassroomAttendanceRecap({ classroomId }: { classroomId: string }) {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [records, setRecords] = useState<RecapRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const monthNames = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];

  useEffect(() => {
    if (!classroomId) return;

    const fetchRecap = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/attendance/recap?classroomId=${classroomId}&month=${month}&year=${year}`);
        const data = await res.json();
        
        if (data.success) {
          setRecords(data.data);
        } else {
          setError(data.error || 'Gagal memuat data rekap absensi.');
        }
      } catch (err: any) {
        setError(err.message || 'Terjadi kesalahan jaringan.');
      } finally {
        setLoading(false);
      }
    };

    fetchRecap();
  }, [classroomId, month, year]);

  const prevMonth = () => {
    if (month === 1) { setMonth(12); setYear(y => y - 1); }
    else setMonth(m => m - 1);
  };
  
  const nextMonth = () => {
    if (month === 12) { setMonth(1); setYear(y => y + 1); }
    else setMonth(m => m + 1);
  };

  const handlePrint = () => {
    window.print();
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
      {/* Header and Controls */}
      <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold text-slate-800">Rekapitulasi Kehadiran</h3>
          <p className="text-sm text-slate-500">Bulan {monthNames[month - 1]} {year}</p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl p-1">
            <button 
              onClick={prevMonth}
              className="p-1.5 text-slate-600 hover:bg-slate-200 rounded-lg transition"
            >
              <ChevronLeft size={18} />
            </button>
            <span className="text-sm font-semibold text-slate-700 min-w-[100px] text-center">
              {monthNames[month - 1]} {year}
            </span>
            <button 
              onClick={nextMonth}
              className="p-1.5 text-slate-600 hover:bg-slate-200 rounded-lg transition"
            >
              <ChevronRight size={18} />
            </button>
          </div>
          <button 
            onClick={handlePrint}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 hover:text-blue-600 text-slate-700 rounded-xl text-sm font-medium transition-colors"
          >
            <Printer className="w-4 h-4" />
            Cetak Rekap
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 text-red-600 text-sm font-medium">
          {error}
        </div>
      )}

      {/* Grid Cards for Screen View */}
      <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 print:hidden">
        {records.length === 0 ? (
          <div className="col-span-full p-8 text-center text-slate-500">Belum ada data siswa di kelas ini.</div>
        ) : records.map((record) => {
          let badgeColor = 'bg-emerald-100 text-emerald-800';
          if (record.percentage < 75) badgeColor = 'bg-rose-100 text-rose-800';
          else if (record.percentage < 90) badgeColor = 'bg-amber-100 text-amber-800';
          if (record.total_days === 0) badgeColor = 'bg-slate-100 text-slate-600';

          return (
            <div key={record.student_id} className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-bl-full opacity-50 -z-10 group-hover:scale-110 transition-transform"></div>
              
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h4 className="font-bold text-slate-800 text-base mb-1">{record.name}</h4>
                  <span className="font-mono text-xs font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">ID: {record.student_number || '-'}</span>
                </div>
                <div className={`px-2.5 py-1 rounded-lg font-bold text-xs ${badgeColor} shadow-sm`}>
                  {record.total_days > 0 ? `${record.percentage}%` : '-'}
                </div>
              </div>

              <div className="grid grid-cols-4 gap-2 pt-2 border-t border-slate-50">
                <div className="flex flex-col items-center p-2 rounded-xl bg-emerald-50 border border-emerald-100/50">
                  <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider mb-1">Hadir</span>
                  <span className="text-lg font-black text-emerald-700">{record.hadir}</span>
                </div>
                <div className="flex flex-col items-center p-2 rounded-xl bg-blue-50 border border-blue-100/50">
                  <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider mb-1">Sakit</span>
                  <span className="text-lg font-black text-blue-700">{record.sakit}</span>
                </div>
                <div className="flex flex-col items-center p-2 rounded-xl bg-amber-50 border border-amber-100/50">
                  <span className="text-[10px] font-bold text-amber-600 uppercase tracking-wider mb-1">Izin</span>
                  <span className="text-lg font-black text-amber-700">{record.izin}</span>
                </div>
                <div className="flex flex-col items-center p-2 rounded-xl bg-rose-50 border border-rose-100/50">
                  <span className="text-[10px] font-bold text-rose-600 uppercase tracking-wider mb-1">Alpha</span>
                  <span className="text-lg font-black text-rose-700">{record.alpha}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Print-only Table */}
      <div className="hidden print:block overflow-visible">
        <table className="w-full text-left border-collapse min-w-[800px]">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100">
              <th className="p-4 font-semibold text-slate-600 text-sm w-16 text-center">No</th>
              <th className="p-4 font-semibold text-slate-600 text-sm w-32">ID Pelajar / NIS</th>
              <th className="p-4 font-semibold text-slate-600 text-sm">Nama Siswa</th>
              <th className="p-4 font-semibold text-slate-600 text-sm text-center">Hadir</th>
              <th className="p-4 font-semibold text-slate-600 text-sm text-center">Sakit</th>
              <th className="p-4 font-semibold text-slate-600 text-sm text-center">Izin</th>
              <th className="p-4 font-semibold text-slate-600 text-sm text-center">Alpha</th>
              <th className="p-4 font-semibold text-slate-600 text-sm text-center">% Hadir</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {records.length === 0 ? (
              <tr>
                <td colSpan={8} className="p-8 text-center text-slate-500">Belum ada data siswa di kelas ini.</td>
              </tr>
            ) : records.map((record, index) => {
              return (
                <tr key={record.student_id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="p-4 text-sm text-slate-500 text-center">{index + 1}</td>
                  <td className="p-4 text-sm font-mono text-slate-600">{record.student_number || '-'}</td>
                  <td className="p-4">
                    <div className="text-sm font-bold text-slate-800">{record.name}</div>
                  </td>
                  <td className="p-4 text-center">
                    <span className="inline-block w-8 h-8 leading-8 rounded-full bg-emerald-50 text-emerald-700 font-semibold text-sm border border-emerald-100">
                      {record.hadir}
                    </span>
                  </td>
                  <td className="p-4 text-center">
                    <span className="inline-block w-8 h-8 leading-8 rounded-full bg-blue-50 text-blue-700 font-semibold text-sm border border-blue-100">
                      {record.sakit}
                    </span>
                  </td>
                  <td className="p-4 text-center">
                    <span className="inline-block w-8 h-8 leading-8 rounded-full bg-amber-50 text-amber-700 font-semibold text-sm border border-amber-100">
                      {record.izin}
                    </span>
                  </td>
                  <td className="p-4 text-center">
                    <span className="inline-block w-8 h-8 leading-8 rounded-full bg-rose-50 text-rose-700 font-semibold text-sm border border-rose-100">
                      {record.alpha}
                    </span>
                  </td>
                  <td className="p-4 text-center">
                    <span className="inline-block px-2.5 py-1 rounded-lg font-bold text-sm bg-slate-100 text-slate-700">
                      {record.total_days > 0 ? `${record.percentage}%` : '-'}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      
      {/* Print-only CSS embedded */}
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          body * {
            visibility: hidden;
          }
          .bg-white.rounded-2xl.border.border-slate-100.shadow-sm, 
          .bg-white.rounded-2xl.border.border-slate-100.shadow-sm * {
            visibility: visible;
          }
          .bg-white.rounded-2xl.border.border-slate-100.shadow-sm {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            border: none;
            box-shadow: none;
          }
          button {
            display: none !important;
          }
        }
      `}} />
    </div>
  );
}
