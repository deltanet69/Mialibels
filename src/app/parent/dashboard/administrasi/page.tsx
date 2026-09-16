import React from 'react';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import { getAdminSupabase } from '@/lib/supabase';
import { getJwtSecretKey } from '@/lib/jwt';
import { ParentAdministrasiClient } from '@/components/parent/administrasi/ParentAdministrasiClient';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Administrasi & Keuangan - Portal Wali Murid | MI Attaqwa 15',
  description: 'Informasi tagihan SPP, pos keuangan umum madrasah, dan buku tabungan siswa MI Attaqwa 15 Babelan.',
};

async function getAdministrasiPageData() {
  const cookieStore = await cookies();
  const token = cookieStore.get('parent_session')?.value;
  if (!token) return null;

  let payload: any;
  try {
    const result = await jwtVerify(token, getJwtSecretKey());
    payload = result.payload;
  } catch {
    return null;
  }

  const studentId = payload.sub as string;
  const tokenNis = payload.nis as string | undefined;
  const tokenNisn = payload.nisn as string | undefined;

  const supabase = getAdminSupabase();
  let studentData: any = null;

  if (studentId) {
    const { data } = await supabase.from('students').select('id, name, class, class_id, fee_waiver_type').eq('id', studentId).maybeSingle();
    studentData = data;
  }
  if (!studentData && tokenNis) {
    const { data } = await supabase.from('students').select('id, name, class, class_id, fee_waiver_type').ilike('student_number', tokenNis.trim()).maybeSingle();
    studentData = data;
  }
  if (!studentData && tokenNisn) {
    const { data } = await supabase.from('students').select('id, name, class, class_id, fee_waiver_type').eq('nisn', tokenNisn.trim()).maybeSingle();
    studentData = data;
  }

  if (!studentData) return null;

  const [
    { data: sppInvoices },
    { data: generalInvoices },
    { data: tabungan },
    { data: transactions }
  ] = await Promise.all([
    supabase
      .from('spp_invoices')
      .select('id, title, month, year, amount, paid_amount, status, due_date')
      .eq('student_id', studentData.id)
      .order('year', { ascending: false })
      .order('month', { ascending: false }),
    supabase
      .from('general_invoices')
      .select('id, title, items, total_amount, paid_amount, status, due_date, created_at, type')
      .eq('student_id', studentData.id)
      .order('created_at', { ascending: false }),
    supabase
      .from('tabungan_siswa')
      .select('balance, total_setor, total_tarik')
      .eq('student_id', studentData.id)
      .maybeSingle(),
    supabase
      .from('tabungan_transaksi')
      .select('id, type, amount, balance_after, description, created_at')
      .eq('student_id', studentData.id)
      .order('created_at', { ascending: false })
      .limit(30),
  ]);

  return {
    sppInvoices: sppInvoices || [],
    generalInvoices: generalInvoices || [],
    savingsData: {
      balance: tabungan?.balance || 0,
      totalSetoran: tabungan?.total_setor || 0,
      totalPenarikan: tabungan?.total_tarik || 0,
      transactions: transactions || [],
    }
  };
}

export default async function ParentAdministrasiPage() {
  const data = await getAdministrasiPageData();
  if (!data) redirect('/parent/login');

  return (
    <ParentAdministrasiClient
      initialSpp={data.sppInvoices}
      initialGeneral={data.generalInvoices}
      initialSavings={data.savingsData}
    />
  );
}
