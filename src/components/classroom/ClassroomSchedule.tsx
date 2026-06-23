'use client';

import React, { useState, useEffect } from 'react';
import { dummySchedules, Schedule } from '@/data/dummyClassroom';
import { Clock, Plus, Trash2, Edit2, X, Calendar as CalendarIcon, PlayCircle } from 'lucide-react';

export function ClassroomSchedule() {
  const [schedules, setSchedules] = useState<Schedule[]>(dummySchedules);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [currentTime, setCurrentTime] = useState(new Date());
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Omit<Schedule, 'id'>>({ name: '', time: '', type: 'Akademik' });

  // Update current time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'Akademik': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'Ekstrakurikuler': return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'Blank': return 'bg-slate-100 text-slate-600 border-slate-200';
      default: return 'bg-emerald-100 text-emerald-700 border-emerald-200';
    }
  };

  const isScheduleActive = (timeString: string, scheduleDate: string) => {
    // Only active if the selected date is today
    const todayStr = new Date().toISOString().split('T')[0];
    if (scheduleDate !== todayStr) return false;

    try {
      const [startStr, endStr] = timeString.split(' - ');
      if (!startStr || !endStr) return false;

      const [startHour, startMin] = startStr.split(':').map(Number);
      const [endHour, endMin] = endStr.split(':').map(Number);
      
      const nowHour = currentTime.getHours();
      const nowMin = currentTime.getMinutes();
      
      const currentTotalMins = nowHour * 60 + nowMin;
      const startTotalMins = startHour * 60 + startMin;
      const endTotalMins = endHour * 60 + endMin;

      return currentTotalMins >= startTotalMins && currentTotalMins <= endTotalMins;
    } catch {
      return false;
    }
  };

  const handleOpenAdd = () => {
    setEditingId(null);
    setFormData({ name: '', time: '', type: 'Akademik' });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (schedule: Schedule) => {
    setEditingId(schedule.id);
    setFormData({ name: schedule.name, time: schedule.time, type: schedule.type });
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    if(confirm('Yakin ingin menghapus jadwal ini?')) {
      setSchedules(schedules.filter(s => s.id !== id));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      setSchedules(schedules.map(s => s.id === editingId ? { ...formData, id: editingId } as Schedule : s));
    } else {
      setSchedules([...schedules, { ...formData, id: Math.random().toString(36).substr(2, 9) } as Schedule]);
    }
    setIsModalOpen(false);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex flex-col">
      <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold text-slate-800">Jadwal Kelas</h3>
          <p className="text-sm text-slate-500">Atur jadwal berdasarkan tanggal</p>
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative">
            <input 
              type="date" 
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="pl-4 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-700"
            />
          </div>
          <button 
            onClick={handleOpenAdd}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-medium transition-colors"
          >
            <Plus className="w-4 h-4" />
            Tambah
          </button>
        </div>
      </div>
      
      <div className="divide-y divide-slate-100 flex-1">
        {schedules.length === 0 ? (
          <div className="p-12 text-center text-slate-500">Belum ada jadwal untuk tanggal ini.</div>
        ) : (
          schedules.map((schedule) => {
            const active = isScheduleActive(schedule.time, selectedDate);
            return (
              <div key={schedule.id} className={`p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center gap-4 transition-colors group relative ${active ? 'bg-blue-50/50' : 'hover:bg-slate-50'}`}>
                {active && (
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500 rounded-r-md"></div>
                )}
                <div className={`flex items-center gap-2 min-w-[140px] ${active ? 'text-blue-600 font-semibold' : 'text-slate-500'}`}>
                  {active ? <PlayCircle className="w-4 h-4 animate-pulse" /> : <Clock className="w-4 h-4" />}
                  <span className="text-sm">{schedule.time}</span>
                </div>
                
                <div className="flex-1 flex items-center justify-between sm:justify-start gap-4">
                  <h4 className={`text-base font-semibold ${active ? 'text-blue-700' : 'text-slate-800'}`}>
                    {schedule.name}
                    {active && <span className="ml-3 inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-700 uppercase tracking-wider">Sedang Berlangsung</span>}
                  </h4>
                  <div className="sm:ml-auto">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${getTypeColor(schedule.type)}`}>
                      {schedule.type === 'Blank' ? 'Istirahat / Kosong' : schedule.type}
                    </span>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => handleOpenEdit(schedule)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-100 rounded-lg transition-colors">
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDelete(schedule.id)} className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-100 rounded-lg transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-slate-800">{editingId ? 'Edit Jadwal' : 'Tambah Jadwal'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nama Kegiatan</label>
                <input required type="text" className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="Contoh: Matematika" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Waktu</label>
                <input required type="text" className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none" value={formData.time} onChange={e => setFormData({...formData, time: e.target.value})} placeholder="Contoh: 07:00 - 08:30" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Jenis Kegiatan</label>
                <select className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none" value={formData.type} onChange={e => setFormData({...formData, type: e.target.value as any})}>
                  <option value="Akademik">Akademik</option>
                  <option value="Ekstrakurikuler">Ekstrakurikuler</option>
                  <option value="Lainnya">Lainnya</option>
                  <option value="Blank">Blank / Istirahat</option>
                </select>
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

