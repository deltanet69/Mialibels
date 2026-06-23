'use client';

import React from 'react';
import { Users, UserCheck, UserMinus, UserX } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const mockChartData = [
  { name: 'Sen', hadir: 28, izin: 1, alpha: 1 },
  { name: 'Sel', hadir: 29, izin: 1, alpha: 0 },
  { name: 'Rab', hadir: 27, izin: 2, alpha: 1 },
  { name: 'Kam', hadir: 30, izin: 0, alpha: 0 },
  { name: 'Jum', hadir: 28, izin: 2, alpha: 0 },
];

export function ClassroomOverview({ totalStudents }: { totalStudents: number }) {
  const stats = [
    { label: 'Total Siswa', value: totalStudents, icon: Users, color: 'text-blue-600', bg: 'bg-blue-100' },
    { label: 'Hadir Hari Ini', value: 28, icon: UserCheck, color: 'text-emerald-600', bg: 'bg-emerald-100' },
    { label: 'Izin / Sakit', value: 2, icon: UserMinus, color: 'text-amber-600', bg: 'bg-amber-100' },
    { label: 'Alpha', value: 0, icon: UserX, color: 'text-rose-600', bg: 'bg-rose-100' },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, idx) => (
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
        <h3 className="text-lg font-bold text-slate-800 mb-6">Tren Kehadiran Mingguan</h3>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={mockChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorHadir" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} dy={10} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} />
              <Tooltip 
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
              />
              <Area type="monotone" dataKey="hadir" name="Hadir" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorHadir)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
