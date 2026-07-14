'use client';

import React from 'react';
import { MapIcon } from 'lucide-react';

export default function ContactMap() {
  return (
    <section className="py-20 bg-[#F8FAFC]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <h2 className="font-headline font-bold text-3xl md:text-4xl text-secondary mb-4 flex items-center justify-center gap-3">
            <MapIcon className="w-8 h-8 text-primary" />
            Lokasi <span className="text-primary">Madrasah</span>
          </h2>
          <p className="font-body text-gray-600 text-lg">
            Kunjungi kami secara langsung untuk melihat fasilitas dan lingkungan belajar di MI Attaqwa 15 Babelan.
          </p>
        </div>

        <div className="w-full h-[400px] md:h-[500px] rounded-3xl overflow-hidden shadow-lg border-4 border-white relative z-10">
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
