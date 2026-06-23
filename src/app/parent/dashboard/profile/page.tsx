import React from 'react';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import { createClient } from '@supabase/supabase-js';
import { 
  UserCircle, 
  MapPin, 
  Phone, 
  Mail, 
  Wallet, 
  CheckCircle2, 
  XCircle,
  ShieldCheck,
  CreditCard
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

export const metadata = {
  title: 'Profil Anak - Portal Wali Murid',
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
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // Fetch student data with relations
    const { data: student, error } = await supabase
      .from('students')
      .select(`
        *,
        student_accounts (*),
        spp_payments (*)
      `)
      .eq('id', studentId)
      .single();

    if (error || !student) {
      console.error('Error fetching student profile:', error);
      return null;
    }

    return student;
  } catch (err) {
    console.error('Failed to verify token or fetch student:', err);
    return null;
  }
}

export default async function ParentProfilePage() {
  const student = await getStudentProfile();

  if (!student) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-center">
        <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-4">
          <XCircle size={32} />
        </div>
        <h2 className="text-xl font-bold text-slate-800">Sesi Tidak Valid atau Data Tidak Ditemukan</h2>
        <p className="text-slate-500 mt-2">Silakan coba login kembali.</p>
        <Link href="/parent/login" className="mt-6 px-6 py-2 bg-[#002957] text-white rounded-lg hover:bg-blue-800 transition">
          Ke Halaman Login
        </Link>
      </div>
    );
  }

  // Calculate savings
  const account = student.student_accounts?.[0];
  const balance = account?.balance || 0;

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(amount);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <UserCircle className="w-8 h-8 text-[#002957]" />
        <div>
          <h1 className="text-2xl font-black text-slate-800 font-headline">Profil Anak</h1>
          <p className="text-sm text-slate-500">Informasi lengkap peserta didik dan status administrasi.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Main Profile Info */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 text-center relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-24 bg-[#002957]"></div>
            <div className="relative z-10">
              <div className="w-24 h-24 mx-auto bg-slate-200 rounded-full border-4 border-white shadow-md mb-4 flex items-center justify-center overflow-hidden bg-white">
                {student.image ? (
                  <Image src={student.image} alt={student.name} width={96} height={96} className="object-cover w-full h-full" />
                ) : (
                  <UserCircle className="w-16 h-16 text-slate-300" />
                )}
              </div>
              <h2 className="text-xl font-bold text-slate-800">{student.name}</h2>
              <p className="text-sm font-medium text-blue-600 mt-1">NISN: {student.student_number}</p>
              
              <div className="mt-4 inline-flex items-center gap-1.5 px-3 py-1 bg-slate-50 border border-slate-100 rounded-full text-sm font-medium text-slate-600">
                <ShieldCheck className="w-4 h-4 text-[#002957]" />
                Kelas {student.class}
              </div>

              {student.is_active ? (
                <div className="mt-6 inline-flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 rounded-lg text-sm font-bold w-full justify-center">
                  <CheckCircle2 className="w-5 h-5" />
                  Status: Siswa Aktif
                </div>
              ) : (
                <div className="mt-6 inline-flex items-center gap-2 px-4 py-2 bg-red-50 text-red-700 rounded-lg text-sm font-bold w-full justify-center">
                  <XCircle className="w-5 h-5" />
                  Status: Tidak Aktif
                </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
            <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
              <UserCircle className="w-5 h-5 text-slate-400" />
              Data Wali Murid
            </h3>
            <div className="space-y-4">
              <div>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Nama Wali</p>
                <p className="font-medium text-slate-800 mt-1">{student.parent_name}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Nomor WhatsApp</p>
                <div className="flex items-center gap-2 mt-1">
                  <Phone className="w-4 h-4 text-slate-400" />
                  <p className="font-medium text-slate-800">{student.parent_phone}</p>
                </div>
              </div>
              {student.parent_email && (
                <div>
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Email</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Mail className="w-4 h-4 text-slate-400" />
                    <p className="font-medium text-slate-800">{student.parent_email}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column - Academic & Finance Details */}
        <div className="lg:col-span-2 space-y-6">
          
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
             <h3 className="font-bold text-slate-800 mb-6 text-lg border-b border-slate-100 pb-4">Informasi Keuangan</h3>
             
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Tabungan Card */}
                <div className="bg-gradient-to-br from-[#002957] to-blue-900 rounded-2xl p-5 text-white relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-4 opacity-20">
                    <Wallet className="w-24 h-24" />
                  </div>
                  <div className="relative z-10">
                    <p className="text-blue-200 text-sm font-medium mb-1">Total Tabungan</p>
                    <h4 className="text-3xl font-black mb-4">{formatCurrency(balance)}</h4>
                    <Link href="/parent/dashboard/savings" className="inline-flex items-center gap-2 text-sm bg-white/10 hover:bg-white/20 transition px-3 py-1.5 rounded-lg font-medium">
                      Lihat Riwayat <span className="opacity-70">→</span>
                    </Link>
                  </div>
                </div>

                {/* SPP Card */}
                <div className="bg-white border border-slate-200 rounded-2xl p-5 relative overflow-hidden flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-slate-500 text-sm font-medium">Status SPP Terkini</p>
                      <CreditCard className="w-5 h-5 text-blue-500" />
                    </div>
                    {/* We show standard status or logic based on spp_payments */}
                    <div className="mt-3">
                      <p className="text-xl font-bold text-slate-800">Cek Tagihan Bulan Ini</p>
                      <p className="text-sm text-slate-500 mt-1">Pembayaran SPP rutin setiap bulan.</p>
                    </div>
                  </div>
                  <Link href="/parent/dashboard/spp" className="mt-4 inline-flex items-center justify-center gap-2 text-sm bg-[#F26430] hover:bg-[#d95627] text-white transition px-4 py-2 rounded-xl font-bold w-full">
                    Buka Halaman SPP
                  </Link>
                </div>
             </div>
          </div>

          <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
             <div className="flex items-center justify-between mb-6 border-b border-slate-100 pb-4">
               <h3 className="font-bold text-slate-800 text-lg">Catatan & Deskripsi Tambahan</h3>
             </div>
             
             {student.description ? (
               <div className="bg-slate-50 p-4 rounded-xl text-slate-700 text-sm leading-relaxed border border-slate-100">
                 {student.description}
               </div>
             ) : (
               <div className="text-center py-8 text-slate-400 text-sm bg-slate-50 rounded-xl border border-slate-100 border-dashed">
                 Belum ada catatan tambahan untuk siswa ini.
               </div>
             )}
          </div>
          
        </div>
      </div>
    </div>
  );
}
