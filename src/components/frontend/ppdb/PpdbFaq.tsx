'use client';

import React, { useState } from 'react';
import { ChevronDown, HelpCircle, Sparkles } from 'lucide-react';

const FAQS = [
  {
    q: 'Apakah ada tes baca, tulis, dan hitung (Calistung) saat masuk?',
    a: (
      <>
        Tidak ada tes calistung formal yang memberatkan. Seleksi dilakukan secara ramah anak melalui:
        <ul className="list-disc pl-5 mt-2 space-y-1 text-gray-600 text-sm">
          <li>Verifikasi berkas dan usia calon siswa</li>
          <li>Wawancara santai dan pemetaan kesiapan belajar</li>
          <li>Hafalan doa atau surat pendek Al-Qur'an (jika sudah bisa)</li>
        </ul>
      </>
    )
  },
  {
    q: 'Apakah boleh mendaftar jika belum genap berusia 6 tahun?',
    a: 'Bisa dipertimbangkan jika calon siswa berusia minimal 5 tahun 6 bulan per 1 Juli 2027 dan memiliki surat rekomendasi dari psikolog atau kesiapan khusus.'
  },
  {
    q: 'Apakah tersedia beasiswa atau potongan biaya?',
    a: 'Tersedia jalur afirmasi bagi keluarga yang membutuhkan dan beasiswa prestasi hafalan Al-Qur\'an sesuai kuota yang dialokasikan.'
  },
  {
    q: 'Bagaimana metode dan skema pembayaran biaya sekolah?',
    a: 'Pembayaran dapat dilakukan melalui transfer virtual account bank atau langsung di bagian Tata Usaha (TU) madrasah secara transparan.'
  },
  {
    q: 'Kapan pengumuman hasil penerimaan PPDB?',
    a: 'Pengumuman hasil seleksi dipublikasikan pada tanggal 10 Agustus 2027 secara online melalui website dan papan informasi madrasah.'
  },
  {
    q: 'Apakah MI Attaqwa 15 menerima siswa mutasi / pindahan?',
    a: 'Menerima siswa pindahan selama daya tampung kelas yang dituju masih mencukupi. Silakan berkonsultasi langsung dengan panitia PPDB.'
  }
];

export default function PpdbFaq() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggleFaq = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section className="py-20 lg:py-24 bg-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-teal-50 border border-teal-100 text-primary-dark font-body text-xs font-bold uppercase tracking-wider mb-4">
            <HelpCircle className="w-3.5 h-3.5 text-accent" />
            <span>Tanya Jawab</span>
          </div>
          <h2 className="font-headline font-black text-3xl md:text-4xl text-secondary mb-4">
            PERTANYAAN UMUM (FAQ)
          </h2>
          <p className="font-body text-gray-500 text-base sm:text-lg">
            Jawaban lengkap atas pertanyaan yang sering diajukan calon wali murid seputar PPDB.
          </p>
        </div>

        <div className="space-y-3.5">
          {FAQS.map((faq, idx) => {
            const isOpen = openIndex === idx;
            return (
              <div 
                key={idx} 
                className={`border rounded-2xl sm:rounded-3xl transition-all duration-300 overflow-hidden ${
                  isOpen ? 'border-primary bg-teal-50/20 shadow-md' : 'border-gray-200/80 bg-white hover:border-teal-200 hover:shadow-2xs'
                }`}
              >
                <button
                  onClick={() => toggleFaq(idx)}
                  className="w-full flex items-center justify-between p-5 md:p-6 text-left focus:outline-none"
                >
                  <span className={`font-headline font-bold text-base md:text-lg pr-4 ${isOpen ? 'text-primary' : 'text-secondary'}`}>
                    {faq.q}
                  </span>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-transform duration-300 ${isOpen ? 'bg-primary text-white rotate-180' : 'bg-slate-100 text-gray-400'}`}>
                    <ChevronDown className="w-4 h-4" />
                  </div>
                </button>
                <div 
                  className={`px-5 md:px-6 overflow-hidden transition-all duration-300 ease-in-out ${
                    isOpen ? 'max-h-96 pb-6 opacity-100' : 'max-h-0 pb-0 opacity-0'
                  }`}
                >
                  <div className="font-body text-gray-600 text-sm sm:text-base leading-relaxed pt-3 border-t border-gray-100">
                    {faq.a}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}
