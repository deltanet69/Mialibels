// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { getSession } from "@/lib/session";
import { getAdminSupabase } from "@/lib/supabase";

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

const getMonthNumber = (mName: string) => {
  const months = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];
  return months.indexOf(mName) + 1;
};

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const filterMonth = searchParams.get('month'); // string '7'
    const filterYear = searchParams.get('year');   // string '2026'
    const search = searchParams.get('search');
    const studentClass = searchParams.get('class');
    const status = searchParams.get('status');
    const paymentType = searchParams.get('payment_method');
    
    const adminSupabase = getAdminSupabase();
    // Query general_invoices HANYA UNTUK INFAQ
    let query = adminSupabase
      .from('general_invoices')
      .select('id, student_id, title, payment_method, due_date, created_at, items, students(name, student_number, class, parent_name, parent_phone)')
      .eq('type', 'Infaq')
      .order('created_at', { ascending: false })
      .limit(3000); // Fetch a large batch to filter in memory

    const { data, error } = await query;
    if (error) throw error;

    let infaqItems: any[] = [];
    
    for (const inv of (data as any[])) {
      if (!inv.items || !Array.isArray(inv.items)) continue;
      
      for (const item of inv.items) {
        if (item.name && item.name.startsWith('Infaq Sekolah - ')) {
          // Parse month and year
          const parts = item.name.replace('Infaq Sekolah - ', '').split(' ');
          if (parts.length === 2) {
             const mNum = getMonthNumber(parts[0]);
             const yNum = parseInt(parts[1], 10);
             
             // Apply month/year filter
             if (filterMonth && mNum !== parseInt(filterMonth, 10)) continue;
             if (filterYear && yNum !== parseInt(filterYear, 10)) continue;
             
             // Determine status
             const amt = Number(item.amount) || 0;
             const paid = Number(item.paid_amount) || 0;
             let itemStatus = 'UNPAID';
             if (paid >= amt && amt > 0) itemStatus = 'PAID';
             else if (paid > 0) itemStatus = 'PARTIAL';
             
             if (status && status !== 'ALL' && itemStatus !== status) continue;
             
             infaqItems.push({
                id: inv.id, // general_invoice ID (so "Detail" opens the right invoice)
                _item_name: item.name,
                student_id: inv.student_id,
                title: item.name,
                amount: amt,
                paid_amount: paid,
                status: itemStatus,
                payment_method: inv.payment_method,
                month: mNum,
                year: yNum,
                due_date: inv.due_date,
                created_at: inv.created_at,
                student_name: inv.students?.name,
                student_number: inv.students?.student_number,
                student_class: inv.students?.class,
                parent_name: inv.students?.parent_name,
                parent_phone: inv.students?.parent_phone,
             });
          }
        }
      }
    }

    // Apply search & class filters
    if (studentClass && studentClass !== 'Semua Kelas') {
      infaqItems = infaqItems.filter(inv => inv.student_class === studentClass);
    }
    if (search) {
      const q = search.toLowerCase();
      infaqItems = infaqItems.filter(inv =>
        inv.student_name?.toLowerCase().includes(q) ||
        inv.student_number?.toLowerCase().includes(q)
      );
    }

    return NextResponse.json({ success: true, data: infaqItems });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Server Error' }, { status: 500 });
  }
}

export async function POST() {
  return NextResponse.json({ error: 'Gunakan fitur Infaq Massal atau Keuangan Umum' }, { status: 400 });
}
export async function PUT() {
  return NextResponse.json({ error: 'Gunakan Edit Rincian di Keuangan Umum' }, { status: 400 });
}
export async function DELETE(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const { invoiceId, itemName } = body;

    if (!invoiceId || !itemName) {
      return NextResponse.json({ error: "ID tagihan dan nama item wajib diisi" }, { status: 400 });
    }

    const adminSupabase = getAdminSupabase();

    // 1. Ambil tagihan
    const { data: invoice, error: fetchErr } = await adminSupabase
      .from('general_invoices')
      .select('id, items, total_amount, status')
      .eq('id', invoiceId)
      .single();

    if (fetchErr) throw fetchErr;
    if (!invoice) return NextResponse.json({ error: "Tagihan tidak ditemukan" }, { status: 404 });
    if (invoice.status === 'PAID') {
      return NextResponse.json({ error: "Tidak dapat menghapus item dari tagihan yang sudah lunas penuh." }, { status: 400 });
    }

    const items = invoice.items || [];
    const targetItemIndex = items.findIndex((i: any) => i.name === itemName);

    if (targetItemIndex === -1) {
      return NextResponse.json({ error: "Item tidak ditemukan dalam tagihan" }, { status: 404 });
    }

    const targetItem = items[targetItemIndex];
    if (Number(targetItem.paid_amount) > 0) {
      return NextResponse.json({ error: "Item infaq ini sudah pernah dibayar (sebagian/penuh). Penghapusan dibatalkan demi menjaga riwayat keuangan." }, { status: 400 });
    }

    // Buat array items baru tanpa item yang dihapus
    const newItems = items.filter((_: any, index: number) => index !== targetItemIndex);
    const newTotal = Math.max(0, Number(invoice.total_amount) - Number(targetItem.amount));

    if (newItems.length === 0) {
      // Jika kosong, hapus sekalian invoice-nya
      const { error: delErr } = await adminSupabase.from('general_invoices').delete().eq('id', invoiceId);
      if (delErr) throw delErr;
      return NextResponse.json({ success: true, message: "Item infaq dihapus dan tagihan umum dibatalkan (kosong)." });
    } else {
      // Update item dan total amount
      const { error: updErr } = await adminSupabase
        .from('general_invoices')
        .update({ items: newItems, total_amount: newTotal })
        .eq('id', invoiceId);
      if (updErr) throw updErr;
      return NextResponse.json({ success: true, message: "Item infaq berhasil dihapus dari tagihan umum." });
    }

  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Server Error' }, { status: 500 });
  }
}
