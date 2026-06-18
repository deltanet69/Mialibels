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
  Link as LinkIcon
} from 'lucide-react';
import { getNewsBySlug, getRelatedNews } from '@/lib/api/news';
import NewsCard from '@/components/frontend/NewsCard';
import AnimatedSection from '@/components/frontend/AnimatedSection';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const article = await getNewsBySlug(slug);
  if (!article) return { title: 'Artikel Tidak Ditemukan' };
  
  return {
    title: `${article.title} - MI Attaqwa 15 Babelan`,
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
    <div className="flex flex-col w-full min-h-screen bg-white pt-24 pb-20">
      
      {/* Breadcrumbs */}
      <AnimatedSection direction="down" delay={0.1}>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 w-full py-6">
        <nav className="flex items-center text-sm font-body text-gray-500 gap-2">
          <Link href="/" className="hover:text-primary transition-colors flex items-center gap-1">
            <Home className="w-4 h-4" />
          </Link>
          <ChevronRight className="w-4 h-4 text-gray-300" />
          <Link href="/news" className="hover:text-primary transition-colors font-medium">
            Artikel & Berita
          </Link>
          <ChevronRight className="w-4 h-4 text-gray-300" />
          <span className="text-gray-800 font-semibold truncate max-w-[200px] sm:max-w-xs">
            {article.title}
          </span>
        </nav>
      </div>
      </AnimatedSection>

      {/* Article Header */}
      <AnimatedSection direction="up" delay={0.2}>
      <header className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 w-full mb-10 text-center sm:text-left">
        <div className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary font-body text-sm font-bold tracking-wider uppercase mb-6">
          {article.category}
        </div>
        <h1 className="font-headline font-black text-3xl sm:text-4xl md:text-5xl text-secondary leading-tight mb-8">
          {article.title}
        </h1>
        
        {/* Meta Info */}
        <div className="flex flex-wrap items-center justify-center sm:justify-start gap-6 text-gray-500 font-body text-sm font-medium border-y border-gray-100 py-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
              <User className="w-4 h-4 text-gray-600" />
            </div>
            <span>{article.author}</span>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            <span>{article.date}</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            <span>{article.readTime} dibaca</span>
          </div>
        </div>
      </header>
      </AnimatedSection>

      {/* Hero Image */}
      <AnimatedSection direction="up" delay={0.3}>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 w-full mb-12">
        <div className="relative w-full aspect-video md:aspect-[21/9] rounded-[2rem] overflow-hidden shadow-xl bg-gray-100">
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
      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        {/* 
          Using custom descendant selectors for typography styling
          since @tailwindcss/typography might not be installed
        */}
        <article 
          className="max-w-none font-body text-gray-700 text-lg leading-relaxed
            [&>p]:mb-6
            [&>h2]:font-headline [&>h2]:font-bold [&>h2]:text-2xl [&>h2]:text-secondary [&>h2]:mt-10 [&>h2]:mb-4
            [&>h3]:font-headline [&>h3]:font-bold [&>h3]:text-xl [&>h3]:text-secondary [&>h3]:mt-8 [&>h3]:mb-3
            [&>blockquote]:border-l-4 [&>blockquote]:border-primary [&>blockquote]:bg-gray-50 [&>blockquote]:py-4 [&>blockquote]:px-6 [&>blockquote]:rounded-r-2xl [&>blockquote]:italic [&>blockquote]:text-secondary [&>blockquote]:font-medium [&>blockquote]:my-8
            [&>ul]:list-disc [&>ul]:pl-6 [&>ul]:mb-6 [&>ul>li]:mb-2
            [&>ol]:list-decimal [&>ol]:pl-6 [&>ol]:mb-6 [&>ol>li]:mb-2
            [&>a]:text-primary [&>a]:underline hover:[&>a]:text-blue-700"
          dangerouslySetInnerHTML={{ __html: article.content }}
        />

        {/* Tags & Share */}
        <div className="mt-16 pt-8 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <span className="font-body text-sm font-bold text-gray-500 uppercase tracking-wider">Tags:</span>
            <span className="px-4 py-1.5 rounded-full bg-gray-100 text-gray-600 font-body text-sm font-medium hover:bg-gray-200 cursor-pointer transition-colors">
              {article.category}
            </span>
            <span className="px-4 py-1.5 rounded-full bg-gray-100 text-gray-600 font-body text-sm font-medium hover:bg-gray-200 cursor-pointer transition-colors">
              Pendidikan
            </span>
          </div>

          <div className="flex items-center gap-3">
            <span className="font-body text-sm font-bold text-gray-500 uppercase tracking-wider">Bagikan:</span>
            <button className="w-10 h-10 rounded-full bg-gray-50 border border-gray-200 flex items-center justify-center text-gray-500 hover:text-primary hover:border-blue-200 hover:bg-blue-50 transition-all">
              <LinkIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
      </main>
      </AnimatedSection>

      {/* Related Articles */}
      <AnimatedSection direction="up">
      <section className="mt-20 bg-[#F8FAFC] py-16 lg:py-20 border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-10">
            <h2 className="font-headline font-black text-2xl md:text-3xl text-secondary">
              Baca Juga
            </h2>
            <Link href="/news" className="hidden sm:flex items-center text-primary font-bold hover:text-[#001d3d] transition-colors">
              Lihat Semua Berita
              <ChevronRight className="w-5 h-5 ml-1" />
            </Link>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {relatedArticles.map((relArticle) => (
              <NewsCard key={relArticle.id} article={relArticle} />
            ))}
          </div>

          <div className="mt-8 text-center sm:hidden">
            <Link href="/news" className="inline-flex items-center justify-center px-8 py-3 rounded-full font-body text-sm font-bold border-2 border-gray-200 text-secondary">
              Lihat Semua Berita
            </Link>
          </div>
        </div>
      </section>
      </AnimatedSection>

    </div>
  );
}
