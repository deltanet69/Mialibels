// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const monthStr = searchParams.get('month');
    const yearStr = searchParams.get('year');
    
    // Default to current month/year if not provided
    const now = new Date();
    const month = monthStr ? parseInt(monthStr, 10) : now.getMonth() + 1;
    const year = yearStr ? parseInt(yearStr, 10) : now.getFullYear();

    // Fetch invoices with student class info
    const { data: invoices, error } = await supabase
      .from('spp_invoices')
      .select('amount, status, paid_amount, students(class)')
      .eq('month', month)
      .eq('year', year);

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
      if (!classStats[studentClass]) {
        classStats[studentClass] = { class: studentClass, lunas: 0, belum_lunas: 0, cicilan: 0 };
      }

      if (inv.status === 'PAID') {
        totalCollected += (inv.paid_amount || inv.amount);
        paidCount++;
        classStats[studentClass].lunas++;
      } else if (inv.status === 'PENDING_VERIFICATION') {
        pendingVerification++;
        classStats[studentClass].belum_lunas++; // treat pending as belum_lunas in chart
        totalUnpaid += (inv.amount - (inv.paid_amount || 0));
        unpaidCount++; // it's still unpaid officially
      } else if (inv.status === 'PARTIAL') {
        totalCollected += (inv.paid_amount || 0);
        totalUnpaid += (inv.amount - (inv.paid_amount || 0));
        partialCount++;
        classStats[studentClass].cicilan++;
      } else if (inv.status === 'UNPAID' || inv.status === 'LATE') {
        totalUnpaid += inv.amount;
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
