'use client'

import React, { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Newspaper, ChevronLeft, ChevronRight, Calendar, Clock, ArrowRight, Sparkles } from 'lucide-react'
import { NewsArticle } from '@/lib/api/news'
import NewsCard from '@/components/frontend/NewsCard'
import AnimatedSection from '@/components/frontend/AnimatedSection'

const CATEGORIES = ['Semua Berita', 'Berita Sekolah', 'Artikel Pendidikan', 'Prestasi']
const PAGE_SIZE = 9

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
        className={`flex flex-col md:flex-row bg-white rounded-[2.5rem] overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-500 border border-gray-100/90 ${animating ? 'opacity-0 scale-[0.99]' : 'opacity-100 scale-100'}`}
        style={{ transition: 'opacity 250ms, transform 250ms' }}
      >
        {/* Image */}
        <div className="relative w-full md:w-1/2 aspect-[16/10] md:aspect-auto overflow-hidden min-h-[280px] bg-slate-100">
          <Image
            src={article.imageUrl}
            alt={article.title}
            fill
            className="object-cover transition-transform duration-700 group-hover:scale-105"
          />
          <span className="absolute top-4 left-4 bg-primary text-white text-xs font-bold px-3.5 py-1.5 rounded-full shadow-md backdrop-blur-md">
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
        <div className="w-full md:w-1/2 p-8 lg:p-12 flex flex-col justify-center">
          <div className="flex items-center gap-4 text-gray-400 text-xs font-semibold mb-4">
            <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5 text-gray-400" />{article.date}</span>
            <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 text-gray-400" />{article.readTime}</span>
          </div>
          <h2 className="font-headline font-black text-2xl lg:text-3xl text-secondary mb-4 leading-tight group-hover:text-primary transition-colors duration-300">
            {article.title}
          </h2>
          <p className="font-body text-gray-500 mb-6 line-clamp-3 leading-relaxed text-sm sm:text-base">{article.excerpt}</p>
          <div className="mt-auto flex items-center text-primary font-bold text-sm uppercase tracking-wider group-hover:text-btn-secondary transition-colors duration-300">
            <span>Baca Selengkapnya</span>
            <ArrowRight className="w-4 h-4 ml-2 transition-transform duration-300 group-hover:translate-x-1.5" />
          </div>
        </div>
      </Link>

      {/* Prev/Next nav buttons */}
      {articles.length > 1 && (
        <>
          <button
            type="button"
            onClick={prev}
            aria-label="Artikel sebelumnya"
            className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/95 hover:bg-white shadow-lg rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 hover:scale-110 active:scale-95"
          >
            <ChevronLeft size={20} className="text-secondary" />
          </button>
          <button
            type="button"
            onClick={next}
            aria-label="Artikel selanjutnya"
            className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/95 hover:bg-white shadow-lg rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 hover:scale-110 active:scale-95"
          >
            <ChevronRight size={20} className="text-secondary" />
          </button>
        </>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────
// Pagination Component
// ─────────────────────────────────────────────────────────
function Pagination({
  currentPage,
  totalPages,
  onPageChange,
}: {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
}) {
  if (totalPages <= 1) return null

  const getPageNumbers = (): (number | 'ellipsis')[] => {
    const pages: (number | 'ellipsis')[] = []
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i)
    } else {
      pages.push(1)
      if (currentPage > 3) pages.push('ellipsis')
      const start = Math.max(2, currentPage - 1)
      const end = Math.min(totalPages - 1, currentPage + 1)
      for (let i = start; i <= end; i++) pages.push(i)
      if (currentPage < totalPages - 2) pages.push('ellipsis')
      pages.push(totalPages)
    }
    return pages
  }

  return (
    <nav aria-label="Halaman berita" className="flex items-center justify-center gap-1.5 mt-14 select-none">
      {/* Prev */}
      <button
        type="button"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        aria-label="Halaman sebelumnya"
        className="btn-tactile inline-flex items-center justify-center h-10 px-3.5 rounded-full border border-gray-200 bg-white text-gray-500 text-sm font-medium hover:bg-gray-50 hover:border-gray-300 hover:text-secondary disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-2xs"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>

      {/* Page numbers */}
      {getPageNumbers().map((page, idx) =>
        page === 'ellipsis' ? (
          <span
            key={`ellipsis-${idx}`}
            className="inline-flex items-center justify-center h-10 w-10 text-gray-400 text-sm"
          >
            &hellip;
          </span>
        ) : (
          <button
            key={page}
            type="button"
            onClick={() => onPageChange(page)}
            aria-label={`Halaman ${page}`}
            aria-current={currentPage === page ? 'page' : undefined}
            className={`btn-tactile inline-flex items-center justify-center h-10 w-10 rounded-full border text-sm font-bold transition-all ${
              currentPage === page
                ? 'bg-secondary text-white border-secondary shadow-sm'
                : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50 hover:border-gray-300 hover:text-secondary shadow-2xs'
            }`}
          >
            {page}
          </button>
        )
      )}

      {/* Next */}
      <button
        type="button"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        aria-label="Halaman selanjutnya"
        className="btn-tactile inline-flex items-center justify-center h-10 px-3.5 rounded-full border border-gray-200 bg-white text-gray-500 text-sm font-medium hover:bg-gray-50 hover:border-gray-300 hover:text-secondary disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-2xs"
      >
        <ChevronRight className="w-4 h-4" />
      </button>
    </nav>
  )
}

