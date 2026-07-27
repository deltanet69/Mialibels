import type { Metadata } from 'next';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import SmoothScrolling from '@/components/providers/SmoothScrolling';

export const metadata: Metadata = {
  title: 'MI Attaqwa 15 Babelan | Membangun Generasi Islami',
  description: 'Website resmi Madrasah Ibtidaiyah Attaqwa 15 Babelan Kota, Bekasi. Membangun Generasi Islami yang Cerdas, Berakhlak, dan Berprestasi.',
};

export default function FrontendLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <div className="min-h-full flex flex-col bg-[#EFF3FB]">
        <SmoothScrolling>
          <Header />
          <main className="flex-grow pt-24 pb-12">{children}</main>
          <Footer />
        </SmoothScrolling>
      </div>
    </>
  );
}
