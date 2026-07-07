import React from 'react';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import { createClient } from '@supabase/supabase-js';
import { 
  UserCircle, 
  Phone, 
  Mail, 
  Wallet, 
  CheckCircle2, 
  XCircle,
  School,
  CreditCard,
  Hash,
  User,
  MapPin
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { ChangePasswordForm } from '@/components/parent/ChangePasswordForm';

export const metadata = {
  title: 'Profil Anak - Portal Wali Murid | MI Attaqwa 15',
};

async function getStudentProfile() {
  const cookieStore = await cookies();
  const token = cookieStore.get('parent_session')?.value;
  if (!token) return null;

  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);
    const studentId = payload.sub as string;

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const { data: student, error } = await supabase
      .from('students')
      .select('*, student_accounts (*), spp_payments (*)')
      .eq('id', studentId)
      .single();

    if (error || !student) return null;

    // Fetch tabungan balance
    const { data: tabungan } = await supabase
      .from('tabungan_siswa')
      .select('balance')
      .eq('student_id', studentId)
      .maybeSingle();

    return { ...student, tabunganBalance: tabungan?.balance || 0 };
  } catch {
    return null;
  }
}

export default async function ParentProfilePage() {
  const student = await getStudentProfile();

  if (!student) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-center font-sans">
        <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-4">
          <XCircle size={32} />
        </div>
        <h2 className="text-xl font-bold text-slate-800">Sesi Tidak Valid</h2>
        <p className="text-slate-400 mt-2 text-sm">Silakan coba login kembali.</p>
        <Link href="/parent/login" className="mt-6 px-6 py-2.5 bg-[#002957] text-white rounded-xl hover:bg-blue-800 transition font-semibold text-sm">
          Ke Halaman Login
        </Link>
      </div>
    );
  }

  const formatCurrency = (n: number) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n);

  const InfoRow = ({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value?: string | null }) => (
    value ? (
      <div className="flex items-start gap-3 py-3 border-b border-slate-50 last:border-0 font-sans">
        <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center shrink-0">
          <Icon size={14} className="text-slate-400" />
        </div>
        <div>
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{label}</p>
          <p className="font-semibold text-slate-800 text-sm mt-0.5">{value}</p>
        </div>
      </div>
    ) : null
  );

  return (
    <div className="space-y-6 w-full pb-12 font-sans">

      {/* Header Info */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-blue-50 rounded-2xl flex items-center justify-center">
          <UserCircle className="text-blue-600" size={22} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-800 font-sans">Profil Siswa</h1>
          <p className="text-sm text-slate-400">Informasi lengkap data siswa dan wali murid</p>
        </div>
      </div>

      {/* Profile Hero Card */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 md:p-8 flex flex-col md:flex-row items-center gap-6">
        <div className="w-24 h-24 rounded-2xl shadow-sm bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center overflow-hidden shrink-0 text-white font-black text-3xl">
          {student.image ? (
            <Image src={student.image} alt={student.name} width={96} height={96} className="object-cover w-full h-full" />
          ) : (
            student.name.charAt(0).toUpperCase()
          )}
        </div>
        <div className="flex-1 text-center md:text-left">
          <h2 className="text-2xl font-bold text-slate-800 font-sans mb-2">{student.name}</h2>
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-100 px-3 py-1 rounded-full">
              <School size={12} /> Kelas {student.class}
            </span>
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 bg-slate-50 border border-slate-200 px-3 py-1 rounded-full">
              <Hash size={12} /> NISN: {student.student_number}
            </span>
            {student.is_active ? (
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-100 px-3 py-1 rounded-full">
                <CheckCircle2 size={12} /> Siswa Aktif
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-red-700 bg-red-50 border border-red-100 px-3 py-1 rounded-full">
                <XCircle size={12} /> Tidak Aktif
              </span>
            )}
          </div>
        </div>
        
        {/* Quick Finance Stats (Right Side) */}
        <div className="w-full md:w-auto flex flex-col gap-3 shrink-0 mt-4 md:mt-0">
          <Link href="/parent/dashboard/savings" className="group flex items-center justify-between gap-6 bg-white border border-slate-200 rounded-xl p-4 hover:border-blue-400 hover:shadow-sm transition-all min-w-[200px]">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5 font-sans">Saldo Tabungan</p>
              <p className="font-bold text-sm text-slate-800 font-sans">{formatCurrency(student.tabunganBalance)}</p>
            </div>
            <Wallet size={20} className="text-blue-500 group-hover:scale-110 transition-transform" />
          </Link>
          <Link href="/parent/dashboard/spp" className="group flex items-center justify-between gap-6 bg-white border border-slate-200 rounded-xl p-4 hover:border-amber-400 hover:shadow-sm transition-all min-w-[200px]">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5 font-sans">Tagihan SPP</p>
              <p className="font-bold text-sm text-slate-800 font-sans">Lihat Detail</p>
            </div>
            <CreditCard size={20} className="text-amber-500 group-hover:scale-110 transition-transform" />
          </Link>
        </div>
      </div>

      {/* Info Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Data Siswa */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <h3 className="font-semibold text-slate-800 mb-4 pb-3 border-b border-slate-100 text-sm font-sans">
            Informasi Data Siswa
          </h3>
          <div className="space-y-1">
            <InfoRow icon={User} label="Nama Lengkap" value={student.name} />
            <InfoRow icon={Hash} label="Nomor Induk Siswa (NISN)" value={student.student_number} />
            <InfoRow icon={School} label="Kelas" value={student.class} />
            {student.position && <InfoRow icon={MapPin} label="Posisi / Jabatan" value={student.position} />}
          </div>
          {student.description && (
            <div className="mt-4 pt-4 border-t border-slate-50">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 font-sans">Catatan</p>
              <p className="text-sm text-slate-600 leading-relaxed bg-slate-50 rounded-xl p-3 border border-slate-100 font-sans">
                {student.description}
              </p>
            </div>
          )}
        </div>

        {/* Data Wali */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <h3 className="font-semibold text-slate-800 mb-4 pb-3 border-b border-slate-100 text-sm font-sans">
            Informasi Data Wali Murid
          </h3>
          <div className="space-y-1">
            <InfoRow icon={User} label="Nama Wali" value={student.parent_name} />
            <InfoRow icon={Phone} label="No. WhatsApp" value={student.parent_phone} />
            <InfoRow icon={Mail} label="Email" value={student.parent_email} />
          </div>
        </div>
      </div>

      {/* Change Password */}
      <div className="mt-6">
        <ChangePasswordForm />
      </div>
    </div>
  );
}
