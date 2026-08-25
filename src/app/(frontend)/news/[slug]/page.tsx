import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { 
  Calendar, 
  Clock, 
  User, 
  ChevronRight, 
  Home,
  Share2,
  ArrowLeft,
  Sparkles
} from 'lucide-react';
import { getNewsBySlug, getRelatedNews } from '@/lib/api/news';
import NewsCard from '@/components/frontend/NewsCard';
import AnimatedSection from '@/components/frontend/AnimatedSection';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const article = await getNewsBySlug(slug);
  if (!article) return { title: 'Artikel Tidak Ditemukan' };
  
  return {
    title: `${article.title} | MI Attaqwa 15 Babelan`,
    description: article.excerpt,
  };
}

export default async function NewsDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const article = await getNewsBySlug(slug);

  if (!article) {
    notFound();
  }

  // Ambil 3 artikel terkait (selain artikel ini)
  const relatedArticles = await getRelatedNews(article.id, 3);

  return (
    <div className="flex flex-col w-full min-h-screen bg-[#F4F7FC] pt-28 pb-20">
      
      {/* Breadcrumbs */}
      <AnimatedSection direction="down" delay={0.1}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 w-full py-4">
          <nav className="flex items-center text-xs sm:text-sm font-body text-gray-500 gap-2 bg-white/80 backdrop-blur-md px-4 py-2.5 rounded-full border border-gray-100 shadow-2xs w-fit">
            <Link href="/" className="hover:text-primary transition-colors flex items-center gap-1">
              <Home className="w-3.5 h-3.5" />
            </Link>
            <ChevronRight className="w-3.5 h-3.5 text-gray-300" />
            <Link href="/news" className="hover:text-primary transition-colors font-medium">
              Artikel &amp; Berita
            </Link>
            <ChevronRight className="w-3.5 h-3.5 text-gray-300" />
            <span className="text-secondary font-bold truncate max-w-[180px] sm:max-w-xs">
              {article.title}
            </span>
          </nav>
        </div>
      </AnimatedSection>

      {/* Article Header */}
      <AnimatedSection direction="up" delay={0.2}>
        <header className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 w-full mt-4 mb-8 text-center sm:text-left">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-teal-50 border border-teal-100 text-primary-dark font-body text-xs font-bold uppercase tracking-wider mb-5">
            <Sparkles className="w-3.5 h-3.5 text-accent" />
            <span>{article.category}</span>
          </div>
          <h1 className="font-headline font-black text-3xl sm:text-4xl md:text-5xl text-secondary leading-tight mb-6">
            {article.title}
          </h1>
          
          {/* Meta Info */}
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-5 text-gray-400 font-body text-xs sm:text-sm font-semibold border-y border-gray-200/70 py-3.5">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-teal-50 border border-teal-100 flex items-center justify-center text-teal-700">
                <User className="w-3.5 h-3.5" />
              </div>
              <span className="text-gray-600">{article.author}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-gray-400" />
              <span>{article.date}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-gray-400" />
              <span>{article.readTime}</span>
            </div>
          </div>
        </header>
      </AnimatedSection>

      {/* Hero Image */}
      <AnimatedSection direction="up" delay={0.3}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 w-full mb-10">
          <div className="relative w-full aspect-[16/9] rounded-[2.5rem] overflow-hidden shadow-xl bg-slate-100 border-4 border-white">
            <Image 
              src={article.imageUrl} 
              alt={article.title} 
              fill 
              priority
              className="object-cover"
            />
          </div>
        </div>
      </AnimatedSection>

      {/* Article Content */}
      <AnimatedSection direction="up">
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="bg-white p-8 sm:p-12 rounded-[2.5rem] shadow-sm border border-gray-100">
            <article 
              className="max-w-none font-body text-gray-700 text-base sm:text-lg leading-relaxed break-words overflow-hidden
                [&_p]:mb-6
                [&_h1]:font-headline [&_h1]:font-black [&_h1]:text-3xl [&_h1]:text-secondary [&_h1]:mt-10 [&_h1]:mb-4
                [&_h2]:font-headline [&_h2]:font-bold [&_h2]:text-2xl [&_h2]:text-secondary [&_h2]:mt-10 [&_h2]:mb-4
                [&_h3]:font-headline [&_h3]:font-bold [&_h3]:text-xl [&_h3]:text-secondary [&_h3]:mt-8 [&_h3]:mb-3
                [&_blockquote]:border-l-4 [&_blockquote]:border-primary [&_blockquote]:bg-slate-50 [&_blockquote]:py-4 [&_blockquote]:px-6 [&_blockquote]:rounded-r-2xl [&_blockquote]:italic [&_blockquote]:text-secondary [&_blockquote]:font-medium [&_blockquote]:my-8
                [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:mb-6 [&_ul_li]:mb-2
                [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:mb-6 [&_ol_li]:mb-2
                [&_a]:text-primary [&_a]:underline hover:[&_a]:text-blue-700
                [&_table]:w-full [&_table]:border-collapse [&_table]:my-6
                [&_th]:border [&_th]:border-gray-200 [&_th]:p-3 [&_th]:bg-slate-50 [&_th]:font-bold
                [&_td]:border [&_td]:border-gray-200 [&_td]:p-3
                [&_img]:rounded-2xl [&_img]:max-w-full [&_img]:mx-auto [&_img]:my-8
                [&_iframe]:w-full [&_iframe]:aspect-video [&_iframe]:rounded-2xl [&_iframe]:my-8
                [&_pre]:bg-slate-800 [&_pre]:text-slate-100 [&_pre]:p-4 [&_pre]:rounded-xl [&_pre]:overflow-x-auto [&_pre]:my-6
                [&_code]:bg-slate-100 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-sm [&_code]:font-mono"
              dangerouslySetInnerHTML={{ __html: article.content }}
            />

            {/* Tags & Navigation */}
            <div className="mt-12 pt-8 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <span className="font-body text-xs font-bold text-gray-400 uppercase tracking-wider">Kategori:</span>
                <span className="px-3.5 py-1 rounded-full bg-slate-100 text-secondary font-body text-xs font-bold">
                  {article.category}
                </span>
                <span className="px-3.5 py-1 rounded-full bg-slate-100 text-secondary font-body text-xs font-bold">
                  MI Attaqwa 15
                </span>
              </div>

              <div>
                <Link
                  href="/news"
                  className="btn-tactile inline-flex items-center gap-1.5 px-5 py-2 rounded-full font-body text-xs font-bold bg-slate-100 text-secondary hover:bg-primary hover:text-white transition-all"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Kembali ke Berita</span>
                </Link>
              </div>
            </div>
          </div>
        </main>
      </AnimatedSection>

      {/* Related Articles */}
      {relatedArticles.length > 0 && (
        <AnimatedSection direction="up">
          <section className="mt-16 py-12">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="font-headline font-black text-2xl md:text-3xl text-secondary">
                    Artikel &amp; Berita Lainnya
                  </h2>
                  <p className="font-body text-xs text-gray-400 mt-1">Simak kabar terbaru lainnya dari MI Attaqwa 15</p>
                </div>
                <Link href="/news" className="hidden sm:inline-flex items-center text-primary font-bold text-sm hover:text-btn-secondary transition-colors">
                  <span>Lihat Semua</span>
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Link>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                {relatedArticles.map((relArticle) => (
                  <NewsCard key={relArticle.id} article={relArticle} />
                ))}
              </div>

              <div className="mt-8 text-center sm:hidden">
                <Link href="/news" className="btn-tactile inline-flex items-center justify-center px-8 py-3 rounded-full font-body text-sm font-bold bg-white border border-gray-200 text-secondary shadow-2xs">
                  Lihat Semua Berita
                </Link>
              </div>
            </div>
          </section>
        </AnimatedSection>
      )}

    </div>
  );
}
