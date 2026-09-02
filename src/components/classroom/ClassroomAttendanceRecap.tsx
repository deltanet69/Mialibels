'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Loader2, 
  Printer, 
  Calendar, 
  Sparkles, 
  Search, 
  Download,
  Users,
  Award,
  TrendingUp,
  AlertTriangle
} from 'lucide-react';

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
  const [searchQuery, setSearchQuery] = useState('');

  const monthNames = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];

  useEffect(() => {
    if (!classroomId) return;

    const fetchRecap = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/attendance/recap?classroomId=${classroomId}&month=${month}&year=${year}&_t=` + Date.now());
        const data = await res.json();
        
        if (data.success) {
          setRecords(data.data || []);
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

  // Helper initials
  const getInitials = (name: string) => {
    const parts = name.trim().split(' ');
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  // Aggregated stats for the class
  const classStats = useMemo(() => {
    if (!records.length) return { avgPercentage: 0, totalHadir: 0, totalIzin: 0, totalSakit: 0, totalAlpha: 0, highAttendanceCount: 0 };
    
    let totalPct = 0;
    let totalHadir = 0;
    let totalIzin = 0;
    let totalSakit = 0;
    let totalAlpha = 0;
    let highAttendanceCount = 0;

    records.forEach(r => {
      totalPct += r.percentage;
      totalHadir += r.hadir;
      totalIzin += r.izin;
      totalSakit += r.sakit;
      totalAlpha += r.alpha;
      if (r.percentage >= 90) highAttendanceCount++;
    });

    const avgPercentage = Math.round(totalPct / records.length);
    return { avgPercentage, totalHadir, totalIzin, totalSakit, totalAlpha, highAttendanceCount };
  }, [records]);

  const filteredRecords = useMemo(() => {
    if (!searchQuery.trim()) return records;
    const q = searchQuery.toLowerCase();
    return records.filter(r => r.name.toLowerCase().includes(q) || (r.student_number && r.student_number.includes(q)));
  }, [records, searchQuery]);

  if (loading) {
    return (
      <div className="bg-white rounded-3xl border border-slate-200/80 p-16 flex flex-col justify-center items-center gap-3 shadow-xs">
        <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 shadow-inner">
          <Loader2 className="w-6 h-6 animate-spin" />
        </div>
        <span className="text-sm font-bold text-slate-600">Menghitung Rekapitulasi...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* ──────────────────────────────────────────────────────────── */}
      {/* MONTH NAVIGATOR & ACTIONS */}
      {/* ──────────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-5 sm:p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-blue-100 text-blue-800 tracking-wider">
              Rekapitulasi Bulanan
            </span>
            <span className="text-xs font-bold text-slate-400">Presensi Kelas</span>
          </div>
          <h3 className="text-xl font-black text-slate-800 tracking-tight mt-1">
            Bulan {monthNames[month - 1]} {year}
          </h3>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {/* Month Stepper */}
          <div className="flex items-center gap-1.5 bg-slate-100/90 border border-slate-200/80 rounded-2xl p-1 shadow-2xs">
            <button 
              onClick={prevMonth}
              className="p-2 text-slate-600 hover:text-slate-900 hover:bg-white rounded-xl transition cursor-pointer shadow-2xs"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="text-xs font-black text-slate-700 min-w-[120px] text-center">
              {monthNames[month - 1]} {year}
            </span>
            <button 
              onClick={nextMonth}
              className="p-2 text-slate-600 hover:text-slate-900 hover:bg-white rounded-xl transition cursor-pointer shadow-2xs"
            >
              <ChevronRight size={16} />
            </button>
          </div>

          {/* Print Button */}
          <button 
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200/90 hover:bg-slate-50 hover:border-slate-300 text-slate-700 rounded-2xl text-xs font-black transition-all shadow-2xs cursor-pointer"
          >
            <Printer size={14} className="text-blue-600" />
            <span>Cetak Rekap</span>
          </button>
        </div>

      </div>

      {/* ──────────────────────────────────────────────────────────── */}
      {/* PLAYFUL MONTHLY KPI STATS */}
      {/* ──────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 print:hidden">
        
        {/* Rata-Rata Kehadiran */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-md flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-blue-100">Rata-Rata Kelas</span>
            <TrendingUp size={16} className="text-blue-200" />
          </div>
          <div className="mt-3 flex items-baseline gap-1">
            <span className="text-3xl font-black">{classStats.avgPercentage}%</span>
            <span className="text-[11px] font-semibold text-blue-200">Kehadiran</span>
          </div>
        </div>

        {/* Siswa Rajin (>90%) */}
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200/80 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-800">Siswa &ge; 90% Hadir</span>
            <Award size={16} className="text-emerald-600" />
          </div>
          <div className="mt-3 flex items-baseline gap-1">
            <span className="text-3xl font-black text-emerald-950">{classStats.highAttendanceCount}</span>
            <span className="text-[11px] font-semibold text-emerald-700">/ {records.length} Siswa</span>
          </div>
        </div>

        {/* Total Izin & Sakit */}
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200/80 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-800">Total Izin / Sakit</span>
            <span className="text-xs font-black text-amber-700">Bulan Ini</span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-amber-950">{classStats.totalIzin + classStats.totalSakit}</span>
            <span className="text-[11px] font-semibold text-amber-700">({classStats.totalIzin} Izin, {classStats.totalSakit} Sakit)</span>
          </div>
        </div>

        {/* Total Alpha */}
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200/80 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-rose-800">Total Alpha</span>
            <AlertTriangle size={16} className="text-rose-600" />
          </div>
          <div className="mt-3 flex items-baseline gap-1">
            <span className="text-3xl font-black text-rose-950">{classStats.totalAlpha}</span>
            <span className="text-[11px] font-semibold text-rose-700">Kasus</span>
          </div>
        </div>

      </div>

      {error && (
        <div className="p-4 bg-rose-50 text-rose-700 text-xs font-semibold rounded-2xl border border-rose-200">
          {error}
        </div>
      )}

      {/* ──────────────────────────────────────────────────────────── */}
      {/* SEARCH TOOLBAR */}
      {/* ──────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-4 print:hidden">
        <div className="relative max-w-xs w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
          <input
            type="text"
            placeholder="Cari nama siswa..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 outline-none focus:border-blue-500 shadow-2xs"
          />
        </div>
        <span className="text-xs font-bold text-slate-500">
          Menampilkan <strong>{filteredRecords.length}</strong> Siswa
        </span>
      </div>

      {/* ──────────────────────────────────────────────────────────── */}
      {/* CARD GRID VIEW (SCREEN) */}
      {/* ──────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 print:hidden">
        {filteredRecords.length === 0 ? (
          <div className="col-span-full py-16 text-center text-slate-400 bg-white rounded-3xl border border-slate-200/80">
            <Users className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-bold text-slate-600">Belum ada data rekap absensi</p>
            <p className="text-xs text-slate-400 mt-0.5">Silakan pilih bulan lain atau catat absensi harian</p>
          </div>
        ) : filteredRecords.map((record) => {
          let badgeColor = 'bg-emerald-100 text-emerald-800 border-emerald-200';
          let progressColor = 'bg-emerald-500';

          if (record.percentage < 75) {
            badgeColor = 'bg-rose-100 text-rose-800 border-rose-200';
            progressColor = 'bg-rose-500';
          } else if (record.percentage < 90) {
            badgeColor = 'bg-amber-100 text-amber-800 border-amber-200';
            progressColor = 'bg-amber-500';
          }

          return (
            <div 
              key={record.student_id} 
              className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-2xs hover:shadow-md transition-all relative overflow-hidden flex flex-col justify-between group"
            >
              {/* Header: Name + Badge */}
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center font-black text-xs text-slate-700 flex-shrink-0">
                      {getInitials(record.name)}
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-extrabold text-xs text-slate-800 truncate tracking-tight group-hover:text-blue-600 transition">
                        {record.name}
                      </h4>
                      <span className="font-mono text-[10px] text-slate-400 font-bold block">
                        NIS: {record.student_number || '—'}
                      </span>
                    </div>
                  </div>

                  <div className={`px-2.5 py-1 rounded-xl font-black text-xs border ${badgeColor} shadow-2xs flex-shrink-0`}>
                    {record.total_days > 0 ? `${record.percentage}%` : '0%'}
                  </div>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-slate-100 h-1.5 rounded-full mt-3 overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all duration-500 ${progressColor}`}
                    style={{ width: `${Math.min(100, record.percentage)}%` }}
                  />
                </div>
              </div>

              {/* Stats Counters Grid */}
              <div className="grid grid-cols-4 gap-1.5 pt-3 mt-3 border-t border-slate-100 text-center">
                <div className="p-1.5 rounded-xl bg-emerald-50/70 border border-emerald-100">
                  <span className="text-[9px] font-extrabold text-emerald-700 block uppercase">Hadir</span>
                  <span className="text-sm font-black text-emerald-950">{record.hadir}</span>
                </div>
                <div className="p-1.5 rounded-xl bg-amber-50/70 border border-amber-100">
                  <span className="text-[9px] font-extrabold text-amber-700 block uppercase">Izin</span>
                  <span className="text-sm font-black text-amber-950">{record.izin}</span>
                </div>
                <div className="p-1.5 rounded-xl bg-blue-50/70 border border-blue-100">
                  <span className="text-[9px] font-extrabold text-blue-700 block uppercase">Sakit</span>
                  <span className="text-sm font-black text-blue-950">{record.sakit}</span>
                </div>
                <div className="p-1.5 rounded-xl bg-rose-50/70 border border-rose-100">
                  <span className="text-[9px] font-extrabold text-rose-700 block uppercase">Alpha</span>
                  <span className="text-sm font-black text-rose-950">{record.alpha}</span>
                </div>
              </div>

            </div>
          );
        })}
      </div>

      {/* ──────────────────────────────────────────────────────────── */}
      {/* PRINT-ONLY TABLE */}
      {/* ──────────────────────────────────────────────────────────── */}
      <div className="hidden print:block">
        <div className="text-center mb-6">
          <h2 className="text-xl font-bold text-slate-900">REKAPITULASI PRESENSI SISWA</h2>
          <p className="text-sm text-slate-600">Periode: {monthNames[month - 1]} {year} - MI Attaqwa 15 Babelan</p>
        </div>

        <table className="w-full text-left border-collapse border border-slate-300">
          <thead>
            <tr className="bg-slate-100 text-xs font-bold text-slate-700 border-b border-slate-300">
              <th className="p-2 border border-slate-300 w-10 text-center">No</th>
              <th className="p-2 border border-slate-300 w-28">NIS</th>
              <th className="p-2 border border-slate-300">Nama Siswa</th>
              <th className="p-2 border border-slate-300 text-center w-16">Hadir</th>
              <th className="p-2 border border-slate-300 text-center w-16">Izin</th>
              <th className="p-2 border border-slate-300 text-center w-16">Sakit</th>
              <th className="p-2 border border-slate-300 text-center w-16">Alpha</th>
              <th className="p-2 border border-slate-300 text-center w-20">% Kehadiran</th>
            </tr>
          </thead>
          <tbody className="text-xs">
            {records.map((r, idx) => (
              <tr key={r.student_id} className="border-b border-slate-200">
                <td className="p-2 border border-slate-300 text-center">{idx + 1}</td>
                <td className="p-2 border border-slate-300 font-mono">{r.student_number || '-'}</td>
                <td className="p-2 border border-slate-300 font-bold">{r.name}</td>
                <td className="p-2 border border-slate-300 text-center">{r.hadir}</td>
                <td className="p-2 border border-slate-300 text-center">{r.izin}</td>
                <td className="p-2 border border-slate-300 text-center">{r.sakit}</td>
                <td className="p-2 border border-slate-300 text-center">{r.alpha}</td>
                <td className="p-2 border border-slate-300 text-center font-bold">{r.percentage}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

    </div>
  );
}
