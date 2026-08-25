'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Calendar, Users, Briefcase, TrendingUp, Sparkles } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export function AttendanceChart({ guruClassId }: { guruClassId?: string }) {
  const [view, setView] = useState<'siswa' | 'guru'>(guruClassId ? 'siswa' : 'siswa');
  const [timeFilter, setTimeFilter] = useState('minggu');
  const [classFilter, setClassFilter] = useState(guruClassId || 'all');
  
  const [rawData, setRawData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [classes, setClasses] = useState<any[]>([]);

  // Fetch unique classes for filter
  useEffect(() => {
    async function fetchClasses() {
      const { data } = await supabase.from('classrooms').select('id, name').order('name', { ascending: true });
      if (data) {
        setClasses((data as any[]).filter((c: any) => c.name && c.name.toLowerCase() !== 'semua kelas'));
      }
    }
    fetchClasses();
  }, []);

  // Fetch data when filters change
  useEffect(() => {
    async function fetchData() {
      setLoading(true);
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

        const res = await fetch(`/api/dashboard/attendance-chart?view=${view}&classFilter=${classFilter}&startDate=${dateStr}&endDate=${todayStr}`);
        const json = await res.json();
        if (res.ok && json.data) {
          setRawData(json.data);
        } else {
          setRawData([]);
        }
      } catch (err) {
        console.error("Failed to fetch attendance:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [view, timeFilter, classFilter]);

  // Process data for Recharts
  const chartData = useMemo(() => {
    if (!rawData || rawData.length === 0) return [];

    const grouped: Record<string, { hadir: number; izin: number; sakit: number; alfa: number; dateStr: string }> = {};

    rawData.forEach(record => {
      const date = record.date;
      if (!grouped[date]) {
        grouped[date] = { hadir: 0, izin: 0, sakit: 0, alfa: 0, dateStr: date };
      }
      
      const status = (record.status || '').toLowerCase();
      if (status.includes('hadir') || status.includes('present')) grouped[date].hadir++;
      else if (status.includes('izin') || status.includes('permit')) grouped[date].izin++;
      else if (status.includes('sakit') || status.includes('sick')) grouped[date].sakit++;
      else grouped[date].alfa++;
    });

    const sorted = Object.values(grouped).sort((a, b) => new Date(a.dateStr).getTime() - new Date(b.dateStr).getTime());

    return sorted.map(item => {
      const dateObj = new Date(item.dateStr);
      let name = '';
      if (timeFilter === 'hari') {
        name = 'Hari Ini';
      } else if (timeFilter === 'minggu') {
        const days = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
        name = days[dateObj.getDay()];
      } else {
        name = `${dateObj.getDate()}/${dateObj.getMonth() + 1}`;
      }
      
      return {
        ...item,
        name
      };
    });
  }, [rawData, timeFilter]);

  // Summary counts for playful badges
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

  return (
    <div className="bg-white p-6 sm:p-7 rounded-[2rem] shadow-sm border border-slate-200/80 flex flex-col w-full min-h-[420px]">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6 gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-pulse"></span>
            <h3 className="font-headline font-bold text-lg text-secondary">Tren Presensi &amp; Kehadiran</h3>
          </div>
          <p className="font-body text-xs sm:text-sm text-slate-500 mt-0.5">Grafik pergerakan presensi real-time madrasah</p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
          {!guruClassId && (
            <>
              {/* Toggle Siswa/Guru */}
              <div className="flex p-1 bg-slate-100/90 rounded-2xl w-full sm:w-auto border border-slate-200/60">
                <button 
                  onClick={() => setView('siswa')}
                  className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    view === 'siswa' 
                      ? 'bg-white text-blue-700 shadow-2xs' 
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <Users size={14} /> <span>Siswa</span>
                </button>
                <button 
                  onClick={() => setView('guru')}
                  className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    view === 'guru' 
                      ? 'bg-white text-blue-700 shadow-2xs' 
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <Briefcase size={14} /> <span>Guru</span>
                </button>
              </div>

              <div className="w-px h-6 bg-slate-200 hidden sm:block"></div>
            </>
          )}

          {/* Filters */}
          <div className="flex gap-2 w-full sm:w-auto">
            {view === 'siswa' && !guruClassId && (
              <select 
                value={classFilter}
                onChange={(e) => setClassFilter(e.target.value)}
                className="flex-1 sm:flex-none bg-slate-50/80 border border-slate-200/90 text-slate-700 text-xs font-medium rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              >
                <option value="all">Semua Kelas</option>
                {classes.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            )}
            
            <div className="relative flex-1 sm:flex-none">
              <Calendar size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <select 
                value={timeFilter}
                onChange={(e) => setTimeFilter(e.target.value)}
                className="w-full bg-slate-50/80 border border-slate-200/90 text-slate-700 text-xs font-medium rounded-xl pl-8 pr-4 py-2 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              >
                <option value="hari">Hari Ini</option>
                <option value="minggu">7 Hari Terakhir</option>
                <option value="bulan">Bulan Ini</option>
                <option value="tahun">Tahun Ini</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Summary Stat Pills */}
      {chartData.length > 0 && !loading && (
        <div className="flex items-center gap-3 sm:gap-4 mb-6 flex-wrap">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-xl bg-blue-50 border border-blue-100 text-blue-800 text-xs font-bold">
            <span className="w-2 h-2 rounded-full bg-blue-600"></span>
            <span>Hadir: {totals.hadir}</span>
          </div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-xl bg-amber-50 border border-amber-100 text-amber-800 text-xs font-bold">
            <span className="w-2 h-2 rounded-full bg-amber-500"></span>
            <span>Izin: {totals.izin}</span>
          </div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-xl bg-sky-50 border border-sky-100 text-sky-800 text-xs font-bold">
            <span className="w-2 h-2 rounded-full bg-sky-500"></span>
            <span>Sakit: {totals.sakit}</span>
          </div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-xl bg-rose-50 border border-rose-100 text-rose-800 text-xs font-bold">
            <span className="w-2 h-2 rounded-full bg-rose-500"></span>
            <span>Alfa: {totals.alfa}</span>
          </div>
        </div>
      )}

      {/* Chart Area */}
      <div className="flex-grow flex flex-col justify-center h-full min-h-[300px] w-full relative">
        {loading ? (
          <div className="flex-grow flex items-center justify-center z-10 py-16">
            <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : chartData.length === 0 ? (
          <div className="flex-grow flex flex-col items-center justify-center text-slate-400 py-16 gap-2">
            <TrendingUp size={40} className="text-slate-300 mb-1" />
            <p className="font-headline font-bold text-sm text-slate-600">Belum ada data kehadiran</p>
            <p className="font-body text-xs text-slate-400">Tidak ada catatan untuk filter waktu/kelas yang dipilih.</p>
          </div>
        ) : (
          <div className="flex-grow w-full h-[320px] sm:h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorHadir" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.25}/>
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorIzin" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorSakit" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorAlfa" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#64748b', fontSize: 12, fontWeight: 500 }} 
                  dy={10} 
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#94a3b8', fontSize: 12 }} 
                  allowDecimals={false}
                />
                <Tooltip 
                  contentStyle={{ 
                    borderRadius: '16px', 
                    border: '1px solid #e2e8f0', 
                    boxShadow: '0 4px 20px -4px rgba(0, 0, 0, 0.06)',
                    padding: '10px 14px'
                  }}
                  itemStyle={{ fontSize: '12px', fontWeight: 600 }}
                  labelStyle={{ color: '#0f2744', fontWeight: 'bold', marginBottom: '6px', fontSize: '13px' }}
                />
                
                <Area 
                  type="monotone" 
                  dataKey="hadir" 
                  name="Hadir" 
                  stroke="#2563eb" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorHadir)" 
                  activeDot={{ r: 6, stroke: '#2563eb', strokeWidth: 2, fill: '#ffffff' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="izin" 
                  name="Izin" 
                  stroke="#f59e0b" 
                  strokeWidth={2}
                  fillOpacity={1} 
                  fill="url(#colorIzin)" 
                  activeDot={{ r: 5, stroke: '#f59e0b', strokeWidth: 2, fill: '#ffffff' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="sakit" 
                  name="Sakit" 
                  stroke="#0ea5e9" 
                  strokeWidth={2}
                  fillOpacity={1} 
                  fill="url(#colorSakit)" 
                  activeDot={{ r: 5, stroke: '#0ea5e9', strokeWidth: 2, fill: '#ffffff' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="alfa" 
                  name="Alfa" 
                  stroke="#f43f5e" 
                  strokeWidth={2}
                  fillOpacity={1} 
                  fill="url(#colorAlfa)" 
                  activeDot={{ r: 5, stroke: '#f43f5e', strokeWidth: 2, fill: '#ffffff' }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}
