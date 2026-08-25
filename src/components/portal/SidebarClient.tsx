'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  ClipboardCheck,
  Wallet,
  CreditCard,
  PiggyBank,
  FileText,
  BookOpen,
  Image as ImageIcon,
  Megaphone,
  MessageSquare,
  Inbox,
  BarChart3,
  UserCog,
  School,
  LogOut,
  X,
  Activity,
  Sparkles,
  ChevronRight
} from 'lucide-react';
import { useSidebar } from './SidebarProvider';

type Props = {
  role: string | null;
  userName: string;
};

export function SidebarClient({ role, userName }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const { isOpen, setIsOpen } = useSidebar();

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
    router.refresh();
  };

  const isActive = (path: string) => {
    return pathname === path || pathname.startsWith(path + '/');
  };

  const linkClass = (path: string) => {
    const active = isActive(path);
    return `group flex items-center justify-between px-3.5 py-2.5 rounded-xl transition-all duration-200 text-sm font-medium ${
      active
        ? 'bg-gradient-to-r from-teal-600 to-teal-700 text-white shadow-md shadow-teal-900/15 font-semibold'
        : 'text-slate-600 hover:bg-slate-100/70 hover:text-slate-900'
    }`;
  };

  const hasAccess = (section: 'main' | 'akademik' | 'finance' | 'content' | 'reports' | 'users') => {
    if (!role) return false;
    // superadmin & kepsek have full access to navigation
    if (role === 'superadmin' || role === 'kepsek') return true;
    // guru: limited access
    if (role === 'guru') {
      switch (section) {
        case 'main':
        case 'akademik':
          return true;
        default:
          return false;
      }
    }
    // staff: same as guru + content posts only
    if (role === 'staff') {
      switch (section) {
        case 'main':
        case 'akademik':
          return true;
        default:
          return false;
      }
    }
    return false;
  };

  // kepsek can see finance pages but cannot execute transactions (handled per-page)
  const canViewFinance = role === 'superadmin' || role === 'kepsek';

  // Staff can only manage Berita & Artikel (posts), not full content
  const canViewContentPosts = role === 'staff';

  return (
    <>
      {/* Overlay for mobile */}
      <div 
        className={`fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-40 md:hidden transition-opacity duration-300 ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        onClick={() => setIsOpen(false)}
        aria-hidden="true"
      />

      <aside className={`fixed inset-y-0 left-0 z-50 w-68 bg-white border-r border-slate-200/80 p-4 flex flex-col justify-between overflow-y-auto transform transition-transform duration-300 ease-in-out md:translate-x-0 md:static md:inset-auto print:hidden shadow-lg md:shadow-none ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex flex-col gap-5">
          {/* Brand */}
          <div className="flex items-center justify-between px-2 sticky top-0 bg-white/95 backdrop-blur-sm py-2 z-10 border-b border-slate-100">
            <Link href="/dashboard" className="flex items-center gap-2.5 group">
              <Image 
                src="/logosmart/smartlogover.png" 
                alt="Logo MI Attaqwa 15" 
                width={140} 
                height={80} 
                className="object-contain transition-transform group-hover:scale-102"
                priority
              />
            </Link>
            <button 
              onClick={() => setIsOpen(false)}
              className="md:hidden p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition"
            >
              <X size={18} />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex flex-col gap-5 flex-grow">

            {/* MAIN */}
            {hasAccess('main') && (
              <div>
                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 px-2">
                  MENU UTAMA
                </h4>
                <div className="flex flex-col gap-1">
                  <Link href="/dashboard" className={linkClass('/dashboard')} onClick={() => setIsOpen(false)}>
                    <div className="flex items-center gap-3">
                      <LayoutDashboard size={18} />
                      <span>Dashboard</span>
                    </div>
                  </Link>
                  <Link href="/guru" className={linkClass('/guru')} onClick={() => setIsOpen(false)}>
                    <div className="flex items-center gap-3">
                      <GraduationCap size={18} />
                      <span>Data Guru</span>
                    </div>
                  </Link>
                  <Link href="/absensi-guru" className={linkClass('/absensi-guru')} onClick={() => setIsOpen(false)}>
                    <div className="flex items-center gap-3">
                      <ClipboardCheck size={18} />
                      <span>Absensi Guru</span>
                    </div>
                  </Link>
                  {role?.toLowerCase().includes('guru') ? (
                    <Link href="/jadwal-mengajar" className={linkClass('/jadwal-mengajar')} onClick={() => setIsOpen(false)}>
                      <div className="flex items-center gap-3">
                        <BookOpen size={18} />
                        <span>Jadwal Mengajar</span>
                      </div>
                    </Link>
                  ) : (
                    <Link href="/rekap-mengajar" className={linkClass('/rekap-mengajar')} onClick={() => setIsOpen(false)}>
                      <div className="flex items-center gap-3">
                        <BookOpen size={18} />
                        <span>Rekap Mengajar</span>
                      </div>
                    </Link>
                  )}
                </div>
              </div>
            )}

            {/* AKADEMIK */}
            {hasAccess('akademik') && (
              <div>
                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 px-2">
                  AKADEMIK
                </h4>
                <div className="flex flex-col gap-1">
                  <Link href="/students" className={linkClass('/students')} onClick={() => setIsOpen(false)}>
                    <div className="flex items-center gap-3">
                      <Users size={18} />
                      <span>Data Siswa</span>
                    </div>
                  </Link>
                  <Link href="/classroom" className={linkClass('/classroom')} onClick={() => setIsOpen(false)}>
                    <div className="flex items-center gap-3">
                      <School size={18} />
                      <span>Classroom</span>
                    </div>
                  </Link>
                  <Link href="/modul-pembelajaran" className={linkClass('/modul-pembelajaran')} onClick={() => setIsOpen(false)}>
                    <div className="flex items-center gap-3">
                      <BookOpen size={18} />
                      <span>Modul Pembelajaran</span>
                    </div>
                  </Link>
                </div>
              </div>
            )}

            {/* FINANCE */}
            {canViewFinance && (
              <div>
                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 px-2">
                  KEUANGAN
                </h4>
                <div className="flex flex-col gap-1">
                  <Link href="/finance/general" className={linkClass('/finance/general')} onClick={() => setIsOpen(false)}>
                    <div className="flex items-center gap-3">
                      <Wallet size={18} />
                      <span>Keuangan Umum</span>
                    </div>
                  </Link>
                  <Link href="/finance/spp" className={linkClass('/finance/spp')} onClick={() => setIsOpen(false)}>
                    <div className="flex items-center gap-3">
                      <CreditCard size={18} />
                      <span>Infaq Sekolah</span>
                    </div>
                  </Link>
                  <Link href="/finance/savings" className={linkClass('/finance/savings')} onClick={() => setIsOpen(false)}>
                    <div className="flex items-center gap-3">
                      <PiggyBank size={18} />
                      <span>Tabungan Siswa</span>
                    </div>
                  </Link>
                </div>
              </div>
            )}

            {/* KONTEN */}
            {hasAccess('content') && (
              <div>
                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 px-2">
                  KONTEN WEBSITE
                </h4>
                <div className="flex flex-col gap-1">
                  <Link href="/content/posts" className={linkClass('/content/posts')} onClick={() => setIsOpen(false)}>
                    <div className="flex items-center gap-3">
                      <FileText size={18} />
                      <span>Berita &amp; Artikel</span>
                    </div>
                  </Link>
                  <Link href="/content/galleries" className={linkClass('/content/galleries')} onClick={() => setIsOpen(false)}>
                    <div className="flex items-center gap-3">
                      <ImageIcon size={18} />
                      <span>Galeri Foto</span>
                    </div>
                  </Link>
                  <Link href="/content/banners" className={linkClass('/content/banners')} onClick={() => setIsOpen(false)}>
                    <div className="flex items-center gap-3">
                      <Megaphone size={18} />
                      <span>Banner Pengumuman</span>
                    </div>
                  </Link>
                  <Link href="/content/testimonials" className={linkClass('/content/testimonials')} onClick={() => setIsOpen(false)}>
                    <div className="flex items-center gap-3">
                      <MessageSquare size={18} />
                      <span>Testimoni</span>
                    </div>
                  </Link>
                  <Link href="/contact-messages" className={linkClass('/contact-messages')} onClick={() => setIsOpen(false)}>
                    <div className="flex items-center gap-3">
                      <Inbox size={18} />
                      <span>Pesan Masuk</span>
                    </div>
                  </Link>
                </div>
              </div>
            )}

            {/* KONTEN untuk Staff (hanya Berita & Artikel) */}
            {canViewContentPosts && (
              <div>
                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 px-2">
                  KONTEN SEKOLAH
                </h4>
                <div className="flex flex-col gap-1">
                  <Link href="/content/posts" className={linkClass('/content/posts')} onClick={() => setIsOpen(false)}>
                    <div className="flex items-center gap-3">
                      <FileText size={18} />
                      <span>Berita &amp; Artikel</span>
                    </div>
                  </Link>
                </div>
              </div>
            )}

            {/* SISTEM */}
            {(hasAccess('reports') || hasAccess('users')) && (
              <div>
                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 px-2">
                  SISTEM &amp; LAPORAN
                </h4>
                <div className="flex flex-col gap-1">
                  {hasAccess('reports') && (
                    <Link href="/reports" className={linkClass('/reports')} onClick={() => setIsOpen(false)}>
                      <div className="flex items-center gap-3">
                        <BarChart3 size={18} />
                        <span>Laporan Eksekutif</span>
                      </div>
                    </Link>
                  )}
                  {hasAccess('reports') && (
                    <Link href="/reports/logs" className={linkClass('/reports/logs')} onClick={() => setIsOpen(false)}>
                      <div className="flex items-center gap-3">
                        <Activity size={18} />
                        <span>Log Aktivitas</span>
                      </div>
                    </Link>
                  )}
                  {hasAccess('users') && (
                    <Link href="/users" className={linkClass('/users')} onClick={() => setIsOpen(false)}>
                      <div className="flex items-center gap-3">
                        <UserCog size={18} />
                        <span>Manajemen User</span>
                      </div>
                    </Link>
                  )}
                </div>
              </div>
            )}

          </nav>
        </div>

        {/* User Card & Logout at the bottom */}
        <div className="border-t border-slate-100 pt-3 mt-4">
          {userName && (
            <div className="px-3 py-2.5 mb-2 bg-slate-50/80 rounded-xl border border-slate-100 flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-slate-800 truncate">{userName}</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span className="text-[11px] text-slate-500 capitalize">{role || 'Online'}</span>
                </div>
              </div>
            </div>
          )}
          <button
            onClick={handleLogout}
            className="flex items-center justify-between px-3.5 py-2.5 rounded-xl text-rose-600 hover:bg-rose-50/80 transition-all w-full text-left font-semibold text-sm"
          >
            <div className="flex items-center gap-3">
              <LogOut size={18} />
              <span>Keluar Akun</span>
            </div>
            <ChevronRight size={14} className="text-rose-400" />
          </button>
        </div>
      </aside>
    </>
  );
}
