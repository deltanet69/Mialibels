// @ts-nocheck
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getSession } from "@/lib/session";

function getAdminSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false } }
  );
}

// GET — ambil detail invoice beserta data siswa (parent_name, parent_phone)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const supabase = getAdminSupabase();

    const { data, error } = await supabase
      .from("general_invoices")
      .select(`
        *,
        students (
          id, name, nisn, student_number, class, class_id,
          parent_name, parent_phone
        )
      `)
      .eq("id", id)
      .single();

    if (error || !data) {
      return NextResponse.json({ error: "Tagihan tidak ditemukan." }, { status: 404 });
    }

    let has_active_invoices = false;
    let active_invoice_id = null;

    if (data.status === 'PAID') {
      const { data: activeInvoices } = await supabase
        .from('general_invoices')
        .select('id')
        .eq('student_id', data.student_id)
        .eq('type', 'Infaq')
        .in('status', ['UNPAID', 'PARTIAL', 'PENDING_VERIFICATION'])
        .limit(1);
        
      if (activeInvoices && activeInvoices.length > 0) {
        has_active_invoices = true;
        active_invoice_id = activeInvoices[0].id;
      }
    }

    const formatted = {
      ...data,
      student_name: data.students?.name || "-",
      student_nisn: data.students?.nisn || null,
      student_number: data.students?.student_number || "-",
      student_class: data.students?.class || "-",
      student_class_id: data.students?.class_id || null,
      parent_name: data.students?.parent_name || "-",
      parent_phone: data.students?.parent_phone || "-",
      has_active_invoices,
      active_invoice_id
    };

    return NextResponse.json({ success: true, data: formatted });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Server Error" }, { status: 500 });
  }
}

