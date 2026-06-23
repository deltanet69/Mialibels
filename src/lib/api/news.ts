import { createClient } from '@supabase/supabase-js';

// We initialize a client for server-side fetching in the app dir or server actions.
// Using env vars, fallback to empty string so it doesn't crash on build if missing.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

export interface NewsArticle {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  category: string;
  date: string;
  author: string;
  imageUrl: string;
  isFeatured: boolean;
  readTime: string;
}

// Helper to map Supabase post to NewsArticle
function mapPostToArticle(post: any): NewsArticle {
  // Strip HTML tags for excerpt
  const strippedContent = post.content ? post.content.replace(/<[^>]*>?/gm, '') : '';
  const excerpt = strippedContent.length > 150 ? strippedContent.substring(0, 150) + '...' : strippedContent;

  return {
    id: post.id,
    slug: post.slug || post.id,
    title: post.title,
    excerpt: excerpt,
    content: post.content,
    category: post.category || 'Berita',
    date: new Date(post.created_at).toLocaleDateString('id-ID', {
      day: 'numeric', month: 'long', year: 'numeric'
    }),
    author: post.author || 'Admin',
    imageUrl: post.thumbnail || '/images/school_building.png',
    isFeatured: post.tags?.includes('featured') || false,
    readTime: post.reading_time ? `${post.reading_time} Menit` : '3 Menit'
  };
}

/**
 * Fetch all published news articles
 */
export async function getPublishedNews(): Promise<NewsArticle[]> {
  const { data, error } = await supabase
    .from('posts')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching news:', error);
    return [];
  }

  return (data || []).map(mapPostToArticle);
}

/**
 * Fetch a single news article by its slug
 */
export async function getNewsBySlug(slug: string): Promise<NewsArticle | null> {
  const { data, error } = await supabase
    .from('posts')
    .select('*')
    .eq('slug', slug)
    .single();

  if (error || !data) {
    return null;
  }

  return mapPostToArticle(data);
}

/**
 * Fetch related news articles
 */
export async function getRelatedNews(currentId: string, limit: number = 3): Promise<NewsArticle[]> {
  const { data, error } = await supabase
    .from('posts')
    .select('*')
    .neq('id', currentId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching related news:', error);
    return [];
  }

  return (data || []).map(mapPostToArticle);
}
