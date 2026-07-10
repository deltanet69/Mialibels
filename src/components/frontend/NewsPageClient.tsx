'use client'

import React, { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Newspaper, ChevronLeft, ChevronRight, Calendar, Clock, ArrowRight } from 'lucide-react'
import { NewsArticle } from '@/lib/api/news'
import NewsCard from '@/components/frontend/NewsCard'
import AnimatedSection from '@/components/frontend/AnimatedSection'

const CATEGORIES = ['Semua Berita', 'Berita Sekolah', 'Artikel Pendidikan', 'Prestasi']

// ─────────────────────────────────────────────────────────
// Featured Slideshow — up to 3 featured articles
// ─────────────────────────────────────────────────────────
function FeaturedSlideshow({ articles }: { articles: NewsArticle[] }) {
  const [current, setCurrent] = useState(0)
  const [animating, setAnimating] = useState(false)

  const goto = useCallback((idx: number) => {
    if (animating) return
    setAnimating(true)
    setTimeout(() => {
      setCurrent(idx)
      setAnimating(false)
    }, 250)
  }, [animating])

  const prev = () => goto((current - 1 + articles.length) % articles.length)
  const next = () => goto((current + 1) % articles.length)

  // Auto-play
  useEffect(() => {
    if (articles.length <= 1) return
    const timer = setInterval(() => goto((current + 1) % articles.length), 6000)
    return () => clearInterval(timer)
  }, [current, articles.length, goto])

  if (!articles.length) return null

  const article = articles[current]

  return (
    <div className="relative group">
      <Link
        href={`/news/${article.slug}`}
        className={`flex flex-col md:flex-row bg-white rounded-[2rem] overflow-hidden shadow-sm hover:shadow-xl transition-all duration-500 border border-gray-100 ${animating ? 'opacity-0 scale-[0.99]' : 'opacity-100 scale-100'}`}
        style={{ transition: 'opacity 250ms, transform 250ms' }}
      >
        {/* Image */}
        <div className="relative w-full md:w-1/2 aspect-[4/3] md:aspect-auto overflow-hidden min-h-[260px]">
          <Image
            src={article.imageUrl}
            alt={article.title}
            fill
            className="object-cover transition-transform duration-700 group-hover:scale-105"
          />
          <span className="absolute top-4 left-4 bg-primary text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg">
            {article.category}
          </span>
          {/* Slide indicators */}
          {articles.length > 1 && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
              {articles.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={(e) => { e.preventDefault(); goto(i) }}
                  className={`h-2 rounded-full transition-all duration-300 ${i === current ? 'w-6 bg-white' : 'w-2 bg-white/50 hover:bg-white/80'}`}
                />
              ))}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="w-full md:w-1/2 p-8 lg:p-10 flex flex-col justify-center">
          <div className="flex items-center gap-4 text-gray-500 text-sm mb-4 font-medium">
            <span className="flex items-center gap-1.5"><Calendar className="w-4 h-4" />{article.date}</span>
            <span className="flex items-center gap-1.5"><Clock className="w-4 h-4" />{article.readTime}</span>
          </div>
          <h2 className="font-headline font-black text-2xl lg:text-3xl text-secondary mb-4 leading-tight group-hover:text-primary transition-colors duration-300">
            {article.title}
          </h2>
          <p className="font-body text-gray-600 mb-6 line-clamp-3 leading-relaxed">{article.excerpt}</p>
          <div className="mt-auto flex items-center text-primary font-bold text-sm uppercase tracking-wider group-hover:translate-x-2 transition-transform duration-300">
            Baca Selengkapnya <ArrowRight className="w-4 h-4 ml-2" />
          </div>
        </div>
      </Link>

      {/* Prev/Next nav buttons */}
      {articles.length > 1 && (
        <>
          <button
            type="button"
            onClick={prev}
            className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-white/90 hover:bg-white shadow-md rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <ChevronLeft size={18} className="text-secondary" />
          </button>
          <button
            type="button"
            onClick={next}
            className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-white/90 hover:bg-white shadow-md rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <ChevronRight size={18} className="text-secondary" />
          </button>
        </>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────
// Main News Page (client-side, instant filtering)
// ─────────────────────────────────────────────────────────
export default function NewsPageClient({ allNews }: { allNews: NewsArticle[] }) {
  const [currentCategory, setCurrentCategory] = useState('Semua Berita')

  // Featured: up to 3 articles tagged 'featured'
  const featuredArticles = allNews.filter(n => n.isFeatured).slice(0, 3)
  // Fallback: use first 3 articles if none are explicitly featured
  const slideshowArticles = featuredArticles.length > 0 ? featuredArticles : allNews.slice(0, 1)

  // Filtered grid — always excludes featured articles from main list on "Semua Berita"
  const filteredNews = currentCategory === 'Semua Berita'
    ? allNews.filter(n => !n.isFeatured || featuredArticles.length === 0)
    : allNews.filter(n => n.category === currentCategory)

  return (
    <div className="flex flex-col w-full min-h-screen bg-[#EFF3FB]">

      {/* Hero */}
      <AnimatedSection direction="none" delay={0.1}>
        <section className="relative pt-32 pb-16 lg:pt-40 lg:pb-20 overflow-hidden flex flex-col justify-center bg-[#EFF3FB]">
          <div className="absolute inset-0 z-0">
            <Image src="/images/student_activity.png" alt="Header Background Berita" fill priority className="object-cover opacity-20 object-top" />
          </div>
          <div className="absolute inset-0 bg-gradient-to-b from-[#EFF3FB]/95 via-[#EFF3FB]/90 to-[#EFF3FB] z-0" />
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
            <span className="inline-flex items-center gap-2 py-1.5 px-5 rounded-full bg-white border border-blue-100 text-secondary font-body text-sm font-bold tracking-wider uppercase mb-6 shadow-sm">
              <Newspaper className="w-5 h-5 text-btn-secondary" /> Pusat Informasi
            </span>
            <h1 className="font-headline font-black text-4xl sm:text-5xl lg:text-6xl mb-6 leading-tight text-secondary">
              Berita & <span className="text-primary">Artikel</span>
            </h1>
            <p className="font-body text-gray-600 text-lg md:text-xl max-w-2xl mx-auto">
              Ikuti perkembangan terbaru, prestasi siswa, dan artikel pendidikan menarik seputar MI Attaqwa 15 Babelan.
            </p>
          </div>
        </section>
      </AnimatedSection>

      {/* Featured Slideshow (always visible on all categories, shows featured/top articles) */}
      <AnimatedSection direction="up" delay={0.2}>
        <section className="py-8 -mt-8 lg:-mt-12 relative z-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {slideshowArticles.length > 0 ? (
              <FeaturedSlideshow articles={slideshowArticles} />
            ) : (
              <div className="bg-white p-12 rounded-[2rem] text-center text-gray-500 shadow-sm border border-gray-100">
                Belum ada berita atau artikel yang diterbitkan saat ini.
              </div>
            )}
          </div>
        </section>
      </AnimatedSection>

      {/* Category Tabs — instant, no page reload */}
      <section className="pb-6 pt-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center justify-center gap-3 border-b border-gray-200 pb-6">
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => setCurrentCategory(cat)}
                className={`px-6 py-2.5 rounded-full font-body text-sm font-bold shadow-sm transition-all border ${currentCategory === cat ? 'bg-secondary text-white border-secondary' : 'bg-white text-gray-600 hover:text-secondary hover:bg-gray-50 border-gray-200'}`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Article Grid */}
      <section className="pb-20 lg:pb-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {filteredNews.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredNews.map(article => (
                <NewsCard key={article.id} article={article} />
              ))}
            </div>
          ) : (
            <div className="bg-white p-12 rounded-3xl text-center text-gray-500 shadow-sm border border-gray-100">
              Belum ada artikel untuk kategori <strong>{currentCategory}</strong> saat ini.
            </div>
          )}
        </div>
      </section>

    </div>
  )
}
