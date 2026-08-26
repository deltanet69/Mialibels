'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Calendar, 
  Clock, 
  BookOpen, 
  AlertCircle, 
  PlayCircle, 
  CheckCircle2, 
  ExternalLink,
  GraduationCap,
  Sparkles,
  ArrowRight
} from 'lucide-react';

interface ScheduleItem {
  id: string;
  name: string;
  time: string;
  day?: string;
  type?: string;
  classroom_id?: string;
  classroom?: {
    id?: string;
    name?: string;
  };
  teacher_id?: string;
}

export function GuruScheduleClient({ 
  schedules = [],
  staffId
}: { 
  schedules: ScheduleItem[];
  staffId?: string;
}) {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [teachingLogs, setTeachingLogs] = useState<Record<string, any>>({});
  const [loadingScheduleId, setLoadingScheduleId] = useState<string | null>(null);

  // Update time every minute
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 30000);
    return () => clearInterval(timer);
  }, []);

  // Fetch teaching logs for today
  useEffect(() => {
    async function fetchLogs() {
      if (!schedules.length) return;
      try {
        const todayStr = new Date().toISOString().split('T')[0];
        // Collect classroom IDs
        const classIds = [...new Set(schedules.map(s => s.classroom_id).filter(Boolean))];
        const logsMap: Record<string, any> = {};

        await Promise.all(
          classIds.map(async (cId) => {
            const res = await fetch(`/api/teaching-attendance?date=${todayStr}&classroomId=${cId}`);
            const json = await res.json();
            if (json.success && Array.isArray(json.data)) {
              json.data.forEach((log: any) => {
                logsMap[log.schedule_id] = log;
              });
            }
          })
        );
        setTeachingLogs(logsMap);
      } catch (err) {
        console.error('Failed to fetch teaching logs:', err);
      }
    }
    fetchLogs();
  }, [schedules]);

  const parseTime = (timeStr: string) => {
    if (!timeStr) return { start: '', end: '', startMins: 0, endMins: 0 };
    const parts = timeStr.split('-').map(s => s.trim());
    const start = parts[0] || '';
    const end = parts[1] || '';

    const [sh, sm] = start.split(':').map(Number);
    const [eh, em] = end.split(':').map(Number);

    const startMins = (!isNaN(sh) && !isNaN(sm)) ? sh * 60 + sm : 0;
    const endMins = (!isNaN(eh) && !isNaN(em)) ? eh * 60 + em : 0;

    return { start, end, startMins, endMins };
  };

  const currentMinutes = currentTime.getHours() * 60 + currentTime.getMinutes();

  const getStatus = (timeStr: string) => {
    const { startMins, endMins } = parseTime(timeStr);
    if (!startMins || !endMins) return 'incoming';

    if (currentMinutes >= startMins && currentMinutes <= endMins) return 'running';
    if (currentMinutes < startMins) {
      if (startMins - currentMinutes <= 20) return 'incoming_soon';
      return 'incoming';
    }
    return 'finished';
  };

  const handleStartTeaching = async (schedule: ScheduleItem) => {
    const targetTeacherId = staffId || schedule.teacher_id;
    if (!targetTeacherId) return;

    setLoadingScheduleId(schedule.id);
    try {
      const todayStr = new Date().toISOString().split('T')[0];
      const res = await fetch('/api/teaching-attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          schedule_id: schedule.id,
          teacher_id: targetTeacherId,
          date: todayStr,
          status: 'Hadir'
        })
      });
      const data = await res.json();
      if (data.success) {
        setTeachingLogs(prev => ({
          ...prev,
          [schedule.id]: data.data
        }));
      } else {
        alert(data.error || 'Gagal merekam presensi mengajar');
      }
    } catch (e) {
      console.error(e);
      alert('Terjadi kesalahan');
    } finally {
      setLoadingScheduleId(null);
    }
  };

  // Find next incoming schedule
  const nextSchedule = schedules.find(s => {
    const status = getStatus(s.time);
    return status === 'incoming_soon' || status === 'incoming';
  });

  const activeSchedule = schedules.find(s => getStatus(s.time) === 'running');

  return (
    <div className="bg-white p-6 sm:p-7 rounded-[2rem] border border-slate-200/80 shadow-sm flex flex-col">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
              <Calendar size={16} />
            </div>
            <h2 className="text-lg sm:text-xl font-headline font-black text-secondary tracking-tight">
              Jadwal Mengajar Hari Ini
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Daftar sesi mata pelajaran yang Anda ampu hari ini.
          </p>
        </div>

        <div className="flex items-center gap-3 self-start sm:self-auto">
          <div className="bg-slate-50 border border-slate-200/80 rounded-2xl px-4 py-2 text-right">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Waktu Real-Time</p>
            <p className="text-base sm:text-lg font-black text-slate-800 font-mono">
              {currentTime.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB
            </p>
          </div>

          <Link
            href="/jadwal-mengajar"
            className="btn-tactile inline-flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold transition border border-blue-100"
          >
            <span>Semua Jadwal</span>
            <ArrowRight size={13} />
          </Link>
        </div>
      </div>

      {/* Active notification banner */}
      {activeSchedule && (
        <div className="mb-6 bg-gradient-to-r from-emerald-500 to-teal-600 text-white p-4 sm:p-5 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm shadow-emerald-600/20 animate-in fade-in">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
              <PlayCircle className="text-white animate-pulse" size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider bg-white/25 px-2 py-0.5 rounded-md text-white">
                  Sedang Berlangsung
                </span>
                <span className="text-xs font-mono font-bold text-emerald-100">{activeSchedule.time}</span>
              </div>
              <h4 className="font-headline font-black text-base sm:text-lg text-white mt-0.5">
                {activeSchedule.name} — Kelas {activeSchedule.classroom?.name || '-'}
              </h4>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            {teachingLogs[activeSchedule.id] ? (
              <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white/20 text-white text-xs font-bold backdrop-blur-xs">
                <CheckCircle2 size={14} className="text-emerald-200" />
                <span>Sudah Presensi Mengajar</span>
              </span>
            ) : (
              <button
                onClick={() => handleStartTeaching(activeSchedule)}
                disabled={loadingScheduleId === activeSchedule.id}
                className="btn-tactile w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-white text-emerald-800 text-xs font-black hover:bg-emerald-50 transition shadow-sm cursor-pointer disabled:opacity-50"
              >
                <PlayCircle size={14} />
                <span>Mulai Mengajar</span>
              </button>
            )}

            {activeSchedule.classroom_id && (
              <Link
                href={`/classroom/${activeSchedule.classroom_id}`}
                className="btn-tactile inline-flex items-center justify-center p-2 rounded-xl bg-white/20 hover:bg-white/30 text-white transition"
                title="Buka Ruang Kelas"
              >
                <ExternalLink size={16} />
              </Link>
            )}
          </div>
        </div>
      )}

      {/* Incoming soon notification banner */}
      {!activeSchedule && nextSchedule && getStatus(nextSchedule.time) === 'incoming_soon' && (
        <div className="mb-6 bg-blue-50 border border-blue-200 text-blue-900 p-4 rounded-2xl flex items-center gap-3 animate-pulse">
          <AlertCircle className="text-blue-600 shrink-0" size={24} />
          <div className="flex-1">
            <h4 className="font-bold text-sm">Sesi Berikutnya Segera Dimulai</h4>
            <p className="text-xs text-blue-700 mt-0.5">
              Mata Pelajaran <strong>{nextSchedule.name}</strong> di Kelas <strong>{nextSchedule.classroom?.name}</strong> akan dimulai pukul {parseTime(nextSchedule.time).start}.
            </p>
          </div>
          {nextSchedule.classroom_id && (
            <Link
              href={`/classroom/${nextSchedule.classroom_id}`}
              className="btn-tactile px-3 py-1.5 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 transition shrink-0"
            >
              Buka Kelas
            </Link>
          )}
        </div>
      )}

      {/* Schedules List */}
      {schedules.length === 0 ? (
        <div className="text-center py-14 border-2 border-dashed border-slate-200 rounded-3xl bg-slate-50/50">
          <BookOpen className="mx-auto text-slate-300 mb-3" size={44} />
          <h3 className="text-base font-bold text-slate-700">Tidak Ada Jadwal Mengajar Hari Ini</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            Anda tidak memiliki agenda mengajar untuk hari ini. Anda dapat memeriksa jadwal lengkap mingguan di menu Jadwal Mengajar.
          </p>
          <Link
            href="/jadwal-mengajar"
            className="btn-tactile inline-flex items-center gap-1.5 px-4 py-2 mt-4 rounded-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition shadow-sm"
          >
            <Calendar size={13} />
            <span>Lihat Timetable Lengkap</span>
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {schedules.map((s, idx) => {
            const status = getStatus(s.time);
            const { start, end } = parseTime(s.time);
            const isLogged = Boolean(teachingLogs[s.id]);

            let cardStyle = 'bg-slate-50/70 border-slate-200/80 hover:bg-slate-100/70';
            let badge = (
              <span className="text-[10px] font-bold text-slate-500 bg-slate-200/70 px-2.5 py-1 rounded-full uppercase tracking-wider">
                Akan Datang
              </span>
            );

            if (status === 'running') {
              cardStyle = 'bg-emerald-50/80 border-emerald-300 ring-2 ring-emerald-500/20 shadow-sm';
              badge = (
                <span className="text-[10px] font-black text-emerald-800 bg-emerald-100 border border-emerald-300 px-2.5 py-1 rounded-full uppercase tracking-wider flex items-center gap-1 animate-pulse">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
                  Sedang Berjalan
                </span>
              );
            } else if (status === 'incoming_soon') {
              cardStyle = 'bg-blue-50/80 border-blue-200 shadow-2xs';
              badge = (
                <span className="text-[10px] font-bold text-blue-800 bg-blue-100 border border-blue-200 px-2.5 py-1 rounded-full uppercase tracking-wider">
                  Segera
                </span>
              );
            } else if (status === 'finished') {
              cardStyle = 'bg-slate-50/40 border-slate-100 opacity-65';
              badge = (
                <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2.5 py-1 rounded-full uppercase tracking-wider">
                  Selesai
                </span>
              );
            }

            return (
              <div 
                key={s.id || idx} 
                className={`flex flex-col sm:flex-row sm:items-center justify-between p-4 sm:p-5 rounded-2xl border transition-all gap-4 ${cardStyle}`}
              >
                <div className="flex items-center gap-4">
                  {/* Time box */}
                  <div className="flex-shrink-0 w-24 sm:w-28 bg-white border border-slate-200/80 rounded-xl p-2.5 text-center shadow-2xs">
                    <p className="text-sm font-black text-slate-800 font-mono tracking-tight">{start || '--:--'}</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase">s.d</p>
                    <p className="text-xs font-bold text-slate-600 font-mono tracking-tight">{end || '--:--'}</p>
                  </div>

                  {/* Subject info */}
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-headline font-black text-base text-slate-800">{s.name}</h3>
                      {s.type && s.type !== 'Pelajaran' && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 border border-purple-200 uppercase">
                          {s.type}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                      <span className="inline-flex items-center gap-1 font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">
                        <GraduationCap size={13} /> Kelas {s.classroom?.name || '-'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Status + Actions */}
                <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                  <div className="flex items-center gap-2">
                    {badge}
                    {isLogged && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full">
                        <CheckCircle2 size={12} className="text-emerald-600" />
                        <span>Hadir</span>
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {status === 'running' && !isLogged && (
                      <button
                        onClick={() => handleStartTeaching(s)}
                        disabled={loadingScheduleId === s.id}
                        className="btn-tactile inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition shadow-xs cursor-pointer disabled:opacity-50"
                      >
                        <PlayCircle size={13} />
                        <span>Mulai</span>
                      </button>
                    )}

                    {s.classroom_id && (
                      <Link
                        href={`/classroom/${s.classroom_id}`}
                        className="btn-tactile inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-700 hover:text-blue-700 hover:border-blue-200 text-xs font-bold transition shadow-2xs"
                        title="Buka Ruang Kelas"
                      >
                        <ExternalLink size={12} />
                        <span className="hidden sm:inline">Kelas</span>
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
