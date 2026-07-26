'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { Users, UserCheck, UserMinus, UserX, Loader2, Search, Eye } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface Props {
  totalStudents: number;
  classroomId: string;
  classroomSlug: string;
}

function SkeletonStudentRow() {
  return (
    <tr className="animate-pulse border-b border-slate-50">
      <td className="px-4 py-3"><div className="h-4 bg-slate-100 rounded w-6" /></td>
      <td className="px-4 py-3"><div className="h-4 bg-slate-100 rounded w-32" /></td>
      <td className="px-4 py-3"><div className="h-4 bg-slate-100 rounded w-20" /></td>
      <td className="px-4 py-3"><div className="h-4 bg-slate-100 rounded w-28" /></td>
      <td className="px-4 py-3"><div className="h-5 bg-slate-100 rounded-full w-12" /></td>
      <td className="px-4 py-3"><div className="h-7 bg-slate-100 rounded w-14 ml-auto" /></td>
    </tr>
  );
}

export function ClassroomOverview({ totalStudents, classroomId, classroomSlug }: Props) {
  const [loadingAttendance, setLoadingAttendance] = useState(true);
  const [loadingStudents, setLoadingStudents] = useState(true);
  const [stats, setStats] = useState({ hadir: 0, izinSakit: 0, alpha: 0 });
  const [chartData, setChartData] = useState<any[]>([]);
  const [allStudents, setAllStudents] = useState<any[]>([]);
  const [studentSearch, setStudentSearch] = useState('');

  // Fetch attendance data
  useEffect(() => {
    if (!classroomId) return;
    const fetchAttendance = async () => {
      try {
        const res = await fetch(`/api/attendance/classroom?classroomId=${classroomId}`);
        const data = await res.json();
        if (data.success && data.data) {
          const records = data.data;
          const d = new Date();
          d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
          const today = d.toISOString().split('T')[0];
          let hadir = 0, izinSakit = 0, alpha = 0;
          records.forEach((r: any) => {
            if (r.date === today) {
              if (r.status === 'Hadir') hadir++;
              else if (r.status === 'Izin' || r.status === 'Sakit') izinSakit++;
              else if (r.status === 'Alpha') alpha++;
            }
          });
          setStats({ hadir, izinSakit, alpha });

          const grouped: Record<string, number> = {};
          for (let i = 4; i >= 0; i--) {
            const d = new Date(); 
            d.setDate(d.getDate() - i);
            d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
            grouped[d.toISOString().split('T')[0]] = 0;
          }
          records.forEach((r: any) => {
            if (grouped[r.date] !== undefined && r.status === 'Hadir') grouped[r.date]++;
          });
          const days = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
          setChartData(Object.keys(grouped).map(dateStr => ({
            name: days[new Date(dateStr).getDay()],
            hadir: grouped[dateStr],
            fullDate: dateStr
          })));
        }
      } catch (err) {
        console.error('Failed to fetch attendance overview', err);
      } finally {
        setLoadingAttendance(false);
      }
    };
    fetchAttendance();
  }, [classroomId]);

  // Fetch students in this class
  useEffect(() => {
    if (!classroomSlug) return;
    const fetchStudents = async () => {
      try {
        const res = await fetch(`/api/classrooms/${classroomSlug}/students`);
        const data = await res.json();
        if (data.success) setAllStudents(data.data);
      } catch (err) {
        console.error('Failed to fetch students', err);
      } finally {
        setLoadingStudents(false);
      }
    };
    fetchStudents();
  }, [classroomSlug]);

  // Instant client-side search for students
  const filteredStudents = useMemo(() => {
    if (!studentSearch.trim()) return allStudents;
    const q = studentSearch.toLowerCase();
    return allStudents.filter(s =>
      s.name?.toLowerCase().includes(q) ||
      s.student_number?.toLowerCase().includes(q)
    );
  }, [allStudents, studentSearch]);

  const statCards = [
    { label: 'Total Siswa', value: totalStudents, icon: Users, color: 'text-blue-600', bg: 'bg-blue-100' },
    { label: 'Hadir Hari Ini', value: stats.hadir, icon: UserCheck, color: 'text-emerald-600', bg: 'bg-emerald-100' },
    { label: 'Izin / Sakit', value: stats.izinSakit, icon: UserMinus, color: 'text-amber-600', bg: 'bg-amber-100' },
    { label: 'Alpha', value: stats.alpha, icon: UserX, color: 'text-rose-600', bg: 'bg-rose-100' },
  ];

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, idx) => (
          <div key={idx} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${stat.bg} ${stat.color}`}>
              <stat.icon className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">{stat.label}</p>
              {loadingAttendance && idx > 0 ? (
                <div className="h-7 w-10 bg-slate-100 rounded animate-pulse mt-1" />
              ) : (
                <p className="text-2xl font-bold text-slate-800">{stat.value}</p>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Attendance Chart */}
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
        <h3 className="text-lg font-bold text-slate-800 mb-6">Tren Kehadiran (5 Hari Terakhir)</h3>
        <div className="h-64">
          {loadingAttendance ? (
            <div className="h-full flex items-center justify-center">
              <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
            </div>
          ) : (
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
          )}
        </div>
      </div>

      {/* Student List — Integrated */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <h3 className="text-base font-bold text-slate-800">Daftar Siswa</h3>
            {!loadingStudents && (
              <span className="text-xs font-semibold bg-blue-50 text-blue-600 px-2 py-0.5 rounded-md">
                {allStudents.length} siswa
              </span>
            )}
          </div>
          <div className="relative w-full sm:w-64">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Cari nama atau NIS..."
              value={studentSearch}
              onChange={(e) => setStudentSearch(e.target.value)}
              className="w-full pl-8 pr-4 py-2 text-sm border border-slate-200 rounded-xl outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500 border-b border-slate-100">
              <tr>
                <th className="px-4 py-3 font-medium w-10">No</th>
                <th className="px-4 py-3 font-medium">Nama Siswa</th>
                <th className="px-4 py-3 font-medium">NIS/NISN</th>
                <th className="px-4 py-3 font-medium">Nama Orang Tua</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loadingStudents ? (
                Array.from({ length: 5 }).map((_, i) => <SkeletonStudentRow key={i} />)
              ) : filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                    {studentSearch ? `Tidak ada siswa dengan kata kunci "${studentSearch}".` : 'Belum ada siswa di kelas ini.'}
                  </td>
                </tr>
              ) : (
                filteredStudents.map((student, idx) => (
                  <tr key={student.id} className="hover:bg-slate-50 transition group">
                    <td className="px-4 py-3 text-slate-400">{idx + 1}</td>
                    <td className="px-4 py-3 font-medium text-slate-800">{student.name}</td>
                    <td className="px-4 py-3 text-slate-600">{student.student_number || '-'}</td>
                    <td className="px-4 py-3 text-slate-600">{student.parent_name || '-'}</td>
                    <td className="px-4 py-3">
                      {student.is_active ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">Aktif</span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">Nonaktif</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/students/${student.id}`}
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition opacity-0 group-hover:opacity-100"
                      >
                        <Eye size={12} /> Detail
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
