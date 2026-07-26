"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";

interface PrintData {
  totalTagihan: number;
  totalTerkumpul: number;
  totalTunggakan: number;
  summaryPerClass: any[];
  studentRows: any[];
  month: number;
  year: number;
  classFilter: string;
}

function InfaqPrintSummaryContent() {
  const searchParams = useSearchParams();
  const month = searchParams.get('month');
  const year = searchParams.get('year');
  const classFilter = searchParams.get('class');

  const [data, setData] = useState<PrintData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPrintData = async () => {
      try {
        const res = await fetch(`/api/finance/infaq/print?month=${month}&year=${year}&class=${classFilter || 'ALL'}`);
        const json = await res.json();
        if (!res.ok) throw new Error(json.error);
        setData(json.data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (month && year) {
      fetchPrintData();
    }
  }, [month, year, classFilter]);

  useEffect(() => {
    if (!loading && data) {
      setTimeout(() => {
        window.print();
      }, 500);
    }
  }, [loading, data]);

  const getMonthName = (monthNumber: number) => {
    const months = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
    return months[monthNumber - 1];
  };

  if (loading) {
    return <div className="p-10 text-center">Memuat Data Laporan...</div>;
  }

  if (error) {
    return <div className="p-10 text-center text-red-500">Error: {error}</div>;
  }

  if (!data) return null;

  const isAllClasses = data.classFilter === 'ALL';

  return (
    <div className="bg-white text-black p-8 max-w-5xl mx-auto text-sm print:p-0 print:max-w-none">
      {/* KOP SURAT */}
      <div className="flex items-center border-b-2 border-black pb-4 mb-6">
        {/* Placeholder for Logo if any, we'll use a local fallback if needed */}
        <div className="w-20 h-20 bg-slate-200 flex-shrink-0 flex items-center justify-center font-bold text-xs">LOGO</div>
        <div className="ml-6 flex-1 text-center">
          <h1 className="text-xl font-bold uppercase">MADRASAH IBTIDAIYAH ATTAQWA 15</h1>
          <p className="text-sm">Jl. Raya Ps. Babelan No.1, Babelan Kota, Kec. Babelan, Kabupaten Bekasi, Jawa Barat 17610</p>
          <p className="text-xs">Telp: (021) 1234567 | Email: info@miattaqwa15.sch.id</p>
        </div>
        <div className="w-20 h-20 flex-shrink-0"></div>
      </div>

      <div className="text-center mb-6">
        <h2 className="text-lg font-bold uppercase underline">
          Laporan Pembukuan Infaq Sekolah
        </h2>
        <p className="mt-1">
          Periode: {getMonthName(data.month)} {data.year}
          {!isAllClasses && ` - Khusus Kelas ${data.classFilter}`}
        </p>
      </div>

      {/* Ringkasan Global */}
      <div className="mb-6 grid grid-cols-3 gap-4 border border-black p-4 bg-slate-50 font-semibold">
        <div>Total Tagihan: <span className="font-bold">Rp {data.totalTagihan.toLocaleString('id-ID')}</span></div>
        <div className="text-emerald-700">Telah Terkumpul: <span className="font-bold">Rp {data.totalTerkumpul.toLocaleString('id-ID')}</span></div>
        <div className="text-red-700">Sisa Tunggakan: <span className="font-bold">Rp {data.totalTunggakan.toLocaleString('id-ID')}</span></div>
      </div>

      {/* Tabel Data */}
      {isAllClasses ? (
        // Table for All Classes Summary
        <table className="w-full border-collapse border border-black mb-8">
          <thead className="bg-slate-100">
            <tr>
              <th className="border border-black px-3 py-2 text-center w-12">No</th>
              <th className="border border-black px-3 py-2 text-left">Kelas</th>
              <th className="border border-black px-3 py-2 text-right">Total Tagihan</th>
              <th className="border border-black px-3 py-2 text-right">Terkumpul</th>
              <th className="border border-black px-3 py-2 text-right">Tunggakan</th>
              <th className="border border-black px-3 py-2 text-center">Lunas</th>
              <th className="border border-black px-3 py-2 text-center">Belum/Mencicil</th>
            </tr>
          </thead>
          <tbody>
            {data.summaryPerClass.map((row, idx) => (
              <tr key={row.class}>
                <td className="border border-black px-3 py-2 text-center">{idx + 1}</td>
                <td className="border border-black px-3 py-2 font-bold">{row.class}</td>
                <td className="border border-black px-3 py-2 text-right">Rp {row.total_tagihan.toLocaleString('id-ID')}</td>
                <td className="border border-black px-3 py-2 text-right">Rp {row.terkumpul.toLocaleString('id-ID')}</td>
                <td className="border border-black px-3 py-2 text-right">Rp {row.tunggakan.toLocaleString('id-ID')}</td>
                <td className="border border-black px-3 py-2 text-center">{row.lunas_count} Siswa</td>
                <td className="border border-black px-3 py-2 text-center">{row.belum_count} Siswa</td>
              </tr>
            ))}
            {data.summaryPerClass.length === 0 && (
              <tr>
                <td colSpan={7} className="border border-black px-3 py-4 text-center">Tidak ada data untuk periode ini</td>
              </tr>
            )}
          </tbody>
        </table>
      ) : (
        // Table for Specific Class (Student Details)
        <table className="w-full border-collapse border border-black mb-8">
          <thead className="bg-slate-100">
            <tr>
              <th className="border border-black px-3 py-2 text-center w-12">No</th>
              <th className="border border-black px-3 py-2 text-left">NISN</th>
              <th className="border border-black px-3 py-2 text-left">Nama Siswa</th>
              <th className="border border-black px-3 py-2 text-right">Tagihan</th>
              <th className="border border-black px-3 py-2 text-right">Terbayar</th>
              <th className="border border-black px-3 py-2 text-right">Tunggakan</th>
              <th className="border border-black px-3 py-2 text-center">Status</th>
            </tr>
          </thead>
          <tbody>
            {data.studentRows.map((student, idx) => (
              <tr key={idx}>
                <td className="border border-black px-3 py-2 text-center">{idx + 1}</td>
                <td className="border border-black px-3 py-2">{student.nis}</td>
                <td className="border border-black px-3 py-2 font-medium">{student.name}</td>
                <td className="border border-black px-3 py-2 text-right">Rp {student.tagihan.toLocaleString('id-ID')}</td>
                <td className="border border-black px-3 py-2 text-right">Rp {student.terbayar.toLocaleString('id-ID')}</td>
                <td className="border border-black px-3 py-2 text-right">Rp {student.tunggakan.toLocaleString('id-ID')}</td>
                <td className="border border-black px-3 py-2 text-center">{student.status}</td>
              </tr>
            ))}
            {data.studentRows.length === 0 && (
              <tr>
                <td colSpan={7} className="border border-black px-3 py-4 text-center">Tidak ada data untuk kelas ini</td>
              </tr>
            )}
          </tbody>
        </table>
      )}

      {/* Footer Tanda Tangan */}
      <div className="flex justify-end mt-12">
        <div className="text-center">
          <p className="mb-16">Babelan, {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
          <p className="font-bold underline">Tata Usaha MI Attaqwa 15</p>
        </div>
      </div>
      
      {/* Hide print button in print dialog but show it on screen if auto-print was closed */}
      <div className="mt-10 text-center print:hidden">
        <button 
          onClick={() => window.print()} 
          className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium"
        >
          Cetak Ulang
        </button>
      </div>
    </div>
  );
}

export default function InfaqPrintSummaryPage() {
  return (
    <Suspense fallback={<div className="p-10 text-center">Memuat Halaman...</div>}>
      <InfaqPrintSummaryContent />
    </Suspense>
  );
}
