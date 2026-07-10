import React from 'react';
import type { Metadata } from 'next';
import AnimatedSection from '@/components/frontend/AnimatedSection';

import PpdbHero from '@/components/frontend/ppdb/PpdbHero';
import PpdbWhyChooseUs from '@/components/frontend/ppdb/PpdbWhyChooseUs';
import PpdbSchedule from '@/components/frontend/ppdb/PpdbSchedule';
import PpdbRequirements from '@/components/frontend/ppdb/PpdbRequirements';
import PpdbFacilitiesFlow from '@/components/frontend/ppdb/PpdbFacilitiesFlow';
import PpdbFaq from '@/components/frontend/ppdb/PpdbFaq';
import PpdbCTA from '@/components/frontend/ppdb/PpdbCTA';

export const metadata: Metadata = {
  title: 'PPDB 2027/2028 | MI Attaqwa 15 Babelan',
  description: 'Pendaftaran Peserta Didik Baru (PPDB) MI Attaqwa 15 Babelan Tahun Ajaran 2027/2028. Dapatkan informasi syarat pendaftaran, jadwal, dan fasilitas kami.',
};

export default function PpdbPage() {
  return (
    <div className="flex flex-col w-full">
      <AnimatedSection direction="none" delay={0.1}>
        <PpdbHero />
      </AnimatedSection>
      
      <AnimatedSection direction="up" delay={0.2}>
        <PpdbWhyChooseUs />
      </AnimatedSection>
      
      <AnimatedSection direction="left">
        <PpdbSchedule />
      </AnimatedSection>
      
      <AnimatedSection direction="right">
        <PpdbRequirements />
      </AnimatedSection>
      
      <AnimatedSection direction="up">
        <PpdbFacilitiesFlow />
      </AnimatedSection>
      
      <AnimatedSection direction="up">
        <PpdbFaq />
      </AnimatedSection>
      
      <AnimatedSection direction="none">
        <PpdbCTA />
      </AnimatedSection>
    </div>
  );
}
