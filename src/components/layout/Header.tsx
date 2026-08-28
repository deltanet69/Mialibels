'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { Menu, X, PhoneCall, Sparkles, ChevronRight } from 'lucide-react';

const navLinks = [
  { label: 'Home', href: '/' },
  { label: 'Tentang Kami', href: '/about' },
  { label: 'Akademik', href: '/akademik' },
  { label: 'Artikel', href: '/news' },
  { label: 'SPMB', href: '/ppdb', highlight: true },
];

export default function Header() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Tutup drawer saat resize ke desktop (lg >= 1024px)
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) setIsOpen(false);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 w-full max-w-[100vw] transition-all duration-500 overflow-x-clip ${
          scrolled
            ? 'py-2.5 sm:py-3.5 bg-white/85 backdrop-blur-xl shadow-lg shadow-blue-950/5 border-b border-white/60'
            : 'py-3 sm:py-5 bg-transparent'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="flex items-center justify-between h-14 sm:h-16 w-full">

            {/* ===== LOGO ===== */}
            <Link href="/" className="flex items-center gap-2 sm:gap-3 group flex-shrink-0 min-w-0">
              <div className="relative w-[130px] xs:w-[150px] sm:w-[170px] lg:w-[155px] xl:w-[175px] h-[38px] sm:h-[46px] flex-shrink-0 transition-transform duration-300 group-hover:scale-105">
                <Image
                  src="/logomi.png"
                  alt="Logo MI Attaqwa 15"
                  fill
                  priority
                  className="object-contain object-left drop-shadow-sm"
                />
              </div>
            </Link>

            {/* ===== DESKTOP NAV (Visible on lg >= 1024px) ===== */}
            <nav className="hidden lg:flex items-center gap-1 xl:gap-1.5 p-1.5 rounded-full bg-white/70 backdrop-blur-md border border-white/80 shadow-sm">
              {navLinks.map((link) => {
                const isActive = pathname === link.href;
                return (
                  <Link
                    key={link.label}
                    href={link.href}
                    className={`relative px-3 xl:px-4 py-1.5 xl:py-2 rounded-full font-body text-xs xl:text-sm font-semibold transition-all duration-300 ${
                      isActive
                        ? 'text-white bg-primary shadow-md shadow-teal-700/20'
                        : link.highlight
                        ? 'text-btn-secondary hover:text-white hover:bg-btn-secondary/90'
                        : 'text-secondary/80 hover:text-primary hover:bg-teal-50/70'
                    }`}
                  >
                    <span className="flex items-center gap-1.5">
                      {link.highlight && !isActive && (
                        <span className="w-2 h-2 rounded-full bg-btn-secondary animate-ping inline-block" />
                      )}
                      {link.label}
                    </span>
                  </Link>
                );
              })}
            </nav>

            {/* ===== DESKTOP BUTTON (Visible on lg >= 1024px) ===== */}
            <div className="hidden lg:flex items-center flex-shrink-0">
              <Link
                href="/contact"
                className="btn-tactile inline-flex items-center justify-center gap-2 px-4 xl:px-5 py-2 xl:py-2.5 rounded-full font-body text-xs xl:text-sm font-bold bg-btn-primary text-white shadow-md shadow-blue-950/15 hover:bg-[#001d3d] hover:shadow-lg transition-all duration-300"
              >
                <PhoneCall className="w-3.5 h-3.5 xl:w-4 xl:h-4 text-accent" />
                <span>Kontak Kami</span>
              </Link>
            </div>

            {/* ===== MOBILE & TABLET HAMBURGER (Visible up to lg < 1024px) ===== */}
            <button
              onClick={() => setIsOpen(true)}
              className="lg:hidden flex-shrink-0 p-2 sm:p-2.5 rounded-2xl bg-white/85 backdrop-blur-md border border-white/80 text-secondary hover:text-primary hover:bg-white shadow-sm transition-all duration-200 focus:outline-none cursor-pointer"
              aria-label="Buka menu"
            >
              <Menu className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>

          </div>
        </div>
      </header>

      {/* ===== MOBILE DRAWER ===== */}
      {/* Overlay */}
      <div
        className={`fixed inset-0 z-[60] bg-slate-950/40 backdrop-blur-sm lg:hidden transition-opacity duration-300 ${
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setIsOpen(false)}
        aria-hidden="true"
      />

      {/* Drawer Panel */}
      <div
        className={`fixed top-0 right-0 bottom-0 z-[70] w-[300px] sm:w-[340px] max-w-[85vw] bg-white/95 backdrop-blur-2xl shadow-2xl flex flex-col lg:hidden transition-transform duration-300 ease-out border-l border-white/50 ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Drawer Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100/80">
          <div className="relative w-[130px] h-[38px]">
            <Image
              src="/logomi.png"
              alt="Logo MI"
              fill
              className="object-contain object-left"
            />
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="p-2 rounded-xl bg-gray-100/80 text-gray-500 hover:text-primary hover:bg-gray-200/80 transition-colors focus:outline-none"
            aria-label="Tutup menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Drawer Nav Links */}
        <nav className="flex-1 overflow-y-auto px-4 py-6 flex flex-col gap-2">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.label}
                href={link.href}
                onClick={() => setIsOpen(false)}
                className={`flex items-center justify-between px-4 py-3.5 rounded-2xl font-body text-sm font-bold transition-all ${
                  isActive
                    ? 'text-white bg-primary shadow-md shadow-teal-700/20'
                    : link.highlight
                    ? 'text-btn-secondary bg-orange-50/80 border border-orange-200/60'
                    : 'text-secondary hover:text-primary hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-2">
                  {link.highlight && (
                    <Sparkles className="w-4 h-4 text-btn-secondary" />
                  )}
                  <span>{link.label}</span>
                </div>
                <ChevronRight className={`w-4 h-4 ${isActive ? 'text-white' : 'text-gray-400'}`} />
              </Link>
            );
          })}
        </nav>

        {/* Drawer Footer CTA */}
        <div className="p-5 border-t border-gray-100 bg-slate-50/50">
          <Link
            href="/contact"
            onClick={() => setIsOpen(false)}
            className="btn-tactile flex items-center justify-center gap-2 w-full px-6 py-3.5 rounded-2xl font-body text-sm font-bold bg-btn-primary text-white shadow-lg shadow-blue-950/20 hover:bg-[#001d3d] transition-all"
          >
            <PhoneCall className="w-4 h-4 text-accent" />
            <span>Hubungi Kami</span>
          </Link>
        </div>
      </div>
    </>
  );
}
