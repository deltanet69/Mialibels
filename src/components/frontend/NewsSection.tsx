'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, Calendar, Clock, Sparkles } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';

// Define TS Interface for post
interface Post {
  id: string;
  title: string;
  content: string;
  thumbnail: string | null;
  category: 'berita' | 'pengumuman' | 'artikel' | 'kegiatan';
  slug: string;
  created_at: string;
  reading_time?: number;
}

// Fallback Mock Data
const mockPosts: Post[] = [
  {
    id: '1',
    title: 'Persiapan Ujian Akhir Semester Genap Tahun Ajaran 2026/2027',
    content: 'Menyambut pelaksanaan Ujian Akhir Semester (UAS) Genap, MI Attaqwa 15 Babelan menyelenggarakan pemantapan materi tambahan khusus bagi seluruh siswa kelas VI guna meraih hasil yang maksimal.',
    thumbnail: '/images/classroom_view.png',
    category: 'pengumuman',
    slug: 'persiapan-ujian-akhir-semester-2026-2027',
    created_at: '2026-06-05T08:00:00Z',
    reading_time: 3,
  },
  {
    id: '2',
    title: 'MI Attaqwa 15 Raih Juara Umum Lomba Keagamaan Tingkat Kecamatan',
    content: 'Alhamdulillah, delegasi siswa-siswi MI Attaqwa 15 Babelan berhasil memboyong piala juara umum pada perhelatan akbar Festival Anak Sholeh dengan memenangkan cabang pidato, tahfidz, dan adzan.',
    thumbnail: '/images/graduation_day.png',
    category: 'kegiatan',
    slug: 'mi-attaqwa-15-raih-juara-umum-lomba-keagamaan',
    created_at: '2026-06-03T09:30:00Z',
    reading_time: 4,
  },
  {
    id: '3',
    title: 'Implementasi Sistem Informasi Madrasah Digital Untuk Wali Murid',
    content: 'Sebagai langkah menuju digitalisasi madrasah secara menyeluruh, MI Attaqwa 15 meluncurkan aplikasi portal khusus wali murid untuk pemantauan realtime keuangan tabungan dan perkembangan akademik.',
    thumbnail: '/images/student_activity.png',
    category: 'artikel',
    slug: 'implementasi-sistem-informasi-madrasah-digital',
    created_at: '2026-05-28T14:15:00Z',
    reading_time: 5,
  },
];

const categoryStyles: Record<string, { bg: string; text: string; border: string }> = {
  berita: { bg: 'bg-teal-50', text: 'text-teal-700', border: 'border-teal-200' },
  pengumuman: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
  artikel: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
  kegiatan: { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
};

const categoryLabels: Record<string, string> = {
  berita: 'Berita',
  pengumuman: 'Pengumuman',
  artikel: 'Artikel',
  kegiatan: 'Kegiatan',
};

export default function NewsSection() {
  const [posts, setPosts] = useState<Post[]>(mockPosts);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchLatestNews() {
      try {
        const { data, error } = await supabase
          .from('posts')
          .select('id, title, content, thumbnail, category, slug, created_at, reading_time')
          .order('created_at', { ascending: false })
          .limit(3);

        if (error) {
          throw error;
        }

        if (data && data.length > 0) {
          const typedData = data.map((item: any) => ({
            ...item,
            category: item.category as Post['category'],
          }));
          setPosts(typedData);
        }
      } catch (err) {
        console.warn('Failed to fetch from Supabase, rendering mock posts:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchLatestNews();
  }, []);

  return (
    <section className="py-20 lg:py-28 bg-[#F4F7FC]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Title Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-12">
          <div className="flex flex-col space-y-3">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-teal-50 border border-teal-100 text-primary-dark font-body text-xs font-bold uppercase tracking-wider w-fit">
              <span>Kabar & Artikel Madrasah</span>
            </div>
            <h2 className="font-headline font-black text-3xl sm:text-4xl text-secondary">
              BERITA & KEGIATAN TERKINI
            </h2>
          </div>
          <Link
            href="/news"
            className="btn-tactile inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full font-body text-sm font-bold bg-btn-primary text-white shadow-md shadow-blue-950/15 hover:bg-[#001d3d] hover:shadow-lg transition-all"
          >
            <span>Lihat Semua Artikel</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-7">
          {posts.map((post) => {
            const dateStr = new Date(post.created_at).toLocaleDateString('id-ID', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
            });

            const cat = categoryStyles[post.category] || categoryStyles.berita;

            return (
              <article
                key={post.id}
                className="group bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-500 flex flex-col h-full border border-gray-100/90 hover:-translate-y-1.5"
              >
                {/* Image Wrap */}
                <div className="relative w-full aspect-[16/10] overflow-hidden bg-slate-100">
                  <Image
                    src={post.thumbnail || '/images/classroom_view.png'}
                    alt={post.title}
                    fill
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute top-3.5 left-3.5">
                    <span
                      className={`text-xs font-bold px-3 py-1 rounded-full border shadow-xs backdrop-blur-md ${cat.bg}/90 ${cat.text} ${cat.border}`}
                    >
                      {categoryLabels[post.category] || post.category}
                    </span>
                  </div>
                </div>

                {/* Content Block */}
                <div className="p-6 flex flex-col flex-grow space-y-4 justify-between">
                  <div className="space-y-3">
                    
                    {/* Meta Info (Date & Read time) */}
                    <div className="flex items-center gap-4 text-gray-400 text-xs font-semibold">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-gray-400" />
                        <span>{dateStr}</span>
                      </div>
                      {post.reading_time && (
                        <div className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-gray-400" />
                          <span>{post.reading_time} mnt baca</span>
                        </div>
                      )}
                    </div>

                    {/* Post Title */}
                    <h3 className="font-headline font-black text-xl text-secondary line-clamp-2 leading-snug group-hover:text-primary transition-colors duration-300">
                      <Link href={`/news/${post.slug}`}>{post.title}</Link>
                    </h3>

                    {/* Excerpt content */}
                    <p className="font-body text-gray-500 text-sm line-clamp-3 leading-relaxed">
                      {post.content
                        .replace(/<[^>]*>?/gm, '')
                        .replace(/&nbsp;/g, ' ')
                        .replace(/&amp;/g, '&')
                        .replace(/&lt;/g, '<')
                        .replace(/&gt;/g, '>')
                        .replace(/&quot;/g, '"')
                        .replace(/&#39;/g, "'")
                        .trim()}
                    </p>
                  </div>

                  {/* Read More Link */}
                  <div className="pt-2 border-t border-gray-50 flex items-center justify-between">
                    <Link
                      href={`/news/${post.slug}`}
                      className="inline-flex items-center font-body text-sm font-bold text-primary group-hover:text-btn-secondary transition-colors duration-300"
                    >
                      <span>Baca Selengkapnya</span>
                      <ArrowRight className="w-4 h-4 ml-1.5 transition-transform duration-300 group-hover:translate-x-1" />
                    </Link>
                  </div>

                </div>
              </article>
            );
          })}
        </div>

      </div>
    </section>
  );
}
