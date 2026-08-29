'use client';

import React from 'react';
import Link from 'next/link';
import { Send, Phone, ArrowRight, Sparkles } from 'lucide-react';
import Image from 'next/image';

export default function PpdbCTA() {
  return (
    <section className="relative py-14 sm:py-20 lg:py-24 overflow-hidden bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="relative rounded-2xl sm:rounded-[2.5rem] bg-gradient-to-br from-[#002957] via-[#0f2744] to-[#004d40] p-6 sm:p-10 md:p-14 lg:p-16 text-center text-white overflow-hidden shadow-2xl">
          {/* Background Image overlay */}
          <div className="absolute inset-0 z-0">
            <Image
              src="/bgheader.png"
              alt="CTA Background"
              fill
              className="object-cover opacity-15 object-top"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#002957]/90 via-transparent to-transparent" />
          </div>

          {/* Ambient Glows */}
          <div className="absolute top-0 right-0 w-80 h-80 rounded-full bg-teal-400/20 blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-80 h-80 rounded-full bg-amber-400/15 blur-3xl translate-y-1/2 -translate-x-1/3 pointer-events-none" />

          <div className="relative z-10 max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 py-1.5 sm:py-2 px-3.5 sm:px-5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-accent font-body text-xs sm:text-sm font-bold uppercase tracking-wider mb-4 sm:mb-6">
              <Sparkles className="w-3.5 h-3.5 text-accent" />
              <span>Pendaftaran Online Aktif</span>
            </div>

            <h2 className="font-headline font-black text-2xl xs:text-3xl sm:text-4xl md:text-5xl leading-tight mb-4 sm:mb-6 break-words">
              Daftarkan Putra-Putri Anda <br className="hidden sm:block" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-300 via-emerald-300 to-amber-200">
                Sekarang di MI Attaqwa 15
              </span>
            </h2>

            <p className="font-body text-slate-200 text-xs sm:text-sm md:text-base lg:text-lg leading-relaxed mb-8 sm:mb-10 max-w-2xl mx-auto px-2">
              Mari bertumbuh bersama madrasah yang mengutamakan akhlakul karimah, ketajaman intelektual, dan kesiapan menghadapi masa depan digital.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
              <a
                href={process.env.NODE_ENV === 'development' ? 'http://spmb.localhost:3000' : '#'}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-tactile w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 sm:px-10 py-3.5 sm:py-4 rounded-full font-body text-sm sm:text-base font-bold bg-btn-secondary text-white shadow-xl shadow-orange-950/30 hover:shadow-2xl hover:brightness-110 transition-all text-center"
              >
                <span>Daftar SPMB Online</span>
                <ArrowRight className="w-5 h-5 ml-1 shrink-0" />
              </a>
              
              <Link
                href="/contact"
                className="btn-tactile w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 sm:px-8 py-3.5 sm:py-4 rounded-full font-body text-sm sm:text-base font-bold bg-white/10 text-white border border-white/25 backdrop-blur-md hover:bg-white/20 transition-all text-center"
              >
                <Phone className="w-4 h-4 shrink-0" />
                <span>Konsultasi Panitia SPMB</span>
              </Link>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}
