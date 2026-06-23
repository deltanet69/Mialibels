import React from 'react';
import { 
  UserCircle, 
  Wallet, 
  CalendarCheck, 
  TrendingUp,
  AlertCircle
} from 'lucide-react';
import Link from 'next/link';

export default function ParentDashboardHome() {
  return (
    <div className="space-y-6">
      
      {/* Welcome Banner */}
      <div className="bg-[#002957] rounded-3xl p-6 md:p-8 text-white flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
        <div className="relative z-10 space-y-2 text-center md:text-left">
          <h2 className="text-2xl md:text-3xl font-black font-headline">Selamat Datang, Bapak/Ibu Wali!</h2>
          <p className="text-blue-100 max-w-lg">
            Pantau aktivitas belajar dan administrasi Ananda dengan mudah melalui portal ini.
          </p>
        </div>
        <div className="relative z-10 shrink-0">
          <div className="bg-white/10 backdrop-blur-sm border border-white/20 p-4 rounded-2xl flex items-center gap-4">
            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-[#002957]">
              <UserCircle size={28} />
            </div>
            <div>
              <p className="text-xs text-blue-200 font-bold uppercase tracking-wider">Siswa Aktif</p>
              <p className="text-lg font-bold">Ahmad Fauzan</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        
        <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100 flex flex-col gap-3">
          <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <CalendarCheck size={20} />
          </div>
          <div>
            <p className="text-2xl font-black text-slate-800">98%</p>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mt-0.5">Kehadiran Bulan Ini</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100 flex flex-col gap-3">
          <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
            <TrendingUp size={20} />
          </div>
          <div>
            <p className="text-2xl font-black text-slate-800">A-</p>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mt-0.5">Rata-rata Nilai</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100 flex flex-col gap-3">
          <div className="w-10 h-10 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center">
            <Wallet size={20} />
          </div>
          <div>
            <p className="text-xl md:text-2xl font-black text-slate-800">Lunas</p>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mt-0.5">SPP Bulan Ini</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100 flex flex-col gap-3">
          <div className="w-10 h-10 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center">
            <UserCircle size={20} />
          </div>
          <div>
            <p className="text-xl md:text-2xl font-black text-slate-800">Kelas 6B</p>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mt-0.5">Wali: Ibu Aminah</p>
          </div>
        </div>

      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Recent Activities */}
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-lg text-slate-800">Aktivitas Terkini</h3>
            <Link href="/parent/dashboard/attendance" className="text-sm font-bold text-blue-600 hover:text-blue-700">Lihat Semua</Link>
          </div>
          <div className="space-y-4">
            <div className="flex gap-4">
              <div className="w-2 h-2 mt-2 rounded-full bg-emerald-500 shrink-0"></div>
              <div>
                <p className="font-bold text-slate-800">Hadir - Tepat Waktu</p>
                <p className="text-sm text-slate-500">Hari ini, 06:45 WIB</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="w-2 h-2 mt-2 rounded-full bg-blue-500 shrink-0"></div>
              <div>
                <p className="font-bold text-slate-800">Tugas Matematika Dinilai</p>
                <p className="text-sm text-slate-500">Kemarin, 14:20 WIB • Nilai: 95</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="w-2 h-2 mt-2 rounded-full bg-emerald-500 shrink-0"></div>
              <div>
                <p className="font-bold text-slate-800">Hadir - Tepat Waktu</p>
                <p className="text-sm text-slate-500">Kemarin, 06:50 WIB</p>
              </div>
            </div>
          </div>
        </div>

        {/* Finance Alert / Info */}
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-bold text-lg text-slate-800">Informasi Keuangan</h3>
            </div>
            <div className="bg-blue-50/50 rounded-2xl p-4 border border-blue-100 mb-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-slate-800 text-sm">Pembayaran SPP Bulan Depan</p>
                <p className="text-xs text-slate-600 mt-1">Jatuh tempo pada tanggal 10 Juli 2026. Nominal Rp 150.000.</p>
              </div>
            </div>
            <div className="flex items-center justify-between py-3 border-b border-slate-100">
              <span className="text-sm text-slate-500">Total Tabungan Siswa</span>
              <span className="font-bold text-slate-800">Rp 1.250.000</span>
            </div>
          </div>
          <Link href="/parent/dashboard/finance" className="mt-6 block w-full text-center py-3 rounded-xl bg-slate-50 text-slate-700 font-bold text-sm hover:bg-slate-100 transition">
            Lihat Detail Keuangan
          </Link>
        </div>

      </div>

    </div>
  );
}
