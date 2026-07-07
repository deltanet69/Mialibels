'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  CalendarCheck, CheckCircle2, XCircle, AlertCircle,
  Clock, ChevronLeft, ChevronRight, Loader2, Filter
} from 'lucide-react';

type AttendanceRecord = {
  id: string;
  date: string;
  status: string;
  reason: string | null;
};

type Summary = {
  hadir: number;
  sakit: number;
  izin: number;
  alpha: number;
  total: number;
  persentaseHadir: number;
};

function StatusBadge({ status }: { status: string }) {
  const s = (status || '').toLowerCase();
  if (s === 'hadir' || s === 'present')
    return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-100"><CheckCircle2 size={11} /> Hadir</span>;
  if (s === 'sakit' || s === 'sick')
    return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-100"><AlertCircle size={11} /> Sakit</span>;
  if (s === 'izin' || s === 'permitted')
    return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-100"><Clock size={11} /> Izin</span>;
  return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-red-50 text-red-700 border border-red-100"><XCircle size={11} /> Alpha</span>;
}

export default function ParentAttendancePage() {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const monthNames = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];

  const fetchAttendance = async (m: number, y: number) => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/parent/attendance?month=${m}&year=${y}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal memuat data');
      setRecords(data.data || []);
      setSummary(data.summary || null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendance(month, year);
  }, [month, year]);

  const prevMonth = () => {
    if (month === 1) { setMonth(12); setYear(y => y - 1); }
    else setMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (month === 12) { setMonth(1); setYear(y => y + 1); }
    else setMonth(m => m + 1);
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr + 'T00:00:00');
    return {
      day: d.toLocaleDateString('id-ID', { weekday: 'long' }),
      date: d.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }),
    };
  };

  const progressBarWidth = summary
    ? Math.min(summary.persentaseHadir, 100)
    : 0;

  return (
    <div className="space-y-6 w-full pb-16">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-emerald-50 rounded-2xl flex items-center justify-center">
          <CalendarCheck className="text-emerald-600" size={22} />
        </div>
        <div>
          <h1 className="text-2xl font-black text-slate-800">Kehadiran Siswa</h1>
          <p className="text-sm text-slate-500">Riwayat dan rekap kehadiran per bulan</p>
        </div>
      </div>

      {/* Month Navigation */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 flex items-center justify-between">
        <button
          onClick={prevMonth}
          className="w-10 h-10 rounded-xl bg-slate-50 hover:bg-slate-100 flex items-center justify-center transition text-slate-600"
        >
          <ChevronLeft size={20} />
        </button>
        <div className="text-center">
          <p className="text-lg font-bold text-slate-800">{monthNames[month - 1]} {year}</p>
          <p className="text-xs text-slate-400">{loading ? 'Memuat...' : `${records.length} hari tercatat`}</p>
        </div>
        <button
          onClick={nextMonth}
          disabled={year === now.getFullYear() && month === now.getMonth() + 1}
          className="w-10 h-10 rounded-xl bg-slate-50 hover:bg-slate-100 flex items-center justify-center transition text-slate-600 disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <ChevronRight size={20} />
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 size={32} className="animate-spin text-slate-300" />
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-5 text-red-600 text-sm font-medium">
          {error}
        </div>
      ) : (
        <>
          {/* Summary Cards */}
          {summary && (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: 'Hadir', value: summary.hadir, color: 'bg-emerald-50 border-emerald-100', text: 'text-emerald-700', dot: 'bg-emerald-500' },
                { label: 'Sakit', value: summary.sakit, color: 'bg-amber-50 border-amber-100', text: 'text-amber-700', dot: 'bg-amber-400' },
                { label: 'Izin', value: summary.izin, color: 'bg-blue-50 border-blue-100', text: 'text-blue-700', dot: 'bg-blue-400' },
                { label: 'Alpha', value: summary.alpha, color: 'bg-red-50 border-red-100', text: 'text-red-700', dot: 'bg-red-500' },
              ].map(({ label, value, color, text, dot }) => (
                <div key={label} className={`bg-white rounded-2xl p-4 border ${color} shadow-sm`}>
                  <div className="flex items-center gap-2 mb-2">
                    <div className={`w-2.5 h-2.5 rounded-full ${dot}`} />
                    <p className={`text-xs font-bold uppercase tracking-wide ${text}`}>{label}</p>
                  </div>
                  <p className={`text-3xl font-black ${text}`}>{value}</p>
                  <p className="text-xs text-slate-400 mt-1">hari</p>
                </div>
              ))}
            </div>
          )}

          {/* Attendance Rate */}
          {summary && summary.total > 0 && (
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
              <div className="flex items-center justify-between mb-3">
                <p className="font-bold text-slate-700">Tingkat Kehadiran</p>
                <p className={`text-2xl font-black ${summary.persentaseHadir >= 90 ? 'text-emerald-600' : summary.persentaseHadir >= 75 ? 'text-amber-600' : 'text-red-600'}`}>
                  {summary.persentaseHadir}%
                </p>
              </div>
              <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-700 ${summary.persentaseHadir >= 90 ? 'bg-emerald-500' : summary.persentaseHadir >= 75 ? 'bg-amber-400' : 'bg-red-500'}`}
                  style={{ width: `${progressBarWidth}%` }}
                />
              </div>
              <p className="text-xs text-slate-400 mt-2">
                {summary.hadir} dari {summary.total} hari belajar — 
                {summary.persentaseHadir >= 90 ? ' ✅ Sangat Baik' : summary.persentaseHadir >= 75 ? ' ⚠️ Perlu Ditingkatkan' : ' ❌ Di Bawah Batas'}
              </p>
            </div>
          )}

          {/* Records List */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="p-5 border-b border-slate-100">
              <h3 className="font-bold text-slate-800">Riwayat Kehadiran</h3>
            </div>
            {records.length === 0 ? (
              <div className="py-16 text-center">
                <CalendarCheck size={40} className="mx-auto mb-3 text-slate-200" />
                <p className="font-semibold text-slate-500">Tidak ada data kehadiran</p>
                <p className="text-sm text-slate-400 mt-1">untuk bulan {monthNames[month - 1]} {year}</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-50">
                {records.map(record => {
                  const { day, date } = formatDate(record.date);
                  return (
                    <div key={record.id} className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors">
                      <div>
                        <p className="font-semibold text-slate-800 text-sm">{day}</p>
                        <p className="text-xs text-slate-400">{date}</p>
                        {record.reason && (
                          <p className="text-xs text-slate-500 mt-0.5 italic">Keterangan: {record.reason}</p>
                        )}
                      </div>
                      <StatusBadge status={record.status} />
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
