// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const month = searchParams.get('month');
    const year = searchParams.get('year');
    const search = searchParams.get('search');
    const studentClass = searchParams.get('class');
    const status = searchParams.get('status');
    const paymentType = searchParams.get('payment_method');
    
    // Step 1: Build invoice query (fast, no joins when possible)
    let query = supabase
      .from('spp_invoices')
      .select('id, student_id, title, amount, paid_amount, status, payment_method, bukti_transfer, note, month, year, due_date, created_at, students(name, student_number, class, parent_name, parent_phone)')
      .order('created_at', { ascending: false })
      .limit(100);

    if (month) query = query.eq('month', parseInt(month, 10));
    if (year) query = query.eq('year', parseInt(year, 10));
    if (status) query = query.eq('status', status);
    if (paymentType) query = query.eq('payment_method', paymentType);

    const { data, error } = await query;
    if (error) throw error;

    // Step 2: Client-side filter for search & class (avoids slow foreign table OR query)
    let filtered = data as any[];
    if (studentClass) {
      filtered = filtered.filter(inv => inv.students?.class === studentClass);
    }
    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter(inv =>
        inv.students?.name?.toLowerCase().includes(q) ||
        inv.students?.student_number?.toLowerCase().includes(q)
      );
    }

    const formatted = filtered.map((inv: any) => ({
      ...inv,
      student_name: inv.students?.name,
      student_number: inv.students?.student_number,
      student_class: inv.students?.class,
      parent_name: inv.students?.parent_name,
      parent_phone: inv.students?.parent_phone,
    }));

    return NextResponse.json({ success: true, data: formatted });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Server Error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, amount, month, year, due_date } = body;

    if (!title || !amount || !month || !year || !due_date) {
      return NextResponse.json({ error: 'Data tidak lengkap' }, { status: 400 });
    }

    // Ambil semua siswa yang aktif
    const { data: students, error: studentErr } = await supabase
      .from('students')
      .select('id')
      .eq('is_active', true);

    if (studentErr) throw studentErr;
    if (!students || students.length === 0) {
      return NextResponse.json({ error: 'Tidak ada siswa aktif ditemukan' }, { status: 400 });
    }

    const invoices = students.map((student: any) => ({
      student_id: student.id,
      title,
      amount: parseInt(amount, 10),
      month: parseInt(month, 10),
      year: parseInt(year, 10),
      due_date: new Date(due_date).toISOString(),
      status: 'UNPAID'
    }));

    const { data, error } = await supabase.from('spp_invoices').insert(invoices);

    if (error) {
      if (error.code === '23505') {
        throw new Error('Tagihan untuk bulan & tahun ini sudah pernah di-generate sebelumnya.');
      }
      throw error;
    }

    return NextResponse.json({ success: true, message: `Berhasil membuat ${invoices.length} tagihan.` });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Server Error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, amount, due_date } = body;

    if (!id || !amount || !due_date) {
      return NextResponse.json({ error: 'Data tidak lengkap' }, { status: 400 });
    }

    const { error } = await supabase
      .from('spp_invoices')
      .update({
        amount: parseInt(amount, 10),
        due_date: new Date(due_date).toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', id);

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Server Error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) return NextResponse.json({ error: 'ID tidak valid' }, { status: 400 });

    const { error } = await supabase
      .from('spp_invoices')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Server Error' }, { status: 500 });
  }
}
