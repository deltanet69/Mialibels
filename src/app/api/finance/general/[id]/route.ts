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
          id, name, student_number, class, class_id,
          parent_name, parent_phone
        )
      `)
      .eq("id", id)
      .single();

    if (error || !data) {
      return NextResponse.json({ error: "Tagihan tidak ditemukan." }, { status: 404 });
    }

    const formatted = {
      ...data,
      student_name: data.students?.name || "-",
      student_number: data.students?.student_number || "-",
      student_class: data.students?.class || "-",
      student_class_id: data.students?.class_id || null,
      parent_name: data.students?.parent_name || "-",
      parent_phone: data.students?.parent_phone || "-",
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
    const { action, amount, payment_method, note } = body;

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

    if (action === "CASH_PAYMENT") {
      // Pembayaran tunai ke TU (bisa partial)
      const addAmount = Number(amount) || 0;
      if (addAmount <= 0) {
        return NextResponse.json({ error: "Nominal pembayaran harus lebih dari 0." }, { status: 400 });
      }
      const maxPayable = Number(current.total_amount) - Number(current.paid_amount);
      const actualAmount = Math.min(addAmount, maxPayable);
      const newPaid = Number(current.paid_amount) + actualAmount;
      const isFullyPaid = newPaid >= Number(current.total_amount);

      updates = {
        ...updates,
        paid_amount: newPaid,
        payment_method: "CASH",
        status: isFullyPaid ? "PAID" : "PARTIAL",
      };
      if (note) {
        updates.note = current.note ? `${current.note} | ${note}` : note;
      }
    } else if (action === "APPROVE_TRANSFER") {
      // Admin approve bukti transfer dari parent
      const newPaid = Number(current.total_amount); // Transfer = full payment
      updates = {
        ...updates,
        paid_amount: newPaid,
        status: "PAID",
        payment_method: "TRANSFER",
      };
    } else if (action === "REJECT_TRANSFER") {
      // Admin tolak bukti transfer, kembalikan ke UNPAID
      updates = {
        ...updates,
        status: Number(current.paid_amount) > 0 ? "PARTIAL" : "UNPAID",
        bukti_transfer: null,
      };
    } else {
      return NextResponse.json({ error: "Action tidak dikenali." }, { status: 400 });
    }

    const { data: updated, error: updateError } = await supabase
      .from("general_invoices")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (updateError) throw updateError;

    return NextResponse.json({
      success: true,
      message: "Berhasil memperbarui tagihan.",
      data: updated,
    });
  } catch (error: any) {
    console.error("Error updating general invoice:", error);
    return NextResponse.json({ error: error.message || "Server Error" }, { status: 500 });
  }
}
