'use client';

import React from 'react';
import Link from 'next/link';
import { 
  ChevronRight, 
  Bell, 
  Calendar, 
  Megaphone, 
  CalendarDays, 
  CreditCard, 
  Info, 
  BellOff,
  Sparkles
} from 'lucide-react';
import { ParentNotificationBell } from '@/components/parent/notifications/ParentNotificationBell';
import { NoticeItem } from './types';
import { 
  AnimatedAllTabIcon, 
  AnimatedMegaphoneTabIcon, 
  AnimatedCalendarTabIcon, 
  AnimatedCoinsTabIcon 
} from '@/components/parent/AnimatedNavIcons';

interface ParentInformasiMobileProps {
  categories: string[];
  selectedCategory: string;
  setSelectedCategory: (cat: string) => void;
  filteredNotices: NoticeItem[];
  onSelectNotice: (notice: NoticeItem) => void;
}

export function ParentInformasiMobile({
  categories,
  selectedCategory,
  setSelectedCategory,
  filteredNotices,
  onSelectNotice,
}: ParentInformasiMobileProps) {
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Pengumuman':
        return <Megaphone size={18} className="text-blue-600" />;
      case 'Kegiatan':
        return <CalendarDays size={18} className="text-purple-600" />;
      case 'Keuangan':
        return <CreditCard size={18} className="text-amber-600" />;
      default:
        return <Info size={18} className="text-slate-600" />;
    }
  };

  const TAB_ITEMS = [
    { id: 'Semua', label: 'Semua', Icon: AnimatedAllTabIcon },
    { id: 'Pengumuman', label: 'Pengumuman', Icon: AnimatedMegaphoneTabIcon },
    { id: 'Kegiatan', label: 'Kegiatan', Icon: AnimatedCalendarTabIcon },
    { id: 'Keuangan', label: 'Keuangan', Icon: AnimatedCoinsTabIcon },
  ];

  return (
    <div className="w-full pb-28 font-sans bg-[#f4f7fb] min-h-screen" style={{ backgroundColor: '#f4f7fb' }}>
      {/* 1. Header Banner (Consistent Dashboard/Profile Deep Navy Gradient + Glow + School Badge) */}
      <div 
        className="bg-gradient-to-b from-[#0d3880] via-[#1557bf] to-[#1d6bf0] pt-10 pb-20 px-5 text-white relative overflow-hidden"
        style={{
          background: 'linear-gradient(180deg, #163364ff 0%, #1e4480ff 55%, #1557bf 100%)',
          backgroundColor: '#163364',
          paddingTop: '32px',
          paddingBottom: '82px',
          paddingLeft: '20px',
          paddingRight: '20px',
          color: '#ffffff',
        }}
      >
        {/* Ambient Glow */}
        <div 
          className="absolute top-0 right-0 w-48 h-48 rounded-full pointer-events-none -mr-12 -mt-12 opacity-20" 
          style={{ background: 'radial-gradient(circle, #38bdf8 0%, rgba(255,255,255,0) 70%)' }} 
        />

        {/* Top Row: Title + Notification Bell */}
        <div className="flex justify-between items-start relative z-5">
          <div>
            <h1 className="text-[22px] font-extrabold text-white tracking-tight leading-snug m-0" style={{ fontSize: '22px', fontWeight: 800, color: '#ffffff' }}>
              Informasi Sekolah
            </h1>
            <p className="text-xs text-white/80 mt-1 mb-0" style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.8)' }}>
              Pengumuman resmi & agenda kegiatan madrasah
            </p>
          </div>

          {/* Notification Bell Button */}
          <ParentNotificationBell />
        </div>
      </div>

      {/* 2. Floating Sub-Tab Segmented Card (-mt-14) */}
      <div 
        className="-mt-14 px-4 relative z-20"
        style={{ marginTop: '-56px', paddingLeft: '16px', paddingRight: '16px', position: 'relative', zIndex: 20 }}
      >
        <div className="bg-white rounded-2xl p-1.5 shadow-[0_12px_32px_-6px_rgba(22,51,100,0.12)] border border-slate-100 flex items-center justify-between gap-1 relative overflow-hidden">
          {TAB_ITEMS.map((tab) => {
            const isActive = selectedCategory === tab.id;
            const TabIcon = tab.Icon;
            return (
              <button
                key={tab.id}
                onClick={() => setSelectedCategory(tab.id)}
                className={`flex-1 py-2 px-1 rounded-xl transition-all duration-200 flex flex-col items-center justify-center gap-1 cursor-pointer active:scale-95 ${
                  isActive
                    ? 'bg-blue-50/90 text-blue-700 border border-blue-200/70 shadow-2xs font-extrabold'
                    : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50/80 border border-transparent font-semibold'
                }`}
              >
                <div className="h-6 w-6 flex items-center justify-center">
                  <TabIcon isActive={isActive} />
                </div>
                <span className={`text-[11px] tracking-tight transition-colors ${isActive ? 'text-blue-700 font-black' : 'text-slate-500'}`}>
                  {tab.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Section Header & Notice Items List */}
      <div className="px-4 mt-5 space-y-3">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-1.5">
            <Megaphone size={14} className="text-blue-600" />
            <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-600 m-0">
              PENGUMUMAN & ARTIKEL RESMI
            </h2>
          </div>
          <span className="text-[10px] font-bold text-slate-400">
            {filteredNotices.length} Informasi
          </span>
        </div>

        {filteredNotices.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 border border-slate-100 shadow-xs text-center flex flex-col items-center">
            <BellOff className="w-10 h-10 text-slate-300 mx-auto mb-2" strokeWidth={1.5} />
            <p className="font-bold text-slate-800 text-sm mt-2">Tidak ada pengumuman</p>
            <p className="text-xs text-slate-400 mt-1">Belum ada informasi untuk kategori {selectedCategory}.</p>
          </div>
        ) : (
          filteredNotices.map((notice) => (
            <div
              key={notice.id}
              onClick={() => onSelectNotice(notice)}
              className="bg-white rounded-2xl p-3.5 border border-slate-100 shadow-sm flex items-center justify-between gap-3 active:scale-98 transition-transform cursor-pointer hover:border-blue-200"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0">
                  {getCategoryIcon(notice.category)}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${notice.pillColor}`}>
                      {notice.category}
                    </span>
                    <span className="text-[10px] text-slate-400 font-medium">
                      {notice.date}
                    </span>
                  </div>
                  <h4 className="font-bold text-xs text-slate-800 mt-1 leading-snug line-clamp-1 m-0">
                    {notice.title}
                  </h4>
                  <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5 m-0">
                    {notice.content}
                  </p>
                </div>
              </div>
              <ChevronRight size={16} className="text-slate-300 shrink-0" />
            </div>
          ))
        )}
      </div>

      {/* Whitespace spacer for Floating Bottom Nav */}
      <div className="h-12 w-full shrink-0" aria-hidden="true" />
    </div>
  );
}
