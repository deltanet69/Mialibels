'use client';

import React from 'react';
import { Building2, Monitor, Book, Map, Coffee, Smile, ChevronRight } from 'lucide-react';

const FASILITAS = [
  { nama: 'Ruang Kelas Nyaman', icon: Building2 },
  { nama: 'Laboratorium Komputer', icon: Monitor },
  { nama: 'Perpustakaan Mini', icon: Book },
  { nama: 'Masjid Jami', icon: Building2 },
  { nama: 'Lapangan Olahraga', icon: Map },
  { nama: 'Kantin Bersih', icon: Coffee },
  { nama: 'Area Bermain Aman', icon: Smile },
];

const ALUR = [
  'Pendaftaran (Online/Offline)',
  'Verifikasi Berkas oleh Panitia',
  'Pengumuman Hasil Seleksi',
  'Daftar Ulang (Pembayaran)',
  'Masa Pengenalan Madrasah',
  'Hari Pertama Masuk Sekolah'
];

export default function PpdbFacilitiesFlow() {
  return (
    <section className="py-20 bg-[#F8FAFC]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
          
          {/* Fasilitas Pendukung */}
          <div>
            <h2 className="font-headline font-bold text-3xl md:text-4xl text-secondary mb-4">
              Fasilitas <span className="text-primary">Pendukung</span>
            </h2>
            <p className="font-body text-gray-600 mb-10">
              MI Attaqwa 15 Babelan menyediakan berbagai fasilitas pendukung untuk menunjang kenyamanan dan kelancaran proses kegiatan belajar mengajar.
            </p>

            <div className="flex flex-wrap gap-4">
              {FASILITAS.map((fasilitas, idx) => {
                const Icon = fasilitas.icon;
                return (
                  <div key={idx} className="flex items-center gap-3 bg-white px-5 py-3 rounded-2xl shadow-sm border border-gray-100 transition-transform hover:-translate-y-1">
                    <Icon className="w-5 h-5 text-primary" />
                    <span className="font-headline font-semibold text-gray-700 text-sm">{fasilitas.nama}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Alur Pendaftaran */}
          <div id="alur-pendaftaran" className="bg-white rounded-3xl p-8 md:p-10 shadow-xl border border-gray-100">
            <h3 className="font-headline font-bold text-2xl text-secondary mb-8 text-center">
              Alur Pendaftaran
            </h3>
            
            <div className="space-y-4 relative">
              <div className="absolute left-[1.15rem] top-4 bottom-4 w-0.5 bg-blue-100 hidden sm:block" />
              
              {ALUR.map((step, idx) => (
                <div key={idx} className="relative flex items-center gap-4 group">
                  <div className="w-10 h-10 rounded-full bg-blue-50 border-2 border-blue-200 flex items-center justify-center font-bold text-primary shrink-0 z-10 group-hover:bg-primary group-hover:text-white group-hover:border-primary transition-colors">
                    {idx + 1}
                  </div>
                  <div className="flex-1 bg-gray-50 border border-gray-100 px-5 py-4 rounded-2xl group-hover:border-blue-200 group-hover:bg-blue-50/50 transition-colors flex items-center justify-between">
                    <span className="font-headline font-semibold text-gray-800 text-sm md:text-base">
                      {step}
                    </span>
                    {idx !== ALUR.length - 1 && (
                      <ChevronRight className="w-5 h-5 text-gray-300 sm:hidden" />
                    )}
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
