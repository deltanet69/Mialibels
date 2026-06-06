'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
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

const categoryColors = {
  berita: 'bg-teal-50 text-teal-700 border-teal-100',
  pengumuman: 'bg-amber-50 text-amber-700 border-amber-100',
  artikel: 'bg-blue-50 text-blue-700 border-blue-100',
  kegiatan: 'bg-purple-50 text-purple-700 border-purple-100',
};

const categoryLabels = {
  berita: 'Berita Terbaru',
  pengumuman: 'Pengumuman',
  artikel: 'Artikel Opini',
  kegiatan: 'Kegiatan Sekolah',
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
          // Map to correct category types
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
    <section className="py-20 lg:py-28 bg-[#EFF3FB]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Title Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-12">
          <div className="flex flex-col space-y-3">
            <span className="font-body text-sm font-bold text-accent tracking-wider uppercase">
              Berita & Artikel
            </span>
            <h2 className="font-headline font-black text-3xl sm:text-4xl text-secondary">
              BERITA UPDATE MIA 15
            </h2>
          </div>
          <Link
            href="/news"
            className="inline-flex items-center justify-center px-6 py-3 rounded-full font-body text-sm font-bold bg-[#002957] text-white transition-all duration-300 hover:bg-[#001d3d] hover:-translate-y-0.5 hover:shadow-lg active:translate-y-0"
          >
            Berita Selengkapnya
          </Link>
        </div>

        {/* Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {posts.map((post) => {
            const dateStr = new Date(post.created_at).toLocaleDateString('id-ID', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            });

            return (
              <article
                key={post.id}
                className="bg-white rounded-3xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 flex flex-col h-full border border-gray-100 group hover:-translate-y-1"
              >
                {/* Image Wrap */}
                <div className="relative w-full aspect-[16/10] overflow-hidden bg-gray-100">
                  <Image
                    src={post.thumbnail || '/images/classroom_view.png'}
                    alt={post.title}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                </div>

                {/* Content Block */}
                <div className="p-6 flex flex-col flex-grow space-y-4 justify-between">
                  <div className="space-y-3">
                    
                    {/* Meta info & Category badge */}
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className={`text-xs font-bold px-3 py-1 rounded-full border ${
                          categoryColors[post.category] || categoryColors.berita
                        }`}
                      >
                        {categoryLabels[post.category] || post.category}
                      </span>
                      <span className="font-body text-xs font-medium text-gray-400">
                        {dateStr}
                      </span>
                    </div>

                    {/* Post Title */}
                    <h3 className="font-headline font-black text-lg text-secondary line-clamp-2 leading-snug group-hover:text-primary transition-colors duration-300">
                      <Link href={`/news/${post.slug}`}>{post.title}</Link>
                    </h3>

                    {/* Excerpt content */}
                    <p className="font-body text-gray-500 text-sm line-clamp-3 leading-relaxed">
                      {post.content}
                    </p>
                  </div>

                  {/* Read More Link */}
                  <div className="pt-2">
                    <Link
                      href={`/news/${post.slug}`}
                      className="inline-flex items-center font-body text-sm font-bold text-primary group-hover:text-secondary transition-colors duration-300"
                    >
                      Read more...
                      <ArrowUpRight className="w-4 h-4 ml-1 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
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
