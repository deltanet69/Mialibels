// @ts-nocheck
import React from 'react';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/session';
import { canViewExecutiveReports } from '@/lib/rbac';
import { supabase } from '@/lib/supabase';
import { 
  BarChart3, Wallet, CreditCard, PiggyBank, Users, GraduationCap, 
  CheckCircle2, AlertTriangle, ArrowUpRight, Clock, ShieldCheck, 
  TrendingUp, Calendar, FileSpreadsheet, Building2
} from 'lucide-react';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

function formatRp(num: number): string {
  return 'Rp ' + Number(num || 0).toLocaleString('id-ID');
}

export default async function ExecutiveReportsPage() {
  const session = await getSession();

  // Strict server-side RBAC check: only superadmin, kepsek, bendahara
  if (!session || !canViewExecutiveReports(session.role)) {
    redirect('/dashboard');
  }

  const todayStr = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta' });
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;

  // Run parallel aggregate queries for the executive summary
  const [
    studentsRes,
    staffsRes,
    studentAttendanceRes,
    staffAttendanceRes,
    savingsRes,
    sppRes,
    generalRes
  ] = await Promise.all([
    // Siswa aktif
    supabase.from('students').select('id, class', { count: 'exact' }).eq('is_active', true),
    // Staff / Guru aktif
    supabase.from('staffs').select('id, role', { count: 'exact' }).eq('is_active', true),
    // Kehadiran Siswa Hari Ini
    supabase.from('classroom_attendances').select('id', { count: 'exact', head: true }).eq('date', todayStr).ilike('status', '%hadir%'),
    // Kehadiran Guru Hari Ini
    supabase.from('staff_attendance').select('id', { count: 'exact', head: true }).eq('date', todayStr).ilike('status', '%hadir%'),
    // Total Tabungan Siswa
    supabase.from('tabungan_siswa').select('balance'),
    // Tagihan SPP
    supabase.from('spp_invoices').select('amount, paid_amount, status'),
    // Tagihan Umum
    supabase.from('general_invoices').select('total_amount, paid_amount, status')
  ]);

  const totalActiveStudents = studentsRes.count || 0;
  const totalActiveStaffs = staffsRes.count || 0;
  const studentHadirCount = studentAttendanceRes.count || 0;
  const staffHadirCount = staffAttendanceRes.count || 0;

  // Aggregate Tabungan
  const totalSavings = (savingsRes.data || []).reduce((acc, curr) => acc + (Number(curr.balance) || 0), 0);

  // Aggregate SPP
  let totalSppBilled = 0;
  let totalSppPaid = 0;
  let sppPaidCount = 0;
  let sppUnpaidCount = 0;
  for (const inv of (sppRes.data || [])) {
    totalSppBilled += Number(inv.amount) || 0;
    totalSppPaid += Number(inv.paid_amount) || 0;
    if (inv.status === 'PAID') sppPaidCount++;
    else sppUnpaidCount++;
  }
  const totalSppTunggakan = Math.max(0, totalSppBilled - totalSppPaid);

  // Aggregate Tagihan Umum
  let totalGeneralBilled = 0;
  let totalGeneralPaid = 0;
  let generalPaidCount = 0;
  let generalUnpaidCount = 0;
  for (const inv of (generalRes.data || [])) {
    totalGeneralBilled += Number(inv.total_amount) || 0;
    totalGeneralPaid += Number(inv.paid_amount) || 0;
    if (inv.status === 'PAID') generalPaidCount++;
    else generalUnpaidCount++;
  }
  const totalGeneralTunggakan = Math.max(0, totalGeneralBilled - totalGeneralPaid);

  // Total Real Pemasukan (SPP + Umum)
  const totalRevenueCollected = totalSppPaid + totalGeneralPaid;
  const totalTunggakanAll = totalSppTunggakan + totalGeneralTunggakan;

  // Persentase Kehadiran
  const studentAttendanceRate = totalActiveStudents > 0 
    ? Math.min(100, Math.round((studentHadirCount / totalActiveStudents) * 100)) 
    : 0;
  const staffAttendanceRate = totalActiveStaffs > 0 
    ? Math.min(100, Math.round((staffHadirCount / totalActiveStaffs) * 100)) 
    : 0;

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-300">
      
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 flex items-center gap-1">
              <ShieldCheck size={12} /> Akses Eksekutif Khusus
            </span>
            <span className="text-xs text-slate-400 font-medium">
              Update: {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-800 tracking-tight">
            Laporan Eksekutif Yayasan & Madrasah
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Ringkasan strategis keuangan, operasional akademik, dan kehadiran untuk Kepala Sekolah, Bendahara, dan Yayasan.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <div className="bg-slate-50 border border-slate-200 px-4 py-2 rounded-xl text-right">
            <div className="text-[11px] font-semibold uppercase text-slate-400">Login Sebagai</div>
            <div className="text-sm font-bold text-slate-700 capitalize flex items-center gap-1.5 justify-end">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              {session.name || 'Pimpinan'} ({session.role})
            </div>
          </div>
        </div>
      </div>

      {/* Primary Financial Overview Cards */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
            <TrendingUp size={18} className="text-blue-600" /> Ringkasan Keuangan Global
          </h2>
          <div className="text-xs font-semibold text-slate-500">
            Tahun Ajaran {currentYear}/{currentYear + 1}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* Card 1: Total Penerimaan Tunai/Transfer */}
          <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl p-5 text-white shadow-lg shadow-blue-500/10 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <Wallet size={80} />
            </div>
            <div className="text-xs font-semibold uppercase tracking-wider text-blue-100">
              Total Realisasi Penerimaan
            </div>
            <div className="text-2xl font-bold mt-2 tracking-tight">
              {formatRp(totalRevenueCollected)}
            </div>
            <div className="text-xs text-blue-100/90 mt-3 pt-3 border-t border-blue-500/40 flex justify-between items-center">
              <span>Akumulasi Terverifikasi</span>
              <span className="font-semibold">SPP + Tagihan Umum</span>
            </div>
          </div>

          {/* Card 2: Saldo Tabungan Siswa */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs relative">
            <div className="flex justify-between items-start">
              <div>
                <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Titipan Tabungan Siswa
                </div>
                <div className="text-2xl font-bold mt-2 text-slate-800 tracking-tight">
                  {formatRp(totalSavings)}
                </div>
              </div>
              <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                <PiggyBank size={20} />
              </div>
            </div>
            <div className="text-xs text-slate-500 mt-3 pt-3 border-t border-slate-100 flex justify-between items-center">
              <span>Dana Mengendap Siswa</span>
              <Link href="/finance/savings" className="text-purple-600 hover:text-purple-700 font-semibold flex items-center gap-0.5">
                Detail <ArrowUpRight size={14} />
              </Link>
            </div>
          </div>

          {/* Card 3: Total Tunggakan Belum Terbayar */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs relative">
            <div className="flex justify-between items-start">
              <div>
                <div className="text-xs font-semibold uppercase tracking-wider text-rose-500">
                  Total Tunggakan Aktif
                </div>
                <div className="text-2xl font-bold mt-2 text-rose-600 tracking-tight">
                  {formatRp(totalTunggakanAll)}
                </div>
              </div>
              <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                <AlertTriangle size={20} />
              </div>
            </div>
            <div className="text-xs text-slate-500 mt-3 pt-3 border-t border-slate-100 flex justify-between items-center">
              <span>Siswa Belum Melunasi</span>
              <span className="font-bold text-rose-600">Perlu Follow-up</span>
            </div>
          </div>

          {/* Card 4: Rasio Pelunasan */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs relative">
            <div className="flex justify-between items-start">
              <div>
                <div className="text-xs font-semibold uppercase tracking-wider text-emerald-600">
                  Kolektibilitas Biaya
                </div>
                <div className="text-2xl font-bold mt-2 text-emerald-700 tracking-tight">
                  {totalRevenueCollected + totalTunggakanAll > 0 
                    ? Math.round((totalRevenueCollected / (totalRevenueCollected + totalTunggakanAll)) * 100) 
                    : 100}%
                </div>
              </div>
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                <CheckCircle2 size={20} />
              </div>
            </div>
            <div className="text-xs text-slate-500 mt-3 pt-3 border-t border-slate-100 flex justify-between items-center">
              <span>Tingkat Kepatuhan Bayar</span>
              <span className="font-semibold text-slate-700">Sehat</span>
            </div>
          </div>
        </div>
      </div>

      {/* Breakdown Section: SPP vs General Finance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* SPP Breakdown Card */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <CreditCard size={20} />
              </div>
              <div>
                <h3 className="font-bold text-slate-800 text-base">Infaq Bulanan (SPP)</h3>
                <p className="text-xs text-slate-500">Rekap tagihan infaq sekolah reguler &amp; fullday</p>
              </div>
            </div>
            <Link href="/finance/spp" className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1">
              Buka Modul <ArrowUpRight size={14} />
            </Link>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-600">Total Tagihan Dibuat:</span>
              <span className="font-bold text-slate-800">{formatRp(totalSppBilled)}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-emerald-700 font-medium">Realisasi Penerimaan:</span>
              <span className="font-bold text-emerald-700">{formatRp(totalSppPaid)}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-rose-600 font-medium">Sisa Belum Terbayar:</span>
              <span className="font-bold text-rose-600">{formatRp(totalSppTunggakan)}</span>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100">
            <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden flex">
              <div 
                className="bg-emerald-500 h-full transition-all" 
                style={{ width: `${totalSppBilled > 0 ? (totalSppPaid / totalSppBilled) * 100 : 0}%` }}
                title="Lunas"
              />
              <div 
                className="bg-rose-400 h-full transition-all" 
                style={{ width: `${totalSppBilled > 0 ? (totalSppTunggakan / totalSppBilled) * 100 : 0}%` }}
                title="Tunggakan"
              />
            </div>
            <div className="flex justify-between text-[11px] text-slate-400 font-medium mt-2">
              <span>Lunas: {sppPaidCount} invoice</span>
              <span>Tunggakan: {sppUnpaidCount} invoice</span>
            </div>
          </div>
        </div>

        {/* General Finance Breakdown Card */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <Wallet size={20} />
              </div>
              <div>
                <h3 className="font-bold text-slate-800 text-base">Keuangan Umum &amp; Non-SPP</h3>
                <p className="text-xs text-slate-500">Buku, seragam, kegiatan, qurban, dan pendaftaran</p>
              </div>
            </div>
            <Link href="/finance/general" className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1">
              Buka Modul <ArrowUpRight size={14} />
            </Link>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-600">Total Tagihan Dibuat:</span>
              <span className="font-bold text-slate-800">{formatRp(totalGeneralBilled)}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-emerald-700 font-medium">Realisasi Penerimaan:</span>
              <span className="font-bold text-emerald-700">{formatRp(totalGeneralPaid)}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-rose-600 font-medium">Sisa Belum Terbayar:</span>
              <span className="font-bold text-rose-600">{formatRp(totalGeneralTunggakan)}</span>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100">
            <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden flex">
              <div 
                className="bg-indigo-500 h-full transition-all" 
                style={{ width: `${totalGeneralBilled > 0 ? (totalGeneralPaid / totalGeneralBilled) * 100 : 0}%` }}
                title="Lunas"
              />
              <div 
                className="bg-rose-400 h-full transition-all" 
                style={{ width: `${totalGeneralBilled > 0 ? (totalGeneralTunggakan / totalGeneralBilled) * 100 : 0}%` }}
                title="Tunggakan"
              />
            </div>
            <div className="flex justify-between text-[11px] text-slate-400 font-medium mt-2">
              <span>Lunas: {generalPaidCount} tagihan</span>
              <span>Tunggakan: {generalUnpaidCount} tagihan</span>
            </div>
          </div>
        </div>

      </div>

      {/* Operational & Attendance Overview */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
          <div>
            <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
              <Building2 size={18} className="text-blue-600" /> Status Operasional &amp; Kehadiran Hari Ini
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Pemantauan langsung stabilitas KBM madrasah pada hari {new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>
          <div className="flex gap-2">
            <Link 
              href="/absensi-guru"
              className="text-xs font-semibold px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition"
            >
              Absensi Guru
            </Link>
            <Link 
              href="/attendance"
              className="text-xs font-semibold px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg transition"
            >
              Absensi Siswa
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* Siswa Total */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                <Users size={20} />
              </div>
              <div>
                <div className="text-xs text-slate-500 font-medium">Total Siswa Aktif</div>
                <div className="text-xl font-bold text-slate-800">{totalActiveStudents} Siswa</div>
              </div>
            </div>
          </div>

          {/* Kehadiran Siswa */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                <GraduationCap size={20} />
              </div>
              <div>
                <div className="text-xs text-slate-500 font-medium">Kehadiran Siswa Hari Ini</div>
                <div className="text-xl font-bold text-slate-800">
                  {studentHadirCount} <span className="text-xs font-normal text-slate-500">({studentAttendanceRate}%)</span>
                </div>
              </div>
            </div>
          </div>

          {/* Staff Total */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center shrink-0">
                <Building2 size={20} />
              </div>
              <div>
                <div className="text-xs text-slate-500 font-medium">Total Guru &amp; Staff</div>
                <div className="text-xl font-bold text-slate-800">{totalActiveStaffs} Orang</div>
              </div>
            </div>
          </div>

          {/* Kehadiran Staff */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                <Clock size={20} />
              </div>
              <div>
                <div className="text-xs text-slate-500 font-medium">Kehadiran Guru Hari Ini</div>
                <div className="text-xl font-bold text-slate-800">
                  {staffHadirCount} <span className="text-xs font-normal text-slate-500">({staffAttendanceRate}%)</span>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>

    </div>
  );
}
