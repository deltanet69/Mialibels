// @ts-nocheck
import React from 'react';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import { getAdminSupabase } from '@/lib/supabase';
import { getJwtSecretKey } from '@/lib/jwt';
import { XCircle } from 'lucide-react';
import Link from 'next/link';
import { ParentProfileClient } from '@/components/parent/profile/ParentProfileClient';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Profil Akun & Data Siswa - Portal Wali Murid | MI Attaqwa 15',
  description: 'Informasi biodata siswa dan profil akun wali murid MI Attaqwa 15 Babelan.',
};

async function getStudentData() {
  const cookieStore = await cookies();
  const token = cookieStore.get('parent_session')?.value;
  if (!token) return null;

  let payload: any;
  try {
    const secret = getJwtSecretKey();
    const result = await jwtVerify(token, secret);
    payload = result.payload;
  } catch {
    return null;
  }

  const studentId = payload.sub as string;
  const studentNis = payload.nis as string | undefined;
  const studentNisn = payload.nisn as string | undefined;

  const supabase = getAdminSupabase();

  let { data: student } = await supabase
    .from('students')
    .select('*')
    .eq('id', studentId)
    .maybeSingle();

  if (!student && studentNis) {
    const { data } = await supabase
      .from('students')
      .select('*')
      .eq('student_number', studentNis)
      .maybeSingle();
    student = data;
  }

  if (!student && studentNisn) {
    const { data } = await supabase
      .from('students')
      .select('*')
      .eq('nisn', studentNisn)
      .maybeSingle();
    student = data;
  }

  if (!student) return null;

  // Resolve classroom, tabungan, and SPP concurrently in a single parallel wave
  const [
    clsResult,
    tabunganResult,
    sppResult
  ] = await Promise.all([
    student.class_id
      ? supabase
          .from('classrooms')
          .select('id, name, homeroom_teacher:staffs!homeroom_teacher_id(name)')
          .eq('id', student.class_id)
          .maybeSingle()
      : student.class
      ? supabase
          .from('classrooms')
          .select('id, name, homeroom_teacher:staffs!homeroom_teacher_id(name)')
          .eq('name', student.class)
          .maybeSingle()
      : Promise.resolve({ data: null }),
    supabase
      .from('tabungan_siswa')
      .select('balance')
      .eq('student_id', student.id)
      .maybeSingle(),
    supabase
      .from('spp_invoices')
      .select('id, title, month, year, amount, paid_amount, status, due_date')
      .eq('student_id', student.id)
      .order('year', { ascending: false })
      .order('month', { ascending: false })
      .limit(5)
  ]);

  const homeroomTeacherName = (clsResult?.data as any)?.homeroom_teacher?.name || 'Dewi P, S.Pd';
  const tabungan = tabunganResult?.data;
  const sppInvoices = sppResult?.data || [];

  const pendingSpp = sppInvoices?.find((i: any) => i.status !== 'PAID');
  const sppAmountDisplay = pendingSpp ? 'Rp 160rb' : 'Lunas';

  return {
    ...student,
    homeroomTeacherName,
    tabunganBalance: tabungan?.balance || 0,
    sppInvoices,
    sppAmountDisplay,
  };
}

export default async function ParentProfilePage() {
  const student = await getStudentData();

  if (!student) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center font-sans p-4">
        <div className="w-16 h-16 bg-red-50 text-red-400 rounded-full flex items-center justify-center mb-4">
          <XCircle size={32} />
        </div>
        <h2 className="text-lg font-bold text-slate-800 mb-1">Sesi Tidak Valid</h2>
        <p className="text-slate-500 text-xs max-w-xs mb-5">
          Sesi login Anda sudah habis. Silakan login ulang untuk melanjutkan.
        </p>
        <Link
          href="/api/auth/parent-logout"
          className="px-5 py-2.5 bg-blue-600 text-white rounded-xl font-bold text-xs shadow-md"
        >
          Login Ulang
        </Link>
      </div>
    );
  }

  return <ParentProfileClient student={student} />;
}
