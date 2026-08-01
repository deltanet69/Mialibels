// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { jwtVerify } from 'jose';

const JWT_SECRET = process.env.JWT_SECRET!;

export async function GET(request: NextRequest) {
  try {
    const sessionCookie = request.cookies.get('parent_session')?.value;
    if (!sessionCookie) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const secret = new TextEncoder().encode(JWT_SECRET);
    const { payload } = await jwtVerify(sessionCookie, secret);
    const studentId = payload.sub as string;

    const { data: invoices, error } = await supabase
      .from('spp_invoices')
      .select('*')
      .eq('student_id', studentId)
      .order('year', { ascending: false })
      .order('month', { ascending: false });

    if (error) throw error;

    return NextResponse.json({ success: true, data: invoices });
  } catch (error: any) {
    return NextResponse.json({ error: 'Terjadi kesalahan internal pada server.' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const sessionCookie = request.cookies.get('parent_session')?.value;
    if (!sessionCookie) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const secret = new TextEncoder().encode(JWT_SECRET);
    const { payload } = await jwtVerify(sessionCookie, secret);
    const studentId = payload.sub as string;

    const body = await request.json();
    const { invoice_id, bukti_transfer, note } = body;

    if (!invoice_id || !bukti_transfer) {
      return NextResponse.json({ error: 'Data tidak lengkap' }, { status: 400 });
    }

    // Verify the invoice belongs to this student
    const { data: invoiceCheck, error: checkError } = await supabase
      .from('spp_invoices')
      .select('id, status, note')
      .eq('id', invoice_id)
      .eq('student_id', studentId)
      .single();

    if (checkError || !invoiceCheck) {
      return NextResponse.json({ error: 'Tagihan tidak ditemukan' }, { status: 404 });
    }

    if (invoiceCheck.status === 'PENDING_VERIFICATION') {
      return NextResponse.json({ error: 'Tagihan ini sudah menunggu verifikasi.' }, { status: 400 });
    }
    if (invoiceCheck.status === 'PAID') {
      return NextResponse.json({ error: 'Tagihan ini sudah lunas.' }, { status: 400 });
    }

    let updatedNote = invoiceCheck.note;
    if (note) {
      updatedNote = invoiceCheck.note ? `${invoiceCheck.note} | ${note}` : note;
    }

    const { error: updateError } = await supabase
      .from('spp_invoices')
      .update({
        status: 'PENDING_VERIFICATION',
        bukti_transfer,
        payment_method: 'TRANSFER',
        note: updatedNote,
        updated_at: new Date().toISOString()
      })
      .eq('id', invoice_id);

    if (updateError) throw updateError;

    return NextResponse.json({ success: true, message: 'Bukti transfer berhasil diunggah' });
  } catch (error: any) {
    return NextResponse.json({ error: 'Terjadi kesalahan internal pada server.' }, { status: 500 });
  }
}

