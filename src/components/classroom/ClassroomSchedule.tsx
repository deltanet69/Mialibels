'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Clock, 
  Plus, 
  Trash2, 
  Edit2, 
  X, 
  PlayCircle, 
  Loader2, 
  UserCircle2, 
  CheckCircle2, 
  Sparkles,
  BookOpen,
  Calendar,
  AlertCircle,
  Coffee,
  Trophy
} from 'lucide-react';

const DAYS = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat'];

const SUBJECTS = [
  "Al-Qur'an Hadis", "Akidah Akhlak", "Fikih", "Sejarah Kebudayaan Islam",
  "Bahasa Arab", "Tematik", "Matematika", "Ilmu Pengetahuan Alam (IPA)",
  "Ilmu Pengetahuan Sosial (IPS)", "Pendidikan Kewarganegaraan (PKn)",
  "Bahasa Indonesia", "Pendidikan Jasmani Olahraga dan Kesehatan (PJOK)",
  "Seni Budaya dan Prakarya (SBdP)", "Bahasa Inggris", "Muatan Lokal",
  "Tahfidz", "Baca Tulis Al-Qur'an (BTQ)"
];

export function ClassroomSchedule({ classroomId, user, homeroomTeacherId }: { classroomId: string, user?: any, homeroomTeacherId?: string }) {
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
  const [formData, setFormData] = useState({ name: SUBJECTS[0], time_start: '', time_end: '', type: 'Pelajaran', teacher_id: '' });
  const [saving, setSaving] = useState(false);
  const [teachingLogs, setTeachingLogs] = useState<Record<string, any>>({});
  const [loadingTeaching, setLoadingTeaching] = useState(false);

  // Safely define currentUser and role permissions
  const currentUser = user || null;
  const role = currentUser?.role?.toLowerCase() || '';
  const isSuperAdmin = role === 'superadmin';
  const isKepsek = role === 'kepsek';
  const canManage = role === 'superadmin' || role === 'administrasi' || role === 'staff_operator' || role === 'admin';
  const isHomeroom = role.includes('guru') && currentUser?.staffId === homeroomTeacherId;
  const canEdit = canManage || isHomeroom;

  // Update current time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  const fetchData = useCallback(async () => {
    if (!classroomId) return;
    setLoading(true);
    try {
      // Fetch schedules with teacher relations
      const resSchedules = await fetch(`/api/schedules?classroomId=${classroomId}&_t=` + Date.now());
      const dataSchedules = await resSchedules.json();
      if (dataSchedules.success) {
        setSchedules(dataSchedules.data || []);
      }
      
      // Fetch teachers for assign dropdown
      const resTeachers = await fetch('/api/guru');
      const dataTeachers = await resTeachers.json();
      if (dataTeachers.success) {
        setTeachers(dataTeachers.data || []);
      }
      
      // Fetch teaching logs for today
      const todayStr = new Date().toISOString().split('T')[0];
      const resLogs = await fetch(`/api/teaching-attendance?date=${todayStr}&classroomId=${classroomId}`);
      const dataLogs = await resLogs.json();
      if (dataLogs.success && dataLogs.data) {
        const logMap: Record<string, any> = {};
        dataLogs.data.forEach((log: any) => {
          logMap[log.schedule_id] = log;
        });
        setTeachingLogs(logMap);
      }
    } catch (e) {
      console.error('Error fetching schedules:', e);
    } finally {
      setLoading(false);
    }
  }, [classroomId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const getTypeStyle = (type: string) => {
    switch (type?.toLowerCase()) {
      case 'pelajaran': 
        return {
          badge: 'bg-blue-50 text-blue-700 border-blue-200',
          icon: BookOpen,
          iconBg: 'bg-blue-50 text-blue-600'
        };
      case 'ekstrakurikuler': 
        return {
          badge: 'bg-purple-50 text-purple-700 border-purple-200',
          icon: Trophy,
          iconBg: 'bg-purple-50 text-purple-600'
        };
      case 'istirahat': 
        return {
          badge: 'bg-amber-50 text-amber-700 border-amber-200',
          icon: Coffee,
          iconBg: 'bg-amber-50 text-amber-600'
        };
      default: 
        return {
          badge: 'bg-emerald-50 text-emerald-700 border-emerald-200',
          icon: Sparkles,
          iconBg: 'bg-emerald-50 text-emerald-600'
        };
    }
  };

  const isScheduleActive = (timeString: string, scheduleDay: string) => {
    const todayIdx = new Date().getDay(); 
    const currentDayName = (todayIdx >= 1 && todayIdx <= 5) ? DAYS[todayIdx - 1] : null;
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
    setFormData({ name: SUBJECTS[0], time_start: '07:30', time_end: '08:45', type: 'Pelajaran', teacher_id: '' });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (schedule: any) => {
    setEditingId(schedule.id);
    let tStart = '07:30', tEnd = '08:45';
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
        setSchedules(prev => prev.filter(s => s.id !== id));
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
        name: formData.name,
        time: `${formData.time_start} - ${formData.time_end}`,
        type: formData.type,
        teacher_id: formData.teacher_id || null,
        classroom_id: classroomId,
        day: selectedDay
      };
      
      const res = await fetch('/api/schedules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      if (res.ok) {
        setIsModalOpen(false);
        fetchData();
      } else {
        const data = await res.json();
        alert(data.error || 'Gagal menyimpan jadwal');
      }
    } catch(e) {
      console.error(e);
      alert('Terjadi kesalahan');
    } finally {
      setSaving(false);
    }
  };

  // Sort schedules by start time
  const filteredSchedules = useMemo(() => {
    return schedules
      .filter(s => s.day === selectedDay)
      .sort((a, b) => {
        const timeA = a.time ? a.time.split('-')[0].trim() : '';
        const timeB = b.time ? b.time.split('-')[0].trim() : '';
        return timeA.localeCompare(timeB);
      });
  }, [schedules, selectedDay]);

  if (loading) {
    return (
      <div className="bg-white rounded-[2rem] border border-slate-200/80 p-16 flex flex-col justify-center items-center gap-3 shadow-sm">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <span className="text-xs font-semibold text-slate-500">Memuat Jadwal Pelajaran...</span>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-[2rem] border border-slate-200/80 shadow-sm overflow-hidden flex flex-col">
      {/* Schedule Top Header */}
      <div className="p-6 sm:p-7 border-b border-slate-100 flex flex-col gap-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold uppercase tracking-wider mb-2 border border-blue-100">
              <Calendar className="w-3.5 h-3.5" />
              <span>Agenda Mingguan</span>
            </div>
            <h3 className="font-headline font-black text-xl text-slate-800 tracking-tight">Jadwal Mata Pelajaran</h3>
            <p className="text-xs text-slate-500 mt-0.5">Kelola mata pelajaran harian, alokasi jam belajar, dan guru pengampu.</p>
          </div>

          {canEdit && (
            <button 
              onClick={handleOpenAdd}
              className="btn-tactile flex items-center justify-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 hover:brightness-105 text-white rounded-full text-xs font-bold transition shadow-sm shadow-blue-900/15 cursor-pointer shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Jadwal</span>
            </button>
          )}
        </div>

        {/* Days Selector Tabs — horizontally scrollable on mobile */}
        <div className="flex items-center gap-1.5 overflow-x-auto hide-scrollbar -mx-1 px-1 pb-1">
          {DAYS.map(day => {
            const isSelected = selectedDay === day;
            const countOnDay = schedules.filter(s => s.day === day).length;
            return (
              <button
                key={day}
                onClick={() => setSelectedDay(day)}
                className={`px-3.5 sm:px-4 py-2 rounded-2xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 active:scale-95 shrink-0 ${
                  isSelected 
                    ? 'bg-blue-600 text-white shadow-xs' 
                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-800'
                }`}
              >
                <span>{day}</span>
                <span className={`text-[10px] px-1.5 rounded-full font-extrabold leading-5 ${
                  isSelected ? 'bg-white/25 text-white' : 'bg-slate-200/80 text-slate-600'
                }`}>
                  {countOnDay}
                </span>
              </button>
            );
          })}
        </div>
      </div>
      
      {/* Schedule Items List */}
      <div className="divide-y divide-slate-100 flex-1">
        {filteredSchedules.length === 0 ? (
          <div className="py-16 text-center">
            <div className="w-14 h-14 bg-slate-50 border border-slate-200/80 rounded-2xl flex items-center justify-center mx-auto mb-3 text-slate-400">
              <Clock className="w-7 h-7" />
            </div>
            <h4 className="font-headline font-bold text-sm text-slate-700">Belum ada jadwal untuk hari {selectedDay}</h4>
            <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
              Klik tombol &quot;Tambah Jadwal&quot; di kanan atas untuk menyusun agenda belajar kelas ini.
            </p>
          </div>
        ) : (
          filteredSchedules.map((schedule) => {
            const active = isScheduleActive(schedule.time, schedule.day);
            const typeStyle = getTypeStyle(schedule.type);
            const IconComp = typeStyle.icon;

            // Check if current user can trigger "Mulai Mengajar"
            const canStartTeaching = 
              isSuperAdmin || 
              isKepsek || 
              (currentUser?.staffId && currentUser?.staffId === schedule.teacher_id);

            return (
              <div 
                key={schedule.id} 
                className={`p-4 sm:p-6 flex flex-col gap-3 sm:gap-4 transition-all group relative ${
                  active ? 'bg-emerald-50/40 border-l-4 border-l-emerald-500' : 'hover:bg-slate-50/60'
                }`}
              >
                {/* Top row: time badge + type + actions */}
                <div className="flex items-center justify-between gap-3">
                  {/* Time Indicator */}
                  <div className={`flex items-center gap-2 ${
                    active ? 'text-emerald-700' : 'text-slate-600'
                  }`}>
                    <div className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center shrink-0 ${
                      active ? 'bg-emerald-100 text-emerald-700' : typeStyle.iconBg
                    }`}>
                      {active ? (
                        <span className="relative flex h-2.5 w-2.5">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                        </span>
                      ) : (
                        <IconComp size={15} />
                      )}
                    </div>
                    <span className="text-xs font-bold tracking-wide font-headline whitespace-nowrap">{schedule.time}</span>
                  </div>

                  {/* Right: badge + edit */}
                  <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${typeStyle.badge}`}>
                      {schedule.type}
                    </span>
                    {canEdit && (
                      <div className="flex items-center gap-0.5">
                        <button 
                          onClick={() => handleOpenEdit(schedule)} 
                          className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition active:scale-90" 
                          title="Edit"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button 
                          onClick={() => handleDelete(schedule.id)} 
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition active:scale-90" 
                          title="Hapus"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Subject name + active badge */}
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className={`font-headline font-bold text-sm sm:text-base ${
                      active ? 'text-emerald-800' : 'text-slate-800'
                    }`}>
                      {schedule.name}
                    </h4>
                    {active && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-200 animate-pulse uppercase tracking-wider">
                        Sedang Berlangsung
                      </span>
                    )}
                  </div>

                  {/* Teacher chip */}
                  {schedule.type !== 'Istirahat' && (
                    <div className="flex items-center gap-2 mt-2">
                      {schedule.teacher ? (
                        <div className="inline-flex items-center gap-2 px-2.5 sm:px-3 py-1 rounded-xl bg-slate-50 border border-slate-200/80 text-xs font-medium text-slate-700">
                          {schedule.teacher.image ? (
                            <img 
                              src={schedule.teacher.image} 
                              alt={schedule.teacher.name} 
                              className="w-4 h-4 rounded-full object-cover border border-blue-200 shrink-0" 
                            />
                          ) : (
                            <div className="w-4 h-4 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-[9px] font-black shrink-0">
                              {schedule.teacher.name ? schedule.teacher.name.charAt(0) : 'G'}
                            </div>
                          )}
                          <span className="font-bold text-slate-800 truncate max-w-[160px] sm:max-w-none">{schedule.teacher.name}</span>
                          {schedule.teacher.position && (
                            <span className="hidden sm:inline text-[11px] text-slate-400 font-semibold shrink-0">• {schedule.teacher.position}</span>
                          )}
                        </div>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-[11px] text-amber-700 font-bold bg-amber-50 px-2.5 py-1 rounded-xl border border-amber-200">
                          <AlertCircle size={12} />
                          <span>Belum Ada Guru</span>
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Teaching action */}
                {schedule.type === 'Pelajaran' && (
                  <div>
                    {teachingLogs[schedule.id] ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Guru Hadir</span>
                      </span>
                    ) : (
                      canStartTeaching && (
                        <button 
                          onClick={() => handleStartTeaching(schedule.id, schedule.teacher_id)}
                          disabled={loadingTeaching}
                          className="btn-tactile inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white transition disabled:opacity-50 shadow-xs shadow-blue-900/15 cursor-pointer active:scale-95"
                        >
                          <PlayCircle className="w-3.5 h-3.5" />
                          <span>Mulai Mengajar</span>
                        </button>
                      )
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Add / Edit Schedule Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-[2rem] w-full max-w-md shadow-2xl border border-slate-100 overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="font-headline font-black text-lg text-slate-800">
                  {editingId ? 'Edit Jadwal Pelajaran' : 'Tambah Jadwal Baru'}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">Hari {selectedDay}</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-1.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Jenis Kegiatan</label>
                <select 
                  className="w-full px-4 py-3 bg-slate-50/80 border border-slate-200/90 rounded-2xl focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 text-xs font-medium text-slate-800 transition outline-none" 
                  value={formData.type} 
                  onChange={e => {
                    const newType = e.target.value;
                    setFormData({
                      ...formData, 
                      type: newType,
                      name: newType === 'Pelajaran' ? SUBJECTS[0] : (newType === 'Istirahat' ? 'Istirahat' : '')
                    });
                  }}
                >
                  <option value="Pelajaran">Mata Pelajaran</option>
                  <option value="Ekstrakurikuler">Ekstrakurikuler</option>
                  <option value="Istirahat">Istirahat / Kosong</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Mata Pelajaran / Kegiatan</label>
                {formData.type === 'Pelajaran' ? (
                  <select 
                    required 
                    className="w-full px-4 py-3 bg-slate-50/80 border border-slate-200/90 rounded-2xl focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 text-xs font-bold text-slate-800 transition outline-none" 
                    value={formData.name} 
                    onChange={e => setFormData({...formData, name: e.target.value})}
                  >
                    {SUBJECTS.map(subj => (
                      <option key={subj} value={subj}>{subj}</option>
                    ))}
                  </select>
                ) : (
                  <input 
                    required 
                    type="text" 
                    className="w-full px-4 py-3 bg-slate-50/80 border border-slate-200/90 rounded-2xl focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 text-xs font-medium text-slate-800 transition outline-none" 
                    value={formData.name} 
                    onChange={e => setFormData({...formData, name: e.target.value})} 
                    placeholder={formData.type === 'Istirahat' ? "Contoh: Istirahat Pertama" : "Contoh: Pramuka / Tahfidz Sore"} 
                  />
                )}
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Jam Mulai</label>
                  <input 
                    required 
                    type="time" 
                    className="w-full px-4 py-3 bg-slate-50/80 border border-slate-200/90 rounded-2xl focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 text-xs font-semibold text-slate-800 transition outline-none" 
                    value={formData.time_start} 
                    onChange={e => setFormData({...formData, time_start: e.target.value})} 
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Jam Selesai</label>
                  <input 
                    required 
                    type="time" 
                    className="w-full px-4 py-3 bg-slate-50/80 border border-slate-200/90 rounded-2xl focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 text-xs font-semibold text-slate-800 transition outline-none" 
                    value={formData.time_end} 
                    onChange={e => setFormData({...formData, time_end: e.target.value})} 
                  />
                </div>
              </div>

              {formData.type !== 'Istirahat' && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Guru / Pengampu</label>
                  <select 
                    className="w-full px-4 py-3 bg-slate-50/80 border border-slate-200/90 rounded-2xl focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 text-xs font-medium text-slate-800 transition outline-none" 
                    value={formData.teacher_id} 
                    onChange={e => setFormData({...formData, teacher_id: e.target.value})}
                  >
                    <option value="">-- Pilih Guru Pengampu --</option>
                    {teachers.map(t => (
                      <option key={t.id} value={t.id}>{t.name} {t.position ? `(${t.position})` : ''}</option>
                    ))}
                  </select>
                </div>
              )}
              
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
                  <span>{editingId ? 'Simpan Perubahan' : 'Tambahkan Jadwal'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
