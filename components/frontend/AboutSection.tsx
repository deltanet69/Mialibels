'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { CheckCircle2, ArrowRight } from 'lucide-react';

const values = ['Religius', 'Disiplin', 'Berakhlak', 'Berprestasi'];

export default function AboutSection() {
  return (
    <section className="py-20 lg:py-28 bg-[#EFF3FB]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 lg:gap-8 items-center">
          
          {/* Left Column: Images Collage */}
          <div className="lg:col-span-6 flex flex-col space-y-6 relative">
            
            {/* Top Classroom Image with overlay */}
            <div className="relative w-full max-w-[480px] aspect-[16/10] rounded-3xl overflow-hidden shadow-xl border border-white/80 self-start">
              <Image
                src="/images/classroom_view.png"
                alt="Ruang Kelas MI Attaqwa 15"
                fill
                className="object-cover"
              />
              
              {/* Badge: 700+ Students */}
              <div className="absolute bottom-4 right-4 bg-[#002957]/95 backdrop-blur-sm text-white px-6 py-3.5 rounded-2xl shadow-xl border border-white/10 transition-transform duration-300 hover:scale-105">
                <span className="font-headline font-black text-2xl sm:text-3xl block text-primary">
                  700+
                </span>
                <span className="font-body text-xs font-semibold text-gray-300">
                  Peserta Didik Aktif
                </span>
              </div>
            </div>

            {/* Bottom School Building Image overlapping */}
            <div className="relative w-full max-w-[480px] aspect-[16/10] rounded-3xl overflow-hidden shadow-xl border border-white/80 self-end lg:-mt-12 z-10 transition-transform duration-500 hover:scale-[1.01]">
              <Image
                src="/images/school_building.png"
                alt="Gedung MI Attaqwa 15"
                fill
                className="object-cover"
              />
            </div>

            {/* Decorative Grid Pattern */}
            <div className="absolute -left-6 -top-6 w-32 h-32 bg-primary/5 rounded-full blur-2xl -z-10" />
            <div className="absolute right-0 bottom-0 w-40 h-40 bg-accent/5 rounded-full blur-2xl -z-10" />

          </div>

          {/* Right Column: Text Content */}
          <div className="lg:col-span-6 flex flex-col items-start space-y-6 lg:pl-12">
            
            {/* Tag */}
            <span className="font-body text-sm font-bold text-accent tracking-wider uppercase">
              Tentang Kami
            </span>

            {/* Title */}
            <h2 className="font-headline font-black text-3xl sm:text-4xl lg:text-5xl text-secondary leading-tight">
              MI ATTAQWA 15 BABELAN
            </h2>

            {/* Paragraph 1 */}
            <p className="font-body text-gray-600 leading-relaxed text-base">
              MI Attaqwa 15 Babelan merupakan madrasah ibtidaiyah unggulan yang berkomitmen tinggi dalam menyelenggarakan pendidikan dasar berciri khas Islam secara integratif, inovatif, dan berwawasan teknologi untuk melahirkan insan kamil yang siap menyongsong masa depan.
            </p>

            {/* Paragraph 2 */}
            <p className="font-body text-gray-500 leading-relaxed text-sm">
              Dengan dukungan tenaga pendidik yang berdedikasi tinggi, kurikulum yang berimbang antara muatan nasional dan agama, serta fasilitas penunjang yang representatif, kami terus konsisten membina dan membimbing putra-putri Anda mencapai kompetensi optimal dan budi pekerti yang luhur.
            </p>

            {/* Values Subheading */}
            <div className="w-full pt-2">
              <h3 className="font-headline font-bold text-lg text-secondary mb-4">
                Landasan Nilai Kami:
              </h3>
              
              {/* Values Checklist Grid */}
              <div className="grid grid-cols-2 gap-4">
                {values.map((val) => (
                  <div key={val} className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0" />
                    <span className="font-body text-base font-bold text-secondary">
                      {val}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* CTA Button */}
            <div className="pt-4 w-full sm:w-auto">
              <Link
                href="/about"
                className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-3.5 rounded-full font-body text-base font-bold bg-[#002957] text-white shadow-lg transition-all duration-300 hover:bg-[#001d3d] hover:-translate-y-0.5 hover:shadow-xl"
              >
                Profil Sekolah
                <ArrowRight className="w-5 h-5 ml-2" />
              </Link>
            </div>

          </div>

        </div>
      </div>
    </section>
  );
}
