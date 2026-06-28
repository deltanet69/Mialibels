'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { Users, UserCircle2, ArrowRight, Plus, Search, X } from 'lucide-react';

const CLASS_OPTIONS = ['1A','1B','2A','2B','3A','3B','4A','4B','5A','5B','6A','6B'];

function SkeletonCard() {
  return (
    <div className="animate-pulse flex flex-col bg-white border border-slate-100 rounded-2xl overflow-hidden">
      <div className="p-4 flex flex-col items-center text-center gap-2">
        <div className="w-14 h-14 rounded-2xl bg-slate-100" />
        <div className="h-4 bg-slate-100 rounded w-20" />
        <div className="h-3 bg-slate-100 rounded w-16" />
        <div className="h-3 bg-slate-100 rounded w-24" />
      </div>
      <div className="px-4 py-2.5 bg-slate-50 h-9" />
    </div>
  );
}

export default function ClassroomPage() {
  const [allClassrooms, setAllClassrooms] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ name: '', homeroomTeacherId: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch classrooms once
  const fetchClassrooms = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/classrooms');
      const data = await res.json();
      if (data.success) setAllClassrooms(data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch teachers once (same `staffs` table)
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

  // Instant client-side filter + predefined order
  const sortedClassrooms = useMemo(() => {
    let result = allClassrooms;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(c =>
        c.name.toLowerCase().includes(q) ||
        (c.homeroomTeacher && c.homeroomTeacher.toLowerCase().includes(q))
      );
    }
    return [...result].sort(
      (a, b) => CLASS_OPTIONS.indexOf(a.name.toUpperCase()) - CLASS_OPTIONS.indexOf(b.name.toUpperCase())
    );
  }, [allClassrooms, searchQuery]);

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
        // Optimistic: add to local state
        setAllClassrooms(prev => [...prev, data.data]);
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Manajemen Kelas</h1>
          <p className="text-slate-500">Kelola kelas, wali kelas, siswa, jadwal, dan absensi.</p>
        </div>
        <button
          onClick={handleOpenModal}
          disabled={availableClassOptions.length === 0}
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-xl font-medium transition-all shadow-sm"
        >
          <Plus className="w-5 h-5" />
          Tambah Kelas
        </button>
      </div>

      {/* Content */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div className="flex items-center gap-3 mb-6">
          <div className="relative flex-1 sm:flex-none sm:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Cari kelas atau nama wali kelas..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition outline-none"
            />
          </div>
          {!loading && (
            <span className="text-sm text-slate-400 shrink-0">
              {sortedClassrooms.length} kelas
            </span>
          )}
        </div>

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
            {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : sortedClassrooms.length === 0 ? (
          <div className="py-12 text-center">
            <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Users className="w-8 h-8 text-slate-400" />
            </div>
            <p className="text-slate-500 font-medium">
              {searchQuery ? `Kelas "${searchQuery}" tidak ditemukan.` : 'Belum ada data kelas.'}
            </p>
            {!searchQuery && (
              <p className="text-slate-400 text-sm mt-1">Klik "Tambah Kelas" untuk membuat kelas baru.</p>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
            {sortedClassrooms.map((classroom) => (
              <Link
                href={`/classroom/kelas-${classroom.name.toLowerCase().replace(/\s+/g, '-')}`}
                key={classroom.id}
                className="group flex flex-col bg-white border border-slate-200 rounded-2xl overflow-hidden hover:border-blue-300 hover:shadow-lg transition-all duration-300"
              >
                <div className="p-4 flex-1 flex flex-col items-center text-center">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 text-white flex items-center justify-center font-extrabold text-xl mb-3 group-hover:scale-110 transition-transform duration-300 shadow-md">
                    {classroom.name}
                  </div>
                  <h3 className="font-bold text-slate-800 mb-1 group-hover:text-blue-600 transition-colors">
                    Kelas {classroom.name}
                  </h3>
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1">
                    <Users className="w-3.5 h-3.5" />
                    <span>{classroom.enrolledStudents || 0} Siswa</span>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-slate-400">
                    <UserCircle2 className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate max-w-[90px]" title={classroom.homeroomTeacher}>
                      {classroom.homeroomTeacher || 'Belum Ditugaskan'}
                    </span>
                  </div>
                </div>
                <div className="px-4 py-2.5 bg-slate-50 flex items-center justify-center gap-1 text-xs font-semibold text-slate-500 group-hover:text-blue-600 group-hover:bg-blue-50 transition-colors">
                  <span>Detail</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Add Class Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-800">Tambah Kelas Baru</h3>
                <p className="text-xs text-slate-500 mt-0.5">Sisa kelas yang belum dibuat: {availableClassOptions.length}</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nama Kelas</label>
                {availableClassOptions.length === 0 ? (
                  <div className="px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-700">
                    Semua kelas (1A–6B) sudah dibuat.
                  </div>
                ) : (
                  <select
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none bg-white text-slate-800 font-semibold"
                  >
                    <option value="">-- Pilih Nama Kelas --</option>
                    {availableClassOptions.map(opt => (
                      <option key={opt} value={opt}>Kelas {opt}</option>
                    ))}
                  </select>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Wali Kelas (Opsional)</label>
                <select
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none bg-white"
                  value={formData.homeroomTeacherId}
                  onChange={(e) => setFormData({ ...formData, homeroomTeacherId: e.target.value })}
                >
                  <option value="">-- Pilih Wali Kelas --</option>
                  {teachers.map(t => (
                    <option key={t.id} value={t.id}>{t.name} {t.position ? `(${t.position})` : ''}</option>
                  ))}
                </select>
                {teachers.length === 0 && (
                  <p className="text-xs text-amber-600 mt-1">⚠ Belum ada guru/staff terdaftar. Tambah terlebih dahulu di menu Guru & Staff.</p>
                )}
              </div>
              <div className="pt-4 flex justify-end gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 font-medium text-slate-600 hover:bg-slate-50 rounded-xl transition-colors">
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || availableClassOptions.length === 0}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-colors disabled:opacity-50"
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
