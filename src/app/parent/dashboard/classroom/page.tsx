import React from 'react';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import { getAdminSupabase } from '@/lib/supabase';
import { getJwtSecretKey } from '@/lib/jwt';
import { getWIBParts } from '@/lib/dateUtils';
import { ParentClassroomClient } from '@/components/parent/classroom/ParentClassroomClient';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Kelas & Jadwal - Portal Wali Murid | MI Attaqwa 15',
  description: 'Jadwal pelajaran, rekapitulasi kehadiran, dan akademik anak di MI Attaqwa 15 Babelan.',
};

async function getClassroomPageData() {
  const cookieStore = await cookies();
  const token = cookieStore.get('parent_session')?.value;
  if (!token) return null;

  let payload: any;
  try {
    const result = await jwtVerify(token, getJwtSecretKey());
    payload = result.payload;
  } catch {
    return null;
  }

  const studentId = payload.sub as string;
  const tokenNis = payload.nis as string | undefined;
  const tokenNisn = payload.nisn as string | undefined;

  const supabase = getAdminSupabase();
  let studentData: any = null;

  if (studentId) {
    const { data } = await supabase.from('students').select('*').eq('id', studentId).maybeSingle();
    studentData = data;
  }
  if (!studentData && tokenNis) {
    const { data } = await supabase.from('students').select('*').ilike('student_number', tokenNis.trim()).maybeSingle();
    studentData = data;
  }
  if (!studentData && tokenNisn) {
    const { data } = await supabase.from('students').select('*').eq('nisn', tokenNisn.trim()).maybeSingle();
    studentData = data;
  }

  if (!studentData) return null;

  // Resolve classroom
  let classroom: any = null;
  if (studentData.class_id) {
    const { data } = await supabase
      .from('classrooms')
      .select('id, name, homeroom_teacher_id, homeroom_teacher:staffs!homeroom_teacher_id(id, name, position, phone, image)')
      .eq('id', studentData.class_id)
      .maybeSingle();
    classroom = data;
  }
  if (!classroom && studentData.class) {
    const { data } = await supabase
      .from('classrooms')
      .select('id, name, homeroom_teacher_id, homeroom_teacher:staffs!homeroom_teacher_id(id, name, position, phone, image)')
      .eq('name', studentData.class)
      .maybeSingle();
    classroom = data;
  }

  // Fetch classroom schedules and current month attendances in parallel
  const now = new Date();
  const wibParts = getWIBParts(now);
  const startOfMonth = `${wibParts.year}-${String(wibParts.month).padStart(2, '0')}-01`;
  const lastDayOfMonth = new Date(Date.UTC(wibParts.year, wibParts.month, 0)).getUTCDate();
  const endOfMonth = `${wibParts.year}-${String(wibParts.month).padStart(2, '0')}-${String(lastDayOfMonth).padStart(2, '0')}`;

  const [
    { data: sch },
    { data: attRecords }
  ] = await Promise.all([
    classroom?.id
      ? supabase
          .from('classroom_schedules')
          .select('*, teacher:staffs(id, name, image, position)')
          .eq('classroom_id', classroom.id)
          .order('time', { ascending: true })
      : Promise.resolve({ data: [] }),
    supabase
      .from('classroom_attendances')
      .select('id, date, status, reason')
      .eq('student_id', studentData.id)
      .gte('date', startOfMonth)
      .lte('date', endOfMonth)
      .order('date', { ascending: false })
  ]);

  const summary = { hadir: 0, sakit: 0, izin: 0, alpha: 0 };
  (attRecords || []).forEach((r: any) => {
    const s = (r.status || '').toLowerCase();
    if (s === 'hadir' || s === 'present') summary.hadir++;
    else if (s === 'sakit' || s === 'sick') summary.sakit++;
    else if (s === 'izin' || s === 'permitted') summary.izin++;
    else summary.alpha++;
  });

  return {
    student: {
      id: studentData.id,
      name: studentData.name,
      className: classroom?.name || studentData.class || '-',
      classId: classroom?.id || null,
      homeroomTeacher: classroom?.homeroom_teacher || null,
    },
    schedules: sch || [],
    attendanceRecords: attRecords || [],
    attendanceSummary: summary,
  };
}

export default async function ParentClassroomPage() {
  const data = await getClassroomPageData();
  if (!data) {
    redirect('/parent/login');
  }

  return (
    <ParentClassroomClient
      student={data.student}
      initialSchedules={data.schedules}
      initialAttendance={data.attendanceRecords}
      initialSummary={data.attendanceSummary}
    />
  );
}
