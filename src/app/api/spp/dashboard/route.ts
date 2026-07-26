import { NextRequest, NextResponse } from 'next/server';
import { getAdminSupabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const monthStr = searchParams.get('month');
    const yearStr = searchParams.get('year');
    const classStr = searchParams.get('class');
    
    // Default to current month/year if not provided
    const now = new Date();
    const month = monthStr ? parseInt(monthStr, 10) : now.getMonth() + 1;
    const year = yearStr ? parseInt(yearStr, 10) : now.getFullYear();

    const supabase = getAdminSupabase();
    
    // Fetch invoices with student class info from spp_invoices
    const { data: invoices, error } = await supabase
      .from('spp_invoices')
      .select('amount, paid_amount, status, month, year, students(class)')
      .eq('month', month)
      .eq('year', year)
      .limit(3000);

    if (error) throw error;

    let totalCollected = 0;
    let totalUnpaid = 0;
    let pendingVerification = 0;
    let paidCount = 0;
    let unpaidCount = 0;
    let partialCount = 0;
    
    // Data for Chart
    const classStats: Record<string, { class: string; lunas: number; belum_lunas: number; cicilan: number }> = {};

    invoices.forEach((inv: any) => {
      const studentClass = inv.students?.class || 'Unknown';
      if (classStr && classStr !== 'ALL' && studentClass !== classStr) return;

      if (!classStats[studentClass]) {
        classStats[studentClass] = { class: studentClass, lunas: 0, belum_lunas: 0, cicilan: 0 };
      }

      const amt = Number(inv.amount) || 0;
      const paid = Number(inv.paid_amount) || 0;
      let itemStatus = inv.status;
      if (itemStatus === 'PENDING_VERIFICATION') {
         pendingVerification++;
      }

      if (itemStatus === 'PAID') {
        totalCollected += amt;
        paidCount++;
        classStats[studentClass].lunas++;
      } else if (itemStatus === 'PARTIAL') {
        totalCollected += paid;
        totalUnpaid += (amt - paid);
        partialCount++;
        classStats[studentClass].cicilan++;
      } else if (itemStatus === 'UNPAID') {
        totalUnpaid += amt;
        unpaidCount++;
        classStats[studentClass].belum_lunas++;
      }
    });

    const chartData = Object.values(classStats).sort((a, b) => a.class.localeCompare(b.class));

    return NextResponse.json({
      success: true,
      data: {
        totalCollected,
        totalUnpaid,
        pendingVerification,
        paidCount,
        unpaidCount,
        partialCount,
        chartData,
        month,
        year
      }
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Server Error' }, { status: 500 });
  }
}
