'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Clock, Plus, Trash2, Edit2, X, PlayCircle, Loader2, UserCircle2, CheckCircle2 } from 'lucide-react';

const DAYS = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat'];

export function ClassroomSchedule({ classroomId }: { classroomId: string }) {
  const [schedules, setSchedules] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  
  // Default to today if it's a weekday, otherwise Monday
  const todayIndex = new Date().getDay(); // 0=Sun, 1=Mon...
  const initialDay = (todayIndex >= 1 && todayIndex <= 5) ? DAYS[todayIndex - 1] : 'Senin';
  const [selectedDay, setSelectedDay] = useState(initialDay);
  
  const [currentTime, setCurrentTime] = useState(new Date());
  
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: '', time_start: '', time_end: '', type: 'Pelajaran', teacher_id: '' });
  const [saving, setSaving] = useState(false);
  const [teachingLogs, setTeachingLogs] = useState<Record<string, any>>({});
  const [loadingTeaching, setLoadingTeaching] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);

  const SUBJECTS = [
    "Al-Qur'an Hadis", "Akidah Akhlak", "Fikih", "Sejarah Kebudayaan Islam",
    "Bahasa Arab", "Tematik", "Matematika", "Ilmu Pengetahuan Alam (IPA)",
    "Ilmu Pengetahuan Sosial (IPS)", "Pendidikan Kewarganegaraan (PKn)",
    "Bahasa Indonesia", "Pendidikan Jasmani Olahraga dan Kesehatan (PJOK)",
    "Seni Budaya dan Prakarya (SBdP)", "Bahasa Inggris", "Muatan Lokal",
    "Tahfidz", "Baca Tulis Al-Qur'an (BTQ)"
  ];

  // Update current time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  const fetchData = async () => {
    if (!classroomId) return;
    setLoading(true);
    try {
      // Fetch schedules
      const resSchedules = await fetch(`/api/schedules?classroomId=${classroomId}`);
      const dataSchedules = await resSchedules.json();
      if (dataSchedules.success) {
        setSchedules(dataSchedules.data);
      }
      
      // Fetch current user
      const resMe = await fetch('/api/auth/me');
      const dataMe = await resMe.json();
      if (dataMe.success) {
        setCurrentUser(dataMe.user);
      }
      
      // Fetch teachers for dropdown
      const resTeachers = await fetch('/api/guru');
      const dataTeachers = await resTeachers.json();
      if (dataTeachers.success) {
        setTeachers(dataTeachers.data);
      }
      
      // Fetch teaching logs for today
      const todayStr = new Date().toISOString().split('T')[0];
      const resLogs = await fetch(`/api/teaching-attendance?date=${todayStr}&classroomId=${classroomId}`);
      const dataLogs = await resLogs.json();
      if (dataLogs.success) {
        const logMap: Record<string, any> = {};
        dataLogs.data.forEach((log: any) => {
          logMap[log.schedule_id] = log;
        });
        setTeachingLogs(logMap);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [classroomId]);

  const getTypeColor = (type: string) => {
    switch (type?.toLowerCase()) {
      case 'pelajaran': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'ekstrakurikuler': return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'istirahat': return 'bg-slate-100 text-slate-600 border-slate-200';
      default: return 'bg-emerald-100 text-emerald-700 border-emerald-200';
    }
  };

  const isScheduleActive = (timeString: string, scheduleDay: string) => {
    const todayIndex = new Date().getDay(); 
    // Match current day of week with scheduleDay
    const currentDayName = (todayIndex >= 1 && todayIndex <= 5) ? DAYS[todayIndex - 1] : null;
    if (scheduleDay !== currentDayName) return false;

    try {
      const [startStr, endStr] = timeString.split('-').map(s => s.trim());
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
    setFormData({ name: SUBJECTS[0], time_start: '', time_end: '', type: 'Pelajaran', teacher_id: '' });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (schedule: any) => {
    setEditingId(schedule.id);
    let tStart = '', tEnd = '';
    if (schedule.time) {
      const parts = schedule.time.split('-');
      if (parts.length === 2) {
        tStart = parts[0].trim();
        tEnd = parts[1].trim();
      }
    }
    setFormData({ 
      name: schedule.name, 
      time_start: tStart,
      time_end: tEnd,
      type: schedule.type,
      teacher_id: schedule.teacher_id || '' 
    });
    setIsModalOpen(true);
  };

  const handleStartTeaching = async (scheduleId: string, teacherId: string) => {
    if (!teacherId) return alert('Pilih guru terlebih dahulu untuk mata pelajaran ini.');
    setLoadingTeaching(true);
    try {
      const todayStr = new Date().toISOString().split('T')[0];
      const res = await fetch('/api/teaching-attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          schedule_id: scheduleId,
          teacher_id: teacherId,
          date: todayStr,
          status: 'Hadir'
        })
      });
      const data = await res.json();
      if (data.success) {
        setTeachingLogs(prev => ({
          ...prev,
          [scheduleId]: data.data
        }));
      } else {
        alert(data.error || 'Gagal merekam data absensi mengajar');
      }
    } catch (e) {
      console.error(e);
      alert('Terjadi kesalahan');
    } finally {
      setLoadingTeaching(false);
    }
  };

  const handleDelete = async (id: string) => {
    if(confirm('Yakin ingin menghapus jadwal ini?')) {
      try {
        await fetch(`/api/schedules?id=${id}`, { method: 'DELETE' });
        setSchedules(schedules.filter(s => s.id !== id));
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
        await fetch(`/api/schedules?id=${editingId}`, { method: 'DELETE' });
      }

      const payload = {
        name: formData.type === 'Pelajaran' ? formData.name : formData.name, // Will refine in UI
        time: `${formData.time_start} - ${formData.time_end}`,
        type: formData.type,
        teacher_id: formData.teacher_id || null,
        classroom_id: classroomId,
        day: selectedDay
      };
      
      await fetch('/api/schedules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify([payload])
      });
      
      setIsModalOpen(false);
      fetchData();
    } catch(e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  // Sort schedules by time
  const filteredSchedules = useMemo(() => {
    return schedules
      .filter(s => s.day === selectedDay)
      .sort((a, b) => {
        const timeA = a.time.split('-')[0].trim();
        const timeB = b.time.split('-')[0].trim();
        return timeA.localeCompare(timeB);
      });
  }, [schedules, selectedDay]);

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-slate-100 p-12 flex justify-center items-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex flex-col">
      <div className="p-6 border-b border-slate-100 flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold text-slate-800">Jadwal Pelajaran</h3>
            <p className="text-sm text-slate-500">Atur jadwal mingguan untuk kelas ini.</p>
          </div>
          <button 
            onClick={handleOpenAdd}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-medium transition-colors"
          >
            <Plus className="w-4 h-4" />
            Tambah Jadwal
          </button>
        </div>

        {/* Days Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto hide-scrollbar pb-1">
          {DAYS.map(day => (
            <button
              key={day}
              onClick={() => setSelectedDay(day)}
              className={`px-5 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
                selectedDay === day 
                  ? 'bg-blue-50 text-blue-700 shadow-sm' 
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
              }`}
            >
              {day}
            </button>
          ))}
        </div>
      </div>
      
      <div className="divide-y divide-slate-100 flex-1">
        {filteredSchedules.length === 0 ? (
          <div className="p-12 text-center text-slate-500">Belum ada jadwal di hari {selectedDay}.</div>
        ) : (
          filteredSchedules.map((schedule) => {
            const active = isScheduleActive(schedule.time, schedule.day);
            return (
              <div key={schedule.id} className={`p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center gap-4 transition-colors group relative ${active ? 'bg-green-50/30' : 'hover:bg-slate-50'}`}>
                {active && (
                  <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-green-500 rounded-r-md"></div>
                )}
                
                <div className={`flex items-center gap-2 min-w-[140px] ${active ? 'text-green-600 font-bold' : 'text-slate-500'}`}>
                  {active ? (
                    <div className="relative flex items-center justify-center w-4 h-4">
                      <div className="absolute w-full h-full bg-green-500 rounded-full animate-ping opacity-75"></div>
                      <div className="relative w-2.5 h-2.5 bg-green-500 rounded-full"></div>
                    </div>
                  ) : (
                    <Clock className="w-4 h-4" />
                  )}
                  <span className="text-sm tracking-wide">{schedule.time}</span>
                </div>
                
                <div className="flex-1 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-3">
                      <h4 className={`text-base font-semibold ${active ? 'text-green-700' : 'text-slate-800'}`}>
                        {schedule.name}
                      </h4>
                      {active && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-green-100 text-green-700 uppercase tracking-wider">Sedang Berlangsung</span>
                      )}
                    </div>
                    {schedule.type !== 'Istirahat' && schedule.teacher && (
                      <div className="flex items-center gap-1.5 mt-1 text-sm text-slate-500">
                        <UserCircle2 className="w-3.5 h-3.5" />
                        <span>{schedule.teacher.name}</span>
                      </div>
                    )}
                  </div>

                  <div className="sm:ml-auto flex items-center gap-3">
                    {schedule.type === 'Pelajaran' && (
                      teachingLogs[schedule.id] ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-green-100 text-green-700">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Guru Hadir
                        </span>
                      ) : (
                        (currentUser?.role === 'superadmin' || currentUser?.role === 'admin' || currentUser?.role === 'kepsek' || currentUser?.id === schedule.teacher_id) ? (
                          <button 
                            onClick={() => handleStartTeaching(schedule.id, schedule.teacher_id)}
                            disabled={loadingTeaching}
                            className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white transition-colors disabled:opacity-50 shadow-sm shadow-blue-200"
                          >
                            <PlayCircle className="w-3.5 h-3.5" />
                            Mulai Mengajar
                          </button>
                        ) : null
                      )
                    )}
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${getTypeColor(schedule.type)}`}>
                      {schedule.type}
                    </span>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => handleOpenEdit(schedule)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-100 rounded-lg transition-colors" title="Edit">
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDelete(schedule.id)} className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-100 rounded-lg transition-colors" title="Hapus">
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
                <label className="block text-sm font-medium text-slate-700 mb-1">Jenis Kegiatan</label>
                <select className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none" value={formData.type} onChange={e => {
                  const newType = e.target.value;
                  setFormData({
                    ...formData, 
                    type: newType,
                    name: newType === 'Pelajaran' ? SUBJECTS[0] : (newType === 'Istirahat' ? 'Istirahat' : '')
                  });
                }}>
                  <option value="Pelajaran">Mata Pelajaran</option>
                  <option value="Ekstrakurikuler">Ekstrakurikuler</option>
                  <option value="Istirahat">Istirahat / Kosong</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Mata Pelajaran / Kegiatan</label>
                {formData.type === 'Pelajaran' ? (
                  <select required className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})}>
                    {SUBJECTS.map(subj => (
                      <option key={subj} value={subj}>{subj}</option>
                    ))}
                  </select>
                ) : (
                  <input required type="text" className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder={formData.type === 'Istirahat' ? "Contoh: Istirahat Pertama" : "Contoh: Pramuka"} />
                )}
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Jam Mulai</label>
                  <input required type="time" className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none" value={formData.time_start} onChange={e => setFormData({...formData, time_start: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Jam Selesai</label>
                  <input required type="time" className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none" value={formData.time_end} onChange={e => setFormData({...formData, time_end: e.target.value})} />
                </div>
              </div>



              {formData.type !== 'Istirahat' && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Guru / Penanggung Jawab</label>
                  <select className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none" value={formData.teacher_id} onChange={e => setFormData({...formData, teacher_id: e.target.value})}>
                    <option value="">-- Pilih Guru --</option>
                    {teachers.map(t => (
                      <option key={t.id} value={t.id}>{t.name} {t.position ? `(${t.position})` : ''}</option>
                    ))}
                  </select>
                </div>
              )}
              
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
