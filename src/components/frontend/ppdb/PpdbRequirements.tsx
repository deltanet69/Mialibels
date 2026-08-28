'use client';

import React from 'react';
import { CheckCircle2, FileText, UserCheck, Sparkles, CreditCard, HeartHandshake, ShieldCheck, Info, FileCheck } from 'lucide-react';

const SYARAT_ITEMS = [
  {
    title: 'Batas Usia Minimal',
    highlight: '6 Tahun 5 Bulan',
    desc: 'Calon murid baru kelas 1 MI wajib berusia minimal 6 tahun 5 bulan terhitung per tanggal 1 Juli 2027.',
    icon: UserCheck,
    color: 'text-teal-600',
    bg: 'bg-teal-50 border-teal-100'
  },
  {
    title: 'Biaya Pendaftaran',
    highlight: 'Rp 300.000',
    desc: 'Membayar biaya formulir & tes observasi via transfer Bank BTN (00129-01-30-00015-9 a.n MI ATTAQWA 15 BABELAN) / QRIS.',
    icon: CreditCard,
    color: 'text-amber-600',
    bg: 'bg-amber-50 border-amber-100'
  },
  {
    title: 'Komitmen Keagamaan',
    highlight: 'Pembiasaan Ibadah',
    desc: 'Beragama Islam dan berkomitmen mengikuti shalat dhuha/dzuhur berjamaah, tahfidz Juz 30, serta pembinaan adab santri.',
    icon: HeartHandshake,
    color: 'text-emerald-600',
    bg: 'bg-emerald-50 border-emerald-100'
  },
  {
    title: 'Kepatuhan Tata Tertib',
    highlight: 'Karakter & Disiplin',
    desc: 'Orang tua dan calon siswa bersedia mematuhi seluruh tata tertib, etika santri, dan tata krama yang berlaku di madrasah.',
    icon: ShieldCheck,
    color: 'text-indigo-600',
    bg: 'bg-indigo-50 border-indigo-100'
  }
];

const BERKAS_ITEMS = [
  { nama: 'Fotokopi Akta Kelahiran', ket: '2 Lembar', detail: 'Legalisir / fotokopi jelas' },
  { nama: 'Fotokopi Kartu Keluarga (KK)', ket: '2 Lembar', detail: 'Update barcode Disdukcapil' },
  { nama: 'Fotokopi KTP Orang Tua / Wali', ket: '2 Lembar', detail: 'KTP Ayah & Ibu (1 Lembar)' },
  { nama: 'Pas Foto Siswa 3x4 Terbaru', ket: '4 Lembar', detail: 'Background Merah rapi' },
  { nama: 'Surat Keterangan Sehat', ket: '1 Berkas', detail: 'Dari Dokter / Puskesmas' },
  { nama: 'Ijazah / SKHU RA / TK', ket: '2 Lembar', detail: 'Bagi lulusan RA / TK (jika ada)' }
];