// PUT — update invoice (konfirmasi cash, approve transfer, reject)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const body = await request.json();
    const { action, amount, payment_method, note, rejectReason } = body;

    const supabase = getAdminSupabase();

    // Ambil invoice saat ini
    const { data: current, error: fetchError } = await supabase
      .from("general_invoices")
      .select("*")
      .eq("id", id)
      .single();

    if (fetchError || !current) {
      return NextResponse.json({ error: "Tagihan tidak ditemukan." }, { status: 404 });
    }

    let updates: any = { updated_at: new Date().toISOString() };

    if (action === "CASH_PAYMENT" || action === "VERIFY_TRANSFER") {
      const { items_paid } = body;
      if (!items_paid || !Array.isArray(items_paid)) {
        return NextResponse.json({ error: "Data rincian pembayaran tidak valid." }, { status: 400 });
      }

      let newItems = [...(current.items || [])];
      let totalAdded = 0;

      for (const p of items_paid) {
        const idx = newItems.findIndex((i: any) => i.name === p.name);
        if (idx !== -1) {
          const currentPaid = Number(newItems[idx].paid_amount) || 0;
          const toAdd = Number(p.paid_amount) || 0;
          
          const maxAdd = Number(newItems[idx].amount) - currentPaid;
          const actualAdd = Math.max(0, Math.min(toAdd, maxAdd));
          
          if (actualAdd > 0) {
            newItems[idx].paid_amount = currentPaid + actualAdd;
            totalAdded += actualAdd;
          }
        }
      }

      if (totalAdded <= 0) {
        return NextResponse.json({ error: "Nominal pembayaran harus lebih dari 0." }, { status: 400 });
      }

      const newPaid = Number(current.paid_amount) + totalAdded;
      const isFullyPaid = newPaid >= Number(current.total_amount);

      updates = {
        ...updates,
        items: newItems,
        paid_amount: newPaid,
        payment_method: action === "VERIFY_TRANSFER" ? "TRANSFER" : "CASH",
        status: isFullyPaid ? "PAID" : "PARTIAL",
      };
      const adminName = session.name || "Admin";
      const now = new Date();
      const timeStr = `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}WIB`;

      if (action === "VERIFY_TRANSFER") {
        if (current.note) {
          const notes = current.note.split(" | ");
          const lastNote = notes[notes.length - 1];
          if (!lastNote.includes("Approved oleh")) {
             notes[notes.length - 1] = `${lastNote} (Approved oleh : ${adminName})`;
             updates.note = notes.join(" | ");
          } else {
             updates.note = current.note;
          }
        }
      } else if (action === "CASH_PAYMENT") {
        const itemsStr = items_paid
          .filter((p: any) => Number(p.paid_amount) > 0)
          .map((p: any) => `${p.name} (Rp ${Number(p.paid_amount).toLocaleString('id-ID')})`)
          .join(", ");
        const generatedNote = `[${timeStr}] Pembayaran tunai oleh : ${adminName} - Item: ${itemsStr}`;
        updates.note = current.note ? `${current.note} | ${generatedNote}` : generatedNote;
      }
    } else if (action === "EDIT_ITEMS") {
      const { items } = body;
      if (!items || !Array.isArray(items)) {
        return NextResponse.json({ error: "Data rincian tagihan tidak valid." }, { status: 400 });
      }
      
      const newItems = items.map((i: any) => {
        const amt = Number(i.amount) || 0;
        let paid = Number(i.paid_amount) || 0;
        if (paid > amt) paid = amt; // Mencegah nominal dibayar melebihi tagihan
        return { ...i, amount: amt, paid_amount: paid };
      });
      
      const newTotal = newItems.reduce((acc: number, i: any) => acc + i.amount, 0);
      const newPaid = newItems.reduce((acc: number, i: any) => acc + i.paid_amount, 0);
      const isFullyPaid = newPaid >= newTotal && newTotal > 0;

      updates = {
        ...updates,
        items: newItems,
        total_amount: newTotal,
        paid_amount: newPaid,
        status: isFullyPaid ? "PAID" : (newPaid > 0 ? "PARTIAL" : "UNPAID")
      };
    } else if (action === "APPROVE_TRANSFER") {
      // Admin approve bukti transfer dari parent (Legacy/Full Approve)
      const newItems = (current.items || []).map((i: any) => ({
        ...i,
        paid_amount: i.amount
      }));
      const newPaid = Number(current.total_amount); // Transfer = full payment
      
      const adminName = session.name || "Admin";
      let newNote = current.note || "";
      if (newNote) {
        const notes = newNote.split(" | ");
        const lastNote = notes[notes.length - 1];
        if (!lastNote.includes("Approved oleh")) {
          notes[notes.length - 1] = `${lastNote} (Approved oleh : ${adminName})`;
          newNote = notes.join(" | ");
        }
      }

      updates = {
        ...updates,
        items: newItems,
        paid_amount: newPaid,
        status: "PAID",
        payment_method: "TRANSFER",
        note: newNote,
      };
    } else if (action === "REJECT_TRANSFER") {
      // Admin tolak bukti transfer, kembalikan ke UNPAID / PARTIAL
      const adminName = session.name || "Admin";
      let newNote = current.note || "";
      if (rejectReason) {
        const timeStr = new Date().toLocaleString("id-ID", { dateStyle: 'medium', timeStyle: 'short' }) + " WIB";
        const rejectMsg = `[${timeStr}] Ditolak oleh ${adminName}: ${rejectReason}`;
        newNote = newNote ? `${newNote} | ${rejectMsg}` : rejectMsg;
      }

      updates = {
        ...updates,
        status: Number(current.paid_amount) > 0 ? "PARTIAL" : "UNPAID",
        bukti_transfer: null,
        note: newNote,
      };
    } else {
      return NextResponse.json({ error: "Action tidak dikenali." }, { status: 400 });
    }

    const { data: updated, error: updateError } = await supabase
      .from("general_invoices")
      .update(updates)
      .eq("id", id)
      .select(`
        *,
        students (
          id, name, nisn, student_number, class, class_id,
          parent_name, parent_phone
        )
      `)
      .single();

    if (updateError) throw updateError;

    let notifTitle = "";
    let notifMessage = "";

    if (action === "VERIFY_TRANSFER" || action === "APPROVE_TRANSFER") {
      notifTitle = "Transfer Tagihan Diverifikasi";
      notifMessage = `Pembayaran transfer untuk tagihan umum Anda berhasil diverifikasi oleh Admin.`;
    } else if (action === "REJECT_TRANSFER") {
      notifTitle = "Bukti Transfer Ditolak";
      notifMessage = `Maaf, bukti transfer untuk tagihan umum Anda ditolak. Alasan: ${rejectReason || 'Tidak valid'}. Silakan perbaiki dan upload ulang.`;
    } else if (action === "CASH_PAYMENT") {
      notifTitle = "Pembayaran Tunai Diterima";
      notifMessage = `Pembayaran tunai Anda untuk tagihan umum berhasil dicatat oleh Admin.`;
    }

    if (notifTitle && notifMessage) {
      await supabase.from("notifications").insert([
        {
          role: "parent",
          user_id: current.student_id,
          type: "PAYMENT",
          title: notifTitle,
          message: notifMessage
        },
        {
          role: "admin",
          type: "PAYMENT",
          title: notifTitle,
          message: `Admin ${session.name || 'Admin'} memproses pembayaran: ${updated.title}`
        }
      ]);
    }

    const formatted = {
      ...updated,
      student_name: updated.students?.name || "-",
      student_nisn: updated.students?.nisn || null,
      student_number: updated.students?.student_number || "-",
      student_class: updated.students?.class || "-",
      student_class_id: updated.students?.class_id || null,
      parent_name: updated.students?.parent_name || "-",
      parent_phone: updated.students?.parent_phone || "-",
    };

    return NextResponse.json({
      success: true,
      message: "Berhasil memperbarui tagihan.",
      data: formatted,
    });
  } catch (error: any) {
    console.error("Error updating general invoice:", error);
    return NextResponse.json({ error: error.message || "Server Error" }, { status: 500 });
  }
}
