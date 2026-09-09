// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { jwtVerify } from 'jose';
import { getJwtSecretKey } from '@/lib/jwt';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  { auth: { persistSession: false } }
);

export async function GET(request: NextRequest) {
  try {
    const sessionCookie = request.cookies.get('parent_session')?.value;
    if (!sessionCookie) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const secret = getJwtSecretKey();
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

    const secret = getJwtSecretKey();
    const { payload } = await jwtVerify(sessionCookie, secret);
    const studentId = payload.sub as string;

    const body = await request.json();
    const { invoice_id, bukti_transfer, note } = body;

    if (!invoice_id || !bukti_transfer) {
      return NextResponse.json({ error: 'Data tidak lengkap' }, { status: 400 });
    }

    console.log(`[SPP PUT] studentId from JWT: ${studentId}, invoice_id: ${invoice_id}`);

    const adminSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { auth: { persistSession: false } }
    );

    // Verify the invoice exists and belongs to this student
    const { data: invoiceCheck, error: checkError } = await adminSupabase
      .from('spp_invoices')
      .select('id, title, status, amount, paid_amount, student_id, students(name, class)')
      .eq('id', invoice_id)
      .maybeSingle();

    console.log(`[SPP PUT] DB student_id: ${invoiceCheck?.student_id}, JWT studentId: ${studentId}`);

    if (checkError || !invoiceCheck) {
      return NextResponse.json({ error: `Tagihan tidak ditemukan (id: ${invoice_id})` }, { status: 404 });
    }

    // Verify ownership
    if (invoiceCheck.student_id !== studentId) {
      return NextResponse.json({ error: `Akses ditolak: student_id tidak cocok (DB: ${invoiceCheck.student_id}, JWT: ${studentId})` }, { status: 403 });
    }


    if (invoiceCheck.status === 'PAID') {
      return NextResponse.json({ error: 'Tagihan ini sudah lunas.' }, { status: 400 });
    }

    const studentInfo = (invoiceCheck as any)?.students;
    const studentName = studentInfo?.name || payload.studentName || 'Siswa';
    const studentClass = studentInfo?.class || payload.class || '';

    const { error: updateError } = await adminSupabase
      .from('spp_invoices')
      .update({
        status: 'PENDING_VERIFICATION',
        bukti_transfer
      })
      .eq('id', invoice_id);

    if (updateError) throw updateError;

    // Insert Notifications for Admin and Parent
    try {
      await adminSupabase.from('in_app_notifications').insert([
        {
          role: 'admin',
          user_id: null, // Broadcast to all admins
          type: 'PAYMENT',
          title: 'Pembayaran SPP Baru',
          message: `Pembayaran ${invoiceCheck.title || 'Infaq/SPP'} atas nama ${studentName} (${studentClass}) menunggu verifikasi.`
        },
        {
          role: 'parent',
          user_id: studentId,
          type: 'PAYMENT',
          title: 'Bukti Pembayaran SPP Terkirim',
          message: `Bukti pembayaran untuk ${invoiceCheck.title || 'Infaq/SPP'} berhasil dikirim dan sedang menunggu verifikasi admin.`
        }
      ]);
    } catch (notifErr) {
      console.warn('Notification insert failed:', notifErr);
    }

    return NextResponse.json({ success: true, message: 'Bukti transfer berhasil diunggah' });
  } catch (error: any) {
    console.error('Parent SPP PUT error:', error);
    return NextResponse.json({ error: error?.message || 'Terjadi kesalahan internal pada server.' }, { status: 500 });
  }
}

