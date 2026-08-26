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
    const table = view === 'siswa' ? 'classroom_attendances' : 'staff_attendance';

    let query = adminSupabase
      .from(table)
      .select('*')
      .gte('date', dateStr)
      .lte('date', todayStr);

    if (view === 'siswa' && classFilter !== 'all') {
      query = query.eq('classroom_id', classFilter);
    } else if (view !== 'siswa' && staffId) {
      query = query.eq('staff_id', staffId);
    }

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    return NextResponse.json({ data: data || [] });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Server Error' }, { status: 500 });
  }
}
