"use client";

import React, { useState, useEffect } from "react";
import { DollarSign, AlertCircle, Users, CheckCircle2, Filter, Printer } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

interface DashboardStats {
  totalCollected: number;
  totalUnpaid: number;
  pendingVerification: number;
  paidCount: number;
  unpaidCount: number;
  partialCount: number;
  chartData: any[];
  month: number;
  year: number;
}

export default function DashboardTab() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [filterMonth, setFilterMonth] = useState<number>(new Date().getMonth() + 1);
  const [filterYear, setFilterYear] = useState<number>(new Date().getFullYear());
  const [filterClass, setFilterClass] = useState<string>("ALL");

  useEffect(() => {
    fetchStats();
  }, [filterMonth, filterYear, filterClass]);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/spp/dashboard?month=${filterMonth}&year=${filterYear}&class=${filterClass}`);
      const result = await res.json();
      if (!res.ok) throw new Error(result.error);
      setStats(result.data);
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getMonthName = (monthNumber: number) => {
    const months = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
    return months[monthNumber - 1];
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-pulse">
        {[1, 2, 3].map(i => <div key={i} className="bg-white h-32 rounded-2xl border border-slate-100"></div>)}
        <div className="col-span-1 md:col-span-2 lg:col-span-3 h-80 bg-white rounded-2xl border border-slate-100 mt-4"></div>
      </div>
    );
  }

  if (errorMsg) {
    return <div className="text-red-500 bg-red-50 p-4 rounded-xl">{errorMsg}</div>;
  }

  if (!stats) return null;

  const totalTagihanCount = stats.paidCount + stats.unpaidCount + stats.pendingVerification + stats.partialCount;

  const handlePrint = () => {
    window.open(`/print/infaq-summary?month=${filterMonth}&year=${filterYear}&class=${filterClass}`, '_blank');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between md:items-center bg-white p-4 rounded-2xl border border-slate-100 shadow-sm gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-800">Ringkasan Infaq Sekolah</h2>
          <p className="text-sm text-slate-500">Periode {getMonthName(stats.month)} {stats.year} {filterClass !== 'ALL' ? `- Kelas ${filterClass}` : ''}</p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
            <Filter className="w-4 h-4 text-slate-400" />
            <span className="text-xs font-medium text-slate-500">Filter:</span>
          </div>
          <select value={filterMonth} onChange={(e) => setFilterMonth(Number(e.target.value))} className="border border-slate-200 bg-white rounded-lg text-sm px-3 py-2 outline-none focus:border-blue-500">
            {Array.from({length: 12}, (_, i) => i + 1).map(m => <option key={m} value={m}>Bulan {m}</option>)}
          </select>
          <select value={filterYear} onChange={(e) => setFilterYear(Number(e.target.value))} className="border border-slate-200 bg-white rounded-lg text-sm px-3 py-2 outline-none focus:border-blue-500">
            {[2024, 2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          <select value={filterClass} onChange={(e) => setFilterClass(e.target.value)} className="border border-slate-200 bg-white rounded-lg text-sm px-3 py-2 outline-none focus:border-blue-500">
            <option value="ALL">Semua Kelas</option>
            <optgroup label="Kelas 1"><option value="1A">1A</option><option value="1B">1B</option><option value="1C">1C</option><option value="1D">1D</option></optgroup>
            <optgroup label="Kelas 2"><option value="2A">2A</option><option value="2B">2B</option><option value="2C">2C</option><option value="2D">2D</option></optgroup>
            <optgroup label="Kelas 3"><option value="3A">3A</option><option value="3B">3B</option><option value="3C">3C</option><option value="3D">3D</option></optgroup>
            <optgroup label="Kelas 4"><option value="4A">4A</option><option value="4B">4B</option><option value="4C">4C</option><option value="4D">4D</option></optgroup>
            <optgroup label="Kelas 5"><option value="5A">5A</option><option value="5B">5B</option><option value="5C">5C</option><option value="5D">5D</option></optgroup>
            <optgroup label="Kelas 6"><option value="6A">6A</option><option value="6B">6B</option><option value="6C">6C</option><option value="6D">6D</option></optgroup>
          </select>
          <button onClick={handlePrint} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
            <Printer className="w-4 h-4" /> Cetak Laporan
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card 1: Total Tagihan Bulan Ini */}
        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center transition-transform group-hover:scale-110">
            <DollarSign className="text-blue-500 w-10 h-10 opacity-50" />
          </div>
          <p className="text-sm font-medium text-slate-500 mb-1 relative z-10">Total Tagihan Bulan Ini</p>
          <h3 className="text-2xl font-bold text-slate-800 relative z-10">Rp {(stats.totalCollected + stats.totalUnpaid).toLocaleString("id-ID")}</h3>
          <p className="text-xs text-blue-600 font-medium mt-3 relative z-10 flex items-center gap-1 bg-blue-50 w-fit px-2 py-1 rounded-md">
            <Users className="w-3 h-3" /> {stats.paidCount} dari {totalTagihanCount} Siswa Lunas
          </p>
          <p className="text-xs text-slate-500 mt-2 font-medium relative z-10">
            Terkumpul: Rp {stats.totalCollected.toLocaleString("id-ID")}
          </p>
        </div>

        {/* Card 2: Total Yang Sudah Bayar */}
        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center transition-transform group-hover:scale-110">
            <CheckCircle2 className="text-emerald-500 w-10 h-10 opacity-50" />
          </div>
          <p className="text-sm font-medium text-slate-500 mb-1 relative z-10">Total Yang Sudah Bayar</p>
          <h3 className="text-2xl font-bold text-emerald-600 relative z-10">Rp {stats.totalCollected.toLocaleString("id-ID")}</h3>
          <p className="text-xs text-emerald-600 font-medium mt-3 relative z-10 flex items-center gap-1 bg-emerald-50 w-fit px-2 py-1 rounded-md">
            <CheckCircle2 className="w-3 h-3" /> {stats.paidCount} Lunas + {stats.partialCount} Cicilan
          </p>
        </div>

        {/* Card 3: Total Yang Belum Bayar */}
        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 w-20 h-20 bg-red-50 rounded-full flex items-center justify-center transition-transform group-hover:scale-110">
            <AlertCircle className="text-red-500 w-10 h-10 opacity-50" />
          </div>
          <p className="text-sm font-medium text-slate-500 mb-1 relative z-10">Total Belum Terbayar</p>
          <h3 className="text-2xl font-bold text-red-600 relative z-10">Rp {stats.totalUnpaid.toLocaleString("id-ID")}</h3>
          <p className="text-xs text-red-600 font-medium mt-3 relative z-10 flex items-center gap-1 bg-red-50 w-fit px-2 py-1 rounded-md">
            <AlertCircle className="w-3 h-3" /> {stats.unpaidCount} Siswa Belum Bayar
          </p>
        </div>
      </div>

      {/* CHART SECTION */}
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
        <h3 className="text-lg font-bold text-slate-800 mb-6">Persentase Pembayaran Infaq Per Kelas</h3>
        <div className="w-full h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={stats.chartData}
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="class" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} dy={10} />
              <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} dx={-10} />
              <Tooltip 
                cursor={{fill: '#f8fafc'}}
                contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
              />
              <Legend wrapperStyle={{paddingTop: '20px'}} />
              <Bar dataKey="lunas" name="Lunas" stackId="a" fill="#10b981" radius={[0, 0, 4, 4]} barSize={40} />
              <Bar dataKey="cicilan" name="Mencicil" stackId="a" fill="#f59e0b" />
              <Bar dataKey="belum_lunas" name="Belum Lunas" stackId="a" fill="#ef4444" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
