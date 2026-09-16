'use client';

import React, { useState } from 'react';
import { X } from 'lucide-react';
import { NoticeItem, MOCKUP_NOTICES } from './types';
import { ParentInformasiMobile } from './ParentInformasiMobile';
import { ParentInformasiDesktop } from './ParentInformasiDesktop';

export * from './types';

export function ParentInformasiClient() {
  const [selectedCategory, setSelectedCategory] = useState<string>('Semua');
  const [activeNotice, setActiveNotice] = useState<NoticeItem | null>(null);

  const categories = ['Semua', 'Pengumuman', 'Kegiatan', 'Keuangan'];

  const filteredNotices = MOCKUP_NOTICES.filter((item) => {
    if (selectedCategory === 'Semua') return true;
    return item.category === selectedCategory;
  });

  return (
    <div className="w-full max-w-full">
      {/* 📱 MOBILE FIRST EXPERIENCE (md:hidden) */}
      <div className="md:hidden">
        <ParentInformasiMobile
          categories={categories}
          selectedCategory={selectedCategory}
          setSelectedCategory={setSelectedCategory}
          filteredNotices={filteredNotices}
          onSelectNotice={setActiveNotice}
        />
      </div>

      {/* 💻 DESKTOP EXPERIENCE (hidden md:block) */}
      <div className="hidden md:block">
        <ParentInformasiDesktop
          categories={categories}
          selectedCategory={selectedCategory}
          setSelectedCategory={setSelectedCategory}
          filteredNotices={filteredNotices}
          onSelectNotice={setActiveNotice}
        />
      </div>

      {/* SHARED NOTICE DETAIL MODAL */}
      {activeNotice && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 sm:p-6 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${activeNotice.pillColor}`}>
                {activeNotice.category}
              </span>
              <button
                onClick={() => setActiveNotice(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>
            <h3 className="font-bold text-base text-slate-800 mb-1">{activeNotice.title}</h3>
            <p className="text-[11px] text-slate-400 mb-4">Diterbitkan pada {activeNotice.date} oleh {activeNotice.author}</p>
            <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-line mb-6">
              {activeNotice.content}
            </p>
            <button
              onClick={() => setActiveNotice(null)}
              className="w-full py-2.5 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 transition cursor-pointer active:scale-95"
            >
              Tutup
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
