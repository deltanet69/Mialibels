'use client';

import React from 'react';
import { Award, Layers, ShieldCheck, Sparkles } from 'lucide-react';

const features = [
  {
    icon: Award,
    badge: 'Akreditasi',
    title: 'Akreditasi Unggul',
    description: 'Disiplin, agamais, berprestasi, dan teruji secara mutu standar pendidikan nasional BAN-SM.',
    gradient: 'from-teal-500 to-emerald-500',
    lightBg: 'bg-teal-50/80 text-teal-700 border-teal-100',
    iconColor: 'text-teal-600',
  },
  {
    icon: Layers,
    badge: 'KMA 1503/2025',
    title: 'Kurikulum Integratif',
    description: 'Keseimbangan harmonis antara ilmu pengetahuan umum, sains, dan pendalaman nilai keagamaan.',
    gradient: 'from-amber-500 to-orange-500',
    lightBg: 'bg-orange-50/80 text-orange-700 border-orange-100',
    iconColor: 'text-orange-600',
  },
  {
    icon: ShieldCheck,
    badge: 'Digital Era',
    title: 'Siap Digital Sejak Dini',
    description: 'Terbiasa dengan teknologi masa depan melalui sistem madrasah, presensi, dan e-learning terpadu.',
    gradient: 'from-blue-600 to-cyan-500',
    lightBg: 'bg-blue-50/80 text-blue-700 border-blue-100',
    iconColor: 'text-blue-600',
  },
];

export default function FeatureBar() {
  return (
    <section className="relative z-30 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6 sm:-mt-10 mb-12 sm:mb-16">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 lg:gap-6">
        {features.map((feat, index) => {
          const Icon = feat.icon;
          return (
            <div
              key={index}
              className="group relative bg-white/90 backdrop-blur-md rounded-3xl p-6 sm:p-7 border border-white shadow-lg shadow-blue-950/5 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl hover:shadow-blue-950/10 flex flex-col justify-between"
            >
              {/* Header inside card */}
              <div>
                <div className="flex items-center justify-between mb-5">
                  <div className={`w-13 h-13 rounded-2xl bg-gradient-to-tr ${feat.gradient} flex items-center justify-center text-white shadow-md shadow-slate-900/10 group-hover:scale-110 transition-transform duration-300`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <span className={`text-[11px] font-extrabold uppercase tracking-wider px-3 py-1 rounded-full border ${feat.lightBg}`}>
                    {feat.badge}
                  </span>
                </div>

                <h3 className="font-primary font-bold text-xl text-secondary group-hover:text-primary transition-colors duration-300 mb-2">
                  {feat.title}
                </h3>
                <p className="font-body text-gray-500 text-sm leading-relaxed">
                  {feat.description}
                </p>
              </div>

              {/* Bottom decorative subtle indicator */}
              <div className="mt-5 pt-4 border-t border-gray-100/80 flex items-center justify-between text-xs font-semibold text-gray-400 group-hover:text-primary transition-colors">
                <span>MI Attaqwa 15 Unggulan</span>
                <Sparkles className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-accent" />
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
