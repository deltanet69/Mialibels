'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { 
  Users, 
  UserCheck, 
  UserMinus, 
  UserX, 
  Loader2, 
  Search, 
  Eye, 
  TrendingUp, 
  CheckCircle2, 
  Calendar,
  Sparkles
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface Props {
  totalStudents: number;
  classroomId: string;
  classroomSlug: string;
}

function SkeletonStudentRow() {
  return (
    <tr className="animate-pulse border-b border-slate-100">
      <td className="py-3.5 pr-4 pl-6"><div className="h-4 bg-slate-100 rounded w-16" /></td>
      <td className="py-3.5 pr-4"><div className="h-4 bg-slate-100 rounded w-32" /></td>
      <td className="py-3.5 pr-4"><div className="h-4 bg-slate-100 rounded w-20" /></td>
      <td className="py-3.5 pr-4"><div className="h-4 bg-slate-100 rounded w-24" /></td>
      <td className="py-3.5 pr-4"><div className="h-5 bg-slate-100 rounded-full w-14" /></td>
      <td className="py-3.5 pr-6 text-right"><div className="h-7 bg-slate-100 rounded-xl w-14 ml-auto" /></td>
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
        const res = await fetch(`/api/attendance/classroom?classroomId=${classroomId}&_t=` + Date.now());
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
            const dateObj = new Date(); 
            dateObj.setDate(dateObj.getDate() - i);
            dateObj.setMinutes(dateObj.getMinutes() - dateObj.getTimezoneOffset());
            grouped[dateObj.toISOString().split('T')[0]] = 0;
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
        const res = await fetch(`/api/classrooms/${classroomSlug}/students?_t=` + Date.now());
        const data = await res.json();
        if (data.success) setAllStudents(data.data || []);
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
      s.student_number?.toLowerCase().includes(q) ||
      s.nisn?.toLowerCase().includes(q)
    );
  }, [allStudents, studentSearch]);

  const statCards = [
    { 
      label: 'Total Siswa Terdaftar', 
      value: totalStudents || allStudents.length, 
      unit: 'Murid',
      icon: Users, 
      color: 'text-blue-600', 
      bg: 'bg-blue-50 border-blue-100' 
    },
    { 
      label: 'Siswa Hadir Hari Ini', 
      value: stats.hadir, 
      unit: 'Hadir',
      icon: UserCheck, 
      color: 'text-emerald-600', 
      bg: 'bg-emerald-50 border-emerald-100' 
    },
    { 
      label: 'Izin / Sakit Hari Ini', 
      value: stats.izinSakit, 
      unit: 'Siswa',
      icon: UserMinus, 
      color: 'text-amber-600', 
      bg: 'bg-amber-50 border-amber-100' 
    },
    { 
      label: 'Alpha / Tanpa Ket.', 
      value: stats.alpha, 
      unit: 'Siswa',
      icon: UserX, 
      color: 'text-rose-600', 
      bg: 'bg-rose-50 border-rose-100' 
    },
  ];

  return (
    <div className="space-y-6">
      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <div key={i} className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  {stat.label}
                </span>
                <div className="flex items-baseline gap-1.5">
                  <span className="font-headline font-black text-2xl text-slate-800">{stat.value}</span>
                  <span className="text-xs font-semibold text-slate-500">{stat.unit}</span>
                </div>
              </div>
              <div className={`w-12 h-12 rounded-2xl ${stat.bg} ${stat.color} flex items-center justify-center border shrink-0 shadow-2xs`}>
                <Icon className="w-6 h-6" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Attendance Chart Card */}
      <div className="bg-white p-6 sm:p-7 rounded-[2rem] border border-slate-200/80 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold uppercase tracking-wider mb-1.5 border border-blue-100">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Trend Kehadiran</span>
            </div>
            <h3 className="font-headline font-black text-lg text-slate-800">Grafik Kehadiran 5 Hari Terakhir</h3>
          </div>

          <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100 self-start sm:self-auto">
            {stats.hadir} Hadir Hari Ini
          </span>
        </div>

        <div className="h-64 w-full">
          {loadingAttendance ? (
            <div className="h-full flex items-center justify-center">
              <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
            </div>
          ) : chartData.length === 0 ? (
            <div className="h-full flex items-center justify-center text-slate-400 text-xs">
              Belum ada riwayat absensi dalam 5 hari terakhir.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorClassHadir" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0.0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11, fontWeight: 600 }} />
                <YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11 }} />
                <Tooltip 
                  contentStyle={{ 
                    borderRadius: '16px', 
                    border: '1px solid #e2e8f0', 
                    boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
                    fontSize: '12px',
                    fontWeight: 'bold'
                  }} 
                  formatter={(value: any) => [`${value} Siswa Hadir`, 'Presensi']}
                />
                <Area 
                  type="monotone" 
                  dataKey="hadir" 
                  stroke="#2563eb" 
                  strokeWidth={3} 
                  fillOpacity={1} 
                  fill="url(#colorClassHadir)" 
                  activeDot={{ r: 6, fill: '#2563eb', stroke: '#ffffff', strokeWidth: 2 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Student List in Class Card */}
      <div className="bg-white p-6 sm:p-7 rounded-[2rem] border border-slate-200/80 shadow-sm">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h3 className="font-headline font-black text-lg text-slate-800">Daftar Siswa di Kelas Ini</h3>
            <p className="text-xs text-slate-500 mt-0.5">Siswa yang terdaftar secara resmi di rombongan belajar ini.</p>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
              <input 
                type="text" 
                placeholder="Cari siswa atau NISN..." 
                value={studentSearch}
                onChange={(e) => setStudentSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-50/80 border border-slate-200/90 rounded-xl focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition text-xs font-medium text-slate-800 outline-none"
              />
            </div>
            
            <span className="text-xs font-bold text-blue-800 bg-blue-50 px-3 py-1.5 rounded-full border border-blue-100 whitespace-nowrap shrink-0">
              {filteredStudents.length} Siswa
            </span>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[600px]">
            <thead>
              <tr className="bg-slate-50/70 border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                <th className="py-3.5 pr-4 pl-6">NISN</th>
                <th className="py-3.5 pr-4">Nama Siswa</th>
                <th className="py-3.5 pr-4">Wali Murid</th>
                <th className="py-3.5 pr-4">Kontak Wali</th>
                <th className="py-3.5 pr-4">Status</th>
                <th className="py-3.5 pr-6 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loadingStudents ? (
                Array.from({ length: 5 }).map((_, i) => <SkeletonStudentRow key={i} />)
              ) : filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-slate-400 text-xs">
                    {studentSearch ? 'Tidak ada siswa yang sesuai pencarian.' : 'Belum ada siswa di kelas ini.'}
                  </td>
                </tr>
              ) : (
                filteredStudents.map((student) => (
                  <tr key={student.id} className="hover:bg-slate-50/80 transition-colors group">
                    <td className="py-3.5 pr-4 pl-6">
                      <span className="font-headline font-bold text-xs text-blue-800 bg-blue-50 px-2.5 py-0.5 rounded-md border border-blue-100">
                        {student.nisn || '—'}
                      </span>
                    </td>
                    <td className="py-3.5 pr-4 font-headline font-bold text-xs text-slate-800">
                      {student.name}
                    </td>
                    <td className="py-3.5 pr-4 text-xs font-semibold text-slate-700">
                      {student.parent_name || '—'}
                    </td>
                    <td className="py-3.5 pr-4 text-xs text-slate-500">
                      {student.parent_phone || '—'}
                    </td>
                    <td className="py-3.5 pr-4">
                      {student.is_active ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                          <span>Aktif</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 text-rose-800 border border-rose-200">
                          <span>Nonaktif</span>
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 pr-6 text-right">
                      <Link 
                        href={`/students/${student.id}`}
                        className="inline-flex items-center gap-1 px-3 py-1 text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-600 hover:text-white rounded-xl transition shadow-2xs"
                      >
                        <Eye size={13} />
                        <span>Profil</span>
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
