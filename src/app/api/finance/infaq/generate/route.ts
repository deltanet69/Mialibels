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

const MONTHS = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember"
];

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { month, year, targetType, classId, studentId } = body; // month is 1-12

    if (!month || !year) {
      return NextResponse.json({ error: "Bulan dan Tahun wajib diisi" }, { status: 400 });
    }

    const monthName = MONTHS[parseInt(month) - 1];
    const itemName = `Infaq Sekolah - ${monthName} ${year}`;

    const supabase = getAdminSupabase();

    // 1. Ambil semua siswa aktif sesuai target
    let studentsQuery = supabase
      .from('students')
      .select('id, class, fee_waiver_type')
      .eq('is_active', true);

    if (targetType === 'class' && classId) {
      studentsQuery = studentsQuery.eq('class_id', classId);
    } else if (targetType === 'student' && studentId) {
      studentsQuery = studentsQuery.eq('id', studentId);
    }

    const { data: students, error: studentErr } = await studentsQuery;

    if (studentErr) throw studentErr;
    if (!students || students.length === 0) {
      return NextResponse.json({ error: 'Tidak ada siswa aktif ditemukan' }, { status: 400 });
    }

    const studentIds = students.map(s => s.id);

    // 2. Ambil tagihan Infaq yang sudah ada (bulan & tahun ini) KHUSUS untuk siswa yang ditarget
    // Selalu skip yang sudah ada - respek unique constraint (student_id, month, year)
    const { data: existingInfaq, error: existingErr } = await supabase
      .from('spp_invoices')
      .select('student_id')
      .in('student_id', studentIds)
      .eq('month', parseInt(month))
      .eq('year', parseInt(year));

    if (existingErr) throw existingErr;

    const studentsWithInfaq = new Set(existingInfaq?.map(inv => inv.student_id) || []);

    const newInvoicesToInsert: any[] = [];

    for (const student of students) {
      // Selalu skip siswa yang sudah punya tagihan bulan ini (respek unique constraint DB)
      if (studentsWithInfaq.has(student.id)) continue;

      let nominal = student.class.endsWith('A') ? 160000 : 60000;
      let status = "UNPAID";
      let paid_amount = 0;
      let finalItemName = itemName;
      let payment_method = null;

      // Logika Keringanan Infaq
      if (student.fee_waiver_type === 'ANAK_YATIM') {
        nominal = 0;
        status = "PAID";
        finalItemName = `${itemName} (Gratis - Anak Yatim)`;
        payment_method = "BEASISWA";
      } else if (student.fee_waiver_type === 'Keluarga Guru') {
        nominal = 0;
        status = "PAID";
        finalItemName = `${itemName} (Gratis - Keluarga Guru)`;
        payment_method = "BEASISWA";
      }

      newInvoicesToInsert.push({
        student_id: student.id,
        title: finalItemName,
        amount: nominal,
        month: parseInt(month),
        year: parseInt(year),
        due_date: new Date(parseInt(year), parseInt(month) - 1, 10).toISOString(),
        paid_amount,
        status,
        payment_method,
      });
    }

    let createdCount = 0;
    if (newInvoicesToInsert.length > 0) {
      const { error: insertErr } = await supabase
        .from('spp_invoices')
        .insert(newInvoicesToInsert);

      if (insertErr) throw insertErr;
      createdCount = newInvoicesToInsert.length;
    }

    const skippedCount = studentsWithInfaq.size;

    return NextResponse.json({
      success: true,
      message: `Berhasil membuat Tagihan Infaq: ${createdCount} tagihan baru dibuat, ${skippedCount} dilewati (sudah ada tagihan aktif).`
    });

  } catch (error: any) {
    console.error("Generate Infaq Error:", error);
    return NextResponse.json({ error: error?.message || error || 'Terjadi kesalahan internal pada server.' }, { status: 500 });
  }
}

