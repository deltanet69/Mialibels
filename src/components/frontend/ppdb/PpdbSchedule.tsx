'use client';

import React from 'react';
import { Calendar, CheckCircle2, Sparkles } from 'lucide-react';

const SCHEDULE = [
  {
    phase: 'Pendaftaran Dibuka',
    date: '1 Juli 2027',
    desc: 'Pendaftaran online & offline via sekretariat madrasah',
  },
  {
    phase: 'Pendaftaran Ditutup',
    date: '31 Juli 2027',
    desc: 'Batas akhir verifikasi dan pengumpulan berkas fisik',
  },
  {
    phase: 'Seleksi & Observasi',
    date: '1 - 5 Agustus 2027',
    desc: 'Wawancara orang tua & pemetaan gaya belajar siswa',
  },
  {
    phase: 'Pengumuman Hasil',
    date: '10 Agustus 2027',
    desc: 'Diumumkan online via website & papan pengumuman madrasah',
  },
  {
    phase: 'Daftar Ulang & Administrasi',
    date: '11 - 15 Agustus 2027',
    desc: 'Konfirmasi kursi, pembayaran & pengukuran seragam',
  },
  {
    phase: 'Masa Ta\'aruf Siswa Madrasah (MATSAMA)',
    date: 'Awal Tahun Ajaran',
    desc: 'Kegiatan pengenalan lingkungan dan adab madrasah',
  }
];

export default function PpdbSchedule() {
  return (
    <section className="py-20 lg:py-24 bg-[#F4F7FC]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="flex flex-col md:flex-row gap-12 lg:gap-16 items-start">
          
          {/* Text Area */}
          <div className="w-full md:w-1/3 flex flex-col items-center md:items-start text-center md:text-left sticky top-28">
            <div className="w-14 h-14 bg-teal-50 border border-teal-100 rounded-2xl flex items-center justify-center mb-6 shadow-2xs">
              <Calendar className="w-7 h-7 text-primary" />
            </div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-50 border border-teal-100 text-primary-dark font-body text-xs font-bold uppercase tracking-wider mb-3">
              <Sparkles className="w-3 h-3 text-accent" />
              <span>Timeline PPDB</span>
            </div>
            <h2 className="font-headline font-black text-3xl md:text-4xl text-secondary mb-4">
              JADWAL PPDB <span className="text-primary block mt-1">2027/2028</span>
            </h2>
            <p className="font-body text-gray-500 leading-relaxed text-sm sm:text-base">
              Catat tanggal-tanggal penting agar tidak tertinggal tahapan pendaftaran penerimaan murid baru MI Attaqwa 15 Babelan.
            </p>
          </div>

          {/* Timeline Area */}
          <div className="w-full md:w-2/3">
            <div className="bg-white rounded-[2rem] p-6 md:p-8 shadow-sm border border-gray-100">
              <div className="relative border-l-2 border-teal-100 ml-4 md:ml-6 space-y-7">
                {SCHEDULE.map((item, index) => (
                  <div key={index} className="relative pl-8 md:pl-10 group">
                    {/* Bullet point */}
                    <div className="absolute -left-[11px] top-1 w-5 h-5 rounded-full bg-white border-4 border-teal-200 group-hover:border-primary transition-colors duration-300 shadow-2xs" />
                    
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 sm:gap-6">
                      <div>
                        <h4 className="font-headline font-bold text-lg text-secondary group-hover:text-primary transition-colors">
                          {item.phase}
                        </h4>
                        <p className="font-body text-gray-500 text-sm mt-1 leading-relaxed">
                          {item.desc}
                        </p>
                      </div>
                      <div className="sm:text-right shrink-0">
                        <span className="inline-flex items-center px-3.5 py-1.5 rounded-full bg-teal-50 border border-teal-100 text-teal-800 font-bold text-xs">
                          {item.date}
                        </span>
                      </div>
                    </div>
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
