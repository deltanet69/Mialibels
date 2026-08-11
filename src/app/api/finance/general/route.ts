// @ts-nocheck
import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { getAdminSupabase } from "@/lib/supabase";

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(request.url);
    const status = url.searchParams.get("status");
    const classId = url.searchParams.get("classId");
    const studentId = url.searchParams.get("studentId");
    const search = url.searchParams.get("search") || "";

    const supabase = getAdminSupabase();

    let query = supabase
      .from("general_invoices")
      .select(`
        *,
        students!inner (
          id,
          name,
          student_number,
          nisn,
          class,
          class_id
        )
      `)
      .neq("type", "Infaq") // EXCLUDE Infaq from General Finance list
      .order("created_at", { ascending: false });

    if (status && status !== "ALL") {
      query = query.eq("status", status);
    }

    if (classId && classId !== "ALL") {
      query = query.eq("students.class_id", classId);
    }

    if (studentId) {
      query = query.eq("student_id", studentId);
    }

    if (search) {
      // Search by title OR student name/NISN — use Supabase OR filter
      query = query.or(`title.ilike.%${search}%,students.name.ilike.%${search}%,students.student_number.ilike.%${search}%,students.nisn.ilike.%${search}%`);
    }

    query = query.limit(2000);

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
      student_nisn: item.students?.nisn || "-",
      student_class: item.students?.class || "-",
      student_class_id: item.students?.class_id || null,
      created_at: item.created_at,
    }));

    return NextResponse.json({ success: true, data: formattedData });
  } catch (error: any) {
    console.error("Error fetching general invoices:", error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan internal pada server.' },
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

    // 1. Ambil daftar siswa sesuai target
    let targetStudents: any[] = [];

    if (target_type === 'student') {
      const { data, error } = await supabase.from("students").select("id, class").eq("id", student_id);
      if (error) {
        return NextResponse.json({ error: "Gagal mengambil data siswa: " + error.message }, { status: 500 });
      }
      targetStudents = data || [];
    } else {
      const { data, error } = await supabase.from("students").select("id, class").eq("class_id", class_id);
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

    const studentIds = targetStudents.map((s: any) => s.id);

    // 2. Cek siswa yang sudah punya tagihan AKTIF (belum lunas) dengan judul yang sama
    //    Ini mencegah double tagihan, tapi tetap buat tagihan untuk siswa yang belum punya
    const { data: existingInvoices, error: existingError } = await supabase
      .from("general_invoices")
      .select("student_id")
      .in("student_id", studentIds)
      .eq("title", title.trim())
      .neq("status", "PAID"); // hanya skip jika masih aktif (belum lunas)

    if (existingError) {
      console.error("Error checking existing invoices:", existingError);
      // Non-fatal - lanjutkan tanpa skip check
    }

    // Set student_id yang sudah punya tagihan aktif dengan judul yang sama
    const studentsWithExistingInvoice = new Set(
      (existingInvoices || []).map((inv: any) => inv.student_id)
    );

    // 3. Buat tagihan hanya untuk siswa yang BELUM punya tagihan aktif
    const invoicesToInsert: any[] = [];
    for (const student of targetStudents) {
      if (studentsWithExistingInvoice.has(student.id)) continue; // skip yang sudah ada

      invoicesToInsert.push({
        student_id: student.id,
        title: title.trim(),
        type: (type || "Administrasi Sekolah").trim(),
        due_date: due_date || null,
        items: validItems,
        total_amount,
        paid_amount: 0,
        status: "UNPAID",
        note: (note || "").trim(),
        // Catatan: kolom student_class belum tersedia di DB general_invoices
        // Gunakan JOIN ke students table via GET endpoint untuk data kelas
      });
    }

    let insertedCount = 0;
    const skippedCount = studentsWithExistingInvoice.size;

    if (invoicesToInsert.length > 0) {
      const { data: newInvoices, error: insertError } = await supabase
        .from("general_invoices")
        .insert(invoicesToInsert)
        .select("id");

      if (insertError) {
        console.error("Error inserting invoices:", insertError);
        return NextResponse.json({ error: "Gagal menyimpan tagihan baru: " + insertError.message }, { status: 500 });
      } else {
        insertedCount = newInvoices?.length || 0;
      }
    }

    let message = `Berhasil membuat ${insertedCount} tagihan baru.`;
    if (skippedCount > 0) {
      message += ` ${skippedCount} siswa dilewati (sudah memiliki tagihan aktif dengan judul yang sama).`;
    }
    if (insertedCount === 0 && skippedCount === 0) {
      message = "Tidak ada tagihan yang perlu dibuat.";
    }

    return NextResponse.json({
      success: true,
      message,
      count: insertedCount,
      skipped: skippedCount,
    });
  } catch (error: any) {
    console.error("Error creating general invoices:", error);
    return NextResponse.json({ error: 'Terjadi kesalahan internal pada server.' }, { status: 500 });
  }
}

