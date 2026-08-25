'use client';

import React, { useState, useEffect } from 'react';
import { 
  Bell, 
  Plus, 
  Trash2, 
  Edit2, 
  X, 
  Calendar, 
  Loader2, 
  Megaphone, 
  Sparkles,
  ChevronRight
} from 'lucide-react';

export function ClassroomInfo({ classroomId }: { classroomId: string }) {
  const [infos, setInfos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ title: '', date: '', description: '' });
  const [saving, setSaving] = useState(false);

  const fetchInfos = async () => {
    if (!classroomId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/infos?classroomId=${classroomId}&_t=` + Date.now());
      const data = await res.json();
      if (data.success) {
        setInfos(data.data || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInfos();
  }, [classroomId]);

  const handleOpenAdd = () => {
    setEditingId(null);
    setFormData({ title: '', date: new Date().toISOString().split('T')[0], description: '' });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (info: any) => {
    setEditingId(info.id);
    setFormData({ title: info.title, date: info.date, description: info.description });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if(confirm('Yakin ingin menghapus informasi ini?')) {
      try {
        await fetch(`/api/infos?id=${id}`, { method: 'DELETE' });
        setInfos(prev => prev.filter(info => info.id !== id));
      } catch (e) {
        console.error(e);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingId) {
        await fetch(`/api/infos?id=${editingId}`, { method: 'DELETE' });
      }

      const payload = {
        ...formData,
        classroom_id: classroomId,
      };
      
      await fetch('/api/infos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      setIsModalOpen(false);
      fetchInfos();
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-[2rem] border border-slate-200/80 p-16 flex flex-col justify-center items-center gap-3 shadow-sm">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <span className="text-xs font-semibold text-slate-500">Memuat Pengumuman Kelas...</span>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-[2rem] border border-slate-200/80 shadow-sm overflow-hidden flex flex-col">
      {/* Header */}
      <div className="p-6 sm:p-7 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100 shrink-0">
            <Megaphone className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-headline font-black text-xl text-slate-800">Pusat Informasi &amp; Pengumuman</h3>
            <p className="text-xs text-slate-500 mt-0.5">Pemberitahuan penting seputar aktivitas rombel dan tugas kelas.</p>
          </div>
        </div>

        <button 
          onClick={handleOpenAdd}
          className="btn-tactile flex items-center justify-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 hover:brightness-105 text-white rounded-full text-xs font-bold transition shadow-sm shadow-blue-900/15 cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Pengumuman</span>
        </button>
      </div>

      {/* Announcements List */}
      <div className="p-6 sm:p-7">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4.5">
          {infos.length === 0 ? (
            <div className="col-span-full py-16 text-center bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
              <div className="w-12 h-12 bg-white rounded-2xl border border-slate-200/80 flex items-center justify-center mx-auto mb-3 text-slate-400">
                <Bell className="w-6 h-6" />
              </div>
              <h4 className="font-headline font-bold text-sm text-slate-700">Belum ada pengumuman di kelas ini</h4>
              <p className="text-xs text-slate-400 mt-1">Gunakan tombol di kanan atas untuk membuat pengumuman baru.</p>
            </div>
          ) : (
            infos.map((info) => (
              <div 
                key={info.id} 
                className="group p-5 rounded-2xl bg-white border border-slate-200/80 shadow-2xs hover:shadow-md hover:border-blue-300 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <h4 className="font-headline font-bold text-sm text-slate-800 leading-snug group-hover:text-blue-700 transition-colors">
                      {info.title}
                    </h4>

                    <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => handleOpenEdit(info)} 
                        className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                        title="Edit"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button 
                        onClick={() => handleDelete(info.id)} 
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                        title="Hapus"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="inline-flex items-center gap-1.5 text-[11px] text-blue-700 font-bold bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-100 mb-3">
                    <Calendar className="w-3 h-3" />
                    <span>{info.date}</span>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-line">{info.description}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-[2rem] w-full max-w-md shadow-2xl border border-slate-100 overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="font-headline font-black text-lg text-slate-800">
                  {editingId ? 'Edit Pengumuman' : 'Tambah Pengumuman Baru'}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">Informasi akan tampil di dashboard kelas.</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-1.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Judul Pengumuman</label>
                <input 
                  required 
                  type="text" 
                  className="w-full px-4 py-3 bg-slate-50/80 border border-slate-200/90 rounded-2xl focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 text-xs font-medium text-slate-800 transition outline-none" 
                  value={formData.title} 
                  onChange={e => setFormData({...formData, title: e.target.value})} 
                  placeholder="Contoh: Jadwal Ujian Akhir Semester" 
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Tanggal</label>
                <input 
                  required 
                  type="date" 
                  className="w-full px-4 py-3 bg-slate-50/80 border border-slate-200/90 rounded-2xl focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 text-xs font-semibold text-slate-800 transition outline-none" 
                  value={formData.date} 
                  onChange={e => setFormData({...formData, date: e.target.value})} 
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Deskripsi / Isi Informasi</label>
                <textarea 
                  required 
                  rows={4} 
                  className="w-full px-4 py-3 bg-slate-50/80 border border-slate-200/90 rounded-2xl focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 text-xs font-medium text-slate-800 transition outline-none resize-none" 
                  value={formData.description} 
                  onChange={e => setFormData({...formData, description: e.target.value})} 
                  placeholder="Tuliskan detail pengumuman kelas di sini..." 
                />
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
                  disabled={saving} 
                  type="submit" 
                  className="btn-tactile px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-full text-xs font-bold transition shadow-sm shadow-blue-900/15 disabled:opacity-50 flex items-center gap-2 cursor-pointer"
                >
                  {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />} 
                  <span>{editingId ? 'Simpan Perubahan' : 'Terbitkan Info'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
