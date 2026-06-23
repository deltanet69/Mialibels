'use client';

import React, { useState } from 'react';
import { dummyInfos, ClassInfo } from '@/data/dummyClassroom';
import { Bell, Plus, Trash2, Edit2, X, Calendar } from 'lucide-react';

export function ClassroomInfo() {
  const [infos, setInfos] = useState<ClassInfo[]>(dummyInfos);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Omit<ClassInfo, 'id'>>({ title: '', date: '', description: '' });

  const handleOpenAdd = () => {
    setEditingId(null);
    setFormData({ title: '', date: new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }), description: '' });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (info: ClassInfo) => {
    setEditingId(info.id);
    setFormData({ title: info.title, date: info.date, description: info.description });
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    if(confirm('Yakin ingin menghapus informasi ini?')) {
      setInfos(infos.filter(info => info.id !== id));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      setInfos(infos.map(info => info.id === editingId ? { ...formData, id: editingId } as ClassInfo : info));
    } else {
      setInfos([{ ...formData, id: Math.random().toString(36).substr(2, 9) } as ClassInfo, ...infos]);
    }
    setIsModalOpen(false);
  };

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
                <input required type="text" className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} placeholder="Contoh: 18 Juni 2026" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Deskripsi</label>
                <textarea required rows={4} className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none resize-none" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} placeholder="Tuliskan detail informasi..." />
              </div>
              <div className="pt-4 flex justify-end gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 rounded-xl transition-colors">Batal</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-medium transition-colors">Simpan</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