// ─────────────────────────────────────────────────────────
// Main News Page (client-side, instant filtering + pagination)
// ─────────────────────────────────────────────────────────
export default function NewsPageClient({ allNews }: { allNews: NewsArticle[] }) {
  const [currentCategory, setCurrentCategory] = useState('Semua Berita')
  const [currentPage, setCurrentPage] = useState(1)

  // Featured: up to 3 articles tagged 'featured'
  const featuredArticles = allNews.filter(n => n.isFeatured).slice(0, 3)
  // Fallback: use first article if none are explicitly featured
  const slideshowArticles = featuredArticles.length > 0 ? featuredArticles : allNews.slice(0, 1)

  // Filter by category
  const filteredNews = currentCategory === 'Semua Berita'
    ? allNews
    : allNews.filter(n => n.category === currentCategory)

  // Pagination calculations
  const totalPages = Math.max(1, Math.ceil(filteredNews.length / PAGE_SIZE))
  const paginatedNews = filteredNews.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  )

  // Reset to page 1 when category changes
  const handleCategoryChange = (cat: string) => {
    setCurrentCategory(cat)
    setCurrentPage(1)
  }

  // Scroll to grid top when page changes
  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    const grid = document.getElementById('news-grid')
    if (grid) grid.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <div className="flex flex-col w-full min-h-screen bg-[#F4F7FC]">

      {/* Hero */}
      <AnimatedSection direction="none" delay={0.1}>
        <section className="relative pt-32 pb-16 lg:pt-40 lg:pb-20 overflow-hidden flex flex-col justify-center min-h-[420px] bg-mesh-radial">
          <div className="absolute inset-0 z-0">
            <Image src="/images/student_activity.png" alt="Header Background Berita" fill priority className="object-cover opacity-20 object-top" />
          </div>
          <div className="absolute inset-0 bg-gradient-to-b from-[#F4F7FC]/90 via-[#F4F7FC]/80 to-[#F4F7FC] z-0" />
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
            <div className="inline-flex items-center gap-2 py-2 px-5 rounded-full glass-pill text-primary-dark font-body text-xs sm:text-sm font-bold tracking-wider uppercase mb-5">
              <Newspaper className="w-3.5 h-3.5 text-btn-secondary" />
              <span>Pusat Informasi &amp; Publikasi</span>
            </div>
            <h1 className="font-headline font-black text-4xl sm:text-5xl lg:text-6xl mb-4 leading-tight text-secondary">
              Berita &amp; <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-700 via-teal-600 to-emerald-500">Artikel Edukasi</span>
            </h1>
            <p className="font-body text-gray-600 text-base sm:text-lg max-w-2xl mx-auto">
              Ikuti perkembangan terbaru, dokumentasi prestasi, dan tulisan pendidikan seputar MI Attaqwa 15 Babelan.
            </p>
          </div>
        </section>
      </AnimatedSection>

      {/* Featured Slideshow */}
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

      {/* Category Tabs */}
      <section id="news-grid" className="pb-6 pt-6 scroll-mt-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center justify-center gap-2.5 pb-6">
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => handleCategoryChange(cat)}
                className={`btn-tactile px-6 py-2.5 rounded-full font-body text-sm font-bold shadow-2xs transition-all border ${
                  currentCategory === cat 
                    ? 'bg-secondary text-white border-secondary shadow-sm' 
                    : 'bg-white text-gray-600 hover:text-secondary hover:bg-slate-50 border-gray-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Article count info */}
          {filteredNews.length > 0 && (
            <p className="text-center font-body text-xs sm:text-sm text-gray-400 mt-2">
              Menampilkan{' '}
              <strong className="text-secondary font-semibold">
                {(currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, filteredNews.length)}
              </strong>{' '}
              dari <strong className="text-secondary font-semibold">{filteredNews.length}</strong> artikel
            </p>
          )}
        </div>
      </section>

      {/* Article Grid */}
      <section className="pb-20 lg:pb-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {paginatedNews.length > 0 ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                {paginatedNews.map(article => (
                  <NewsCard key={article.id} article={article} />
                ))}
              </div>
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
              />
            </>
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