export default function PpdbRequirements() {
  return (
    <section className="py-14 sm:py-20 lg:py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center max-w-4xl mx-auto mb-10 sm:mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-teal-50 border border-teal-100 text-primary-dark font-body text-xs font-bold uppercase tracking-wider mb-3.5 sm:mb-4">
            <Sparkles className="w-3.5 h-3.5 text-accent" />
            <span>Dokumen &amp; Ketentuan</span>
          </div>
          <h2 className="font-headline font-black text-2xl xs:text-3xl md:text-4xl text-secondary mb-3 sm:mb-4 break-words">
            SYARAT &amp; KELENGKAPAN BERKAS SPMB
          </h2>
          <p className="font-body text-gray-500 text-sm sm:text-base md:text-lg px-2 leading-relaxed">
            Pastikan seluruh kriteria umum dan dokumen fisik calon siswa dipersiapkan dengan lengkap sebelum tahapan verifikasi.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-stretch">
          
          {/* Col 1: Syarat Umum Calon Siswa */}
          <div className="lg:col-span-6 flex flex-col justify-between p-6 sm:p-8 md:p-10 rounded-3xl sm:rounded-[2.5rem] bg-gradient-to-b from-[#F4F7FC] to-white border border-teal-100/80 shadow-md shadow-slate-900/5">
            <div>
              {/* Card Title */}
              <div className="flex items-center gap-3.5 mb-7">
                <div className="w-12 h-12 rounded-2xl bg-teal-600 text-white flex items-center justify-center shadow-md shadow-teal-700/20 shrink-0">
                  <UserCheck className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-headline font-black text-xl sm:text-2xl text-secondary">
                    Syarat Umum Calon Siswa
                  </h3>
                  <p className="font-body text-sm text-gray-600 font-medium">Ketentuan dasar sistem penerimaan murid baru</p>
                </div>
              </div>
              
              {/* 4 Interactive Requirement Cards */}
              <div className="space-y-3.5">
                {SYARAT_ITEMS.map((item, idx) => {
                  const Icon = item.icon;
                  return (
                    <div
                      key={idx}
                      className="p-4 rounded-2xl bg-white border border-gray-100 shadow-2xs hover:shadow-md hover:border-teal-200 transition-all duration-300 flex items-start gap-3.5 group"
                    >
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${item.bg} group-hover:scale-105 transition-transform`}>
                        <Icon className={`w-5 h-5 ${item.color}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 mb-0.5">
                          <h4 className="font-headline font-bold text-md text-secondary group-hover:text-primary transition-colors">
                            {item.title}
                          </h4>
                          <span className="text-[12px] font-extrabold text-teal-800 bg-teal-50 px-2.5 py-0.5 rounded-full border border-teal-100 shrink-0">
                            {item.highlight}
                          </span>
                        </div>
                        <p className="font-body text-gray-500 text-sm leading-relaxed mt-1">
                          {item.desc}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Bottom Accent */}
            <div className="mt-6 pt-4 border-t border-slate-100 flex items-center gap-2 text-xs font-semibold text-teal-700">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>Memenuhi seluruh standar regulasi Kementerian Agama KMA 1503/2025</span>
            </div>
          </div>

          {/* Col 2: Kelengkapan Berkas Fisik */}
          <div className="lg:col-span-6 flex flex-col justify-between p-6 sm:p-8 md:p-10 rounded-3xl sm:rounded-[2.5rem] bg-white border border-gray-100 shadow-xl shadow-slate-900/5">
            <div>
              {/* Card Title */}
              <div className="flex items-center gap-3.5 mb-7">
                <div className="w-12 h-12 rounded-2xl bg-btn-secondary text-white flex items-center justify-center shadow-md shadow-orange-950/20 shrink-0">
                  <FileText className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-headline font-black text-xl sm:text-2xl text-secondary">
                    Kelengkapan Berkas Calon Siswa
                  </h3>
                  <p className="font-body text-sm text-gray-600 font-medium">Diserahkan ke sekretariat saat verifikasi akhir</p>
                </div>
              </div>
              
              {/* 6 Document List Cards */}
              <div className="space-y-2.5">
                {BERKAS_ITEMS.map((berkas, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-2xl border border-gray-100 bg-[#F4F7FC]/70 hover:bg-white hover:border-amber-200 hover:shadow-sm transition-all duration-300 flex items-center justify-between gap-3 group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center font-headline font-black text-base text-secondary border border-gray-200 shadow-2xs shrink-0 group-hover:bg-btn-secondary group-hover:text-white group-hover:border-btn-secondary transition-colors">
                        0{idx + 1}
                      </div>
                      <div className="min-w-0">
                        <span className="font-headline font-bold text-gray-800 text-sm sm:text-sm block truncate group-hover:text-primary transition-colors">
                          {berkas.nama}
                        </span>
                        <span className="font-body text-[14px] text-gray-500 block truncate">
                          {berkas.detail}
                        </span>
                      </div>
                    </div>

                    <span className="text-[11px] sm:text-xs font-extrabold text-emerald-700 bg-emerald-50 border border-emerald-200/80 px-3 py-1 rounded-full shrink-0 shadow-2xs">
                      {berkas.ket}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Bottom Tip Notice */}
            <div className="mt-6 p-3.5 rounded-2xl bg-teal-50/70 border border-teal-100 flex items-start gap-2.5">
              <Info className="w-4 h-4 text-primary shrink-0 mt-0.5" />
              <p className="font-body text-[11px] sm:text-xs text-teal-900 leading-snug">
                <strong>Catatan Penyerahan:</strong> Berkas fisik dimasukkan ke dalam map merah (putra) / hijau (putri) dan dibawa saat verifikasi observasi di sekretariat madrasah.
              </p>
            </div>
          </div>

        </div>

      </div>
    </section>
  );
}
