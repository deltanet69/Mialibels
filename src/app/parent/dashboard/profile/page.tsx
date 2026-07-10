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
  MapPin,
  BookOpen,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { ChangePasswordForm } from '@/components/parent/ChangePasswordForm';

export const metadata = {
  title: 'Profil Anak - Portal Wali Murid | MI Attaqwa 15',
};

const JWT_SECRET = process.env.JWT_SECRET!;

// Admin-level client — bypasses RLS. Required because parent portal uses custom JWT, not Supabase Auth.
function getAdminSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false } }
  );
}

async function getStudentData() {
  const cookieStore = await cookies();
  const token = cookieStore.get('parent_session')?.value;
  if (!token) return null;

  let payload: any;
  try {
    const secret = new TextEncoder().encode(JWT_SECRET);
    const result = await jwtVerify(token, secret);
    payload = result.payload;
  } catch {
    return null; // Token expired or invalid
  }

  const studentId = payload.sub as string;
  const studentNis = payload.nis as string | undefined;
  const studentNisn = payload.nisn as string | undefined;

  const supabase = getAdminSupabase();

  // 1. Primary lookup: by UUID
  let { data: student } = await supabase
    .from('students')
    .select('*')
    .eq('id', studentId)
    .maybeSingle();

  // 2. Fallback: by student_number (NIS internal)
  if (!student && studentNis) {
    const { data } = await supabase
      .from('students')
      .select('*')
      .eq('student_number', studentNis)
      .maybeSingle();
    student = data;
  }

  // 3. Fallback: by nisn (NISN national)
  if (!student && studentNisn) {
    const { data } = await supabase
      .from('students')
      .select('*')
      .eq('nisn', studentNisn)
      .maybeSingle();
    student = data;
  }

  if (!student) return null;

  // Fetch tabungan balance
  const { data: tabungan } = await supabase
    .from('tabungan_siswa')
    .select('balance')
    .eq('student_id', student.id)
    .maybeSingle();

  // Fetch latest SPP invoices
  const { data: sppInvoices } = await supabase
    .from('spp_invoices')
    .select('id, title, month, year, amount, paid_amount, status, due_date')
    .eq('student_id', student.id)
    .order('year', { ascending: false })
    .order('month', { ascending: false })
    .limit(5);

  return {
    ...student,
    tabunganBalance: tabungan?.balance || 0,
    sppInvoices: sppInvoices || [],
  };
}

