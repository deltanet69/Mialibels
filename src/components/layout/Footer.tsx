import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { MapPin, Phone, Mail, ArrowUpRight, Heart } from 'lucide-react';

/* ── Inline SVG Icons ─────────────────────────── */
const FacebookIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
  </svg>
);

const InstagramIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
  </svg>
);

const YoutubeIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z" />
    <polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02" />
  </svg>
);

/* ── Data ─────────────────────────────────────── */
const socialLinks = [
  { name: 'Facebook', href: '#', icon: FacebookIcon, hoverClass: 'hover:bg-[#1877F2] hover:border-[#1877F2] hover:text-white' },
  { name: 'Instagram', href: 'https://www.instagram.com/miattaqwa15/?hl=id', icon: InstagramIcon, hoverClass: 'hover:bg-gradient-to-tr hover:from-amber-500 hover:via-pink-500 hover:to-purple-600 hover:border-pink-500 hover:text-white' },
  { name: 'Youtube', href: 'https://www.youtube.com/@miattaqwa15', icon: YoutubeIcon, hoverClass: 'hover:bg-[#FF0000] hover:border-[#FF0000] hover:text-white' },
];
import { getSpmbUrl } from '@/lib/urls';

const menuLinks = [
  { label: 'Home', href: '/' },
  { label: 'Tentang Kami', href: '/about' },
  { label: 'Akademik', href: '/akademik' },
  { label: 'Artikel & Berita', href: '/news' },
  { label: 'SPMB 2027/2028', href: getSpmbUrl() },
];

export default function Footer() {
  return (
    <footer className="bg-white border-t border-slate-200/80 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* ─── Main Grid ─── */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 lg:gap-12 py-14 border-b border-gray-100">

          {/* Col 1: Logo + Tagline + Social */}
          <div className="md:col-span-5 flex flex-col gap-4">
            <Link href="/" className="flex items-center gap-3 group w-fit">
              <div className="relative w-[160px] h-[45px]">
                <Image
                  src="/logomi.png"
                  alt="Logo MI Attaqwa 15"
                  fill
                  className="object-contain object-left"
                />
              </div>
            </Link>
            <p className="font-body text-md text-gray-500 leading-relaxed max-w-sm">
              Madrasah Ibtidaiyah unggulan di Babelan, Bekasi. Membentuk generasi cerdas, berakhlak mulia, dan berkarakter pejuang berlandaskan Islam Ahlussunnah Wal Jamaah.
            </p>
            {/* Social icons */}
            <div className="flex items-center gap-2.5 mt-2">
              {socialLinks.map((soc) => {
                const Icon = soc.icon;
                return (
                  <a
                    key={soc.name}
                    href={soc.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={soc.name}
                    className={`btn-tactile w-10 h-10 rounded-full border border-gray-200 bg-slate-50 flex items-center justify-center text-gray-500 shadow-2xs transition-all duration-300 ${soc.hoverClass}`}
                  >
                    <Icon />
                  </a>
                );
              })}
            </div>
          </div>

          {/* Col 2: Navigasi Cepat */}
          <div className="md:col-span-3 flex flex-col gap-3">
            <h4 className="font-headline font-bold text-md text-secondary uppercase tracking-wider flex items-center gap-2">
              <span className="w-1.5 h-3.5 bg-primary rounded-full" />
              Navigasi Halaman
            </h4>
            <ul className="flex flex-col gap-2.5 mt-1">
              {menuLinks.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="font-body text-md text-gray-500 hover:text-primary transition-colors duration-200 inline-flex items-center gap-1.5 group"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-gray-300 group-hover:bg-primary transition-colors" />
                    <span>{link.label}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Col 3: Kontak & Alamat */}
          <div className="md:col-span-4 flex flex-col gap-3">
            <h4 className="font-headline font-bold text-md text-secondary uppercase tracking-wider flex items-center gap-2">
              <span className="w-1.5 h-3.5 bg-btn-secondary rounded-full" />
              Lokasi & Kontak
            </h4>
            <div className="flex flex-col gap-2.5 font-body text-md text-gray-500">
              <div className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-primary flex-shrink-0 mt-1" />
                <span>Jl. Raya Pasar Babelan RT.05/RW.01, Kec. Babelan, Kab. Bekasi, Jawa Barat 17610</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-accent flex-shrink-0" />
                <span>(021) 8923-XXXX / WhatsApp Aktif</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-teal-600 flex-shrink-0" />
                <span>info@miattaqwa15.sch.id</span>
              </div>
            </div>
            
            <div className="pt-2">
              <Link
                href="/contact"
                className="btn-tactile inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full font-body text-xs font-bold bg-btn-primary text-white hover:bg-[#001d3d] shadow-sm transition-all"
              >
                <span>Kirim Pesan ke Madrasah</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

        </div>

        {/* ─── Copyright Bar ─── */}
        <div className="py-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-body text-gray-400">
          <p className="text-center sm:text-left flex items-center gap-1">
            <span>&copy; {new Date().getFullYear()} MI Attaqwa 15 Babelan. Seluruh Hak Cipta Dilindungi.</span>
          </p>
          <p className="text-center sm:text-right font-medium text-gray-500">
            Yayasan Attaqwa 15 Babelan — Bekasi
          </p>
        </div>

      </div>
    </footer>
  );
}
