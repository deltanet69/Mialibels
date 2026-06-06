import React from 'react';
import HeroSection from '@/components/frontend/HeroSection';
import FeatureBar from '@/components/frontend/FeatureBar';
import AboutSection from '@/components/frontend/AboutSection';
import CtaBanner from '@/components/frontend/CtaBanner';
import NewsSection from '@/components/frontend/NewsSection';
import SocialSection from '@/components/frontend/SocialSection';

export default function HomePage() {
  return (
    <div className="flex flex-col w-full">
      <HeroSection />
      <FeatureBar />
      <AboutSection />
      <CtaBanner />
      <NewsSection />
      <SocialSection />
    </div>
  );
}
