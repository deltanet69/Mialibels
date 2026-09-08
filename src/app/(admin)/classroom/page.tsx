'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { 
  Users, 
  UserCircle2, 
  ArrowRight, 
  Plus, 
  Search, 
  X, 
  LayoutGrid, 
  List, 
  Sparkles, 
  GraduationCap, 
  School,
  CheckCircle2,
  ChevronRight,
  BookOpen
} from 'lucide-react';

const CLASS_OPTIONS = [
  '1A','1B','1C','1D',
  '2A','2B','2C','2D',
  '3A','3B','3C','3D',
  '4A','4B','4C','4D',
  '5A','5B','5C','5D',
  '6A','6B','6C','6D'
];

function SkeletonCard() {
  return (
    <div className="animate-pulse flex flex-col bg-white border border-slate-100 rounded-3xl p-5 gap-3 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="w-12 h-12 rounded-2xl bg-slate-100" />
        <div className="h-5 w-16 bg-slate-100 rounded-full" />
      </div>
      <div className="h-5 bg-slate-100 rounded-lg w-28 mt-2" />
      <div className="h-4 bg-slate-100 rounded-lg w-36" />
      <div className="mt-4 pt-3 border-t border-slate-50 flex justify-between items-center">
        <div className="h-4 bg-slate-100 rounded w-20" />
        <div className="h-6 w-6 bg-slate-100 rounded-full" />
      </div>
    </div>
  );
}

