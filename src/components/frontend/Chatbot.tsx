'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import {
  X, Send, Sparkles, FileText, BookOpen,
  GraduationCap, MessageSquare, MapPin, Trophy,
  MessageCircle, ExternalLink, ChevronRight,
} from 'lucide-react';

type ActionButton = { label: string; query?: string; link?: string };
type Message = {
  role: 'user' | 'assistant';
  content: string;
  showSpmbButton?: boolean;
  showWaButton?: boolean;
  waText?: string;
  actionButtons?: ActionButton[];
};
type QuickAction = { label: string; icon: React.ReactNode; query: string };

const QUICK_ACTIONS: QuickAction[] = [
  { label: 'Cara Daftar SPMB',   icon: <FileText size={13} />,      query: 'Bagaimana cara daftar PPDB/SPMB di MI Attaqwa 15?' },
  { label: 'Program Unggulan',   icon: <BookOpen size={13} />,       query: 'Apa saja program unggulan dan tahfidz di MI Attaqwa 15?' },
  { label: 'Biaya Pendidikan',   icon: <GraduationCap size={13} />,  query: 'Berapa biaya pendaftaran dan administrasi di MI Attaqwa 15?' },
  { label: 'Syarat & Dokumen',   icon: <FileText size={13} />,       query: 'Apa saja syarat dan dokumen pendaftaran SPMB?' },
  { label: 'Kegiatan Ekskul',    icon: <Trophy size={13} />,         query: 'Apa saja kegiatan ekstrakurikuler di MI Attaqwa 15?' },
  { label: 'Lokasi & Jam Kerja', icon: <MapPin size={13} />,         query: 'Di mana lokasi madrasah dan jam pelayanannya?' },
  { label: 'Chat Admin WA',      icon: <MessageCircle size={13} />,  query: 'Saya ingin menghubungi WhatsApp Admin MI Attaqwa 15' },
];

const INITIAL_GREETING: Message = {
  role: 'assistant',
  content: `Assalamu'alaikum! 👋 \nSaya **Mialibels Ai**, asisten virtual resmi MI Attaqwa 15 Babelan.\n\nApa yang bisa saya bantu terkait **Informasi Madrasah**, info program belajar, atau fasilitas madrasah?`,
  actionButtons: [
    { label: 'Buka Form SPMB Online',    link: 'https://spmb.miattaqwa15.sch.id' },
    { label: 'Info Program & Tahfidz',   query: 'Apa saja program unggulan dan tahfidz di MI Attaqwa 15?' },
    { label: 'Biaya & Syarat Masuk',     query: 'Bagaimana syarat pendaftaran dan info biaya SPMB di MI Attaqwa 15?' },
    { label: 'Lokasi & Kontak Admin',    query: 'Di mana alamat sekolah dan kontak WhatsApp admin MI Attaqwa 15?' },
    { label: 'Kegiatan Ekstrakurikuler', query: 'Apa saja kegiatan ekstrakurikuler di MI Attaqwa 15?' },
  ],
};

const DEFAULT_RESPONSE = {
  content: 'Maaf, saya tidak dapat menemukan informasi spesifik mengenai hal tersebut. Silakan langsung hubungi admin kami.',
  showWaButton: true,
  waText: 'Halo Admin MI Attaqwa 15, saya ingin menanyakan informasi...',
};

const CONFIDENTIAL_PATTERNS = [
  { regex: /(data\s*siswa|nama\s*siswa|daftar\s*siswa|biodata|nilai|rapor|raport|ijazah|nisn)/i, topic: 'data pribadi siswa & nilai akademik' },
  { regex: /(data\s*guru|nama\s*guru|gaji\s*guru|kontak\s*guru|wali\s*kelas|kepala\s*sekolah)/i, topic: 'data pribadi guru/staf' },
  { regex: /(tagihan|tunggakan|rincian\s*tagihan|spp\s*anak|status\s*pembayaran|keuangan\s*sekolah|laporan\s*keuangan)/i, topic: 'rincian tagihan & keuangan' },
  { regex: /(password|kata\s*sandi|login|akun|database|rahasia|confidential)/i, topic: 'informasi akun & data rahasia' },
];

type KnowledgeBaseItem = {
  keywords: string[];
  response: string;
  showSpmbButton?: boolean;
  showWaButton?: boolean;
  waText?: string;
};

