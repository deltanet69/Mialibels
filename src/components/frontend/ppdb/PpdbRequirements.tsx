'use client';

import React from 'react';
import { CheckCircle2, FileText, UserCheck, Sparkles } from 'lucide-react';

const SYARAT_UMUM = [
  'Usia minimal 6 tahun per 1 Juli 2027 (calon siswa kelas 1)',
  'Beragama Islam & siap mengikuti pembiasaan ibadah',
  'Sehat jasmani dan rohani (surat keterangan sehat)',
  'Berkomitmen mematuhi tata tertib dan tata krama madrasah'
];

const BERKAS_PENDAFTARAN = [
  { nama: 'Fotokopi Akta Kelahiran', ket: '2 lembar' },
  { nama: 'Fotokopi KK (Kartu Keluarga)', ket: '2 lembar' },
  { nama: 'Fotokopi KTP Orang Tua/Wali', ket: '2 lembar (Ayah & Ibu)' },
  { nama: 'Pas Foto Siswa 3x4', ket: '4 lembar (Background Merah)' },
  { nama: 'Surat Keterangan Sehat', ket: 'Dari Dokter / Puskesmas' },
  { nama: 'Ijazah / SKHU RA/TK', ket: 'Jika ada (Lulusan RA/TK)' }
];

export default function PpdbRequirements() {
  return (
    <section className="py-20 lg:py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-teal-50 border border-teal-100 text-primary-dark font-body text-xs font-bold uppercase tracking-wider mb-4">
            <Sparkles className="w-3.5 h-3.5 text-accent" />
            <span>Dokumen & Ketentuan</span>
          </div>
          <h2 className="font-headline font-black text-3xl md:text-4xl text-secondary mb-4">
            SYARAT &amp; BERKAS PENDAFTARAN
          </h2>
          <p className="font-body text-gray-500 text-base sm:text-lg">
            Persiapkan persyaratan dan berkas administrasi berikut untuk proses verifikasi data calon siswa.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-10">
          
          {/* Syarat Umum */}
          <div className="bg-[#F4F7FC] rounded-[2.5rem] p-8 md:p-10 border border-gray-100/90 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-3.5 mb-8">
                <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-2xs border border-gray-100 text-teal-700">
                  <UserCheck className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-headline font-black text-2xl text-secondary">
                    Syarat Umum Calon Siswa
                  </h3>
                  <span className="font-body text-xs text-gray-400">Kriteria penerimaan peserta didik baru</span>
                </div>
              </div>
              
              <ul className="space-y-4">
                {SYARAT_UMUM.map((syarat, idx) => (
                  <li key={idx} className="flex items-start gap-3.5 bg-white p-4 rounded-2xl border border-gray-100/80 shadow-2xs">
                    <CheckCircle2 className="w-5 h-5 text-teal-600 shrink-0 mt-0.5" />
                    <span className="font-body text-gray-700 text-sm sm:text-base leading-relaxed font-semibold">
                      {syarat}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Berkas Pendaftaran */}
          <div className="bg-white rounded-[2.5rem] p-8 md:p-10 border border-gray-100 shadow-xl shadow-slate-900/5 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-3.5 mb-8">
                <div className="w-12 h-12 bg-orange-50 rounded-2xl flex items-center justify-center border border-orange-100 text-btn-secondary">
                  <FileText className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-headline font-black text-2xl text-secondary">
                    Kelengkapan Berkas Fisik
                  </h3>
                  <span className="font-body text-xs text-gray-400">Dokumen yang diserahkan saat daftar ulang</span>
                </div>
              </div>
              
              <div className="space-y-3">
                {BERKAS_PENDAFTARAN.map((berkas, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3.5 rounded-2xl border border-gray-100 bg-slate-50/70 hover:bg-white hover:shadow-sm transition-all duration-300">
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-full bg-white flex items-center justify-center font-bold text-xs text-secondary border border-gray-200 shadow-2xs">
                        {idx + 1}
                      </div>
                      <span className="font-headline font-semibold text-gray-800 text-sm">
                        {berkas.nama}
                      </span>
                    </div>
                    <span className="text-xs font-bold text-teal-800 bg-teal-50 border border-teal-100 px-3 py-1 rounded-full whitespace-nowrap">
                      {berkas.ket}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
