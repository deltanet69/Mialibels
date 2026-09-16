'use client';

import React from 'react';
import { NoticeItem } from './types';

interface ParentInformasiDesktopProps {
  categories: string[];
  selectedCategory: string;
  setSelectedCategory: (cat: string) => void;
  filteredNotices: NoticeItem[];
  onSelectNotice: (notice: NoticeItem) => void;
}

export function ParentInformasiDesktop({
  categories,
  selectedCategory,
  setSelectedCategory,
  filteredNotices,
  onSelectNotice,
}: ParentInformasiDesktopProps) {
  return (
    <div className="space-y-5 max-w-5xl mx-auto font-sans">
      {/* Header Banner */}
      <div 
        className="rounded-2xl py-6 px-6 text-white shadow-md relative overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, #002957 0%, #163364 50%, #1e4480 100%)',
          backgroundColor: '#002957',
          color: '#ffffff',
        }}
      >
        <div className="relative z-10">
          <div className="flex items-center gap-2 text-blue-200/90 text-xs font-bold uppercase tracking-widest mb-2" style={{ color: '#bfdbfe' }}>
            <span className="px-2.5 py-0.5 rounded-full" style={{ backgroundColor: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.2)' }}>
              MI Attaqwa 15
            </span>
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight leading-none mb-2" style={{ color: '#ffffff' }}>
            Informasi Sekolah
          </h1>
          <p className="text-sm" style={{ color: '#dbeafe' }}>
            Papan pengumuman resmi, surat edaran, dan informasi penting madrasah.
          </p>
        </div>
      </div>

      {/* Category Pills Filter */}
      <div className="flex items-center gap-2">
        {categories.map((cat) => {
          const isActive = selectedCategory === cat;
          return (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-full text-xs font-bold transition-all border cursor-pointer ${
                isActive
                  ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
            >
              {cat}
            </button>
          );
        })}
      </div>

      {/* Grid of Notice Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredNotices.length === 0 ? (
          <div className="col-span-2 py-12 text-center bg-white rounded-2xl border border-slate-100 shadow-xs">
            <p className="text-slate-500 text-sm">Tidak ada informasi untuk kategori {selectedCategory}.</p>
          </div>
        ) : (
          filteredNotices.map((notice) => (
            <div
              key={notice.id}
              onClick={() => onSelectNotice(notice)}
              className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm hover:border-blue-300 transition-colors cursor-pointer"
            >
              <div className="flex items-center justify-between mb-3">
                <span className={`text-xs font-bold px-3 py-1 rounded-full ${notice.pillColor}`}>
                  {notice.category}
                </span>
                <span className="text-xs text-slate-400 font-medium">{notice.date}</span>
              </div>
              <h3 className="font-bold text-base text-slate-800 mb-2">{notice.title}</h3>
              <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">{notice.content}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