const KNOWLEDGE_BASE: KnowledgeBaseItem[] = [
  { keywords: ['profil', 'tentang', 'sejarah', 'mi attaqwa', 'mi 15', 'siapa kamu', 'lo siapa', 'siape si lo'],
    response: '**MI Attaqwa 15 Babelan** adalah madrasah ibtidaiyah unggulan yang berkomitmen mencetak generasi Qur\'ani, berakhlak mulia, cerdas, dan mandiri.' },
  { keywords: ['visi', 'misi', 'tujuan'],
    response: '**Visi:** Terwujudnya generasi Islam yang berakhlak mulia, cerdas, dan berwawasan global.\n\n**Misi:**\n1. Pendidikan dasar bermutu berbasis kurikulum terpadu.\n2. Menanamkan adab & nilai-nilai Qur\'ani sejak dini.\n3. Mengembangkan bakat dan prestasi siswa.' },
  { keywords: ['program', 'unggulan', 'tahfidz', 'fullday', 'kelas', 'hafalan'],
    response: '**Program Unggulan MI Attaqwa 15:**\n• **Kelas Fullday** – Kurikulum intensif & penguatan karakter.\n• **Tahfidz Al-Qur\'an** – Target hafalan Juz 30.\n• Sholat Dhuha & Dzuhur Berjamaah.\n• Bilingual Dasar (Arab & Inggris).' },
  { keywords: ['ekskul', 'ekstrakurikuler', 'kegiatan', 'lomba'],
    response: '**Ekstrakurikuler MI Attaqwa 15:**\n• Pramuka • Marawis & Hadroh\n• Futsal • Pencak Silat\n• Tahfidz Club • Dokter Kecil/UKS' },
  { keywords: ['spmb', 'ppdb', 'daftar', 'pendaftaran', 'syarat', 'formulir'],
    response: '**Cara Daftar SPMB MI Attaqwa 15:**\n\n**Berkas yang diperlukan:**\n1. Formulir Pendaftaran (Online/Offline)\n2. Fotokopi Akta Kelahiran (2 lembar)\n3. Fotokopi Kartu Keluarga (2 lembar)\n4. Pas Foto 3x4 Berwarna (3 lembar)\n5. Fotokopi Ijazah TK/RA (bila ada)\n\nKlik tombol di bawah untuk daftar online:',
    showSpmbButton: true },
  { keywords: ['biaya', 'bayar', 'spp', 'uang pangkal', 'tarif', 'dokumen'],
    response: 'Untuk rincian biaya pendaftaran, uang pangkal, dan SPP silakan hubungi admin langsung.',
    showWaButton: true, waText: 'Halo Admin MI Attaqwa 15, saya ingin tanya rincian biaya SPMB dan SPP.' },
  { keywords: ['kontak', 'hubungi', 'whatsapp', 'wa', 'lokasi', 'alamat', 'jam', 'admin'],
    response: '**Lokasi & Kontak:**\n• Babelan, Kabupaten Bekasi, Jawa Barat\n• WhatsApp: [0812-8888-8888](https://wa.me/6281288888888)\n• Jam Pelayanan: Senin–Jumat 07.30–15.00 WIB',
    showWaButton: true, waText: 'Halo Admin MI Attaqwa 15, saya ingin bertanya...' },
  { keywords: ['halo', 'assalamualaikum', 'hai', 'hello', 'pagi', 'siang', 'sore', 'malam'],
    response: 'Wa\'alaikumsalam! 👋 Apa yang bisa saya bantu? Apakah seputar SPMB, program unggulan, atau info madrasah lainnya?' },
  { keywords: ['terima kasih', 'makasih', 'thanks', 'oke', 'baik', 'sip'],
    response: 'Sama-sama! 🙏 Silakan tanya lagi jika ada yang ingin diketahui seputar MI Attaqwa 15.' },
];

function renderContent(text: string) {
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g,
      '<a href="$2" target="_blank" rel="noreferrer" class="text-blue-600 font-semibold hover:underline">$1</a>')
    .replace(/\n/g, '<br/>');
}

