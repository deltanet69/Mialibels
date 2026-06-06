import React from 'react';
import Link from 'next/link';
import Image from 'next/image';

const FacebookIcon = (props: React.SVGProps<SVGSVGElement>) => (
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
    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
  </svg>
);

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

const TikTokIcon = (props: React.SVGProps<SVGSVGElement>) => (
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
    <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5" />
  </svg>
);

const socialLinks = [
  { name: 'Facebook', href: '#', icon: FacebookIcon, color: 'hover:bg-[#1877F2]' },
  { name: 'Instagram', href: 'https://instagram.com', icon: InstagramIcon, color: 'hover:bg-gradient-to-tr hover:from-[#f9ce34] hover:via-[#ee2a7b] hover:to-[#6228d7]' },
  { name: 'TikTok', href: '#', icon: TikTokIcon, color: 'hover:bg-[#000000]' }
];

const menuLinks = [
  { label: 'Home', href: '/' },
  { label: 'Tentang Kami', href: '/about' },
  { label: 'Akademik', href: '/curriculum' },
  { label: 'Artikel', href: '/news' },
  { label: 'PPDB', href: '/ppdb' }
];

export default function Footer() {
  return (
    <footer className="bg-white border-t border-gray-100 pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-9 pb-12 border-b border-gray-100">

          {/* Logo & Description */}
          <div className="flex flex-col space-y-4">
            <Link href="/" className="flex items-center space-x-3">
              <Image
                src="/logomi.png"
                alt="Logo MI"
                width={170}
                height={170}
                className="object-contain"
              />
            </Link>
            <div className="text-left">
              <p className="font-body text-xs text-gray-400">NPSN: 60709253</p>
              <p className="font-body text-xs text-gray-400">Akreditasi A (Unggul)</p>
            </div>
            {/* <p className="font-body text-sm text-gray-500 max-w-sm leading-relaxed">
              Membangun Generasi Islami yang Cerdas, Berakhlak, dan Berprestasi. Menyediakan pendidikan berkualitas seimbang antara ilmu pengetahuan dan akhlak mulia.
            </p> */}
          </div>

          {/* Site Navigation */}
          <div className="flex flex-col md:items-center space-y-4">

            <ul className="flex flex-wrap md:justify-center gap-x-6 gap-y-2">
              {menuLinks.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="font-body text-sm font-semibold text-gray-600 hover:text-primary transition-colors duration-300"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Social Media & Contact */}
          <div className="flex flex-col md:items-end space-y-4">

            <div className="flex space-x-3">
              {socialLinks.map((soc) => {
                const Icon = soc.icon;
                return (
                  <a
                    key={soc.name}
                    href={soc.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`p-3 rounded-full bg-gray-100 text-gray-600 hover:text-white transition-all duration-300 transform hover:-translate-y-1 hover:shadow-md ${soc.color}`}
                    aria-label={soc.name}
                  >
                    <Icon className="w-5 h-5" />
                  </a>
                );
              })}
            </div>

          </div>

        </div>

        {/* Bottom copyright line */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="font-body text-xs text-gray-400 text-center sm:text-left">
            &copy; {new Date().getFullYear()} MI Attaqwa 15 Babelan. Seluruh Hak Cipta Dilindungi.
          </p>
          <p className="font-body text-xs text-gray-400 text-center sm:text-right">
            Yayasan Attaqwa 19 Babelan
          </p>
        </div>
      </div>
    </footer>
  );
}
