import React from 'react';
import type { Metadata } from 'next';
import AnimatedSection from '@/components/frontend/AnimatedSection';

import ContactHero from '@/components/frontend/contact/ContactHero';
import ContactInfo from '@/components/frontend/contact/ContactInfo';
import ContactForm from '@/components/frontend/contact/ContactForm';
import ContactMap from '@/components/frontend/contact/ContactMap';

export const metadata: Metadata = {
  title: 'Hubungi Kami | MI Attaqwa 15 Babelan',
  description: 'Hubungi MI Attaqwa 15 Babelan Kota. Dapatkan informasi terkait PPDB, akademik, atau kirim pesan melalui formulir kontak resmi kami.',
};

export default function ContactPage() {
  return (
    <div className="flex flex-col w-full">
      <AnimatedSection direction="none" delay={0.1}>
        <ContactHero />
      </AnimatedSection>
      
      <section className="py-20 bg-white relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
            
            <div className="lg:col-span-5">
              <AnimatedSection direction="right" delay={0.2}>
                <ContactInfo />
              </AnimatedSection>
            </div>
            
            <div className="lg:col-span-7">
              <AnimatedSection direction="left" delay={0.3}>
                <ContactForm />
              </AnimatedSection>
            </div>
            
          </div>
        </div>
      </section>

      <AnimatedSection direction="up">
        <ContactMap />
      </AnimatedSection>
    </div>
  );
}
