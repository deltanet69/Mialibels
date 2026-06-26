'use client';

import React, { useState, useEffect } from 'react';
import { Bell, Plus, Trash2, Edit2, X, Calendar, Loader2 } from 'lucide-react';

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
      const res = await fetch(`/api/infos?classroomId=${classroomId}`);
      const data = await res.json();
      if (data.success) {
        setInfos(data.data);
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
        setInfos(infos.filter(info => info.id !== id));
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
        body: JSON.stringify([payload]) // wait, /api/infos does insert(body), if body is array it inserts multiple, if single it inserts single. But in POST route it just does insert(body). So it's fine.
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
      <div className="bg-white rounded-2xl border border-slate-100 p-12 flex justify-center items-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex flex-col">
      <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
            <Bell className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-800">Pusat Informasi</h3>
            <p className="text-sm text-slate-500">Pengumuman dan kegiatan kelas terbaru</p>
          </div>
        </div>
        <button 
          onClick={handleOpenAdd}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-medium transition-colors"
        >
          <Plus className="w-4 h-4" />
          Tambah Info
        </button>
      </div>

      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {infos.length === 0 ? (
            <div className="col-span-full py-12 text-center text-slate-500">Belum ada informasi.</div>
          ) : (
            infos.map((info) => (
              <div key={info.id} className="group p-5 rounded-2xl bg-white border border-slate-200 shadow-sm hover:shadow-md hover:border-blue-200 transition-all flex flex-col h-full">
                <div className="flex items-start justify-between gap-4 mb-2">
                  <h4 className="font-bold text-slate-800 leading-snug">{info.title}</h4>
                  <div className="flex items-center gap-1 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => handleOpenEdit(info)} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(info.id)} className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-blue-600 font-medium mb-3">
                  <Calendar className="w-3.5 h-3.5" />
                  {info.date}
                </div>
                <p className="text-sm text-slate-600 leading-relaxed flex-1">{info.description}</p>
              </div>
            ))
          )}
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-slate-800">{editingId ? 'Edit Informasi' : 'Tambah Informasi'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Judul / Kegiatan</label>
                <input required type="text" className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} placeholder="Contoh: Kegiatan Jumat Bersih" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Tanggal</label>
                <input required type="date" className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} placeholder="Contoh: 2026-06-18" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Deskripsi</label>
                <textarea required rows={4} className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none resize-none" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} placeholder="Tuliskan detail informasi..." />
              </div>
              <div className="pt-4 flex justify-end gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 rounded-xl transition-colors">Batal</button>
                <button disabled={saving} type="submit" className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-medium transition-colors disabled:opacity-50 flex items-center gap-2">
                  {saving && <Loader2 className="w-4 h-4 animate-spin" />} Simpan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
