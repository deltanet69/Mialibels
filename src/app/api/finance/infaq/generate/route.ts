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

    // 2. Ambil semua tagihan Infaq aktif (UNPAID, PARTIAL, PENDING_VERIFICATION)
    const { data: activeInvoices, error: activeErr } = await supabase
      .from('general_invoices')
      .select('id, student_id, items, total_amount, paid_amount, status')
      .eq('type', 'Infaq')
      .in('status', ['UNPAID', 'PARTIAL', 'PENDING_VERIFICATION']);

    if (activeErr) throw activeErr;

    // Cari tagihan (apapun statusnya) yang mengandung nama item ini, untuk menghindari duplikasi
    // Supabase jsonb contains: kita bisa gunakan syntax [{ "name": "..." }] atau mengecek secara manual
    // Kita akan mengecek secara manual setelah mengambil student invoices jika syntax contains bermasalah
    // Tapi syntax supabase .contains('items', [{name: '...'}]) biasanya bekerja jika items adalah array of objects.
    const { data: existingInfaq, error: existingErr } = await supabase
      .from('general_invoices')
      .select('student_id, items')
      .eq('type', 'Infaq');

    if (existingErr) throw existingErr;
    
    // Filter manual di js untuk lebih aman
    const studentsWithInfaq = new Set();
    if (existingInfaq) {
      existingInfaq.forEach((inv: any) => {
        if (inv.items && Array.isArray(inv.items)) {
          if (inv.items.some((item: any) => item.name === itemName)) {
            studentsWithInfaq.add(inv.student_id);
          }
        }
      });
    }

    let createdCount = 0;
    let updatedCount = 0;

    const newInvoicesToInsert = [];
    
    for (const student of students) {
      // Jika siswa sudah punya infaq bulan ini, skip
      if (studentsWithInfaq.has(student.id)) continue;

      const nominal = student.class.endsWith('A') ? 160000 : 60000;
      const newItem = { name: itemName, amount: nominal, paid_amount: 0 };

      // Cari tagihan aktif untuk siswa ini
      const activeInv = activeInvoices?.find(inv => inv.student_id === student.id);

      if (activeInv) {
        // Update tagihan aktif
        const newItems = [...(activeInv.items || []), newItem];
        const newTotal = Number(activeInv.total_amount) + nominal;
        
        await supabase
          .from('general_invoices')
          .update({
            items: newItems,
            total_amount: newTotal
          })
          .eq('id', activeInv.id);
        
        updatedCount++;
      } else {
        // Buat tagihan baru
        newInvoicesToInsert.push({
          student_id: student.id,
          title: "Tagihan Infaq Sekolah",
          type: "Infaq",
          items: [newItem],
          total_amount: nominal,
          paid_amount: 0,
          status: "UNPAID",
          note: `Tagihan otomatis untuk ${itemName}`
        });
      }
    }

    if (newInvoicesToInsert.length > 0) {
      const { error: insertErr } = await supabase
        .from('general_invoices')
        .insert(newInvoicesToInsert);
      
      if (insertErr) throw insertErr;
      createdCount = newInvoicesToInsert.length;
    }

    return NextResponse.json({ 
      success: true, 
      message: `Berhasil menambahkan Infaq Sekolah. Tagihan Baru dibuat: ${createdCount}, Tagihan Aktif di-update: ${updatedCount}, Dilewati (Sudah ada): ${students.length - createdCount - updatedCount}.` 
    });

  } catch (error: any) {
    console.error("Generate Infaq Error:", error);
    return NextResponse.json({ error: error.message || "Server Error" }, { status: 500 });
  }
}
