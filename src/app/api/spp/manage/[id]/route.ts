import { NextRequest, NextResponse } from 'next/server';
import { getSession } from "@/lib/session";
import { getAdminSupabase } from "@/lib/supabase";
import { canViewFinance, canManageFinance } from "@/lib/rbac";

export const dynamic = 'force-dynamic';

// Helper: build response data from invoice row
function buildInvoiceData(inv: any) {
  return {
    ...inv,
    student_name: inv.students?.name,
    student_number: inv.students?.student_number,
    student_nisn: inv.students?.nisn,
    student_class: inv.students?.class,
    parent_name: inv.students?.parent_name,
    parent_phone: inv.students?.parent_phone,
  };
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getSession();
    if (!session || !canViewFinance(session.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const adminSupabase = getAdminSupabase();

    // 1. Fetch main invoice
    const { data: _invoice, error } = await adminSupabase
      .from('spp_invoices')
      .select('*, students(name, student_number, nisn, class, parent_name, parent_phone)')
      .eq('id', id)
      .single();

    const invoice = _invoice as any;
    if (error) throw error;
    if (!invoice) return NextResponse.json({ error: "Tagihan tidak ditemukan" }, { status: 404 });

    // 2. Fetch other relevant invoices for this student (excluding current):
    //    - PAST months that are still UNPAID/PARTIAL (tunggakan bulan lalu)
    //    - FUTURE months only if already PAID (dibayar duluan)
    //    - Do NOT include future UNPAID months (bukan tunggakan, belum waktunya)
    const currentDueDate = invoice.due_date ? new Date(invoice.due_date) : null;
    const currentYear = invoice.year || new Date().getFullYear();
    const currentMonth = invoice.month || (new Date().getMonth() + 1);

    // Fetch ALL other invoices for this student
    const { data: allOtherInvoices } = await adminSupabase
      .from('spp_invoices')
      .select('id, title, amount, paid_amount, status, due_date, payment_method, month, year')
      .eq('student_id', invoice.student_id)
      .neq('id', id)
      .order('due_date', { ascending: true });

    const otherUnpaidInvoices = allOtherInvoices || [];

    // 3. Fetch transaction notes for ALL invoices of this student (for history)
    const allInvoiceIds = [id, ...(otherUnpaidInvoices || []).map((i: any) => i.id)];
    const { data: transactions } = await adminSupabase
      .from('spp_transactions')
      .select('description, created_at, payment_method, admin_id')
      .in('invoice_id', allInvoiceIds)
      .order('created_at', { ascending: true });

    // Build note history string from transactions (already formatted with timestamp + admin)
    const notes = transactions
      ? transactions.map((t: any) => t.description).filter(Boolean).join(' | ')
      : '';

    return NextResponse.json({
      success: true,
      data: {
        ...invoice,
        note: notes,
        student_name: invoice.students?.name,
        student_number: invoice.students?.student_number,
        student_nisn: invoice.students?.nisn,
        student_class: invoice.students?.class,
        parent_name: invoice.students?.parent_name,
        parent_phone: invoice.students?.parent_phone,
        has_active_invoices: (otherUnpaidInvoices && otherUnpaidInvoices.some((inv: any) => (Number(inv.amount) - (Number(inv.paid_amount) || 0)) > 0)),
        other_unpaid_invoices: otherUnpaidInvoices || [],
      }
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Server Error' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getSession();
    if (!session || !canManageFinance(session.role)) {
      return NextResponse.json({ error: "Forbidden: Anda tidak memiliki hak untuk mengubah atau memproses pembayaran" }, { status: 403 });
    }

    const body = await request.json();
    const { action, paid_amount, note, rejectReason } = body;

    const adminSupabase = getAdminSupabase();
    const adminId = session.id;

    // Fetch current invoice (NO note column in spp_invoices)
    const { data: _invoice, error: fetchErr } = await adminSupabase
      .from('spp_invoices')
      .select('*')
      .eq('id', id)
      .single();

    const invoice = _invoice as any;
    if (fetchErr) throw fetchErr;
    if (!invoice) return NextResponse.json({ error: "Tagihan tidak ditemukan" }, { status: 404 });

    // ─── CASH_PAYMENT or VERIFY_TRANSFER ─────────────────────────────────────
    if (action === 'CASH_PAYMENT' || action === 'VERIFY_TRANSFER') {
      const amountToPay = Number(paid_amount);
      if (amountToPay <= 0) {
        return NextResponse.json({ error: "Nominal pembayaran tidak valid." }, { status: 400 });
      }

      const newPaidAmount = Math.min((Number(invoice.paid_amount) || 0) + amountToPay, Number(invoice.amount));
      const newStatus = newPaidAmount >= Number(invoice.amount) ? 'PAID' : 'PARTIAL';
      const newPaymentMethod = action === 'CASH_PAYMENT' ? 'CASH' : 'TRANSFER';

      // Build rich note like Keuangan Umum: [DD/MM/YYYY HH:MMwib] Pembayaran tunai oleh : adminName - Item: title (Rp X)
      const adminName = session.name || 'Admin';
      const now = new Date();
      const timeStr = `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}WIB`;
      const method = action === 'CASH_PAYMENT' ? 'tunai' : 'transfer';
      const baseNote = `[${timeStr}] Pembayaran ${method} oleh : ${adminName} - Item: ${invoice.title} (Rp ${amountToPay.toLocaleString('id-ID')})`;
      const transactionNote = note ? `${baseNote} | Catatan: ${note}` : baseNote;

      // Update invoice (NO note column)
      const { data: _updatedInvoice, error: updErr } = await (adminSupabase
        .from('spp_invoices') as any)
        .update({
          paid_amount: newPaidAmount,
          status: newStatus,
          payment_method: newPaymentMethod,
          verified_by: adminId,
          verified_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select('*, students(name, student_number, nisn, class, parent_name, parent_phone)')
        .single();

      const updatedInvoice = _updatedInvoice as any;
      if (updErr) throw updErr;

      // Store rich note in spp_transactions
      await (adminSupabase.from('spp_transactions') as any).insert({
        invoice_id: id,
        student_id: invoice.student_id,
        amount: amountToPay,
        payment_method: newPaymentMethod,
        description: transactionNote,
        admin_id: adminId,
        created_at: new Date().toISOString(),
      });

      return NextResponse.json({
        success: true,
        data: buildInvoiceData(updatedInvoice),
      });
    }

    // ─── REJECT_TRANSFER ─────────────────────────────────────────────────────
    if (action === 'REJECT_TRANSFER') {
      const { data: _updatedInvoice, error: updErr } = await (adminSupabase
        .from('spp_invoices') as any)
        .update({
          status: 'UNPAID',
          bukti_transfer: null,
        })
        .eq('id', id)
        .select('*, students(name, student_number, nisn, class, parent_name, parent_phone)')
        .single();

      const updatedInvoice = _updatedInvoice as any;
      if (updErr) throw updErr;

      // Log rejection in transactions with rich note
      const adminName2 = session.name || 'Admin';
      const now2 = new Date();
      const timeStr2 = `${String(now2.getDate()).padStart(2, '0')}/${String(now2.getMonth() + 1).padStart(2, '0')}/${now2.getFullYear()} ${String(now2.getHours()).padStart(2, '0')}:${String(now2.getMinutes()).padStart(2, '0')}WIB`;
      await (adminSupabase.from('spp_transactions') as any).insert({
        invoice_id: id,
        student_id: invoice.student_id,
        amount: 0,
        payment_method: 'TRANSFER',
        description: `[${timeStr2}] Bukti transfer ditolak oleh : ${adminName2} - Alasan: ${rejectReason}`,
        admin_id: adminId,
        created_at: new Date().toISOString(),
      });

      return NextResponse.json({
        success: true,
        data: buildInvoiceData(updatedInvoice),
      });
    }

    // ─── EDIT_AMOUNT ─────────────────────────────────────────────────────────
    if (action === 'EDIT_AMOUNT') {
      const { amount, paid_amount } = body;
      const newAmount = Number(amount);
      if (isNaN(newAmount) || newAmount < 0) {
        return NextResponse.json({ error: "Nominal tagihan tidak valid." }, { status: 400 });
      }

      const newPaidAmount = paid_amount !== undefined ? Number(paid_amount) : (Number(invoice.paid_amount) || 0);
      const safePaidAmount = Math.min(newPaidAmount, newAmount); // Capping paid_amount to amount just in case

      let newStatus = invoice.status;
      if (safePaidAmount === 0) newStatus = 'UNPAID';
      else if (safePaidAmount < newAmount) newStatus = 'PARTIAL';
      else if (safePaidAmount >= newAmount && newAmount > 0) newStatus = 'PAID';

      const { data: _updatedInvoice, error: updErr } = await (adminSupabase
        .from('spp_invoices') as any)
        .update({ amount: newAmount, paid_amount: safePaidAmount, status: newStatus })
        .eq('id', id)
        .select('*, students(name, student_number, nisn, class, parent_name, parent_phone)')
        .single();

      const updatedInvoice = _updatedInvoice as any;
      if (updErr) throw updErr;

      return NextResponse.json({
        success: true,
        data: buildInvoiceData(updatedInvoice),
      });
    }

    return NextResponse.json({ error: "Aksi tidak dikenali." }, { status: 400 });

  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Server Error' }, { status: 500 });
  }
}
