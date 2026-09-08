'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  AreaChart, Area, 
  BarChart, Bar,
  XAxis, YAxis, 
  CartesianGrid, Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import { 
  Calendar, Users, Briefcase, TrendingUp, Sparkles, 
  CheckCircle2, UserCheck, RefreshCw, BarChart2, 
  Activity, Clock, Flame, Info, AlertCircle
} from 'lucide-react';
import { supabase } from '@/lib/supabase/client';

interface AttendanceChartProps {
  guruClassId?: string;
  guruClassName?: string;
  guruStaffId?: string;
  guruName?: string;
}

export function AttendanceChart({
  guruClassId,
  guruClassName,
  guruStaffId,
  guruName
}: AttendanceChartProps) {
  const isGuruMode = Boolean(guruStaffId);
  const isHomeroom = Boolean(guruClassId);

  const [view, setView] = useState<'siswa' | 'guru'>(isGuruMode ? 'guru' : 'siswa');
  const [chartType, setChartType] = useState<'area' | 'bar'>('area');
  const [timeFilter, setTimeFilter] = useState<'hari' | 'minggu' | 'bulan' | 'tahun'>('minggu');
  const [classFilter, setClassFilter] = useState(guruClassId || 'all');
  
  const [rawData, setRawData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [classes, setClasses] = useState<any[]>([]);
  const [lastSyncTime, setLastSyncTime] = useState<string>('Baru saja');
  const [activeMetric, setActiveMetric] = useState<'all' | 'hadir' | 'izin' | 'sakit' | 'alfa'>('all');

  // Fetch unique classrooms for filter
  useEffect(() => {
    if (!isGuruMode) {
      async function fetchClasses() {
        const { data } = await supabase
          .from('classrooms')
          .select('id, name')
          .order('name', { ascending: true });
        if (data) {
          setClasses((data as any[]).filter((c: any) => c.name && c.name.toLowerCase() !== 'semua kelas'));
        }
      }
      fetchClasses();
    }
  }, [isGuruMode]);

  // Main data fetcher
  const fetchData = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    try {
      const getLocalDateString = (d: Date) => {
        const local = new Date(d);
        local.setMinutes(local.getMinutes() - local.getTimezoneOffset());
        return local.toISOString().split('T')[0];
      };

      const today = new Date();
      let startDate = new Date();
      
      if (timeFilter === 'hari') {
        startDate.setDate(today.getDate());
      } else if (timeFilter === 'minggu') {
        startDate.setDate(today.getDate() - 7);
      } else if (timeFilter === 'bulan') {
        startDate.setMonth(today.getMonth() - 1);
      } else if (timeFilter === 'tahun') {
        startDate.setMonth(0, 1);
      }

      const dateStr = getLocalDateString(startDate);
      const todayStr = getLocalDateString(today);

      let url = `/api/dashboard/attendance-chart?view=${view}&startDate=${dateStr}&endDate=${todayStr}`;
      
      if (view === 'siswa') {
        url += `&classFilter=${isHomeroom ? guruClassId : classFilter}`;
      } else if (view === 'guru' && guruStaffId) {
        url += `&staffId=${guruStaffId}`;
      }

      const res = await fetch(url);
      const json = await res.json();
      if (res.ok && json.data) {
        setRawData(json.data);
        const now = new Date();
        setLastSyncTime(now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ' WIB');
      } else {
        setRawData([]);
      }
    } catch (err) {
      console.error("Failed to fetch attendance:", err);
    } finally {
      if (!isSilent) setLoading(false);
    }
  }, [view, timeFilter, classFilter, guruStaffId, guruClassId, isHomeroom]);

  // Initial & filter change fetch
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Realtime Supabase Subscription & Custom Local Scan Listener
  useEffect(() => {
    // 1. Subscribe to Supabase Realtime changes for student_attendances and staff_attendance
    const channel = supabase
      .channel('dashboard-attendance-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'student_attendances' },
        () => {
          if (view === 'siswa') {
            fetchData(true);
          }
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'staff_attendance' },
        () => {
          if (view === 'guru') {
            fetchData(true);
          }
        }
      )
      .subscribe();

    // 2. Listen to local scanner events from RFID reader in the browser
    const handleLocalScan = () => {
      fetchData(true);
    };
    window.addEventListener('mia_local_scan', handleLocalScan);

    return () => {
      supabase.removeChannel(channel);
      window.removeEventListener('mia_local_scan', handleLocalScan);
    };
  }, [fetchData, view]);

  // Process data for Recharts
  const chartData = useMemo(() => {
    if (!rawData || rawData.length === 0) return [];

    // If timeFilter is 'hari', group by hour intervals for playful rush-hour analysis
    if (timeFilter === 'hari') {
      const hourlyBuckets: Record<string, { label: string; hadir: number; izin: number; sakit: number; alfa: number; dateStr: string }> = {
        '06:00': { label: '06:00 - 06:30', hadir: 0, izin: 0, sakit: 0, alfa: 0, dateStr: 'Pagi Awal' },
        '06:30': { label: '06:30 - 07:00', hadir: 0, izin: 0, sakit: 0, alfa: 0, dateStr: 'Puncak Pagi' },
        '07:00': { label: '07:00 - 07:30', hadir: 0, izin: 0, sakit: 0, alfa: 0, dateStr: 'Mulai KBM' },
        '07:30': { label: '07:30+', hadir: 0, izin: 0, sakit: 0, alfa: 0, dateStr: 'Siang/Sore' },
      };

      rawData.forEach(record => {
        const time = record.entry_time || record.check_in_time || '06:15';
        const [h, m] = time.split(':').map(Number);
        const totalMinutes = (h || 6) * 60 + (m || 0);

        let bucketKey = '06:00';
        if (totalMinutes >= 7 * 60 + 30) bucketKey = '07:30';
        else if (totalMinutes >= 7 * 60) bucketKey = '07:00';
        else if (totalMinutes >= 6 * 60 + 30) bucketKey = '06:30';

        const status = (record.status || '').toLowerCase();
        if (status.includes('hadir') || status.includes('present') || status.includes('terlambat')) hourlyBuckets[bucketKey].hadir++;
        else if (status.includes('izin') || status.includes('permit')) hourlyBuckets[bucketKey].izin++;
        else if (status.includes('sakit') || status.includes('sick')) hourlyBuckets[bucketKey].sakit++;
        else hourlyBuckets[bucketKey].alfa++;
      });

      return Object.entries(hourlyBuckets).map(([key, val]) => ({
        name: val.label,
        hadir: val.hadir,
        izin: val.izin,
        sakit: val.sakit,
        alfa: val.alfa,
        total: val.hadir + val.izin + val.sakit + val.alfa,
        dateStr: val.dateStr
      }));
    }

    // Group by Date for weekly/monthly/yearly
    const grouped: Record<string, { hadir: number; izin: number; sakit: number; alfa: number; dateStr: string }> = {};

    rawData.forEach(record => {
      const date = record.date;
      if (!date) return;
      if (!grouped[date]) {
        grouped[date] = { hadir: 0, izin: 0, sakit: 0, alfa: 0, dateStr: date };
      }
      
      const status = (record.status || '').toLowerCase();
      if (status.includes('hadir') || status.includes('present') || status.includes('terlambat')) grouped[date].hadir++;
      else if (status.includes('izin') || status.includes('permit')) grouped[date].izin++;
      else if (status.includes('sakit') || status.includes('sick')) grouped[date].sakit++;
      else grouped[date].alfa++;
    });

    const sorted = Object.values(grouped).sort((a, b) => new Date(a.dateStr).getTime() - new Date(b.dateStr).getTime());

    return sorted.map(item => {
      const dateObj = new Date(item.dateStr);
      let name = '';
      if (timeFilter === 'minggu') {
        const days = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
        name = `${days[dateObj.getDay()]} (${dateObj.getDate()}/${dateObj.getMonth() + 1})`;
      } else {
        name = `${dateObj.getDate()}/${dateObj.getMonth() + 1}`;
      }
      
      return {
        ...item,
        name,
        total: item.hadir + item.izin + item.sakit + item.alfa
      };
    });
  }, [rawData, timeFilter]);

  // Summary counts
  const totals = useMemo(() => {
    return chartData.reduce(
      (acc, cur) => {
        acc.hadir += cur.hadir;
        acc.izin += cur.izin;
        acc.sakit += cur.sakit;
        acc.alfa += cur.alfa;
        return acc;
      },
      { hadir: 0, izin: 0, sakit: 0, alfa: 0 }
    );
  }, [chartData]);

  const totalEntries = totals.hadir + totals.izin + totals.sakit + totals.alfa;
  const attendanceRate = totalEntries > 0 ? Math.round((totals.hadir / totalEntries) * 100) : (chartData.length > 0 ? 100 : 0);

  // Custom Glassmorphism Tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const hadirVal = payload.find((p: any) => p.dataKey === 'hadir')?.value || 0;
      const izinVal = payload.find((p: any) => p.dataKey === 'izin')?.value || 0;
      const sakitVal = payload.find((p: any) => p.dataKey === 'sakit')?.value || 0;
      const alfaVal = payload.find((p: any) => p.dataKey === 'alfa')?.value || 0;
      const totalDay = hadirVal + izinVal + sakitVal + alfaVal;

      return (
        <div className="bg-slate-900/95 backdrop-blur-md border border-slate-700/80 p-4 rounded-2xl shadow-xl text-white min-w-[200px] animate-in fade-in zoom-in-95 duration-150">
          <div className="flex items-center justify-between gap-2 border-b border-slate-800 pb-2 mb-2.5">
            <span className="text-xs font-bold text-slate-300">{label}</span>
            <span className="text-[10px] bg-blue-500/20 text-blue-300 font-bold px-2 py-0.5 rounded-full">
              Total: {totalDay}
            </span>
          </div>

          <div className="space-y-1.5 text-xs font-medium">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
                <span className="text-slate-300">Hadir</span>
              </div>
              <span className="font-bold text-blue-400">{hadirVal} siswa</span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
                <span className="text-slate-300">Izin</span>
              </div>
              <span className="font-bold text-amber-400">{izinVal} siswa</span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-sky-400"></span>
                <span className="text-slate-300">Sakit</span>
              </div>
              <span className="font-bold text-sky-400">{sakitVal} siswa</span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
                <span className="text-slate-300">Alfa</span>
              </div>
              <span className="font-bold text-rose-400">{alfaVal} siswa</span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  const chartTitle = isGuruMode
    ? (view === 'guru' ? 'Rekap Presensi Kehadiran Saya' : `Presensi Siswa Kelas ${guruClassName || ''}`)
    : 'Tren Presensi & Kehadiran Realtime';

  const chartSubtitle = isGuruMode
    ? (view === 'guru' 
        ? `Pantau riwayat presensi akun ${guruName ? `Bpk/Ibu ${guruName}` : 'Anda'}` 
        : `Grafik kehadiran harian siswa perwalian Kelas ${guruClassName || ''}`)
    : 'Data kehadiran siswa & guru langsung dari scanner RFID & wali kelas';

  return (
    <div className="bg-white p-6 sm:p-7 rounded-[2rem] shadow-sm border border-slate-200/80 flex flex-col w-full min-h-[460px] transition-all hover:shadow-md">
      
      {/* ── TOP HEADER & CONTROLS ── */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6 gap-4">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[11px] font-black uppercase tracking-wider animate-pulse">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span>Live Realtime</span>
            </div>

            <h3 className="font-headline font-black text-xl text-slate-800 tracking-tight">
              {chartTitle}
            </h3>
          </div>
          <p className="font-body text-xs sm:text-sm text-slate-500 mt-1">
            {chartSubtitle} • <span className="text-slate-400 font-medium">Update: {lastSyncTime}</span>
          </p>
        </div>

        {/* Action Toolbar */}
        <div className="flex flex-col sm:flex-row items-center gap-2.5 w-full lg:w-auto flex-wrap">
          
          {/* Target Role Selector (Siswa vs Guru) */}
          {(!isGuruMode || isHomeroom) && (
            <div className="flex p-1 bg-slate-100 rounded-2xl w-full sm:w-auto border border-slate-200/70">
              <button 
                onClick={() => setView('siswa')}
                className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  view === 'siswa' 
                    ? 'bg-white text-blue-700 shadow-sm' 
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <Users size={14} /> <span>Siswa</span>
              </button>
              <button 
                onClick={() => setView('guru')}
                className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  view === 'guru' 
                    ? 'bg-white text-blue-700 shadow-sm' 
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <Briefcase size={14} /> <span>Guru & Staf</span>
              </button>
            </div>
          )}

          {/* Chart Type Toggle (Area vs Bar) */}
          <div className="flex p-1 bg-slate-100 rounded-2xl border border-slate-200/70">
            <button
              onClick={() => setChartType('area')}
              title="Grafik Gelombang Tren (Area)"
              className={`p-1.5 rounded-xl transition cursor-pointer ${
                chartType === 'area' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-400 hover:text-slate-700'
              }`}
            >
              <TrendingUp size={15} />
            </button>
            <button
              onClick={() => setChartType('bar')}
              title="Grafik Batang (Bar Chart)"
              className={`p-1.5 rounded-xl transition cursor-pointer ${
                chartType === 'bar' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-400 hover:text-slate-700'
              }`}
            >
              <BarChart2 size={15} />
            </button>
          </div>

          {/* Class Filter */}
          {!isGuruMode && view === 'siswa' && (
            <select 
              value={classFilter}
              onChange={(e) => setClassFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition cursor-pointer"
            >
              <option value="all">Semua Kelas</option>
              {classes.map(c => (
                <option key={c.id} value={c.name}>{c.name}</option>
              ))}
            </select>
          )}

          {/* Time Filter */}
          <div className="relative">
            <select 
              value={timeFilter}
              onChange={(e: any) => setTimeFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold rounded-xl pl-3 pr-8 py-2 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition cursor-pointer"
            >
              <option value="hari">Hari Ini</option>
              <option value="minggu">7 Hari Terakhir</option>
              <option value="bulan">Bulan Ini</option>
              <option value="tahun">Tahun Ini</option>
            </select>
          </div>

          {/* Manual Refresh Button */}
          <button
            onClick={() => fetchData()}
            disabled={loading}
            title="Muat ulang data realtime"
            className="p-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition cursor-pointer disabled:opacity-50"
          >
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* ── PLAYFUL STAT BADGES & METRIC TOGGLE ── */}
      <div className="flex items-center gap-2.5 sm:gap-3 mb-6 flex-wrap">
        <button
          onClick={() => setActiveMetric(activeMetric === 'hadir' ? 'all' : 'hadir')}
          className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
            activeMetric === 'hadir' || activeMetric === 'all'
              ? 'bg-blue-50 border border-blue-200 text-blue-700 shadow-2xs'
              : 'bg-slate-50 border border-slate-200 text-slate-400 opacity-60'
          }`}
        >
          <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span>
          <span>Hadir: {totals.hadir}</span>
        </button>

        <button
          onClick={() => setActiveMetric(activeMetric === 'izin' ? 'all' : 'izin')}
          className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
            activeMetric === 'izin' || activeMetric === 'all'
              ? 'bg-amber-50 border border-amber-200 text-amber-700 shadow-2xs'
              : 'bg-slate-50 border border-slate-200 text-slate-400 opacity-60'
          }`}
        >
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
          <span>Izin: {totals.izin}</span>
        </button>

        <button
          onClick={() => setActiveMetric(activeMetric === 'sakit' ? 'all' : 'sakit')}
          className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
            activeMetric === 'sakit' || activeMetric === 'all'
              ? 'bg-sky-50 border border-sky-200 text-sky-700 shadow-2xs'
              : 'bg-slate-50 border border-slate-200 text-slate-400 opacity-60'
          }`}
        >
          <span className="w-2.5 h-2.5 rounded-full bg-sky-500"></span>
          <span>Sakit: {totals.sakit}</span>
        </button>

        <button
          onClick={() => setActiveMetric(activeMetric === 'alfa' ? 'all' : 'alfa')}
          className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
            activeMetric === 'alfa' || activeMetric === 'all'
              ? 'bg-rose-50 border border-rose-200 text-rose-700 shadow-2xs'
              : 'bg-slate-50 border border-slate-200 text-slate-400 opacity-60'
          }`}
        >
          <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
          <span>Alfa: {totals.alfa}</span>
        </button>

        {totalEntries > 0 && (
          <div className="ml-auto inline-flex items-center gap-2 px-4 py-1.5 rounded-2xl bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 text-emerald-800 text-xs font-black shadow-2xs">
            <CheckCircle2 size={14} className="text-emerald-600 shrink-0" />
            <span>Tingkat Kehadiran: {attendanceRate}%</span>
          </div>
        )}
      </div>

      {/* ── MAIN CHART CANVAS ── */}
      <div className="flex-grow flex flex-col justify-center h-full min-h-[320px] w-full relative">
        {loading ? (
          <div className="flex-grow flex flex-col items-center justify-center z-10 py-16 gap-3">
            <div className="w-10 h-10 border-3 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-xs font-bold text-slate-400 animate-pulse">Menghubungkan ke server presensi realtime...</p>
          </div>
        ) : chartData.length === 0 ? (
          <div className="flex-grow flex flex-col items-center justify-center text-slate-400 py-16 gap-3 bg-slate-50/50 rounded-3xl border border-dashed border-slate-200 p-8">
            <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <TrendingUp size={28} />
            </div>
            <div className="text-center max-w-sm">
              <p className="font-headline font-bold text-sm text-slate-700">Belum Ada Rekap Presensi pada Periode Ini</p>
              <p className="font-body text-xs text-slate-400 mt-1 leading-relaxed">
                Catatan presensi akan otomatis muncul saat siswa atau guru melakukan scan RFID / presensi kelas hari ini.
              </p>
            </div>
          </div>
        ) : (
          <div className="flex-grow w-full h-[320px] sm:h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              {chartType === 'area' ? (
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gradientHadir" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2563eb" stopOpacity={0.35}/>
                      <stop offset="95%" stopColor="#2563eb" stopOpacity={0.0}/>
                    </linearGradient>
                    <linearGradient id="gradientIzin" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.0}/>
                    </linearGradient>
                    <linearGradient id="gradientSakit" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0.0}/>
                    </linearGradient>
                    <linearGradient id="gradientAlfa" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#f43f5e" stopOpacity={0.0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#64748b', fontSize: 11, fontWeight: 600 }} 
                    dy={10} 
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#94a3b8', fontSize: 11 }} 
                    allowDecimals={false}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  
                  {(activeMetric === 'all' || activeMetric === 'hadir') && (
                    <Area 
                      type="monotone" 
                      dataKey="hadir" 
                      name="Hadir" 
                      stroke="#2563eb" 
                      strokeWidth={3}
                      fillOpacity={1} 
                      fill="url(#gradientHadir)" 
                      activeDot={{ r: 6, stroke: '#2563eb', strokeWidth: 2, fill: '#ffffff' }}
                    />
                  )}
                  {(activeMetric === 'all' || activeMetric === 'izin') && (
                    <Area 
                      type="monotone" 
                      dataKey="izin" 
                      name="Izin" 
                      stroke="#f59e0b" 
                      strokeWidth={2.5}
                      fillOpacity={1} 
                      fill="url(#gradientIzin)" 
                      activeDot={{ r: 5, stroke: '#f59e0b', strokeWidth: 2, fill: '#ffffff' }}
                    />
                  )}
                  {(activeMetric === 'all' || activeMetric === 'sakit') && (
                    <Area 
                      type="monotone" 
                      dataKey="sakit" 
                      name="Sakit" 
                      stroke="#0ea5e9" 
                      strokeWidth={2.5}
                      fillOpacity={1} 
                      fill="url(#gradientSakit)" 
                      activeDot={{ r: 5, stroke: '#0ea5e9', strokeWidth: 2, fill: '#ffffff' }}
                    />
                  )}
                  {(activeMetric === 'all' || activeMetric === 'alfa') && (
                    <Area 
                      type="monotone" 
                      dataKey="alfa" 
                      name="Alfa" 
                      stroke="#f43f5e" 
                      strokeWidth={2.5}
                      fillOpacity={1} 
                      fill="url(#gradientAlfa)" 
                      activeDot={{ r: 5, stroke: '#f43f5e', strokeWidth: 2, fill: '#ffffff' }}
                    />
                  )}
                </AreaChart>
              ) : (
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#64748b', fontSize: 11, fontWeight: 600 }} 
                    dy={10} 
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#94a3b8', fontSize: 11 }} 
                    allowDecimals={false}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  
                  {(activeMetric === 'all' || activeMetric === 'hadir') && (
                    <Bar dataKey="hadir" name="Hadir" fill="#2563eb" radius={[6, 6, 0, 0]} maxBarSize={40} />
                  )}
                  {(activeMetric === 'all' || activeMetric === 'izin') && (
                    <Bar dataKey="izin" name="Izin" fill="#f59e0b" radius={[6, 6, 0, 0]} maxBarSize={40} />
                  )}
                  {(activeMetric === 'all' || activeMetric === 'sakit') && (
                    <Bar dataKey="sakit" name="Sakit" fill="#0ea5e9" radius={[6, 6, 0, 0]} maxBarSize={40} />
                  )}
                  {(activeMetric === 'all' || activeMetric === 'alfa') && (
                    <Bar dataKey="alfa" name="Alfa" fill="#f43f5e" radius={[6, 6, 0, 0]} maxBarSize={40} />
                  )}
                </BarChart>
              )}
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}
