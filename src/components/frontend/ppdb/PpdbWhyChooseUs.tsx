'use client';

import React from 'react';
import { Award, BookOpen, HeartHandshake, PiggyBank, Sparkles } from 'lucide-react';

const REASONS = [
  {
    title: 'Akreditasi A (Unggul)',
    description: 'Telah terakreditasi A secara resmi BAN-SM, menjamin mutu kurikulum dan proses belajar mengajar prima.',
    icon: Award,
    color: 'text-amber-600',
    bgColor: 'bg-amber-50',
    borderColor: 'border-amber-100'
  },
  {
    title: 'Kurikulum Integratif',
    description: 'Memadukan standar nasional, kurikulum Kemenag KMA 1503/2025, dan kepesantrenan Attaqwa.',
    icon: BookOpen,
    color: 'text-teal-600',
    bgColor: 'bg-teal-50',
    borderColor: 'border-teal-100'
  },
  {
    title: 'Lingkungan Religius',
    description: 'Pembiasaan ibadah rutin: shalat dhuha & dzuhur berjamaah, hafalan Juz 30, dan adab islami sehari-hari.',
    icon: HeartHandshake,
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-50',
    borderColor: 'border-emerald-100'
  },
  {
    title: 'Biaya Terjangkau',
    description: 'Biaya pendidikan transparan dan rasional dengan fasilitas sarana belajar modern serta berkualitas.',
    icon: PiggyBank,
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-50',
    borderColor: 'border-indigo-100'
  }
];

export default function PpdbWhyChooseUs() {
  return (
    <section className="py-20 lg:py-24 bg-white relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-teal-50 border border-teal-100 text-primary-dark font-body text-xs font-bold uppercase tracking-wider mb-4">
            <Sparkles className="w-3.5 h-3.5 text-accent" />
            <span>Alasan Utama</span>
          </div>
          <h2 className="font-headline font-black text-3xl md:text-4xl text-secondary mb-4">
            MENGAPA MEMILIH MI ATTAQWA 15?
          </h2>
          <p className="font-body text-gray-500 text-base sm:text-lg">
            Komitmen kami memberikan layanan pendidikan dasar Islam terbaik untuk mewujudkan generasi cerdas dan berakhlak mulia.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-7">
          {REASONS.map((reason, index) => {
            const Icon = reason.icon;
            return (
              <div 
                key={index} 
                className="flex flex-col items-center text-center p-8 rounded-[2rem] bg-white border border-gray-100/90 shadow-sm hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 group"
              >
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-6 border transition-transform duration-300 group-hover:scale-110 shadow-2xs ${reason.bgColor} ${reason.borderColor}`}>
                  <Icon className={`w-8 h-8 ${reason.color}`} />
                </div>
                <h3 className="font-headline font-bold text-xl text-secondary mb-3">
                  {reason.title}
                </h3>
                <p className="font-body text-gray-500 leading-relaxed text-sm">
                  {reason.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
