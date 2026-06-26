'use client';

import React, { useState, useEffect } from 'react';
import { Users, UserCheck, UserMinus, UserX, Loader2 } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export function ClassroomOverview({ totalStudents, classroomId }: { totalStudents: number, classroomId: string }) {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    hadir: 0,
    izinSakit: 0,
    alpha: 0
  });
  const [chartData, setChartData] = useState<any[]>([]);

  useEffect(() => {
    if (!classroomId) return;

    const fetchData = async () => {
      try {
        const res = await fetch(`/api/attendance/classroom?classroomId=${classroomId}`);
        const data = await res.json();
        
        if (data.success && data.data) {
          const records = data.data;
          
          // Get today's stats
          const today = new Date().toISOString().split('T')[0];
          let hadir = 0, izinSakit = 0, alpha = 0;
          
          records.forEach((r: any) => {
            if (r.date === today) {
              if (r.status === 'Hadir') hadir++;
              else if (r.status === 'Izin' || r.status === 'Sakit') izinSakit++;
              else if (r.status === 'Alpha') alpha++;
            }
          });
          
          setStats({ hadir, izinSakit, alpha });

          // Group by day for the last 5 days
          const grouped: Record<string, number> = {};
          for (let i = 4; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const dateStr = d.toISOString().split('T')[0];
            grouped[dateStr] = 0;
          }

          records.forEach((r: any) => {
            if (grouped[r.date] !== undefined && r.status === 'Hadir') {
              grouped[r.date]++;
            }
          });

          // Format for Recharts
          const days = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
          const newChartData = Object.keys(grouped).map(dateStr => {
            const d = new Date(dateStr);
            return {
              name: days[d.getDay()],
              hadir: grouped[dateStr],
              fullDate: dateStr
            };
          });

          setChartData(newChartData);
        }
      } catch (err) {
        console.error('Failed to fetch attendance overview', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [classroomId]);

  const statCards = [
    { label: 'Total Siswa', value: totalStudents, icon: Users, color: 'text-blue-600', bg: 'bg-blue-100' },
    { label: 'Hadir Hari Ini', value: stats.hadir, icon: UserCheck, color: 'text-emerald-600', bg: 'bg-emerald-100' },
    { label: 'Izin / Sakit', value: stats.izinSakit, icon: UserMinus, color: 'text-amber-600', bg: 'bg-amber-100' },
    { label: 'Alpha', value: stats.alpha, icon: UserX, color: 'text-rose-600', bg: 'bg-rose-100' },
  ];

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-slate-100 p-12 flex justify-center items-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, idx) => (
          <div key={idx} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${stat.bg} ${stat.color}`}>
              <stat.icon className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">{stat.label}</p>
              <p className="text-2xl font-bold text-slate-800">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
        <h3 className="text-lg font-bold text-slate-800 mb-6">Tren Kehadiran Mingguan (5 Hari Terakhir)</h3>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorHadir" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} dy={10} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} allowDecimals={false} />
              <Tooltip 
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                labelFormatter={(label, payload) => payload?.[0]?.payload?.fullDate || label}
              />
              <Area type="monotone" dataKey="hadir" name="Hadir" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorHadir)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
