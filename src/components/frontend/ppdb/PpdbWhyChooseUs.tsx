'use client';

import React from 'react';
import { Award, BookOpen, HeartHandshake, PiggyBank } from 'lucide-react';

const REASONS = [
  {
    title: 'Akreditasi A (Unggul)',
    description: 'Telah terakreditasi A secara resmi, menjamin kualitas pendidikan dan fasilitas madrasah yang optimal.',
    icon: Award,
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-50',
    borderColor: 'border-yellow-100'
  },
  {
    title: 'Kurikulum Integratif',
    description: 'Memadukan kurikulum pendidikan nasional dan kurikulum madrasah (kemenag) secara seimbang.',
    icon: BookOpen,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-100'
  },
  {
    title: 'Lingkungan Religius',
    description: 'Menciptakan suasana islami dengan pembiasaan ibadah rutin seperti shalat dhuha dan mengaji.',
    icon: HeartHandshake,
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-50',
    borderColor: 'border-emerald-100'
  },
  {
    title: 'Biaya Terjangkau',
    description: 'Memberikan pendidikan berkualitas tinggi dengan biaya yang rasional dan transparan bagi masyarakat.',
    icon: PiggyBank,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-100'
  }
];

export default function PpdbWhyChooseUs() {
  return (
    <section className="py-20 bg-white relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="font-headline font-bold text-3xl md:text-4xl text-secondary mb-4">
            Kenapa Memilih <span className="text-primary">MI Attaqwa 15?</span>
          </h2>
          <p className="font-body text-gray-600 text-lg">
            Kami berkomitmen memberikan layanan pendidikan dasar Islam terbaik untuk mewujudkan generasi yang cerdas dan berakhlakul karimah.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {REASONS.map((reason, index) => {
            const Icon = reason.icon;
            return (
              <div 
                key={index} 
                className="flex flex-col items-center text-center p-8 rounded-3xl bg-white border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group"
              >
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-6 border transition-transform duration-300 group-hover:scale-110 ${reason.bgColor} ${reason.borderColor}`}>
                  <Icon className={`w-8 h-8 ${reason.color}`} />
                </div>
                <h3 className="font-headline font-bold text-xl text-secondary mb-3">
                  {reason.title}
                </h3>
                <p className="font-body text-gray-600 leading-relaxed text-sm">
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
