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
      .select('id, name, student_number')
      .eq('class_id', classroomId)
      .eq('is_active', true)
      .order('name', { ascending: true });

    if (studentsError) throw studentsError;

    // Get all attendances for this classroom in the given month and year
    const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
    const endDate = new Date(parseInt(year, 10), parseInt(month, 10), 0).toISOString().split('T')[0];

    const { data: attendances, error: attError } = await supabase
      .from('classroom_attendances')
      .select('student_id, status, date')
      .eq('classroom_id', classroomId)
      .gte('date', startDate)
      .lte('date', endDate);

    if (attError) throw attError;

    // Aggregate attendances by student
    const recapMap: Record<string, any> = {};

    // Initialize all active students with 0
    students?.forEach(student => {
      recapMap[student.id] = {
        student_id: student.id,
        name: student.name,
        student_number: student.student_number,
        hadir: 0,
        sakit: 0,
        izin: 0,
        alpha: 0,
        total_days: 0,
      };
    });

    // Populate counts
    attendances?.forEach(att => {
      const sid = att.student_id;
      if (recapMap[sid]) {
        const status = (att.status || '').toLowerCase();
        recapMap[sid].total_days++;
        
        if (status === 'hadir' || status === 'present') recapMap[sid].hadir++;
        else if (status === 'sakit' || status === 'sick') recapMap[sid].sakit++;
        else if (status === 'izin' || status === 'permitted') recapMap[sid].izin++;
        else recapMap[sid].alpha++;
      }
    });

    // Calculate percentages
    const result = Object.values(recapMap).map((record: any) => {
      const percentage = record.total_days > 0 
        ? Math.round((record.hadir / record.total_days) * 100) 
        : 0;
      return {
        ...record,
        percentage
      };
    });

    return NextResponse.json({ success: true, data: result });
  } catch (error: any) {
    return NextResponse.json({ error: 'Terjadi kesalahan internal pada server.' }, { status: 500 });
  }
}

