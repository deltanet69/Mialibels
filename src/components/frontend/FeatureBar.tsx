'use client';

import React from 'react';
import { Award, Layers, ShieldCheck } from 'lucide-react';

const features = [
  {
    icon: Award,
    title: 'Akreditasi A',
    description: 'Disiplin, agamais, berprestasi, dan teruji secara mutu pendidikan nasional.',
  },
  {
    icon: Layers,
    title: 'Kurikulum Integratif',
    description: 'Keseimbangan antara ilmu pengetahuan umum dan pendalaman nilai keagamaan.',
  },
  {
    icon: ShieldCheck,
    title: 'Siap Digital Sejak Dini',
    description: 'Terbiasa dengan teknologi masa depan melalui sistem madrasah berbasis digital.',
  },
];

export default function FeatureBar() {
  return (
    <section className="bg-[#002957] py-8 lg:py-10 text-white relative z-20 shadow-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12 divide-y md:divide-y-0 md:divide-x divide-white/10">
          {features.map((feat, index) => {
            const Icon = feat.icon;
            return (
              <div
                key={index}
                className="flex items-start gap-4 pt-6 md:pt-0 first:pt-0 md:first:pl-0 pl-0 md:pl-8 group transition-all duration-300 hover:translate-x-1 md:hover:translate-x-0 md:hover:-translate-y-0.5"
              >
                <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center flex-shrink-0 group-hover:bg-primary transition-colors duration-300">
                  <Icon className="w-6 h-6 text-primary group-hover:text-white transition-colors duration-300" />
                </div>
                <div className="flex flex-col space-y-1">
                  <h3 className="font-headline font-bold text-lg text-white group-hover:text-primary transition-colors duration-300">
                    {feat.title}
                  </h3>
                  <p className="font-body text-gray-300 text-sm leading-relaxed">
                    {feat.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
