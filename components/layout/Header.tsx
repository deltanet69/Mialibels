'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { Menu, X, PhoneCall } from 'lucide-react';

const navLinks = [
  { label: 'Home', href: '/' },
  { label: 'Tentang Kami', href: '/about' },
  { label: 'Akademik', href: '/curriculum' },
  { label: 'Artikel', href: '/news' },
  { label: 'PPDB', href: '/ppdb' },
];

export default function Header() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 w-full transition-all duration-500 ${scrolled
        ? 'bg-white/95 backdrop-blur-md shadow-lg py-2'
        : 'bg-transparent py-4'
        }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* Logo Section */}
          <Link href="/" className="flex items-center space-x-3 group">
            <div className="relative w-36 h-36 transition-transform duration-300 group-hover:scale-105">
              <Image
                src="/logomi.png"
                alt="Logo MI Attaqwa 15"
                fill
                priority
                className="object-contain"
              />
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex space-x-1 lg:space-x-2">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.label}
                  href={link.href}
                  className={`px-4 py-2 rounded-full font-body text-sm font-medium transition-all duration-300 ${isActive
                    ? 'text-primary bg-primary/10'
                    : scrolled
                      ? 'text-secondary hover:text-primary hover:bg-gray-100'
                      : 'text-black/90 hover:text-black/70 hover:bg-slate-200 '
                    }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {/* Contact Button */}
          <div className="hidden md:flex items-center">
            <Link
              href="/contact"
              className={`inline-flex items-center justify-center px-6 py-2.5 rounded-full font-body text-sm font-bold shadow-md transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 ${scrolled
                ? 'bg-btn-primary text-white hover:bg-secondary'
                : 'bg-white text-btn-primary hover:bg-white/90'
                }`}
            >
              <PhoneCall className="w-4 h-4 mr-2" />
              Kontak Kami
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className={`p-2 rounded-lg transition-colors focus:outline-none ${scrolled
                ? 'text-secondary hover:text-primary hover:bg-gray-100'
                : 'text-white hover:bg-white/20'
                }`}
              aria-label={isOpen ? 'Tutup menu' : 'Buka menu'}
            >
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Overlay */}
      <div
        className={`fixed inset-0 z-40 md:hidden bg-black/50 transition-opacity duration-300 ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
          }`}
        onClick={() => setIsOpen(false)}
      >
        <div
          className={`fixed right-0 top-0 bottom-0 w-3/4 max-w-sm bg-white shadow-2xl p-6 transition-transform duration-300 ease-in-out transform flex flex-col justify-between ${isOpen ? 'translate-x-0' : 'translate-x-full'
            }`}
          onClick={(e) => e.stopPropagation()}
        >
          <div>
            <div className="flex items-center justify-between pb-6 border-b border-gray-100">
              <div className="flex items-center space-x-2">
                <Image
                  src="/logomi.png"
                  alt="Logo MI"
                  width={36}
                  height={36}
                  className="object-contain"
                />
                <span className="font-headline font-bold text-md text-secondary">
                  MI ATTAQWA 15
                </span>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-lg text-secondary hover:text-primary hover:bg-gray-100 focus:outline-none"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <nav className="flex flex-col space-y-3 mt-8">
              {navLinks.map((link) => {
                const isActive = pathname === link.href;
                return (
                  <Link
                    key={link.label}
                    href={link.href}
                    onClick={() => setIsOpen(false)}
                    className={`px-4 py-3 rounded-xl font-body text-base font-semibold transition-all ${isActive
                      ? 'text-primary bg-primary/10 border border-primary/20'
                      : 'text-secondary hover:text-primary hover:bg-gray-50'
                      }`}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className="mt-auto pt-6 border-t border-gray-100">
            <Link
              href="/contact"
              onClick={() => setIsOpen(false)}
              className="w-full inline-flex items-center justify-center px-6 py-3.5 rounded-full font-body text-base font-bold bg-btn-primary text-white shadow-md hover:bg-secondary hover:shadow-lg transition-all"
            >
              <PhoneCall className="w-5 h-5 mr-2" />
              Kontak Kami
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
