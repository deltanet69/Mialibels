import React from 'react';
import type { Metadata } from 'next';
import { getPublishedNews } from '@/lib/api/news';
import NewsPageClient from '@/components/frontend/NewsPageClient';

export const metadata: Metadata = {
  title: 'Berita & Artikel - MI Attaqwa 15 Babelan',
  description: 'Kumpulan berita, artikel pendidikan, dan informasi terbaru dari MI Attaqwa 15 Babelan',
};

export default async function NewsPage() {
  const allNews = await getPublishedNews();
  return <NewsPageClient allNews={allNews} />;
}
