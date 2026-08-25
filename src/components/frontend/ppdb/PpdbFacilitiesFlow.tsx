'use client';

import React from 'react';
import { Building2, Monitor, Book, Map, Coffee, Smile, ChevronRight, Sparkles, CheckCircle2 } from 'lucide-react';

const FASILITAS = [
  { nama: 'Ruang Kelas Representatif', icon: Building2 },
  { nama: 'Laboratorium Komputer & IT', icon: Monitor },
  { nama: 'Perpustakaan Mini Sekolah', icon: Book },
  { nama: 'Mushola & Tempat Ibadah', icon: Building2 },
  { nama: 'Lapangan Olahraga & Upacara', icon: Map },
  { nama: 'Kantin Sehat & Higienis', icon: Coffee },
  { nama: 'Area Bermain Ramah Anak', icon: Smile },
];

const ALUR = [
  { step: 'Pendaftaran Online / Datang Langsung', desc: 'Isi formulir pendaftaran dan serahkan berkas administrasi.' },
  { step: 'Verifikasi Berkas & Observasi Siswa', desc: 'Wawancara orang tua dan pemetaan minat serta karakter anak.' },
  { step: 'Pengumuman Hasil Seleksi', desc: 'Diumumkan secara transparan di website resmi madrasah.' },
  { step: 'Daftar Ulang & Administrasi', desc: 'Konfirmasi kursi, pembayaran administrasi & seragam.' },
  { step: 'Masa Ta\'aruf Siswa Madrasah (MATSAMA)', desc: 'Pengenalan lingkungan madrasah, guru, dan teman baru.' },
  { step: 'Hari Pertama Masuk Pembelajaran', desc: 'Memulai masa belajar ceria di MI Attaqwa 15 Babelan.' }
];

export default function PpdbFacilitiesFlow() {
  return (
    <section className="py-20 lg:py-24 bg-[#F4F7FC]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-14 items-start">
          
          {/* Fasilitas Pendukung */}
          <div className="lg:col-span-5 sticky top-28">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-teal-50 border border-teal-100 text-primary-dark font-body text-xs font-bold uppercase tracking-wider mb-4">
              <Sparkles className="w-3.5 h-3.5 text-accent" />
              <span>Sarana & Prasarana</span>
            </div>
            <h2 className="font-headline font-black text-3xl md:text-4xl text-secondary mb-4">
              FASILITAS PENDUKUNG
            </h2>
            <p className="font-body text-gray-500 mb-8 text-sm sm:text-base leading-relaxed">
              MI Attaqwa 15 Babelan menyediakan sarana prasarana yang aman, nyaman, dan memadai untuk menunjang tumbuh kembang siswa.
            </p>

            <div className="flex flex-wrap gap-2.5">
              {FASILITAS.map((fasilitas, idx) => {
                const Icon = fasilitas.icon;
                return (
                  <div key={idx} className="flex items-center gap-2.5 bg-white px-4 py-3 rounded-2xl shadow-2xs border border-gray-100/90 transition-all hover:-translate-y-0.5 hover:border-teal-200">
                    <Icon className="w-4 h-4 text-primary" />
                    <span className="font-headline font-semibold text-gray-700 text-xs sm:text-sm">{fasilitas.nama}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Alur Pendaftaran */}
          <div id="alur-pendaftaran" className="lg:col-span-7 bg-white rounded-[2.5rem] p-8 md:p-10 shadow-xl shadow-slate-900/5 border border-gray-100">
            <div className="flex items-center justify-between mb-8">
              <h3 className="font-headline font-black text-2xl text-secondary">
                Alur Tahapan Pendaftaran
              </h3>
              <span className="font-body text-xs font-bold text-teal-800 bg-teal-50 px-3 py-1 rounded-full border border-teal-100">
                6 Langkah Mudah
              </span>
            </div>
            
            <div className="space-y-4 relative">
              {ALUR.map((item, idx) => (
                <div key={idx} className="relative flex items-start gap-4 group">
                  <div className="w-9 h-9 rounded-2xl bg-teal-50 border border-teal-200 flex items-center justify-center font-headline font-black text-sm text-teal-800 shrink-0 mt-1 group-hover:bg-primary group-hover:text-white group-hover:border-primary transition-all shadow-2xs">
                    {idx + 1}
                  </div>
                  <div className="flex-1 bg-slate-50/70 border border-gray-100 p-4 rounded-2xl group-hover:border-teal-200 group-hover:bg-white group-hover:shadow-sm transition-all">
                    <h4 className="font-headline font-bold text-secondary text-sm md:text-base">
                      {item.step}
                    </h4>
                    <p className="font-body text-gray-500 text-xs sm:text-sm mt-1 leading-relaxed">
                      {item.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
