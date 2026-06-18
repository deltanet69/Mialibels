import { dummyNews, NewsArticle } from '@/data/dummyNews';

// TODO: Replace with actual Supabase client later
// import { createClient } from '@/lib/supabase/server';

/**
 * Fetch all published news articles
 * Currently returns dummy data, ready to be swapped with DB logic
 */
export async function getPublishedNews(): Promise<NewsArticle[]> {
  // Simulate network delay
  // await new Promise(resolve => setTimeout(resolve, 500));
  
  // Nanti ganti dengan:
  // const supabase = createClient();
  // const { data, error } = await supabase.from('news').select('*').eq('status', 'published').order('date', { ascending: false });
  // if (error) throw error;
  // return data;

  return dummyNews;
}

/**
 * Fetch a single news article by its slug
 */
export async function getNewsBySlug(slug: string): Promise<NewsArticle | null> {
  // Simulate network delay
  // await new Promise(resolve => setTimeout(resolve, 500));
  
  // Nanti ganti dengan:
  // const supabase = createClient();
  // const { data, error } = await supabase.from('news').select('*').eq('slug', slug).single();
  // if (error) return null;
  // return data;

  const article = dummyNews.find(n => n.slug === slug);
  return article || null;
}

/**
 * Fetch related news articles
 */
export async function getRelatedNews(currentId: string, limit: number = 3): Promise<NewsArticle[]> {
  // Nanti ganti dengan:
  // const supabase = createClient();
  // const { data, error } = await supabase.from('news').select('*').neq('id', currentId).limit(limit);
  // if (error) return [];
  // return data;

  return dummyNews.filter(n => n.id !== currentId).slice(0, limit);
}
