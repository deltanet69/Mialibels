import React from 'react';
import { supabase } from '@/lib/supabase';
import { getSession } from '@/lib/session';
import { JadwalMengajarClient, ScheduleItem } from '@/components/portal/jadwal/JadwalMengajarClient';

export const dynamic = 'force-dynamic';

function parseScheduleTime(timeStr?: string) {
  if (!timeStr) return { startTime: '--:--', endTime: '--:--', startMinutes: 0, endMinutes: 0, durationStr: '' };
  const parts = timeStr.split('-').map(s => s.trim());
  const startTime = parts[0] || '--:--';
  const endTime = parts[1] || '--:--';

  const [sh, sm] = startTime.split(':').map(Number);
  const [eh, em] = endTime.split(':').map(Number);

  const startMinutes = (!isNaN(sh) && !isNaN(sm)) ? sh * 60 + sm : 0;
  const endMinutes = (!isNaN(eh) && !isNaN(em)) ? eh * 60 + em : 0;

  const diffMins = Math.max(0, endMinutes - startMinutes);
  const h = Math.floor(diffMins / 60);
  const m = diffMins % 60;
  const durationStr = h > 0 && m > 0 ? `${h}j ${m}m` : (h > 0 ? `${h} jam` : `${m} mnt`);

  return { startTime, endTime, startMinutes, endMinutes, durationStr };
}

export default async function JadwalMengajarPage() {
  const user = await getSession().catch(() => null);

  if (!user || !user.role?.toLowerCase().includes('guru')) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] bg-white rounded-[2rem] border border-slate-200/80 p-8 shadow-sm">
        <h1 className="text-2xl font-black font-headline text-slate-800">Akses Khusus Guru</h1>
        <p className="text-slate-500 mt-2 text-sm">Halaman jadwal mengajar ini khusus untuk akun pendidik / guru.</p>
      </div>
    );
  }

  // 1. Resolve staff record
  let staff: any = null;

  if (user?.staffId) {
    const { data } = await supabase
      .from('staffs')
      .select('id, name, email, position')
      .eq('id', user.staffId)
      .maybeSingle();
    staff = data;
  }

  if (!staff && user?.email) {
    const { data } = await supabase
      .from('staffs')
      .select('id, name, email, position')
      .ilike('email', user.email)
      .maybeSingle();
    staff = data;
  }

  if (!staff && user?.name) {
    const { data } = await supabase
      .from('staffs')
      .select('id, name, email, position')
      .ilike('name', user.name)
      .maybeSingle();
    staff = data;
  }

  let schedules: ScheduleItem[] = [];

  if (staff) {
    const { data } = await supabase
      .from('classroom_schedules')
      .select('*, classroom:classrooms(id, name)')
      .eq('teacher_id', staff.id);

    if (data) {
      schedules = data.map((s: any) => {
        const timeParsed = parseScheduleTime(s.time);
        return {
          id: s.id,
          name: s.name || 'Mata Pelajaran',
          time: s.time || '',
          day: s.day || 'Senin',
          type: s.type || 'Pelajaran',
          classroom_id: s.classroom_id,
          classroom: s.classroom,
          startTime: timeParsed.startTime,
          endTime: timeParsed.endTime,
          startMinutes: timeParsed.startMinutes,
          endMinutes: timeParsed.endMinutes,
          durationStr: timeParsed.durationStr
        };
      });
    }
  }

  return (
    <JadwalMengajarClient 
      schedules={schedules} 
      staffName={staff?.name || user?.name}
    />
  );
}
