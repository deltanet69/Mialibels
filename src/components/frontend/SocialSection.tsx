'use client';

import React from 'react';
import Script from 'next/script';

const InstagramIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
  </svg>
);

export default function SocialSection() {
  return (
    <section className="py-20 lg:py-28 bg-white overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center flex flex-col items-center space-y-3 mb-16">
          <span className="font-body text-sm font-bold text-primary tracking-wider uppercase">
            Social Media
          </span>
          <h2 className="font-headline font-black text-3xl sm:text-4xl text-secondary">
            SOCIAL UPDATE MI ATTAQWA 15
          </h2>
          <div className="w-16 h-1 bg-primary rounded-full mt-2" />
        </div>

        {/* Juicer.io Feed Embed */}
        <div className="w-full min-h-[500px] mb-12">
          {/* 
            Membutuhkan ul.juicer-feed agar script dari juicer mengetahui 
            dimana feed harus dirender. 
          */}
          <ul className="juicer-feed" data-feed-id="miattaqwa15"></ul>
          
          <Script 
            src="https://www.juicer.io/embed/miattaqwa15/embed-code.js" 
            strategy="lazyOnload" 
          />
        </div>

        {/* Visit Instagram Button */}
        <div className="flex justify-center">
          <a
            href="https://instagram.com/miattaqwa15.babelan"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center px-8 py-3.5 rounded-full font-body text-base font-bold text-white bg-gradient-to-r from-[#f9ce34] via-[#ee2a7b] to-[#6228d7] shadow-lg shadow-purple-500/10 transition-all duration-300 hover:shadow-xl hover:shadow-purple-500/20 hover:opacity-95 hover:-translate-y-0.5 active:translate-y-0"
          >
            <InstagramIcon className="w-5 h-5 mr-2.5" />
            Kunjungi Instagram Kami
          </a>
        </div>

      </div>
    </section>
  );
}
