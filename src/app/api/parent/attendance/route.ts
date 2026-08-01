// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { jwtVerify } from 'jose';

const JWT_SECRET = process.env.JWT_SECRET!;

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET(request: NextRequest) {
  try {
    const sessionCookie = request.cookies.get('parent_session')?.value;
    if (!sessionCookie) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const secret = new TextEncoder().encode(JWT_SECRET);
    const { payload } = await jwtVerify(sessionCookie, secret);
    const studentId = payload.sub as string;

    const { searchParams } = new URL(request.url);
    const month = searchParams.get('month');
    const year = searchParams.get('year');

    let query = supabase
      .from('classroom_attendances')
      .select('id, date, status, reason, created_at')
      .eq('student_id', studentId)
      .order('date', { ascending: false });

    // Filter by month/year if provided
    if (year) {
      const startDate = month
        ? `${year}-${String(month).padStart(2, '0')}-01`
        : `${year}-01-01`;
      const endDate = month
        ? new Date(parseInt(year), parseInt(month), 0).toISOString().split('T')[0]
        : `${year}-12-31`;
      query = query.gte('date', startDate).lte('date', endDate);
    }

    const { data: records, error } = await query;
    if (error) throw error;

    // Build summary
    const summary = {
      hadir: 0,
      sakit: 0,
      izin: 0,
      alpha: 0,
      total: records?.length || 0,
    };

    records?.forEach((r: any) => {
      const s = (r.status || '').toLowerCase();
      if (s === 'hadir' || s === 'present') summary.hadir++;
      else if (s === 'sakit' || s === 'sick') summary.sakit++;
      else if (s === 'izin' || s === 'permitted') summary.izin++;
      else summary.alpha++;
    });

    const persentaseHadir =
      summary.total > 0 ? Math.round((summary.hadir / summary.total) * 100) : 0;

    return NextResponse.json({
      success: true,
      data: records,
      summary: { ...summary, persentaseHadir },
    });
  } catch (error: any) {
    return NextResponse.json({ error: 'Terjadi kesalahan internal pada server.' }, { status: 500 });
  }
}

