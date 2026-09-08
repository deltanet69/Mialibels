import { NextRequest, NextResponse } from 'next/server';
import { getAdminSupabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const view = searchParams.get('view') || 'siswa';
    const classFilter = searchParams.get('classFilter') || 'all';
    const dateStr = searchParams.get('startDate');
    const todayStr = searchParams.get('endDate');
    const staffId = searchParams.get('staffId');

    if (!dateStr || !todayStr) {
      return NextResponse.json({ error: 'Missing date range' }, { status: 400 });
    }

    const adminSupabase = getAdminSupabase();

    if (view === 'siswa') {
      let query = adminSupabase
        .from('student_attendances')
        .select('id, date, status, entry_time, exit_time, student_id, students!student_id(id, name, class, class_id)')
        .gte('date', dateStr)
        .lte('date', todayStr)
        .order('date', { ascending: true });

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching student_attendances:', error);
        throw error;
      }

      let filteredData = data || [];

      // Filter by classroom if not 'all'
      if (classFilter && classFilter !== 'all') {
        filteredData = filteredData.filter((item: any) => {
          const studentClassId = item.students?.class_id;
          const studentClass = item.students?.class?.toLowerCase().trim();
          const target = classFilter.toLowerCase().trim();
          return studentClassId === classFilter || studentClass === target || studentClass?.includes(target);
        });
      }

      return NextResponse.json({ 
        success: true,
        data: filteredData,
        total: filteredData.length 
      });
    } else {
      // Guru / Staff attendance
      let query = adminSupabase
        .from('staff_attendance')
        .select('id, date, status, check_in_time, check_out_time, staff_id, notes, staffs!staff_id(id, name, position)')
        .gte('date', dateStr)
        .lte('date', todayStr)
        .order('date', { ascending: true });

      if (staffId) {
        query = query.eq('staff_id', staffId);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching staff_attendance:', error);
        throw error;
      }

      return NextResponse.json({ 
        success: true,
        data: data || [],
        total: (data || []).length 
      });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Server Error' }, { status: 500 });
  }
}