export default function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);

  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setMessages([INITIAL_GREETING]);
      setShowTooltip(true);
    }, 2500);
    return () => clearTimeout(timer);
  }, []);

  const scrollToBottom = useCallback((behavior: ScrollBehavior = 'smooth') => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTo({
        top: messagesContainerRef.current.scrollHeight,
        behavior,
      });
    }
  }, []);

  // Scroll to bottom only when new messages are added or loading
  useEffect(() => {
    if (isOpen && messages.length > 0) {
      const timer = setTimeout(() => {
        scrollToBottom(messages.length <= 1 ? 'auto' : 'smooth');
      }, 60);
      return () => clearTimeout(timer);
    }
  }, [messages, isLoading, isOpen, scrollToBottom]);

  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => inputRef.current?.focus(), 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  const toggleChat = useCallback(() => {
    setIsOpen((prev) => !prev);
    if (!isOpen) {
      setShowTooltip(false);
    }
  }, [isOpen]);

  const sendMessage = useCallback(
    (text: string) => {
      if (!text.trim() || isLoading) return;

      const userMessage = text.trim();
      setInput('');
      if (!isOpen) setIsOpen(true);

      setMessages((prev) => [...prev, { role: 'user', content: userMessage }]);
      setIsLoading(true);

      // Simulate network delay for natural feel
      setTimeout(() => {
        const lowerInput = userMessage.toLowerCase();

        // 1. Confidential filter
        const confidentialMatch = CONFIDENTIAL_PATTERNS.find((pattern) =>
          pattern.regex.test(lowerInput)
        );

        if (confidentialMatch) {
          setMessages((prev) => [
            ...prev,
            {
              role: 'assistant',
              content: `Maaf, perihal **${confidentialMatch.topic}** bersifat rahasia dan tidak dapat diakses melalui asisten virtual. Silakan hubungi Admin/TU MI Attaqwa 15 secara langsung.`,
              showWaButton: true,
              waText: `Assalamu'alaikum Admin MI Attaqwa 15, saya ingin menanyakan terkait ${confidentialMatch.topic}.`,
            },
          ]);
          setIsLoading(false);
          return;
        }

        // 2. Knowledge base search
        let bestMatch: KnowledgeBaseItem | null = null;
        let highestScore = 0;

        for (const item of KNOWLEDGE_BASE) {
          let score = 0;
          for (const keyword of item.keywords) {
            if (lowerInput.includes(keyword)) {
              score++;
            }
          }
          if (score > highestScore) {
            highestScore = score;
            bestMatch = item;
          }
        }

        if (bestMatch && highestScore > 0) {
          setMessages((prev) => [
            ...prev,
            {
              role: 'assistant',
              content: bestMatch!.response,
              showSpmbButton: bestMatch!.showSpmbButton,
              showWaButton: bestMatch!.showWaButton,
              waText: bestMatch!.waText,
            },
          ]);
        } else {
          setMessages((prev) => [
            ...prev,
            {
              role: 'assistant',
              content: DEFAULT_RESPONSE.content,
              showWaButton: true,
              waText: DEFAULT_RESPONSE.waText,
            },
          ]);
        }

        setIsLoading(false);
      }, 350);
    },
    [messages, isLoading, isOpen]
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  return (
    <>
      {/* ── Chat Window ── */}
      <div
        aria-label="Chat dengan Assistance MI 15"
        className={`fixed bottom-[90px] right-4 sm:right-6 z-[60] w-[calc(100vw-2rem)] sm:w-[390px] md:w-[410px] h-[600px] max-h-[75vh] bg-slate-50 rounded-[22px] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.35)] border border-slate-200/90 grid grid-rows-[auto_1fr_auto] overflow-hidden origin-bottom-right transition-all duration-300 ${
          isOpen ? 'opacity-100 scale-100 translate-y-0 pointer-events-auto' : 'opacity-0 scale-75 translate-y-8 pointer-events-none'
        }`}
      >
        {/* Header */}
        <div className="bg-[#0f2142] px-4 py-3 flex items-center justify-between shrink-0 shadow-sm z-10">
          <div className="flex items-center gap-3">
            <div className="relative shrink-0">
              <div className="w-10 h-10 rounded-full bg-white/10 border border-white/20 overflow-hidden flex items-center justify-center shadow-inner">
                <Image src="/bot.png" alt="Bot" width={34} height={34} className="object-contain" />
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-400 border-2 border-[#0f2142]" />
            </div>
            <div>
              <p className="text-white font-bold text-[16px] leading-snug">Mialibels Ai</p>
              <p className="text-emerald-400 text-[13px] font-semibold flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Online • Asisten Virtual Resmi
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/70 hover:text-white transition-colors cursor-pointer"
            aria-label="Tutup chat"
          >
            <X size={17} />
          </button>
        </div>

        {/* ── Messages Container ── */}
        <div
          ref={messagesContainerRef}
          data-lenis-prevent
          onWheel={e => e.stopPropagation()}
          onTouchMove={e => e.stopPropagation()}
          style={{ minHeight: 0 }}
          className="overflow-y-auto p-4 space-y-3.5 chat-scroll-body overscroll-contain select-text min-w-0 w-full"
        >
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex gap-2.5 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.role === 'assistant' && (
                <div className="shrink-0 w-7 h-7 rounded-full bg-white border border-slate-200 overflow-hidden flex items-center justify-center mt-0.5 shadow-2xs">
                  <Image src="/bot.png" alt="Bot" width={20} height={20} className="object-contain" />
                </div>
              )}

              <div className="max-w-[85%] flex flex-col gap-2">
                <div
                  className={`px-3.5 py-2.5 rounded-2xl text-[15px] leading-relaxed shadow-2xs ${
                    msg.role === 'user'
                      ? 'bg-[#0f2142] text-white rounded-tr-xs'
                      : 'bg-white text-slate-800 border border-slate-100 rounded-tl-xs'
                  }`}
                  dangerouslySetInnerHTML={{ __html: renderContent(msg.content) }}
                />

                {/* SPMB Online Button */}
                {msg.showSpmbButton && (
                  <a
                    href="https://spmb.miattaqwa15.sch.id"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-sm px-4 py-2.5 rounded-xl transition-all shadow-2xs active:scale-95 self-start cursor-pointer"
                  >
                    <FileText size={13} />
                    Buka Form SPMB Online
                  </a>
                )}

                {/* WhatsApp Contact Admin Button */}
                {msg.showWaButton && (
                  <a
                    href={`https://wa.me/6281288888888?text=${encodeURIComponent(
                      msg.waText || 'Halo Admin MI Attaqwa 15, saya ingin bertanya informasi...'
                    )}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm px-4 py-2.5 rounded-xl transition-all shadow-2xs active:scale-95 self-start cursor-pointer"
                  >
                    <MessageCircle size={14} />
                    Hubungi WhatsApp Admin
                  </a>
                )}

                {/* Action Buttons */}
                {msg.actionButtons && (
                  <div className="flex flex-col gap-1.5 mt-1">
                    {msg.actionButtons.map((btn, btnIdx) =>
                      btn.link ? (
                        <a
                          key={btnIdx}
                          href={btn.link}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center justify-between bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold text-sm px-4 py-2.5 rounded-xl transition-all shadow-xs active:scale-95 cursor-pointer"
                        >
                          <span>{btn.label}</span>
                          <ExternalLink size={12} className="opacity-70" />
                        </a>
                      ) : (
                        <button
                          key={btnIdx}
                          onClick={() => sendMessage(btn.query || btn.label)}
                          className="flex items-center justify-between bg-white hover:bg-slate-50 text-slate-700 font-semibold text-sm px-4 py-2.5 rounded-xl border border-slate-200 transition-all active:scale-95 cursor-pointer text-left w-full shadow-xs"
                        >
                          <span>{btn.label}</span>
                          <ChevronRight size={14} className="text-slate-400" />
                        </button>
                      )
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex gap-2.5 justify-start">
              <div className="shrink-0 w-7 h-7 rounded-full bg-white border border-slate-200 overflow-hidden flex items-center justify-center mt-0.5 shadow-2xs">
                <Image src="/bot.png" alt="Bot" width={20} height={20} className="object-contain" />
              </div>
              <div className="bg-white border border-slate-100 px-4 py-3 rounded-2xl rounded-tl-xs shadow-2xs flex gap-1.5 items-center">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-300 animate-[bounce_1s_infinite_0ms]" />
                <span className="w-1.5 h-1.5 rounded-full bg-slate-300 animate-[bounce_1s_infinite_150ms]" />
                <span className="w-1.5 h-1.5 rounded-full bg-slate-300 animate-[bounce_1s_infinite_300ms]" />
              </div>
            </div>
          )}
        </div>

        {/* ── Input Area ── */}
        <div className="bg-white border-t border-slate-100 px-3 pt-2 pb-3 shrink-0 shadow-xs z-10 min-w-0 w-full">
          
          {/* Horizontal Quick Pills */}
          <div 
            data-lenis-prevent
            onWheel={e => e.stopPropagation()}
            onTouchMove={e => e.stopPropagation()}
            className="flex gap-2 overflow-x-auto pb-2 mb-1 scrollbar-hide snap-x w-full"
          >
            {QUICK_ACTIONS.map((action, idx) => (
              <button
                key={idx}
                onClick={() => sendMessage(action.query)}
                disabled={isLoading}
                className="shrink-0 flex items-center gap-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 text-[11px] font-semibold px-3 py-1.5 rounded-full whitespace-nowrap transition-colors cursor-pointer snap-start disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {action.icon}
                {action.label}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="flex gap-2 relative">
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Tanya info SPMB, program, biaya..."
              disabled={isLoading}
              className="flex-1 bg-slate-50 border border-slate-200 rounded-full text-[13px] px-4 py-2.5 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20 transition-all text-slate-800 placeholder:text-slate-400 disabled:opacity-60"
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="w-10 h-10 shrink-0 rounded-full bg-[#0f2142] hover:bg-[#1a3668] disabled:bg-slate-200 disabled:text-slate-400 text-white flex items-center justify-center transition-all cursor-pointer shadow-md disabled:shadow-none active:scale-95"
            >
              <Send size={16} className={input.trim() && !isLoading ? 'translate-x-0.5' : ''} />
            </button>
          </form>
        </div>
      </div>

      {/* ── Floating Trigger Button & Tooltip ── */}
      <div className="fixed bottom-5 right-4 sm:right-6 z-[50] flex flex-col items-end gap-3 select-none">
        {/* Tooltip Balloon */}
        {showTooltip && !isOpen && (
          <div className="relative bg-white rounded-2xl px-4 py-2.5 shadow-[0_8px_24px_rgba(0,0,0,0.12)] border border-slate-100 flex items-center gap-3 animate-[fadeSlideIn_0.4s_ease_forwards]">
            <div className="flex items-center gap-2 text-[13px] font-semibold text-slate-800">
              <MessageSquare size={16} className="text-blue-600" />
              Butuh info pendaftaran?
            </div>
            <button
              onClick={toggleChat}
              className="bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold text-[11px] px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
            >
              Tanya AI
            </button>

            <button
              onClick={() => setShowTooltip(false)}
              className="absolute -top-2 -right-2 w-6 h-6 bg-white border border-slate-200 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 shadow-sm cursor-pointer"
            >
              <X size={12} />
            </button>

            {/* Triangle pointing down */}
            <div className="absolute -bottom-1.5 right-[3.5rem] w-3 h-3 bg-white border-b border-r border-slate-100 transform rotate-45" />
          </div>
        )}

        <button
          onClick={toggleChat}
          aria-label="Toggle chat AI"
          className="group flex items-center gap-3 bg-[#0a1835] hover:bg-[#132a5c] rounded-full p-2 pr-5 border border-amber-500/20 shadow-[0_8px_30px_rgba(10,24,53,0.35)] hover:shadow-[0_12px_40px_rgba(10,24,53,0.45)] transition-all duration-300 hover:-translate-y-1 active:scale-95 cursor-pointer origin-bottom-right focus:outline-none focus:ring-4 focus:ring-amber-500/30"
        >
          <div className="relative shrink-0 transition-transform duration-300 group-hover:rotate-[10deg] group-hover:scale-105">
            <div className="w-12 h-12 rounded-full bg-gradient-to-b from-blue-500 to-blue-700 p-0.5">
              <div className="w-full h-full rounded-full bg-[#0a1835] flex items-center justify-center overflow-hidden relative">
                <Image
                  src="/bot.png"
                  alt="AI Bot"
                  width={34}
                  height={34}
                  className="object-contain z-10"
                />
                <div className="absolute inset-0 bg-blue-500/10 blur-md rounded-full animate-pulse" />
              </div>
            </div>
            <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-400 border-2 border-[#0a1835] z-20 shadow-[0_0_8px_rgba(52,211,153,0.6)]" />
          </div>

          <div className="flex flex-col items-start">
            <div className="flex items-center gap-1 text-amber-400 mb-0.5">
              <Sparkles size={10} className="fill-amber-400" />
              <span className="text-[10px] font-black tracking-widest uppercase">AI Assistant</span>
            </div>
            <span className="text-white font-bold text-[15px] leading-none tracking-tight">
              Mialibels Ai
            </span>
          </div>
        </button>
      </div>

      <style jsx>{`
        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateY(10px) scale(0.95); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }

        .chat-scroll-body::-webkit-scrollbar {
          width: 5px;
        }
        .chat-scroll-body::-webkit-scrollbar-track {
          background: transparent;
        }
        .chat-scroll-body::-webkit-scrollbar-thumb {
          background-color: #cbd5e1;
          border-radius: 20px;
        }
      `}</style>
    </>
  );
}
