'use client';

import React from 'react';
import { MapPin, Sparkles } from 'lucide-react';

export default function ContactMap() {
  return (
    <section className="py-20 bg-[#F4F7FC]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-teal-50 border border-teal-100 text-primary-dark font-body text-xs font-bold uppercase tracking-wider mb-4">
            <MapPin className="w-3.5 h-3.5 text-accent" />
            <span>Peta Petunjuk Arah</span>
          </div>
          <h2 className="font-headline font-black text-3xl md:text-4xl text-secondary mb-4">
            LOKASI MADRASAH KAMI
          </h2>
          <p className="font-body text-gray-500 text-base sm:text-lg">
            Kunjungi kami secara langsung untuk melihat suasana belajar kondusif dan fasilitas di MI Attaqwa 15 Babelan.
          </p>
        </div>

        <div className="w-full h-[400px] md:h-[480px] rounded-[2.5rem] overflow-hidden shadow-xl shadow-slate-900/5 border-4 border-white relative z-10">
          <iframe 
            src="https://www.google.com/maps?q=Jl.+Raya+Ps.+Babelan+No.1,+Babelan+Kota,+Kec.+Babelan,+Kabupaten+Bekasi,+Jawa+Barat+17610&output=embed" 
            width="100%" 
            height="100%" 
            style={{ border: 0 }} 
            allowFullScreen 
            loading="lazy" 
            referrerPolicy="no-referrer-when-downgrade"
            className="w-full h-full"
            title="Google Maps Lokasi MI Attaqwa 15 Babelan"
          ></iframe>
        </div>
      </div>
    </section>
  );
}
