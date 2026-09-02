// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const classroomId = searchParams.get('classroomId');
    const month = searchParams.get('month');
    const year = searchParams.get('year');

    if (!classroomId || !month || !year) {
      return NextResponse.json({ error: 'Missing classroomId, month, or year' }, { status: 400 });
    }

    // Get all students in this classroom
    const { data: students, error: studentsError } = await supabase
      .from('students')
      .select('id, name, student_number, class')
      .eq('class_id', classroomId)
      .eq('is_active', true)
      .order('name', { ascending: true });

    if (studentsError) throw studentsError;

    // Dates for the month
    const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
    const endDate = new Date(parseInt(year, 10), parseInt(month, 10), 0).toISOString().split('T')[0];

    // 1. Fetch classroom manual attendances
    const { data: classroomAttendances } = await supabase
      .from('classroom_attendances')
      .select('student_id, status, date')
      .eq('classroom_id', classroomId)
      .gte('date', startDate)
      .lte('date', endDate);

    // 2. Fetch student RFID scan attendances
    const studentIds = students?.map(s => s.id) || [];
    let rfidAttendances: any[] = [];
    if (studentIds.length > 0) {
      const { data: rfidData } = await supabase
        .from('student_attendances')
        .select('student_id, status, date')
        .in('student_id', studentIds)
        .gte('date', startDate)
        .lte('date', endDate);
      if (rfidData) rfidAttendances = rfidData;
    }

    // Aggregate unique attendance dates per student
    // Map of student_id -> map of date -> status
    const studentDateMap: Record<string, Record<string, string>> = {};

    students?.forEach(s => {
      studentDateMap[s.id] = {};
    });

    // Populate from RFID first
    rfidAttendances.forEach(att => {
      if (studentDateMap[att.student_id]) {
        studentDateMap[att.student_id][att.date] = att.status || 'Hadir';
      }
    });

    // Override with classroom manual attendances
    classroomAttendances?.forEach(att => {
      if (studentDateMap[att.student_id] && att.status) {
        studentDateMap[att.student_id][att.date] = att.status;
      }
    });

    // Aggregate recap statistics
    const result = students?.map(student => {
      const dates = studentDateMap[student.id] || {};
      let hadir = 0;
      let sakit = 0;
      let izin = 0;
      let alpha = 0;

      Object.values(dates).forEach(status => {
        const s = (status || '').toLowerCase();
        if (s === 'hadir' || s === 'present' || s === 'tepat waktu' || s === 'terlambat') {
          hadir++;
        } else if (s === 'sakit' || s === 'sick') {
          sakit++;
        } else if (s === 'izin' || s === 'permitted') {
          izin++;
        } else if (s === 'alpha' || s === 'alpa') {
          alpha++;
        }
      });

      const total_days = hadir + sakit + izin + alpha;
      const percentage = total_days > 0 ? Math.round((hadir / total_days) * 100) : 0;

      return {
        student_id: student.id,
        name: student.name,
        student_number: student.student_number,
        hadir,
        sakit,
        izin,
        alpha,
        total_days,
        percentage
      };
    }) || [];

    return NextResponse.json({ success: true, data: result });
  } catch (error: any) {
    console.error('Error in recap route', error);
    return NextResponse.json({ error: 'Terjadi kesalahan internal pada server.' }, { status: 500 });
  }
}
