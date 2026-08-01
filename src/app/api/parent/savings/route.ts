// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { jwtVerify } from 'jose';

const JWT_SECRET = process.env.JWT_SECRET!;

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET(request: NextRequest) {
  try {
    const sessionCookie = request.cookies.get('parent_session')?.value;
    if (!sessionCookie) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const secret = new TextEncoder().encode(JWT_SECRET);
    const { payload } = await jwtVerify(sessionCookie, secret);
    const studentId = payload.sub as string;

    // Fetch balance from tabungan_siswa
    const { data: account, error: accErr } = await supabase
      .from('tabungan_siswa')
      .select('id, balance, updated_at')
      .eq('student_id', studentId)
      .maybeSingle();

    if (accErr) throw accErr;

    // Fetch transaction history from tabungan_transaksi
    const { data: transactions, error: trxErr } = await supabase
      .from('tabungan_transaksi')
      .select('id, type, amount, balance_after, description, created_at')
      .eq('student_id', studentId)
      .order('created_at', { ascending: false })
      .limit(50);

    if (trxErr) throw trxErr;

    // Calculate totals
    let totalSetoran = 0;
    let totalPenarikan = 0;
    transactions?.forEach((t: any) => {
      if (t.type === 'SETOR' || t.type === 'IN' || t.type === 'DEPOSIT') {
        totalSetoran += t.amount;
      } else {
        totalPenarikan += t.amount;
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        balance: account?.balance || 0,
        lastUpdated: account?.updated_at || null,
        transactions: transactions || [],
        totalSetoran,
        totalPenarikan,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: 'Terjadi kesalahan internal pada server.' }, { status: 500 });
  }
}

