'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Users, UserCircle2, ArrowRight, Plus, Search, X } from 'lucide-react';

export default function ClassroomPage() {
  const [classrooms, setClassrooms] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ name: '', homeroomTeacherId: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchClassrooms = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/classrooms?search=${encodeURIComponent(searchQuery)}`);
      const data = await res.json();
      if (data.success) {
        setClassrooms(data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchTeachers = async () => {
    try {
      const res = await fetch('/api/guru');
      const data = await res.json();
      if (data.success) {
        setTeachers(data.data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    const delay = setTimeout(() => {
      fetchClassrooms();
    }, 500);
    return () => clearTimeout(delay);
  }, [searchQuery]);

  useEffect(() => {
    fetchTeachers();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/classrooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
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

  const filteredClassrooms = classrooms.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (c.homeroomTeacher && c.homeroomTeacher.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 capitalize">Classroom</h1>
          <p className="text-slate-500">Kelola ruang kelas, jadwal, dan absensi siswa.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-all shadow-sm hover:shadow-md"
        >
          <Plus className="w-5 h-5" />
          Tambah Kelas
        </button>
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div className="relative mb-6 w-full sm:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
          <input 
            type="text"
            placeholder="Cari kelas atau nama wali kelas..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition outline-none"
          />
        </div>

        {loading ? (
          <div className="py-12 text-center text-slate-500">Memuat data kelas...</div>
        ) : filteredClassrooms.length === 0 ? (
          <div className="py-12 text-center text-slate-500">
            {searchQuery ? 'Kelas tidak ditemukan.' : 'Belum ada data kelas.'}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredClassrooms.map((classroom) => (
              <Link href={`/classroom/${classroom.id}`} key={classroom.id} className="group flex flex-col bg-white border border-slate-200 rounded-2xl overflow-hidden hover:border-blue-300 hover:shadow-lg transition-all duration-300">
                <div className="p-5 flex-1 border-b border-slate-50">
                  <div className="flex justify-between items-start mb-4">
                    <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xl group-hover:scale-110 transition-transform duration-300 shadow-sm border border-blue-100">
                      {classroom.name.charAt(0)}
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-500 bg-slate-50 px-2.5 py-1 rounded-lg text-sm font-medium border border-slate-100">
                      <Users className="w-4 h-4" />
                      <span>{classroom.enrolledStudents || 0}</span>
                    </div>
                  </div>
                  <h3 className="font-bold text-slate-800 text-lg mb-1 group-hover:text-blue-600 transition-colors">Kelas {classroom.name}</h3>
                  <div className="flex items-center gap-2 text-sm text-slate-500">
                    <UserCircle2 className="w-4 h-4 text-slate-400" />
                    <span className="truncate">{classroom.homeroomTeacher || '-'}</span>
                  </div>
                </div>
                <div className="px-5 py-3 bg-slate-50 flex items-center justify-between text-sm font-medium text-slate-600 group-hover:text-blue-600 group-hover:bg-blue-50/50 transition-colors">
                  <span>Lihat Detail</span>
                  <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-slate-800">Tambah Kelas Baru</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nama Kelas</label>
                <input 
                  required 
                  type="text" 
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-colors" 
                  placeholder="Contoh: 1A, 2B, dll" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Wali Kelas (Opsional)</label>
                <select 
                  className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-colors"
                  value={formData.homeroomTeacherId}
                  onChange={(e) => setFormData({...formData, homeroomTeacherId: e.target.value})}
                >
                  <option value="">-- Pilih Wali Kelas --</option>
                  {teachers.map(t => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>
              <div className="pt-4 flex justify-end gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 font-medium text-slate-600 hover:bg-slate-50 rounded-xl transition-colors">Batal</button>
                <button type="submit" disabled={isSubmitting} className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-colors disabled:opacity-50">
                  {isSubmitting ? 'Menyimpan...' : 'Simpan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
