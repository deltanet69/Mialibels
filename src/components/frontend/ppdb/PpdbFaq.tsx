'use client';

import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';

const FAQS = [
  {
    q: 'Apakah ada tes masuk?',
    a: (
      <>
        Tidak ada tes baca, tulis, dan hitung. Seleksi dilakukan berdasarkan:
        <ul className="list-disc pl-5 mt-2 space-y-1 text-gray-600">
          <li>Verifikasi dokumen</li>
          <li>Wawancara dengan orang tua</li>
          <li>Hafalan surat pendek (jika ada)</li>
        </ul>
      </>
    )
  },
  {
    q: 'Apakah boleh mendaftar jika belum berusia 6 tahun?',
    a: 'Boleh, jika usia minimal 5 tahun 6 bulan dan memiliki rekomendasi psikolog profesional yang menyatakan potensi kecerdasan istimewa.'
  },
  {
    q: 'Apakah ada beasiswa?',
    a: 'Tersedia jalur afirmasi untuk keluarga ekonomi tidak mampu dengan kuota minimal 15% dari daya tampung.'
  },
  {
    q: 'Bagaimana sistem pembayaran SPP?',
    a: 'SPP dibayar setiap bulan via transfer bank atau tunai di Tata Usaha (TU). Detail sistem pembayaran akan diinformasikan lebih lanjut setelah siswa diterima.'
  },
  {
    q: 'Kapan pengumuman kelulusan PPDB?',
    a: 'Pengumuman dilaksanakan pada tanggal 10 Agustus 2027 melalui website sekolah dan papan pengumuman madrasah.'
  },
  {
    q: 'Apakah MI Attaqwa 15 menerima siswa pindahan?',
    a: 'Menerima sesuai dengan kebijakan dan kuota bangku kosong yang tersedia. Silakan hubungi panitia PPDB untuk informasi lebih lanjut terkait pindahan.'
  }
];

export default function PpdbFaq() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggleFaq = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section className="py-20 bg-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="text-center mb-16">
          <h2 className="font-headline font-bold text-3xl md:text-4xl text-secondary mb-4">
            Pertanyaan Umum <span className="text-primary">(FAQ)</span>
          </h2>
          <p className="font-body text-gray-600 text-lg">
            Berikut adalah jawaban atas pertanyaan yang sering diajukan terkait proses PPDB.
          </p>
        </div>

        <div className="space-y-4">
          {FAQS.map((faq, idx) => {
            const isOpen = openIndex === idx;
            return (
              <div 
                key={idx} 
                className={`border rounded-2xl transition-all duration-300 overflow-hidden ${
                  isOpen ? 'border-primary bg-blue-50/30 shadow-md' : 'border-gray-200 bg-white hover:border-blue-300 hover:shadow-sm'
                }`}
              >
                <button
                  onClick={() => toggleFaq(idx)}
                  className="w-full flex items-center justify-between p-5 md:p-6 text-left focus:outline-none"
                >
                  <span className={`font-headline font-bold text-base md:text-lg pr-4 ${isOpen ? 'text-primary' : 'text-secondary'}`}>
                    {faq.q}
                  </span>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-transform duration-300 ${isOpen ? 'bg-primary text-white rotate-180' : 'bg-gray-100 text-gray-400'}`}>
                    <ChevronDown className="w-5 h-5" />
                  </div>
                </button>
                <div 
                  className={`px-5 md:px-6 overflow-hidden transition-all duration-300 ease-in-out ${
                    isOpen ? 'max-h-96 pb-6 opacity-100' : 'max-h-0 pb-0 opacity-0'
                  }`}
                >
                  <div className="font-body text-gray-600 leading-relaxed pt-2 border-t border-gray-100">
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
