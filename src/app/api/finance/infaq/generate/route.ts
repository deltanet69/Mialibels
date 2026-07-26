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

    // 1. Ambil semua siswa aktif
    let studentsQuery = supabase
      .from('students')
      .select('id, class')
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

    // 2. Ambil semua tagihan Infaq di bulan dan tahun ini untuk mencegah duplikasi
    const { data: existingInfaq, error: existingErr } = await supabase
      .from('spp_invoices')
      .select('student_id')
      .eq('month', parseInt(month))
      .eq('year', parseInt(year));

    if (existingErr) throw existingErr;
    
    const studentsWithInfaq = new Set(existingInfaq?.map(inv => inv.student_id) || []);

    let createdCount = 0;

    const newInvoicesToInsert = [];
    
    for (const student of students) {
      // Jika siswa sudah punya infaq bulan ini, skip
      if (studentsWithInfaq.has(student.id)) continue;

      const nominal = student.class.endsWith('A') ? 160000 : 60000;
      
      // Buat tagihan baru per bulan
      newInvoicesToInsert.push({
        student_id: student.id,
        title: itemName,
        amount: nominal,
        month: parseInt(month),
        year: parseInt(year),
        due_date: new Date(year, parseInt(month) - 1, 10).toISOString(),
        paid_amount: 0,
        status: "UNPAID"
      });
    }

    if (newInvoicesToInsert.length > 0) {
      const { error: insertErr } = await supabase
        .from('spp_invoices')
        .insert(newInvoicesToInsert);
      
      if (insertErr) throw insertErr;
      createdCount = newInvoicesToInsert.length;
    }

    return NextResponse.json({ 
      success: true, 
      message: `Berhasil menambahkan Infaq Sekolah. Tagihan Baru dibuat: ${createdCount}, Dilewati (Sudah ada): ${students.length - createdCount}.` 
    });

  } catch (error: any) {
    console.error("Generate Infaq Error:", error);
    return NextResponse.json({ error: error.message || "Server Error" }, { status: 500 });
  }
}
