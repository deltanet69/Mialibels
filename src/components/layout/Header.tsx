'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { Menu, X, PhoneCall } from 'lucide-react';

const navLinks = [
  { label: 'Home', href: '/' },
  { label: 'Tentang Kami', href: '/about' },
  { label: 'Akademik', href: '/akademik' },
  { label: 'Artikel', href: '/news' },
  { label: 'PPDB', href: '/ppdb' },
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

  // Tutup drawer saat resize ke desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) setIsOpen(false);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 w-full transition-all duration-500 ${scrolled
          ? 'bg-white/95 backdrop-blur-md shadow-md'
          : 'bg-transparent'
          }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-20">

            {/* ===== LOGO ===== */}
            <Link href="/" className="flex items-center gap-3 group flex-shrink-0">
              <div className="relative w-30 h-30 sm:w-36 sm:h-36 flex-shrink-0 transition-transform duration-300 group-hover:scale-105">
                <Image
                  src="/logomi.png"
                  alt="Logo MI Attaqwa 15"
                  fill
                  priority
                  className="object-contain"
                />
              </div>
            </Link>

            {/* ===== DESKTOP NAV ===== */}
            <nav className="hidden md:flex items-center gap-1">
              {navLinks.map((link) => {
                const isActive = pathname === link.href;
                return (
                  <Link
                    key={link.label}
                    href={link.href}
                    className={`px-3 lg:px-4 py-2 rounded-full font-body text-sm font-medium transition-all duration-200 ${isActive
                      ? 'text-primary bg-primary/10 font-semibold'
                      : 'text-secondary hover:text-primary hover:bg-gray-100'
                      }`}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </nav>

            {/* ===== DESKTOP BUTTON ===== */}
            <div className="hidden md:flex items-center flex-shrink-0">
              <Link
                href="/contact"
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full font-body text-sm font-bold bg-btn-primary text-white shadow-md transition-all duration-300 hover:bg-secondary hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0"
              >
                <PhoneCall className="w-4 h-4" />
                Kontak Kami
              </Link>
            </div>

            {/* ===== MOBILE HAMBURGER ===== */}
            <button
              onClick={() => setIsOpen(true)}
              className="md:hidden p-2 rounded-lg text-secondary hover:text-primary hover:bg-gray-100 transition-colors focus:outline-none"
              aria-label="Buka menu"
            >
              <Menu className="w-6 h-6" />
            </button>

          </div>
        </div>
      </header>

      {/* ===== MOBILE DRAWER ===== */}
      {/* Overlay */}
      <div
        className={`fixed inset-0 z-[60] bg-black/50 md:hidden transition-opacity duration-300 ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
          }`}
        onClick={() => setIsOpen(false)}
        aria-hidden="true"
      />

      {/* Drawer Panel */}
      <div
        className={`fixed top-0 right-0 bottom-0 z-[70] w-[330px] max-w-[85vw] bg-white shadow-2xl flex flex-col md:hidden transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
      >
        {/* Drawer Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            <Image
              src="/logomi.png"
              alt="Logo MI"
              width={120}
              height={120}
              className="object-contain"
            />

          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="p-2 rounded-lg text-gray-500 hover:text-primary hover:bg-gray-100 transition-colors focus:outline-none"
            aria-label="Tutup menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Drawer Nav Links */}
        <nav className="flex-1 overflow-y-auto px-4 py-6 flex flex-col gap-1">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.label}
                href={link.href}
                onClick={() => setIsOpen(false)}
                className={`flex items-center px-4 py-3.5 rounded-xl font-body text-sm font-semibold transition-all ${isActive
                  ? 'text-primary bg-primary/10 border border-primary/15'
                  : 'text-secondary hover:text-primary hover:bg-gray-50'
                  }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* Drawer Footer CTA */}
        <div className="px-4 py-5 border-t border-gray-100">
          <Link
            href="/contact"
            onClick={() => setIsOpen(false)}
            className="flex items-center justify-center gap-2 w-full px-6 py-3.5 rounded-full font-body text-sm font-bold bg-btn-primary text-white shadow-md hover:bg-secondary hover:shadow-lg transition-all"
          >
            <PhoneCall className="w-4 h-4" />
            Kontak Kami
          </Link>
        </div>
      </div>
    </>
  );
}