export default function ClassroomPage() {
  const [allClassrooms, setAllClassrooms] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGrade, setSelectedGrade] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ name: '', homeroomTeacherId: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Fetch classrooms
  const fetchClassrooms = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/classrooms?_t=' + Date.now());
      const data = await res.json();
      if (data.success) setAllClassrooms(data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch teachers
  const fetchTeachers = useCallback(async () => {
    try {
      const res = await fetch('/api/guru');
      const data = await res.json();
      if (data.success) setTeachers(data.data);
    } catch (err) {
      console.error(err);
    }
  }, []);

  useEffect(() => {
    fetchClassrooms();
    fetchTeachers();
  }, [fetchClassrooms, fetchTeachers]);

  // Filter classrooms by search and grade
  const filteredClassrooms = useMemo(() => {
    let result = allClassrooms;

    if (selectedGrade !== 'all') {
      result = result.filter(c => c.name.startsWith(selectedGrade));
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(c =>
        c.name.toLowerCase().includes(q) ||
        (c.homeroomTeacher && c.homeroomTeacher.toLowerCase().includes(q))
      );
    }

    // Sort alphabetically by class name (1A, 1B, 2A...)
    return result.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));
  }, [allClassrooms, searchQuery, selectedGrade]);

  // Metrics
  const totalStudentsCount = useMemo(() => {
    return allClassrooms.reduce((acc, curr) => acc + (Number(curr.enrolledStudents) || 0), 0);
  }, [allClassrooms]);

  const assignedHomeroomsCount = useMemo(() => {
    return allClassrooms.filter(c => Boolean(c.homeroomTeacher)).length;
  }, [allClassrooms]);

  const existingClassNames = allClassrooms.map(c => c.name.toUpperCase());
  const availableClassOptions = CLASS_OPTIONS.filter(opt => !existingClassNames.includes(opt));

  const handleOpenModal = () => {
    setFormData({ name: availableClassOptions[0] || '', homeroomTeacherId: '' });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) return alert('Pilih nama kelas terlebih dahulu.');
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/classrooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (data.success) {
        setIsModalOpen(false);
        setFormData({ name: '', homeroomTeacherId: '' });
        fetchClassrooms();
      } else {
        alert(data.error || 'Gagal menambahkan kelas');
      }
    } catch (err) {
      console.error(err);
      alert('Terjadi kesalahan');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Grade color theme generator
  const getGradeGradient = (name: string) => {
    const firstChar = name.charAt(0);
    switch (firstChar) {
      case '1': return 'from-blue-600 to-indigo-600 text-white shadow-blue-500/20';
      case '2': return 'from-indigo-600 to-violet-600 text-white shadow-indigo-500/20';
      case '3': return 'from-blue-500 to-cyan-600 text-white shadow-cyan-500/20';
      case '4': return 'from-emerald-600 to-teal-700 text-white shadow-emerald-500/20';
      case '5': return 'from-amber-500 to-orange-600 text-white shadow-amber-500/20';
      case '6': return 'from-blue-700 to-slate-900 text-white shadow-slate-700/20';
      default: return 'from-blue-600 to-blue-700 text-white shadow-blue-500/20';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white/80 backdrop-blur-md p-6 sm:p-7 rounded-[2rem] border border-slate-200/70 shadow-sm">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-blue-700 font-body text-xs font-bold uppercase tracking-wider mb-2">
            <Sparkles className="w-3.5 h-3.5 text-accent" />
            <span>Manajemen Ruang Kelas</span>
          </div>
          <h1 className="font-headline font-black text-2xl sm:text-3xl text-secondary tracking-tight">
            Daftar Seluruh Kelas
          </h1>
          <p className="font-body text-xs sm:text-sm text-slate-500 mt-0.5">
            Kelola rombongan belajar, penugasan wali kelas, jadwal mingguan, dan rekap absensi.
          </p>
        </div>

        <button
          onClick={handleOpenModal}
          disabled={availableClassOptions.length === 0}
          className="btn-tactile flex items-center justify-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 hover:brightness-105 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-full text-xs font-bold transition shadow-sm shadow-blue-900/15 cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Kelas</span>
        </button>
      </div>

      {/* Quick Summary Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-3 sm:gap-4">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100 shrink-0">
            <School className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Total Rombel</span>
            <div className="flex items-baseline gap-2">
              <span className="font-headline font-black text-2xl text-slate-800">{allClassrooms.length}</span>
              <span className="text-xs font-semibold text-slate-500">Kelas</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-3 sm:gap-4">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100 shrink-0">
            <Users className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Siswa Terdaftar</span>
            <div className="flex items-baseline gap-2">
              <span className="font-headline font-black text-2xl text-slate-800">{totalStudentsCount}</span>
              <span className="text-xs font-semibold text-slate-500">Murid Aktif</span>
            </div>
          </div>
        </div>

        <div className="col-span-2 sm:col-span-1 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-3 sm:gap-4">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100 shrink-0">
            <GraduationCap className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Wali Kelas Terisi</span>
            <div className="flex items-baseline gap-2">
              <span className="font-headline font-black text-2xl text-slate-800">{assignedHomeroomsCount}</span>
              <span className="text-xs font-semibold text-slate-500">/ {allClassrooms.length} Kelas</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Classroom Content Card */}
      <div className="bg-white p-6 sm:p-7 rounded-[2rem] shadow-sm border border-slate-200/80 space-y-6">
        {/* Controls: Search, Grade Tabs & View Mode */}
        <div className="flex flex-col lg:flex-row justify-between items-stretch lg:items-center gap-4">
          {/* Search bar */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Cari nama kelas atau wali kelas..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50/80 border border-slate-200/90 rounded-xl focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition text-xs font-medium text-slate-800 outline-none"
            />
          </div>

          {/* Grade Level Selector Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto hide-scrollbar pb-1">
            {[
              { id: 'all', label: 'Semua' },
              { id: '1', label: 'Tingkat 1' },
              { id: '2', label: 'Tingkat 2' },
              { id: '3', label: 'Tingkat 3' },
              { id: '4', label: 'Tingkat 4' },
              { id: '5', label: 'Tingkat 5' },
              { id: '6', label: 'Tingkat 6' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setSelectedGrade(tab.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                  selectedGrade === tab.id
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center gap-2 self-end lg:self-auto shrink-0">
            <span className="text-xs font-bold text-blue-800 bg-blue-50 px-3 py-1.5 rounded-full border border-blue-100 whitespace-nowrap">
              {filteredClassrooms.length} Kelas
            </span>
            <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200/60">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg transition ${viewMode === 'grid' ? 'bg-white shadow-xs text-blue-600' : 'text-slate-400 hover:text-slate-700'}`}
                title="Grid View"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded-lg transition ${viewMode === 'list' ? 'bg-white shadow-xs text-blue-600' : 'text-slate-400 hover:text-slate-700'}`}
                title="List View"
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Content Section */}
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 2xl:grid-cols-5 gap-3 sm:gap-4">
            {Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : filteredClassrooms.length === 0 ? (
          <div className="py-16 text-center bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
            <div className="w-14 h-14 bg-white rounded-2xl shadow-sm border border-slate-100 flex items-center justify-center mx-auto mb-3 text-slate-400">
              <School className="w-7 h-7" />
            </div>
            <h3 className="font-headline font-bold text-slate-700 text-sm">
              {searchQuery ? `Tidak ada kelas yang sesuai pencarian "${searchQuery}"` : 'Belum ada data kelas.'}
            </h3>
            <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
              {searchQuery ? 'Coba gunakan kata kunci lain atau pilih tingkatan kelas lain.' : 'Silakan tambahkan kelas baru menggunakan tombol di atas.'}
            </p>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 2xl:grid-cols-5 gap-3 sm:gap-4">
            {filteredClassrooms.map((classroom) => {
              const gradientClass = getGradeGradient(classroom.name);
              return (
                  <Link
                  href={`/classroom/kelas-${classroom.name.toLowerCase().replace(/\s+/g, '-')}`}
                  key={classroom.id}
                  className="group flex flex-col justify-between bg-white border border-slate-200/80 rounded-2xl sm:rounded-3xl p-4 sm:p-5 hover:border-blue-300 hover:shadow-md hover:-translate-y-0.5 sm:hover:-translate-y-1 transition-all duration-300 relative overflow-hidden active:scale-98"
                >
                  {/* Subtle top decoration */}
                  <div className="absolute top-0 right-0 w-20 h-20 bg-blue-50/50 rounded-full blur-2xl -mr-6 -mt-6 pointer-events-none group-hover:bg-blue-100/60 transition-colors" />

                  <div>
                    {/* Card Top Row: Badge + Student Count */}
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-gradient-to-br ${gradientClass} flex items-center justify-center font-headline font-black text-base sm:text-xl shadow-md group-hover:scale-105 transition-transform shrink-0`}>
                        {classroom.name}
                      </div>

                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-100 whitespace-nowrap">
                        <Users size={10} />
                        <span>{classroom.enrolledStudents || 0}</span>
                      </span>
                    </div>

                    {/* Class Name */}
                    <h3 className="font-headline font-bold text-sm sm:text-base text-slate-800 group-hover:text-blue-600 transition-colors mb-1 leading-tight">
                      Kelas {classroom.name}
                    </h3>

                    {/* Homeroom Teacher */}
                    <div className="flex items-center gap-1.5 mt-2 pt-2.5 border-t border-slate-100">
                      <div className="w-5 h-5 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center text-[9px] font-bold shrink-0">
                        {classroom.homeroomTeacher ? classroom.homeroomTeacher.charAt(0) : '?'}
                      </div>
                      <span className="text-[11px] sm:text-xs font-semibold text-slate-600 truncate" title={classroom.homeroomTeacher}>
                        {classroom.homeroomTeacher || 'Belum ada Wali'}
                      </span>
                    </div>
                  </div>

                  {/* Card Bottom CTA */}
                  <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-slate-400 group-hover:text-blue-600 transition-colors">
                    <span className="text-[11px]">Buka Kelas</span>
                    <div className="w-6 h-6 rounded-full bg-slate-50 group-hover:bg-blue-50 flex items-center justify-center transition-colors">
                      <ArrowRight size={12} className="group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          /* Table View */
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[600px]">
              <thead>
                <tr className="bg-slate-50/70 border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="py-3.5 pr-4 pl-6 w-16">Kelas</th>
                  <th className="py-3.5 pr-4">Wali Kelas</th>
                  <th className="py-3.5 pr-4">Jumlah Siswa</th>
                  <th className="py-3.5 pr-4">Status</th>
                  <th className="py-3.5 pr-6 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredClassrooms.map((classroom) => (
                  <tr key={classroom.id} className="hover:bg-slate-50/80 transition-colors group">
                    <td className="py-3.5 pr-4 pl-6">
                      <span className="font-headline font-bold text-xs text-white bg-blue-600 px-3 py-1 rounded-xl shadow-xs">
                        {classroom.name}
                      </span>
                    </td>
                    <td className="py-3.5 pr-4 font-headline font-bold text-xs text-slate-800">
                      {classroom.homeroomTeacher ? (
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-blue-50 text-blue-700 flex items-center justify-center text-[10px] font-bold">
                            {classroom.homeroomTeacher.charAt(0)}
                          </div>
                          <span>{classroom.homeroomTeacher}</span>
                        </div>
                      ) : (
                        <span className="text-slate-400 font-normal italic text-xs">Belum Ditugaskan</span>
                      )}
                    </td>
                    <td className="py-3.5 pr-4 text-xs font-semibold text-slate-600">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                        <Users size={12} />
                        <span>{classroom.enrolledStudents || 0} Siswa</span>
                      </span>
                    </td>
                    <td className="py-3.5 pr-4">
                      {classroom.homeroomTeacher ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                          <CheckCircle2 size={11} />
                          <span>Siap Aktif</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                          Perlu Wali Kelas
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 pr-6 text-right">
                      <Link
                        href={`/classroom/kelas-${classroom.name.toLowerCase().replace(/\s+/g, '-')}`}
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-600 hover:text-white rounded-xl text-xs font-bold transition-all shadow-xs"
                      >
                        <span>Detail</span>
                        <ChevronRight size={13} />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Class Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-[2rem] w-full max-w-md shadow-2xl border border-slate-100 overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="font-headline font-black text-lg text-slate-800">Tambah Kelas Baru</h3>
                <p className="text-xs text-slate-500 mt-0.5">Tersedia {availableClassOptions.length} rombel yang belum dibuat.</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-1.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Nama Kelas</label>
                {availableClassOptions.length === 0 ? (
                  <div className="px-4 py-3 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-700 font-semibold">
                    Semua kelas (1A–6D) sudah dibuat di sistem.
                  </div>
                ) : (
                  <select
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-50/80 border border-slate-200/90 rounded-2xl focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 text-xs font-bold text-slate-800 transition outline-none"
                  >
                    <option value="">-- Pilih Nama Kelas --</option>
                    {availableClassOptions.map(opt => (
                      <option key={opt} value={opt}>Kelas {opt}</option>
                    ))}
                  </select>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Wali Kelas (Opsional)</label>
                <select
                  className="w-full px-4 py-3 bg-slate-50/80 border border-slate-200/90 rounded-2xl focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 text-xs font-medium text-slate-800 transition outline-none"
                  value={formData.homeroomTeacherId}
                  onChange={(e) => setFormData({ ...formData, homeroomTeacherId: e.target.value })}
                >
                  <option value="">-- Pilih Wali Kelas --</option>
                  {teachers.map(t => (
                    <option key={t.id} value={t.id}>{t.name} {t.position ? `(${t.position})` : ''}</option>
                  ))}
                </select>
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)} 
                  className="px-5 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-full transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || availableClassOptions.length === 0}
                  className="btn-tactile px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-full text-xs font-bold transition shadow-sm shadow-blue-900/15 disabled:opacity-50"
                >
                  {isSubmitting ? 'Menyimpan...' : 'Simpan Kelas'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
