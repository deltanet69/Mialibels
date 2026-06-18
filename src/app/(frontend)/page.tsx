import React from 'react';
import HeroSection from '@/components/frontend/HeroSection';
import FeatureBar from '@/components/frontend/FeatureBar';
import AboutSection from '@/components/frontend/AboutSection';
import CtaBanner from '@/components/frontend/CtaBanner';
import NewsSection from '@/components/frontend/NewsSection';
import SocialSection from '@/components/frontend/SocialSection';
import AnimatedSection from '@/components/frontend/AnimatedSection';

export default function HomePage() {
  return (
    <div className="flex flex-col w-full">
      <AnimatedSection direction="none" delay={0.2}>
        <HeroSection />
      </AnimatedSection>
      <AnimatedSection direction="up">
        <FeatureBar />
      </AnimatedSection>
      <AnimatedSection direction="up">
        <AboutSection />
      </AnimatedSection>
      <AnimatedSection direction="left">
        <CtaBanner />
      </AnimatedSection>
      <AnimatedSection direction="up">
        <NewsSection />
      </AnimatedSection>
      <AnimatedSection direction="right">
        <SocialSection />
      </AnimatedSection>
    </div>
  );
}
