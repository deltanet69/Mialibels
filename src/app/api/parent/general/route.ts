// @ts-nocheck
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { jwtVerify } from "jose";

const JWT_SECRET = process.env.JWT_SECRET!;

function getAdminSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false } }
  );
}

async function resolveStudentId(payload: any): Promise<string | null> {
  const supabase = getAdminSupabase();
  const tokenId = payload.sub as string;
  const tokenNis = payload.nis as string | undefined;
  const tokenNisn = payload.nisn as string | undefined;

  const { data: byId } = await supabase
    .from("students")
    .select("id")
    .eq("id", tokenId)
    .maybeSingle();
  if (byId) return byId.id;

  if (tokenNis) {
    const { data: byNis } = await supabase
      .from("students")
      .select("id")
      .eq("student_number", tokenNis)
      .maybeSingle();
    if (byNis) return byNis.id;
  }

  if (tokenNisn) {
    const { data: byNisn } = await supabase
      .from("students")
      .select("id")
      .eq("nisn", tokenNisn)
      .maybeSingle();
    if (byNisn) return byNisn.id;
  }

  return null;
}

export async function GET(request: NextRequest) {
  try {
    const sessionCookie = request.cookies.get("parent_session")?.value;
    if (!sessionCookie) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const secret = new TextEncoder().encode(JWT_SECRET);
    const { payload } = await jwtVerify(sessionCookie, secret);

    const studentId = await resolveStudentId(payload);
    if (!studentId) {
      return NextResponse.json({ error: "Data siswa tidak ditemukan." }, { status: 404 });
    }

    const supabase = getAdminSupabase();

    const { data, error } = await supabase
      .from("general_invoices")
      .select("*")
      .eq("student_id", studentId)
      .order("created_at", { ascending: false });

    if (error) throw error;

    return NextResponse.json({ success: true, data: data ?? [] });
  } catch (error: any) {
    console.error("Error fetching parent general invoices:", error);
    return NextResponse.json(
      { error: error.message || "Server Error" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const sessionCookie = request.cookies.get("parent_session")?.value;
    if (!sessionCookie) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const secret = new TextEncoder().encode(JWT_SECRET);
    const { payload } = await jwtVerify(sessionCookie, secret);

    const studentId = await resolveStudentId(payload);
    if (!studentId) {
      return NextResponse.json({ error: "Data siswa tidak ditemukan." }, { status: 404 });
    }

    const body = await request.json();
    const { invoice_id, bukti_transfer } = body;

    if (!invoice_id || !bukti_transfer) {
      return NextResponse.json(
        { error: "Invoice ID dan bukti transfer wajib diisi." },
        { status: 400 }
      );
    }

    const supabase = getAdminSupabase();

    // Pastikan tagihan milik siswa yang sedang login
    const { data: invoice, error: fetchErr } = await supabase
      .from("general_invoices")
      .select("id, student_id")
      .eq("id", invoice_id)
      .eq("student_id", studentId)
      .single();

    if (fetchErr || !invoice) {
      return NextResponse.json({ error: "Tagihan tidak ditemukan." }, { status: 404 });
    }

    const { error: updateErr } = await supabase
      .from("general_invoices")
      .update({
        bukti_transfer,
        status: "PENDING_VERIFICATION",
        payment_method: "TRANSFER",
        updated_at: new Date().toISOString(),
      })
      .eq("id", invoice_id);

    if (updateErr) throw updateErr;

    return NextResponse.json({
      success: true,
      message: "Bukti transfer berhasil dikirim. Menunggu konfirmasi admin.",
    });
  } catch (error: any) {
    console.error("Error submitting general invoice proof:", error);
    return NextResponse.json(
      { error: error.message || "Server Error" },
      { status: 500 }
    );
  }
}
