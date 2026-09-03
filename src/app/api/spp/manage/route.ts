// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { getSession } from "@/lib/session";
import { getAdminSupabase } from "@/lib/supabase";
import { canViewFinance, canManageFinance } from "@/lib/rbac";

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || !canViewFinance(session.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const filterMonth = searchParams.get('month');
    const filterYear = searchParams.get('year');
    const search = searchParams.get('search');
    const studentClass = searchParams.get('class');
    const classId = searchParams.get('classId');
    const studentId = searchParams.get('studentId');
    const status = searchParams.get('status');
    
    const adminSupabase = getAdminSupabase();
    
    // Query spp_invoices
    // Sort by student name for stable, alphabetical display
    // No hard limit - filtered by month/year so bounded to ~jumlah siswa aktif
    let query = adminSupabase
      .from('spp_invoices')
      .select('id, student_id, title, amount, paid_amount, status, payment_method, month, year, due_date, created_at, students(name, student_number, nisn, class, class_id, parent_name, parent_phone)')
      .order('created_at', { ascending: false });

    if (filterMonth) query = query.eq('month', parseInt(filterMonth));
    if (filterYear) query = query.eq('year', parseInt(filterYear));
    if (status && status !== 'ALL') query = query.eq('status', status);
    if (studentId) query = query.eq('student_id', studentId);

    const { data, error } = await query.limit(2000);
    
    if (error) throw error;

    let infaqItems = (data as any[]).map(inv => ({
      id: inv.id,
      _item_name: inv.title,
      student_id: inv.student_id,
      title: inv.title,
      amount: Number(inv.amount) || 0,
      paid_amount: Number(inv.paid_amount) || 0,
      status: inv.status,
      payment_method: inv.payment_method,
      month: inv.month,
      year: inv.year,
      due_date: inv.due_date,
      created_at: inv.created_at,
      student_name: inv.students?.name,
      student_number: inv.students?.student_number,
      student_nisn: inv.students?.nisn,
      student_class: inv.students?.class,
      student_class_id: inv.students?.class_id,
      parent_name: inv.students?.parent_name,
      parent_phone: inv.students?.parent_phone,
    }));

    // Apply search & class filters
    if (studentClass && studentClass !== 'Semua Kelas') {
      infaqItems = infaqItems.filter(inv => inv.student_class === studentClass);
    }
    // API Route ClassID is used for filtering active invoices by class_id of student
    if (classId && classId !== 'ALL') {
      infaqItems = infaqItems.filter(inv => inv.student_class_id === classId);
    }
    if (search) {
      const q = search.toLowerCase();
      infaqItems = infaqItems.filter(inv =>
        inv.student_name?.toLowerCase().includes(q) ||
        inv.student_nisn?.toLowerCase().includes(q) ||
        inv.student_number?.toLowerCase().includes(q)
      );
    }

    return NextResponse.json({ success: true, data: infaqItems });
  } catch (error: any) {
    return NextResponse.json({ error: 'Terjadi kesalahan internal pada server.' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || !canManageFinance(session.role)) {
      return NextResponse.json({ error: "Forbidden: Anda tidak memiliki hak untuk membuat tagihan" }, { status: 403 });
    }

    const body = await request.json();
    const { student_id, title, amount, month, year } = body;
    
    if (!student_id || !title || amount === undefined) {
      return NextResponse.json({ error: "Data tagihan tidak lengkap" }, { status: 400 });
    }

    const adminSupabase = getAdminSupabase();
    const d = new Date();
    const invMonth = month || (d.getMonth() + 1);
    const invYear = year || d.getFullYear();
    
    const { data: studentData, error: studentError } = await adminSupabase.from("students").select("class").eq("id", student_id).single();
    if (studentError) {
      return NextResponse.json({ error: "Gagal mengambil data siswa" }, { status: 500 });
    }

    const { data, error } = await (adminSupabase.from('spp_invoices') as any).insert({
      student_id,
      title,
      amount: Number(amount),
      month: Number(invMonth),
      year: Number(invYear),
      due_date: new Date(Number(invYear), Number(invMonth) - 1, 10).toISOString(),
      status: 'UNPAID',
      student_class: studentData?.class || null,
    }).select().single();

    if (error) throw error;
    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    return NextResponse.json({ error: 'Terjadi kesalahan internal pada server.' }, { status: 500 });
  }
}

export async function PUT() {
  return NextResponse.json({ error: 'Gunakan Detail Infaq' }, { status: 400 });
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const { invoiceId } = body;

    if (!invoiceId) {
      return NextResponse.json({ error: "ID tagihan wajib diisi" }, { status: 400 });
    }

    const adminSupabase = getAdminSupabase();

    // 1. Ambil tagihan
    const { data: _invoice, error: fetchErr } = await adminSupabase
      .from('spp_invoices')
      .select('id, paid_amount, status')
      .eq('id', invoiceId)
      .single();

    const invoice = _invoice as any;

    if (fetchErr) throw fetchErr;
    if (!invoice) return NextResponse.json({ error: "Tagihan tidak ditemukan" }, { status: 404 });
    if (invoice.status === 'PAID' || Number(invoice.paid_amount) > 0) {
      return NextResponse.json({ error: "Tidak dapat menghapus tagihan yang sudah lunas atau dibayar sebagian." }, { status: 400 });
    }

    // 2. Hapus tagihan
    const { error: delErr } = await adminSupabase.from('spp_invoices').delete().eq('id', invoiceId);
    if (delErr) throw delErr;
    
    return NextResponse.json({ success: true, message: "Tagihan infaq berhasil dihapus." });

  } catch (error: any) {
    return NextResponse.json({ error: 'Terjadi kesalahan internal pada server.' }, { status: 500 });
  }
}