export default async function ParentProfilePage() {
  const student = await getStudentData();

  if (!student) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center font-sans">
        <div className="w-20 h-20 bg-red-50 text-red-400 rounded-full flex items-center justify-center mb-5">
          <XCircle size={40} />
        </div>
        <h2 className="text-xl font-bold text-slate-800 mb-2">Sesi Tidak Valid</h2>
        <p className="text-slate-500 text-sm max-w-xs mb-6">
          Sesi login Anda sudah habis atau tidak valid. Silakan login ulang untuk melanjutkan.
        </p>
        <Link
          href="/api/auth/parent-logout"
          className="px-6 py-3 bg-[#002957] text-white rounded-2xl hover:bg-blue-900 transition font-semibold text-sm shadow-lg shadow-blue-900/20"
        >
          Logout & Login Ulang
        </Link>
      </div>
    );
  }

  const formatCurrency = (n: number) =>
    new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(n);

  const InfoRow = ({
    icon: Icon,
    label,
    value,
  }: {
    icon: React.ElementType;
    label: string;
    value?: string | null;
  }) =>
    value ? (
      <div className="flex items-start gap-3 py-3 border-b border-slate-50 last:border-0">
        <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center shrink-0 mt-0.5">
          <Icon size={16} className="text-blue-500" />
        </div>
        <div>
          <p className="text-[14px]  text-slate-400 uppercase tracking-wider">{label}</p>
          <p className="font-semibold text-slate-800 text-md mt-0.5">{value}</p>
        </div>
      </div>
    ) : null;

  const getSppStatusColor = (status: string) => {
    if (status === 'PAID') return 'bg-emerald-100 text-emerald-700';
    if (status === 'UNPAID') return 'bg-red-100 text-red-700';
    if (status === 'LATE') return 'bg-red-200 text-red-800';
    if (status === 'PARTIAL') return 'bg-amber-100 text-amber-700';
    if (status === 'PENDING_VERIFICATION') return 'bg-blue-100 text-blue-700';
    return 'bg-slate-100 text-slate-600';
  };

  const getSppStatusLabel = (status: string) => {
    if (status === 'PAID') return 'Lunas';
    if (status === 'UNPAID') return 'Belum Bayar';
    if (status === 'LATE') return 'Terlambat';
    if (status === 'PARTIAL') return 'Cicilan';
    if (status === 'PENDING_VERIFICATION') return 'Menunggu Verifikasi';
    return status;
  };

  return (
    <div className="space-y-6 w-full pb-12 font-sans">
      {/* Page Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-blue-50 rounded-2xl flex items-center justify-center">
          <UserCircle className="text-blue-600" size={22} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Profil Anak</h1>
          <p className="text-sm text-slate-400">Data lengkap siswa dan wali murid</p>
        </div>
      </div>

      {/* Hero Card */}
      <div className="bg-gradient-to-r from-[#002957] to-blue-700 rounded-2xl p-6 md:p-8 flex flex-col md:flex-row items-center gap-6 text-white shadow-lg shadow-blue-900/20 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <div className="absolute top-0 right-0 w-72 h-72 bg-white rounded-full -mr-20 -mt-20 blur-3xl" />
          <div className="absolute bottom-0 left-1/4 w-48 h-48 bg-white rounded-full -mb-20 blur-2xl" />
        </div>

        {/* Avatar */}
        <div className="w-20 h-20 md:w-24 md:h-24 rounded-2xl bg-white/20 border-2 border-white/30 flex items-center justify-center overflow-hidden shrink-0 text-white font-black text-3xl shadow-xl relative z-10">
          {student.image ? (
            <Image src={student.image} alt={student.name} width={96} height={96} className="object-cover w-full h-full" />
          ) : (
            student.name.charAt(0).toUpperCase()
          )}
        </div>

        {/* Name & Info */}
        <div className="flex-1 text-center md:text-left relative z-10">
          <h2 className="text-2xl md:text-3xl font-black mb-2">{student.name}</h2>
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 mb-3">
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold bg-white/20 border border-white/30 px-3 py-1 rounded-full backdrop-blur-sm">
              <School size={11} /> Kelas {student.class}
            </span>
            {student.nisn && (
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold bg-white/20 border border-white/30 px-3 py-1 rounded-full backdrop-blur-sm">
                <Hash size={11} /> NISN: {student.nisn}
              </span>
            )}
            {student.student_number && (
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold bg-white/20 border border-white/30 px-3 py-1 rounded-full backdrop-blur-sm">
                <Hash size={11} /> NIS: {student.student_number}
              </span>
            )}
            <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full backdrop-blur-sm border ${student.is_active ? 'bg-emerald-500/30 border-emerald-400/40' : 'bg-red-500/30 border-red-400/40'}`}>
              {student.is_active ? <><CheckCircle2 size={11} /> Aktif</> : <><XCircle size={11} /> Tidak Aktif</>}
            </span>
          </div>
          <p className="text-blue-200 text-sm">
            Wali: <span className="font-bold text-white">{student.parent_name}</span>
          </p>
        </div>

        {/* Quick Finance */}
        <div className="flex  gap-3 shrink-0 relative z-10">
          <Link href="/parent/dashboard/savings" className="group flex items-center gap-4 bg-white/10 border border-white/20 rounded-xl p-4 hover:bg-white/20 transition-all backdrop-blur-sm min-w-[180px]">
            <Wallet size={20} className="text-blue-200 group-hover:scale-110 transition-transform" />
            <div>
              <p className="text-[12px] font-bold text-blue-200 uppercase tracking-wider">Saldo Tabungan</p>
              <p className="font-bold text-md">{formatCurrency(student.tabunganBalance)}</p>
            </div>
          </Link>
          <Link href="/parent/dashboard/spp" className="group flex items-center gap-4 bg-white/10 border border-white/20 rounded-xl p-4 hover:bg-white/20 transition-all backdrop-blur-sm min-w-[180px]">
            <CreditCard size={20} className="text-blue-200 group-hover:scale-110 transition-transform" />
            <div>
              <p className="text-[12px] font-bold text-blue-200 uppercase tracking-wider">Tagihan SPP</p>
              <p className="font-bold text-md">Lihat Detail</p>
            </div>
          </Link>
        </div>
      </div>

      {/* Info Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Data Siswa */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <div className="flex items-center gap-2 mb-5 pb-3 border-b border-slate-100">
            <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
              <BookOpen size={20} className="text-blue-600" />
            </div>
            <h3 className="font-bold text-slate-800 text-xl">Data Siswa</h3>
          </div>
          <div>
            <InfoRow icon={User} label="Nama Lengkap" value={student.name} />
            <InfoRow icon={Hash} label="NISN (Nasional)" value={student.nisn} />
            <InfoRow icon={Hash} label="NIS (Internal)" value={student.student_number} />
            <InfoRow icon={School} label="Kelas" value={student.class} />
            <InfoRow icon={MapPin} label="Posisi / Jabatan" value={student.position} />
          </div>
          {student.description && (
            <div className="mt-4 p-3 bg-slate-50 rounded-xl border border-slate-100">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Catatan</p>
              <p className="text-sm text-slate-600 leading-relaxed">{student.description}</p>
            </div>
          )}
        </div>

        {/* Data Wali */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <div className="flex items-center gap-2 mb-5 pb-3 border-b border-slate-100">
            <div className="w-8 h-8 bg-purple-50 rounded-lg flex items-center justify-center">
              <User size={20} className="text-purple-600" />
            </div>
            <h3 className="font-bold text-slate-800 text-xl">Data Wali Murid</h3>
          </div>
          <div>
            <InfoRow icon={User} label="Nama Wali" value={student.parent_name} />
            <InfoRow icon={Phone} label="No. WhatsApp / Telepon" value={student.parent_phone} />
            <InfoRow icon={Mail} label="Email" value={student.parent_email} />
          </div>

          {/* SPP Quick Summary */}
          {student.sppInvoices.length > 0 && (
            <div className="mt-5 pt-4 border-t border-slate-100">
              <p className="text-[14px] font-bold text-slate-400 uppercase tracking-wider mb-3">Tagihan SPP Terbaru</p>
              <div className="space-y-2">
                {student.sppInvoices.slice(0, 3).map((inv: any) => (
                  <div key={inv.id} className="flex items-center justify-between text-md">
                    <span className="text-slate-600 truncate mr-2">{inv.title || `SPP ${String(inv.month).padStart(2, '0')}/${inv.year}`}</span>
                    <span className={`text-md font-bold px-2 py-0.5 rounded-full shrink-0 ${getSppStatusColor(inv.status)}`}>
                      {getSppStatusLabel(inv.status)}
                    </span>
                  </div>
                ))}
              </div>
              <Link href="/parent/dashboard/spp" className="text-md font-bold text-blue-600 hover:underline mt-2 block">
                Lihat semua →
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Change Password */}
      <div>
        <ChangePasswordForm />
      </div>
    </div>
  );
}
