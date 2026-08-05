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

    const targetMonth = parseInt(month);
    const targetYear = parseInt(year);
    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();

    let startM = currentMonth, startY = currentYear;
    let endM = targetMonth, endY = targetYear;

    // If target is in the past, swap them so we always generate a valid range
    if (targetYear < currentYear || (targetYear === currentYear && targetMonth < currentMonth)) {
      startM = targetMonth;
      startY = targetYear;
      endM = currentMonth;
      endY = currentYear;
    }

    const periodsToGenerate = [];
    let curY = startY;
    let curM = startM;
    while (curY < endY || (curY === endY && curM <= endM)) {
      periodsToGenerate.push({ month: curM, year: curY });
      curM++;
      if (curM > 12) {
        curM = 1;
        curY++;
      }
    }

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

    // 2. Ambil tagihan Infaq yang sudah ada untuk semua periode KHUSUS untuk siswa yang ditarget
    // We will fetch all invoices for these students within the period range
    const { data: existingInfaq, error: existingErr } = await supabase
      .from('spp_invoices')
      .select('student_id, month, year')
      .in('student_id', studentIds);

    if (existingErr) throw existingErr;

    // Set of "studentId-month-year" for quick lookup
    const existingSet = new Set(existingInfaq?.map(inv => `${inv.student_id}-${inv.month}-${inv.year}`) || []);

    const newInvoicesToInsert: any[] = [];
    let skippedCount = 0;

    for (const student of students) {
      for (const period of periodsToGenerate) {
        const periodKey = `${student.id}-${period.month}-${period.year}`;
        if (existingSet.has(periodKey)) {
          skippedCount++;
          continue;
        }

        let nominal = student.class.endsWith('A') ? 160000 : 60000;
        let status = "UNPAID";
        let paid_amount = 0;
        let finalItemName = `Infaq Sekolah - ${MONTHS[period.month - 1]} ${period.year}`;
        let payment_method = null;

        // Logika Keringanan Infaq
        if (student.fee_waiver_type === 'ANAK_YATIM') {
          nominal = 0;
          status = "PAID";
          finalItemName = `${finalItemName} (Gratis - Anak Yatim)`;
          payment_method = "BEASISWA";
        } else if (student.fee_waiver_type === 'Keluarga Guru') {
          nominal = 0;
          status = "PAID";
          finalItemName = `${finalItemName} (Gratis - Keluarga Guru)`;
          payment_method = "BEASISWA";
        }

        newInvoicesToInsert.push({
          student_id: student.id,
          title: finalItemName,
          amount: nominal,
          month: period.month,
          year: period.year,
          due_date: new Date(period.year, period.month - 1, 10).toISOString(),
          paid_amount,
          status,
          payment_method,
        });
      }
    }

    let createdCount = 0;
    if (newInvoicesToInsert.length > 0) {
      const { error: insertErr } = await supabase
        .from('spp_invoices')
        .insert(newInvoicesToInsert);

      if (insertErr) throw insertErr;
      createdCount = newInvoicesToInsert.length;
    }



    return NextResponse.json({
      success: true,
      message: `Berhasil membuat Tagihan Infaq: ${createdCount} tagihan baru dibuat, ${skippedCount} dilewati (sudah ada tagihan aktif).`
    });

  } catch (error: any) {
    console.error("Generate Infaq Error:", error);
    return NextResponse.json({ error: error?.message || error || 'Terjadi kesalahan internal pada server.' }, { status: 500 });
  }
}

