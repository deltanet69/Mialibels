'use client';

import React from 'react';
import { FileEdit, CreditCard, UserCheck, FileCheck2, BookOpen, ArrowRight } from 'lucide-react';

const STEPS = [
  {
    step: '01',
    title: 'Isi Formulir Online',
    description: 'Lengkapi identitas calon siswa (usia min. 6 th 5 bln per 1 Juli 2027) dan data lengkap orang tua/wali melalui portal SPMB.',
    icon: FileEdit,
    badgeColor: 'bg-blue-600 text-white',
    cardBg: 'bg-blue-50/40 border-blue-100 hover:border-blue-300',
    iconColor: 'text-blue-600',
    iconBg: 'bg-blue-100/70 border-blue-200'
  },
  {
    step: '02',
    title: 'Transfer & Upload Struk',
    description: 'Transfer biaya formulir Rp 300.000 ke Bank BTN (00129-01-30-00015-9 a.n MI ATTAQWA 15 BABELAN) / QRIS dan unggah bukti transfer.',
    icon: CreditCard,
    badgeColor: 'bg-amber-500 text-white',
    cardBg: 'bg-amber-50/40 border-amber-100 hover:border-amber-300',
    iconColor: 'text-amber-600',
    iconBg: 'bg-amber-100/70 border-amber-200'
  },
  {
    step: '03',
    title: 'Verifikasi Berkas Siswa',
    description: 'Panitia memverifikasi berkas pembayaran & menjadwalkan wawancara orang tua serta pemetaan karakter anak.',
    icon: UserCheck,
    badgeColor: 'bg-emerald-600 text-white',
    cardBg: 'bg-emerald-50/40 border-emerald-100 hover:border-emerald-300',
    iconColor: 'text-emerald-600',
    iconBg: 'bg-emerald-100/70 border-emerald-200'
  },
  {
    step: '04',
    title: 'Daftar Ulang & Berkas',
    description: 'Setelah disetujui (Approved), serahkan dokumen fisik (Akta, KK, KTP, Pas Foto) untuk konfirmasi kursi & pengukuran seragam.',
    icon: FileCheck2,
    badgeColor: 'bg-indigo-600 text-white',
    cardBg: 'bg-indigo-50/40 border-indigo-100 hover:border-indigo-300',
    iconColor: 'text-indigo-600',
    iconBg: 'bg-indigo-100/70 border-indigo-200'
  }
];

export default function PpdbWhyChooseUs() {
  const spmbUrl = process.env.NODE_ENV === 'development' ? 'http://spmb.localhost:3000' : '#';

  return (
    <section id="petunjuk-pendaftaran" className="py-14 sm:py-20 lg:py-24 bg-white relative scroll-mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center max-w-4xl mx-auto mb-10 sm:mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-teal-50 border border-teal-100 text-primary-dark font-body text-xs font-bold uppercase tracking-wider mb-3.5 sm:mb-4">
            <BookOpen className="w-3.5 h-3.5 text-accent" />
            <span>Petunjuk Pendaftaran</span>
          </div>
          <h2 className="font-headline font-black text-2xl xs:text-3xl md:text-4xl text-secondary mb-3 sm:mb-4 break-words">
            4 LANGKAH MUDAH PENDAFTARAN SPMB
          </h2>
          <p className="font-body text-gray-500 text-sm sm:text-base md:text-lg px-2 leading-relaxed">
            Panduan lengkap alur sistem penerimaan murid baru MI Attaqwa 15 Babelan secara online dari awal hingga verifikasi berkas.
          </p>
        </div>

        {/* 4 Step Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-4 lg:gap-4">
          {STEPS.map((item, index) => {
            const Icon = item.icon;
            return (
              <div 
                key={index} 
                className={`relative flex flex-col justify-between p-4 sm:p-6 rounded-2xl sm:rounded-[2rem] bg-white border shadow-sm hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 group ${item.cardBg}`}
              >
                <div>
                  {/* Step Badge & Icon Header */}
                  <div className="flex items-center justify-between mb-5">
                    <span className={`font-headline font-black text-xs px-3 py-1 rounded-full shadow-2xs ${item.badgeColor}`}>
                      LANGKAH {item.step}
                    </span>
                  </div>

                  {/* Title & Description */}
                  <h3 className="font-headline font-bold text-lg sm:text-xl text-secondary mb-2.5 group-hover:text-primary transition-colors">
                    {item.title}
                  </h3>
                  <p className="font-body text-gray-600 leading-relaxed text-xs sm:text-sm">
                    {item.description}
                  </p>
                </div>

                {/* Bottom Step Indicator */}
                <div className="mt-6 pt-3.5 border-t border-slate-200/60 flex items-center justify-between text-xs font-semibold text-gray-400">
                  <span>Tahap {index + 1} dari 4</span>
                  <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-300 text-primary" />
                </div>
              </div>
            );
          })}
        </div>

        {/* Direct Link Banner */}
        <div className="mt-10 sm:mt-12 p-6 sm:p-8 rounded-2xl sm:rounded-3xl bg-gradient-to-r from-[#002957] to-[#004d40] text-white flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl">
          <div className="text-center sm:text-left">
            <h4 className="font-headline font-bold text-lg sm:text-xl text-white mb-1">
              Siap Mendaftarkan Putra-Putri Anda?
            </h4>
            <p className="font-body text-xs sm:text-sm text-teal-100">
              Isi formulir SPMB online sekarang dalam waktu kurang dari 5 menit.
            </p>
          </div>
          <a
            href={spmbUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-tactile inline-flex items-center justify-center gap-2 px-7 py-3 rounded-full font-body text-xs sm:text-sm font-bold bg-btn-secondary text-white shadow-md hover:brightness-110 transition-all shrink-0 w-full sm:w-auto"
          >
            <span>Buka Formulir Pendaftaran</span>
            <ArrowRight className="w-4 h-4" />
          </a>
        </div>

      </div>
    </section>
  );
}
