import React from 'react';
import Image from 'next/image';
import { Newspaper } from 'lucide-react';
import { getPublishedNews } from '@/lib/api/news';
import NewsCard from '@/components/frontend/NewsCard';
import AnimatedSection from '@/components/frontend/AnimatedSection';

export const metadata = {
  title: 'Berita & Artikel - MI Attaqwa 15 Babelan',
  description: 'Kumpulan berita, artikel pendidikan, dan informasi terbaru dari MI Attaqwa 15 Babelan',
};

export default async function NewsPage() {
  const allNews = await getPublishedNews();
  
  // Ambil 1 berita featured untuk hero headline
  const featuredArticle = allNews.find(news => news.isFeatured) || allNews[0];
  
  // Ambil berita sisanya
  const regularArticles = featuredArticle 
    ? allNews.filter(news => news.id !== featuredArticle.id)
    : [];

  return (
    <div className="flex flex-col w-full min-h-screen bg-[#F8FAFC]">
      
      {/* Hero Section */}
      <AnimatedSection direction="none" delay={0.1}>
      <section className="relative pt-32 pb-16 lg:pt-40 lg:pb-20 overflow-hidden flex flex-col justify-center bg-[#002957]">
        {/* Background Image */}
        <div className="absolute inset-0 z-0">
          <Image
            src="/bgheader.png"
            alt="Header Background Berita"
            fill
            priority
            className="object-cover opacity-30"
          />
        </div>

        {/* Overlay gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#002957]/90 to-[#002957] z-0" />
        
        {/* Decorative */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/20 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/3 z-0"></div>
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-accent/20 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/3 z-0"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <span className="inline-flex items-center gap-2 py-1.5 px-4 rounded-full bg-white/10 border border-white/20 text-white font-body text-sm font-bold tracking-wider uppercase mb-6 backdrop-blur-sm">
            <Newspaper className="w-4 h-4 text-primary" />
            Pusat Informasi
          </span>
          <h1 className="font-headline font-black text-4xl sm:text-5xl lg:text-6xl mb-6 leading-tight text-white">
            Berita & <span className="text-primary">Artikel</span>
          </h1>
          <p className="font-body text-gray-300 text-lg max-w-2xl mx-auto">
            Ikuti perkembangan terbaru, prestasi siswa, dan artikel pendidikan menarik seputar MI Attaqwa 15 Babelan.
          </p>
        </div>
      </section>
      </AnimatedSection>

      {/* Featured Headline Section */}
      <AnimatedSection direction="up" delay={0.2}>
      <section className="py-12 -mt-10 lg:-mt-16 relative z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {featuredArticle ? (
            <NewsCard article={featuredArticle} featured={true} />
          ) : (
            <div className="bg-white p-12 rounded-[2rem] text-center text-gray-500 shadow-sm border border-gray-100">
              Belum ada berita atau artikel yang diterbitkan saat ini.
            </div>
          )}
        </div>
      </section>
      </AnimatedSection>

      {/* Categories Filter (Visual only for now) */}
      <AnimatedSection direction="up">
      <section className="pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center justify-center gap-3 border-b border-gray-200 pb-8">
            <button className="px-6 py-2.5 rounded-full bg-secondary text-white font-body text-sm font-bold shadow-md transition-all">
              Semua Berita
            </button>
            <button className="px-6 py-2.5 rounded-full bg-white text-gray-600 hover:text-secondary hover:bg-gray-50 border border-gray-200 font-body text-sm font-bold transition-all">
              Berita Sekolah
            </button>
            <button className="px-6 py-2.5 rounded-full bg-white text-gray-600 hover:text-secondary hover:bg-gray-50 border border-gray-200 font-body text-sm font-bold transition-all">
              Artikel Pendidikan
            </button>
            <button className="px-6 py-2.5 rounded-full bg-white text-gray-600 hover:text-secondary hover:bg-gray-50 border border-gray-200 font-body text-sm font-bold transition-all">
              Prestasi
            </button>
          </div>
        </div>
      </section>
      </AnimatedSection>

      {/* Article Grid */}
      <AnimatedSection direction="up">
      <section className="pb-20 lg:pb-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {regularArticles.map((article) => (
              <NewsCard key={article.id} article={article} />
            ))}
          </div>
          
          {/* Pagination / Load More */}
          <div className="mt-16 text-center">
            <button className="inline-flex items-center justify-center px-8 py-3.5 rounded-full font-body text-sm font-bold bg-white text-secondary border-2 border-gray-200 hover:border-secondary hover:bg-gray-50 transition-all shadow-sm">
              Muat Lebih Banyak
            </button>
          </div>
        </div>
      </section>
      </AnimatedSection>

    </div>
  );
}
