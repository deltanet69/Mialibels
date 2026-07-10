'use client';

import React from 'react';
import { CheckCircle2, FileText, UserCheck } from 'lucide-react';

const SYARAT_UMUM = [
  'Usia minimal 6 tahun per 1 Juli 2027 (calon siswa kelas 1)',
  'Beragama Islam',
  'Sehat jasmani dan rohani (surat keterangan sehat dari dokter)',
  'Bersedia mengikuti seluruh kegiatan madrasah (termasuk pembiasaan ibadah)'
];

const BERKAS_PENDAFTARAN = [
  { nama: 'Fotokopi Akta Kelahiran', ket: '2 lembar, legalisir' },
  { nama: 'Fotokopi KK (Kartu Keluarga)', ket: '2 lembar' },
  { nama: 'Fotokopi KTP Orang Tua/Wali', ket: '2 lembar (Ayah & Ibu)' },
  { nama: 'Pas Foto 3x4', ket: '4 lembar (background merah)' },
  { nama: 'Surat Keterangan Sehat', ket: 'Dari dokter/puskesmas' },
  { nama: 'Surat Keterangan Tidak Mampu', ket: 'Jika ada (dari kelurahan)' },
  { nama: 'Ijazah / SKHU RA/TK', ket: 'Jika lulus RA/TK' }
];

export default function PpdbRequirements() {
  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="font-headline font-bold text-3xl md:text-4xl text-secondary mb-4">
            Syarat & Berkas <span className="text-primary">Pendaftaran</span>
          </h2>
          <p className="font-body text-gray-600 text-lg">
            Persiapkan persyaratan dan berkas-berkas berikut ini untuk mendaftarkan putra-putri Anda.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
          
          {/* Syarat Umum */}
          <div className="bg-[#EFF3FB] rounded-3xl p-8 md:p-10 border border-blue-50">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm">
                <UserCheck className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-headline font-bold text-2xl text-secondary">
                Syarat Umum
              </h3>
            </div>
            
            <ul className="space-y-4">
              {SYARAT_UMUM.map((syarat, idx) => (
                <li key={idx} className="flex items-start gap-3">
                  <CheckCircle2 className="w-6 h-6 text-emerald-500 shrink-0 mt-0.5" />
                  <span className="font-body text-gray-700 leading-relaxed font-medium">
                    {syarat}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* Berkas Pendaftaran */}
          <div className="bg-white rounded-3xl p-8 md:p-10 border border-gray-100 shadow-xl shadow-blue-900/5">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center border border-blue-100">
                <FileText className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-headline font-bold text-2xl text-secondary">
                Berkas Pendaftaran
              </h3>
            </div>
            
            <div className="space-y-4">
              {BERKAS_PENDAFTARAN.map((berkas, idx) => (
                <div key={idx} className="flex items-center justify-between p-4 rounded-2xl border border-gray-100 bg-gray-50/50 hover:bg-white hover:shadow-md transition-all duration-300">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center font-bold text-sm text-gray-500 border border-gray-200">
                      {idx + 1}
                    </div>
                    <span className="font-headline font-semibold text-gray-800">
                      {berkas.nama}
                    </span>
                  </div>
                  <span className="text-xs font-semibold text-primary bg-blue-50 px-3 py-1.5 rounded-full whitespace-nowrap hidden sm:block">
                    {berkas.ket}
                  </span>
                </div>
              ))}
              <div className="mt-4 p-4 rounded-2xl bg-amber-50 border border-amber-100 flex items-start gap-3 sm:hidden">
                <span className="text-sm text-amber-800 font-medium">
                  <strong>Catatan:</strong> Silakan cek di desktop untuk melihat detail jumlah rangkap tiap berkas.
                </span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
