'use client';

import React from 'react';
import { Calendar, CheckCircle2 } from 'lucide-react';

const SCHEDULE = [
  {
    phase: 'Pendaftaran Dibuka',
    date: '1 Juli 2027',
    desc: 'Pendaftaran online & offline',
  },
  {
    phase: 'Pendaftaran Ditutup',
    date: '31 Juli 2027',
    desc: 'Batas akhir pengumpulan berkas',
  },
  {
    phase: 'Seleksi',
    date: '1 - 5 Agustus 2027',
    desc: 'Seleksi administrasi & wawancara',
  },
  {
    phase: 'Pengumuman',
    date: '10 Agustus 2027',
    desc: 'Diumumkan di website & papan pengumuman',
  },
  {
    phase: 'Daftar Ulang',
    date: '11 - 15 Agustus 2027',
    desc: 'Pembayaran & verifikasi berkas',
  },
  {
    phase: 'Masa Pengenalan Madrasah',
    date: '1 - 2 minggu sebelum ajaran baru',
    desc: 'Kegiatan orientasi siswa baru',
  },
  {
    phase: 'Hari Pertama Masuk',
    date: 'Pertengahan Juli 2027',
    desc: 'Awal tahun ajaran baru',
  }
];

export default function PpdbSchedule() {
  return (
    <section className="py-20 bg-[#F8FAFC]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="flex flex-col md:flex-row gap-12 lg:gap-16 items-center">
          
          {/* Text Area */}
          <div className="w-full md:w-1/3 flex flex-col items-center md:items-start text-center md:text-left">
            <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mb-6">
              <Calendar className="w-8 h-8 text-primary" />
            </div>
            <h2 className="font-headline font-bold text-3xl md:text-4xl text-secondary mb-4">
              Jadwal PPDB <span className="text-primary block mt-1">2027/2028</span>
            </h2>
            <p className="font-body text-gray-600 leading-relaxed">
              Catat tanggal-tanggal penting berikut agar Anda tidak tertinggal setiap tahapan pendaftaran penerimaan peserta didik baru MI Attaqwa 15 Babelan.
            </p>
          </div>

          {/* Timeline Area */}
          <div className="w-full md:w-2/3">
            <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-gray-100">
              <div className="relative border-l-2 border-blue-100 ml-4 md:ml-6 space-y-8">
                {SCHEDULE.map((item, index) => (
                  <div key={index} className="relative pl-8 md:pl-10 group">
                    {/* Bullet point */}
                    <div className="absolute -left-[11px] top-1 w-5 h-5 rounded-full bg-white border-4 border-blue-200 group-hover:border-primary transition-colors duration-300" />
                    
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 sm:gap-6">
                      <div>
                        <h4 className="font-headline font-bold text-lg text-secondary">
                          {item.phase}
                        </h4>
                        <p className="font-body text-gray-500 text-sm mt-1">
                          {item.desc}
                        </p>
                      </div>
                      <div className="sm:text-right shrink-0">
                        <span className="inline-flex items-center px-3 py-1.5 rounded-lg bg-blue-50 text-primary font-semibold text-sm">
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
