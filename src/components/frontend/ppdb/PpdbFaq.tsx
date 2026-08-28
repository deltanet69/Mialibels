'use client';

import React, { useState } from 'react';
import { ChevronDown, HelpCircle, Sparkles, MessageCircle, Phone, ArrowRight } from 'lucide-react';

const FAQS = [
  {
    q: 'Kapan pendaftaran SPMB dibuka dan berapa kuotanya?',
    a: 'Pendaftaran dibuka dalam satu gelombang resmi mulai Bulan Oktober hingga kuota 120 siswa baru (4 rombongan belajar @ 30 siswa) terpenuhi. Pendaftaran akan otomatis ditutup lebih awal bila kuota telah terverifikasi penuh.'
  },
  {
    q: 'Berapa batas usia minimum calon siswa kelas 1 MI?',
    a: 'Sesuai ketentuan Kementerian Agama dan regulasi madrasah, calon siswa wajib berusia minimal 6 tahun 5 bulan terhitung per tanggal 1 Juli tahun ajaran baru 2027.'
  },
  {
    q: 'Berapa biaya pendaftaran formulir dan bagaimana cara pembayarannya?',
    a: 'Biaya formulir pendaftaran dan tes observasi adalah sebesar Rp 300.000. Pembayaran dapat ditransfer ke rekening resmi Bank BTN: 00129-01-30-00015-9 (a.n MI ATTAQWA 15 BABELAN) atau melalui QRIS resmi, kemudian unggah bukti struk transfer di formulir online.'
  },
  {
    q: 'Bagaimana cara mengetahui status kelulusan & verifikasi?',
    a: 'Anda dapat mengecek status pendaftaran secara realtime melalui menu "Cek Status & Berkas" atau di dalam Parent Portal. Sistem juga otomatis mengirimkan email konfirmasi dan notifikasi WhatsApp panitia.'
  },
  {
    q: 'Apakah uang formulir dapat dikembalikan jika mengundurkan diri?',
    a: 'Biaya formulir pendaftaran dan tes observasi sebesar Rp 300.000 bersifat non-refundable (tidak dapat dikembalikan).'
  },
  {
    q: 'Kapan berkas fisik diserahkan ke pihak madrasah?',
    a: 'Berkas fisik (fotokopi Akta Kelahiran 2 lbr, KK 2 lbr, KTP orang tua 2 lbr, Pas Foto 3x4 4 lbr background merah, dan Surat Keterangan Sehat) diserahkan ke sekretariat madrasah saat proses daftar ulang setelah status pendaftaran dinyatakan Approved.'
  }
];

export default function PpdbFaq() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggleFaq = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section className="py-14 sm:py-20 lg:py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center mb-10 sm:mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-teal-50 border border-teal-100 text-primary-dark font-body text-xs font-bold uppercase tracking-wider mb-3.5 sm:mb-4">
            <HelpCircle className="w-3.5 h-3.5 text-accent" />
            <span>Tanya Jawab</span>
          </div>
          <h2 className="font-headline font-black text-2xl xs:text-3xl md:text-4xl text-secondary mb-3 sm:mb-4 break-words">
            PERTANYAAN UMUM (FAQ)
          </h2>
          <p className="font-body text-gray-500 text-sm sm:text-base md:text-lg px-2 leading-relaxed">
            Jawaban lengkap atas pertanyaan yang paling sering diajukan calon wali murid seputar sistem penerimaan murid baru.
          </p>
        </div>

        {/* Accordion FAQ Items */}
        <div className="space-y-3.5 sm:space-y-4">
          {FAQS.map((faq, idx) => {
            const isOpen = openIndex === idx;
            return (
              <div 
                key={idx} 
                className={`border rounded-2xl sm:rounded-[1.75rem] transition-all duration-300 overflow-hidden ${
                  isOpen 
                    ? 'border-primary/80 bg-teal-50/25 shadow-md shadow-teal-950/5 ring-2 ring-teal-500/15' 
                    : 'border-gray-200/80 bg-white hover:border-teal-200 hover:shadow-2xs'
                }`}
              >
                <button
                  onClick={() => toggleFaq(idx)}
                  className="w-full flex items-center justify-between p-4 sm:p-5 md:p-6 text-left focus:outline-none cursor-pointer gap-3.5 group"
                >
                  <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
                    <span className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center font-headline font-black text-xs sm:text-sm shrink-0 border transition-all ${
                      isOpen 
                        ? 'bg-primary text-white border-primary shadow-2xs' 
                        : 'bg-slate-50 text-gray-400 border-gray-200 group-hover:border-teal-300 group-hover:text-primary'
                    }`}>
                      0{idx + 1}
                    </span>
                    <span className={`font-headline font-bold text-sm sm:text-base md:text-lg pr-2 break-words flex-1 transition-colors ${
                      isOpen ? 'text-primary' : 'text-secondary group-hover:text-primary'
                    }`}>
                      {faq.q}
                    </span>
                  </div>

                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-transform duration-300 ${
                    isOpen ? 'bg-primary text-white rotate-180 shadow-2xs' : 'bg-slate-100 text-gray-400 group-hover:bg-teal-50 group-hover:text-primary'
                  }`}>
                    <ChevronDown size={17} />
                  </div>
                </button>

                <div 
                  className={`px-4 sm:px-5 md:px-6 overflow-hidden transition-all duration-300 ease-in-out ${
                    isOpen ? 'max-h-[600px] pb-5 sm:pb-6 opacity-100' : 'max-h-0 pb-0 opacity-0'
                  }`}
                >
                  <div className="font-body text-gray-600 text-xs sm:text-sm md:text-base leading-relaxed pt-3 sm:pt-4 border-t border-teal-100/70 pl-11 sm:pl-13">
                    {faq.a}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Support Help Box */}
        <div className="mt-10 sm:mt-12 p-6 sm:p-7 rounded-3xl bg-[#F4F7FC] border border-gray-200/80 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3.5 text-center sm:text-left">
            <div className="w-12 h-12 rounded-2xl bg-teal-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-teal-700/20">
              <MessageCircle className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-headline font-bold text-base sm:text-lg text-secondary">
                Punya Pertanyaan Lain?
              </h4>
              <p className="font-body text-xs sm:text-sm text-gray-500">
                Panitia SPMB siap membantu Anda melalui konsultasi langsung via WhatsApp.
              </p>
            </div>
          </div>

          <a
            href="https://wa.me/6281234567890?text=Halo%20Panitia%20SPMB%20MI%20Attaqwa%2015,%20saya%20ingin%20bertanya%20seputar%20pendaftaran"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-tactile inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full font-body text-xs sm:text-sm font-bold bg-emerald-600 text-white shadow-md shadow-emerald-950/20 hover:bg-emerald-700 transition-all shrink-0 w-full sm:w-auto"
          >
            <span>Hubungi Panitia SPMB</span>
            <ArrowRight className="w-4 h-4" />
          </a>
        </div>

      </div>
    </section>
  );
}
