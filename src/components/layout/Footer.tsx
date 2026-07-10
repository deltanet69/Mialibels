import React from 'react';
import Link from 'next/link';
import Image from 'next/image';

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
  { name: 'Facebook', href: '#', icon: FacebookIcon, hoverClass: 'hover:bg-[#1877F2] hover:border-[#1877F2]' },
  { name: 'Instagram', href: 'https://www.instagram.com/miattaqwa15/?hl=id', icon: InstagramIcon, hoverClass: 'hover:bg-pink-500 hover:border-pink-500' },
  { name: 'Youtube', href: 'https://www.youtube.com/@miattaqwa15', icon: YoutubeIcon, hoverClass: 'hover:bg-red-600 hover:border-red-600' },
];

const menuLinks = [
  { label: 'Home', href: '/' },
  { label: 'Tentang Kami', href: '/about' },
  { label: 'Akademik', href: '/akademik' },
  { label: 'Artikel', href: '/news' },
  { label: 'PPDB', href: '/ppdb' },
];

/* ── Component ────────────────────────────────── */
export default function Footer() {
  return (
    <footer className="bg-white border-t border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* ─── Main Grid ─── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12 py-12 border-b border-gray-100">

          {/* Col 1: Logo + tagline */}
          <div className="flex flex-col gap-4">
            <Link href="/" className="flex items-center gap-3 group w-fit">
              <Image
                src="/logomi.png"
                alt="Logo MI Attaqwa 15"
                width={170}
                height={170}
                className="object-contain flex-shrink-0"
              />

            </Link>
            <p className="font-body text-sm text-gray-500 leading-relaxed max-w-xs">
              Membangun generasi islami yang cerdas, berakhlak, dan berprestasi sejak dini.
            </p>
            {/* Social icons */}
            <div className="flex items-center gap-2 mt-1">
              {socialLinks.map((soc) => {
                const Icon = soc.icon;
                return (
                  <a
                    key={soc.name}
                    href={soc.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={soc.name}
                    className={`p-2.5 rounded-full border border-gray-200 text-gray-500 hover:text-white transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md ${soc.hoverClass}`}
                  >
                    <Icon />
                  </a>
                );
              })}
            </div>
          </div>

          {/* Col 2: Navigasi */}
          <div className="flex flex-col gap-3">
            <h4 className="font-headline font-bold text-sm text-secondary uppercase tracking-wider">
              Navigasi
            </h4>
            <ul className="flex flex-col gap-2">
              {menuLinks.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="font-body text-sm text-gray-500 hover:text-primary transition-colors duration-200"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>



          {/* Col 3: Kontak & Alamat */}
          <div className="flex flex-col gap-3">
            <h4 className="font-headline font-bold text-sm text-secondary uppercase tracking-wider">
              Alamat
            </h4>
            <p className="font-body text-sm text-gray-500 leading-relaxed">
              Jl. Raya Pasar Babelan RT.05/RW.01,<br />
              Kec. Babelan, Kab. Bekasi,<br />
              Jawa Barat
            </p>
            <Link
              href="/contact"
              className="mt-1 w-fit inline-flex items-center justify-center px-5 py-2.5 rounded-full font-body text-xs font-bold bg-btn-primary text-white hover:bg-secondary transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md"
            >
              Hubungi Kami
            </Link>
          </div>

        </div>

        {/* ─── Copyright Bar ─── */}
        <div className="py-5 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="font-body text-xs text-gray-400 text-center sm:text-left">
            &copy; {new Date().getFullYear()} MI Attaqwa 15 Babelan — Seluruh Hak Cipta Dilindungi.
          </p>
          <p className="font-body text-xs text-gray-400 text-center sm:text-right">
            Yayasan Attaqwa Babelan
          </p>
        </div>

      </div>
    </footer>
  );
}
