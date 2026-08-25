import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Calendar, Clock, ArrowRight } from 'lucide-react';
import { NewsArticle } from '@/data/dummyNews';

interface NewsCardProps {
  article: NewsArticle;
  featured?: boolean;
}

export default function NewsCard({ article, featured = false }: NewsCardProps) {
  if (featured) {
    return (
      <Link 
        href={`/news/${article.slug}`}
        className="group relative flex flex-col md:flex-row bg-white rounded-[2rem] overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-500 border border-gray-100/80 hover:-translate-y-1"
      >
        <div className="relative w-full md:w-1/2 aspect-[16/10] md:aspect-auto overflow-hidden bg-slate-100">
          <Image 
            src={article.imageUrl} 
            alt={article.title} 
            fill 
            className="object-cover transition-transform duration-700 group-hover:scale-105"
          />
          <div className="absolute top-4 left-4">
            <span className="bg-primary text-white text-xs font-bold px-3.5 py-1.5 rounded-full shadow-md backdrop-blur-md">
              {article.category}
            </span>
          </div>
        </div>
        
        <div className="w-full md:w-1/2 p-8 lg:p-10 flex flex-col justify-center">
          <div className="flex items-center gap-4 text-gray-400 text-xs font-semibold mb-4">
            <div className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-gray-400" />
              <span>{article.date}</span>
            </div>
            {article.readTime && (
              <div className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-gray-400" />
                <span>{article.readTime}</span>
              </div>
            )}
          </div>
          
          <h2 className="font-headline font-black text-2xl lg:text-3xl text-secondary mb-4 leading-tight group-hover:text-primary transition-colors duration-300">
            {article.title}
          </h2>
          
          <p className="font-body text-gray-500 mb-6 line-clamp-3 leading-relaxed text-sm sm:text-base">
            {article.excerpt}
          </p>
          
          <div className="mt-auto flex items-center text-primary font-bold text-sm uppercase tracking-wider group-hover:text-btn-secondary transition-colors duration-300">
            <span>Baca Selengkapnya</span>
            <ArrowRight className="w-4 h-4 ml-2 transition-transform duration-300 group-hover:translate-x-1.5" />
          </div>
        </div>
      </Link>
    );
  }

  return (
    <Link 
      href={`/news/${article.slug}`}
      className="group flex flex-col bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-500 border border-gray-100/90 h-full hover:-translate-y-1.5"
    >
      <div className="relative w-full aspect-[16/10] overflow-hidden bg-slate-100">
        <Image 
          src={article.imageUrl} 
          alt={article.title} 
          fill 
          className="object-cover transition-transform duration-700 group-hover:scale-105"
        />
        <div className="absolute top-3.5 left-3.5">
          <span className="bg-white/90 backdrop-blur-md text-secondary text-xs font-bold px-3 py-1 rounded-full shadow-xs border border-white/60">
            {article.category}
          </span>
        </div>
      </div>
      
      <div className="p-6 flex flex-col flex-1 justify-between">
        <div>
          <div className="flex items-center gap-4 text-gray-400 text-xs mb-3 font-semibold">
            <div className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-gray-400" />
              <span>{article.date}</span>
            </div>
            {article.readTime && (
              <div className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-gray-400" />
                <span>{article.readTime}</span>
              </div>
            )}
          </div>
          
          <h3 className="font-headline font-black text-lg text-secondary mb-3 leading-snug group-hover:text-primary transition-colors duration-300 line-clamp-2">
            {article.title}
          </h3>
          
          <p className="font-body text-gray-500 text-sm mb-5 line-clamp-2 leading-relaxed">
            {article.excerpt}
          </p>
        </div>
        
        <div className="pt-4 border-t border-gray-50 flex items-center justify-between text-xs sm:text-sm">
          <span className="text-gray-400 font-medium">{article.author}</span>
          <span className="text-primary font-bold inline-flex items-center group-hover:text-btn-secondary transition-colors duration-300">
            <span>Baca</span>
            <ArrowRight className="w-4 h-4 ml-1 transition-transform duration-300 group-hover:translate-x-1" />
          </span>
        </div>
      </div>
    </Link>
  );
}
