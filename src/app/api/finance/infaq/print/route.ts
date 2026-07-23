import { NextRequest, NextResponse } from 'next/server';
import { createClient } from "@supabase/supabase-js";

function getAdminSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false } }
  );
}

const getMonthNumber = (mName: string) => {
  const months = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];
  return months.indexOf(mName) + 1;
};

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const monthStr = searchParams.get('month');
    const yearStr = searchParams.get('year');
    const classStr = searchParams.get('class');
    
    const now = new Date();
    const month = monthStr ? parseInt(monthStr, 10) : now.getMonth() + 1;
    const year = yearStr ? parseInt(yearStr, 10) : now.getFullYear();

    const supabase = getAdminSupabase();
    
    const { data: invoices, error } = await supabase
      .from('general_invoices')
      .select('items, students(name, student_number, class)')
      .limit(2000);

    if (error) throw error;

    let totalTagihan = 0;
    let totalTerkumpul = 0;
    let totalTunggakan = 0;
    
    // Untuk laporan spesifik kelas
    const studentRows: any[] = [];
    
    // Untuk laporan semua kelas
    const classStats: Record<string, { class: string; total_tagihan: number; terkumpul: number; tunggakan: number; lunas_count: number; belum_count: number }> = {};

    invoices.forEach((inv: any) => {
      const studentName = inv.students?.name || 'Unknown';
      const studentNis = inv.students?.student_number || '-';
      const studentClass = inv.students?.class || 'Unknown';
      
      if (classStr && classStr !== 'ALL' && studentClass !== classStr) return;
      if (!inv.items || !Array.isArray(inv.items)) return;

      inv.items.forEach((item: any) => {
        if (item.name && item.name.startsWith('Infaq Sekolah - ')) {
          const parts = item.name.replace('Infaq Sekolah - ', '').split(' ');
          if (parts.length === 2) {
            const mNum = getMonthNumber(parts[0]);
            const yNum = parseInt(parts[1], 10);

            if (mNum === month && yNum === year) {
              const amt = Number(item.amount) || 0;
              const paid = Number(item.paid_amount) || 0;
              const tunggakan = amt - paid;
              
              let itemStatus = 'Belum Bayar';
              if (paid >= amt && amt > 0) itemStatus = 'Lunas';
              else if (paid > 0) itemStatus = 'Mencicil';

              totalTagihan += amt;
              totalTerkumpul += paid;
              totalTunggakan += tunggakan;

              if (!classStats[studentClass]) {
                classStats[studentClass] = { class: studentClass, total_tagihan: 0, terkumpul: 0, tunggakan: 0, lunas_count: 0, belum_count: 0 };
              }

              classStats[studentClass].total_tagihan += amt;
              classStats[studentClass].terkumpul += paid;
              classStats[studentClass].tunggakan += tunggakan;
              
              if (itemStatus === 'Lunas') classStats[studentClass].lunas_count++;
              else classStats[studentClass].belum_count++;

              studentRows.push({
                name: studentName,
                nis: studentNis,
                class: studentClass,
                tagihan: amt,
                terbayar: paid,
                tunggakan: tunggakan,
                status: itemStatus
              });
            }
          }
        }
      });
    });

    const summaryPerClass = Object.values(classStats).sort((a, b) => a.class.localeCompare(b.class));
    const sortedStudentRows = studentRows.sort((a, b) => a.name.localeCompare(b.name));

    return NextResponse.json({
      success: true,
      data: {
        totalTagihan,
        totalTerkumpul,
        totalTunggakan,
        summaryPerClass,
        studentRows: sortedStudentRows,
        month,
        year,
        classFilter: classStr || 'ALL'
      }
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Server Error' }, { status: 500 });
  }
}
