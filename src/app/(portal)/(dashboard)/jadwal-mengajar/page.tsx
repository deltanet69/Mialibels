import React from 'react';
import { supabase } from '@/lib/supabase';
import { getSession } from '@/lib/session';
import { Calendar, BookOpen } from 'lucide-react';
import { GuruScheduleClient } from '@/components/portal/dashboard/GuruScheduleClient';

export const dynamic = 'force-dynamic';

export default async function JadwalMengajarPage() {
  const user = await getSession().catch(() => null);

  if (!user || !user.role?.toLowerCase().includes('guru')) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh]">
        <h1 className="text-2xl font-bold text-slate-800">Akses Ditolak</h1>
        <p className="text-slate-500 mt-2">Halaman ini khusus untuk guru.</p>
      </div>
    );
  }

  // Fetch staff data
  const { data: staff } = await supabase
    .from('staffs')
    .select('id, name')
    .eq('email', user.email)
    .single();

  let schedules: any[] = [];
  
  if (staff) {
    const { data } = await supabase
      .from('classroom_schedules')
      .select('*, classroom:classrooms(name)')
      .eq('teacher_id', staff.id)
      .order('start_time', { ascending: true });
    
    schedules = data || [];
  }

  const days = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  const todayDay = new Date().toLocaleDateString('id-ID', { weekday: 'long', timeZone: 'Asia/Jakarta' });

  return (
    <div className="space-y-6 w-full pb-10">
      <div>
        <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
          <Calendar className="text-blue-600" />
          Jadwal Mengajar Saya
        </h1>
        <p className="text-slate-500 mt-1">
          Rekap seluruh jadwal mengajar Anda di berbagai kelas.
        </p>
      </div>

      <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
        <div className="space-y-8">
          {days.map((day) => {
            const daySchedules = schedules.filter(s => s.day_of_week?.toLowerCase() === day.toLowerCase());
            
            if (daySchedules.length === 0) return null;

            return (
              <div key={day} className="border-b border-slate-100 pb-6 last:border-0 last:pb-0">
                <h3 className={`text-lg font-bold mb-4 flex items-center gap-2 ${todayDay.toLowerCase() === day.toLowerCase() ? 'text-blue-600' : 'text-slate-800'}`}>
                  {day}
                  {todayDay.toLowerCase() === day.toLowerCase() && (
                    <span className="bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded-full font-bold">Hari Ini</span>
                  )}
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {daySchedules.map((s, idx) => (
                    <div key={s.id || idx} className="bg-slate-50 border border-slate-100 p-4 rounded-2xl flex flex-col gap-2 hover:border-blue-200 transition-colors">
                      <div className="flex justify-between items-start">
                        <h4 className="font-bold text-slate-800">{s.name}</h4>
                        <span className="text-xs font-mono font-bold text-slate-500 bg-white px-2 py-1 rounded-md border border-slate-200 shadow-sm">
                          {s.start_time.slice(0, 5)} - {s.end_time.slice(0, 5)}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 text-sm font-semibold text-blue-600 mt-auto pt-2">
                        <BookOpen size={14} /> Kelas {s.classroom?.name || '-'}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
          
          {schedules.length === 0 && (
            <div className="text-center py-12">
              <BookOpen className="mx-auto text-slate-300 mb-3" size={48} />
              <p className="font-semibold text-slate-500">Anda belum ditugaskan mengajar di kelas manapun.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
