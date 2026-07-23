// @ts-nocheck
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getSession } from "@/lib/session";

// Gunakan service_role untuk bypass RLS pada operasi write
function getAdminSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false } }
  );
}

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(request.url);
    const status = url.searchParams.get("status");
    const classId = url.searchParams.get("classId");

    const supabase = getAdminSupabase();

    let query = supabase
      .from("general_invoices")
      .select(`
        *,
        students!inner (
          id,
          name,
          student_number,
          class,
          class_id
        )
      `)
      .order("created_at", { ascending: false })
      .limit(3000); // Prevent extreme payloads that cause Vercel 504 timeouts

    if (status && status !== "ALL") {
      query = query.eq("status", status);
    }

    if (classId && classId !== "ALL") {
      query = query.eq("students.class_id", classId);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Supabase Error fetch general invoices:", error);
      return NextResponse.json(
        { error: "Gagal mengambil data tagihan: " + error.message },
        { status: 500 }
      );
    }

    const filteredData = data ?? [];

    const formattedData = filteredData.map((item: any) => ({
      id: item.id,
      title: item.title,
      type: item.type,
      due_date: item.due_date,
      items: item.items,
      total_amount: item.total_amount,
      paid_amount: item.paid_amount,
      status: item.status,
      payment_method: item.payment_method,
      bukti_transfer: item.bukti_transfer,
      note: item.note,
      student_id: item.student_id,
      student_name: item.students?.name || "Unknown",
      student_number: item.students?.student_number || "-",
      student_class: item.students?.class || "-",
      student_class_id: item.students?.class_id || null,
      created_at: item.created_at,
    }));

    return NextResponse.json({ success: true, data: formattedData });
  } catch (error: any) {
    console.error("Error fetching general invoices:", error);
    return NextResponse.json(
      { error: error.message || "Server Error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { title, type, due_date, class_id, student_id, target_type, items, note } = body;

    if (!title) {
      return NextResponse.json({ error: "Nama Tagihan wajib diisi." }, { status: 400 });
    }

    if (target_type === 'class' && !class_id) {
      return NextResponse.json({ error: "Kelas wajib dipilih." }, { status: 400 });
    }
    
    if (target_type === 'student' && !student_id) {
      return NextResponse.json({ error: "Siswa wajib dipilih." }, { status: 400 });
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "Minimal 1 item tagihan wajib diisi." }, { status: 400 });
    }

    const validItems = items
      .filter((i: any) => i.name && String(i.name).trim() !== "" && Number(i.amount) > 0)
      .map((i: any) => ({
        name: String(i.name).trim(),
        amount: Number(i.amount),
        paid_amount: 0
      }));

    if (validItems.length === 0) {
      return NextResponse.json({ error: "Minimal 1 item tagihan dengan nama dan nominal lebih dari 0." }, { status: 400 });
    }

    const total_amount = validItems.reduce((acc: number, item: any) => acc + item.amount, 0);

    const supabase = getAdminSupabase();

    let targetStudents = [];

    if (target_type === 'student') {
      const { data, error } = await supabase.from("students").select("id").eq("id", student_id);
      if (error) {
        return NextResponse.json({ error: "Gagal mengambil data siswa: " + error.message }, { status: 500 });
      }
      targetStudents = data || [];
    } else {
      const { data, error } = await supabase.from("students").select("id").eq("class_id", class_id);
      if (error) {
        return NextResponse.json({ error: "Gagal mengambil data siswa: " + error.message }, { status: 500 });
      }
      targetStudents = data || [];
    }

    if (!targetStudents || targetStudents.length === 0) {
      return NextResponse.json(
        { error: "Tidak ada siswa yang sesuai kriteria. Pastikan siswa tersedia." },
        { status: 404 }
      );
    }

    // Buat tagihan untuk setiap siswa
    const invoicesToInsert = targetStudents.map((student: any) => ({
      student_id: student.id,
      title: title.trim(),
      type: (type || "Administrasi Sekolah").trim(),
      due_date: due_date || null,
      items: validItems,
      total_amount,
      paid_amount: 0,
      status: "UNPAID",
      note: (note || "").trim(),
    }));

    const { data: newInvoices, error: insertError } = await supabase
      .from("general_invoices")
      .insert(invoicesToInsert)
      .select("id");

    if (insertError) {
      console.error("Error inserting invoices:", insertError);
      return NextResponse.json({ error: "Gagal menyimpan tagihan: " + insertError.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: `Berhasil membuat ${newInvoices?.length || 0} tagihan.`,
      count: newInvoices?.length || 0,
    });
  } catch (error: any) {
    console.error("Error creating general invoices:", error);
    return NextResponse.json({ error: error.message || "Server Error" }, { status: 500 });
  }
}
