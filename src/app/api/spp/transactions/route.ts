// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const invoiceId = searchParams.get('invoice_id');
    const studentId = searchParams.get('student_id');

    let query = supabase
      .from('spp_transactions')
      .select(`
        *,
        admins(name)
      `)
      .order('created_at', { ascending: false });

    if (invoiceId) {
      query = query.eq('invoice_id', invoiceId);
    } else if (studentId) {
      query = query.eq('student_id', studentId);
    } else {
      return NextResponse.json({ error: 'Missing invoice_id or student_id' }, { status: 400 });
    }

    const { data, error } = await query;
    if (error) throw error;

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    return NextResponse.json({ error: 'Terjadi kesalahan internal pada server.' }, { status: 500 });
  }
}

