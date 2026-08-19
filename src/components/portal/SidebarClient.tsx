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
  Activity
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
    return `flex items-center gap-3 px-3 py-2.5 rounded-xl transition ${isActive(path)
        ? 'bg-blue-600 text-white shadow-sm'
        : 'text-slate-600 hover:bg-slate-50 hover:text-blue-600'
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
        className={`fixed inset-0 bg-black/50 z-40 md:hidden transition-opacity duration-300 ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        onClick={() => setIsOpen(false)}
        aria-hidden="true"
      />

      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-slate-100 p-4 flex flex-col gap-6 justify-between overflow-y-auto transform transition-transform duration-300 ease-in-out md:translate-x-0 md:static md:inset-auto print:hidden ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex flex-col gap-6">
          {/* Brand */}
          <div className="flex items-center justify-between mb-2 px-2 sticky top-0 bg-white py-2 z-10">
            <Link href="/dashboard" className="flex items-center gap-2">
              <Image 
                src="/logosmart/smartlogover.png" 
                alt="Logo MI Attaqwa 15" 
                width={140} 
                height={80} 
                className="object-contain"
                priority
              />
            </Link>
            <button 
              onClick={() => setIsOpen(false)}
              className="md:hidden p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-lg transition"
            >
              <X size={20} />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex flex-col gap-6 flex-grow">

            {/* MAIN */}
            {hasAccess('main') && (
              <div>
                <h4 className="text-xs font-semibold text-slate-400 mb-3 px-2">MAIN</h4>
                <div className="flex flex-col gap-1">
                  <Link href="/dashboard" className={linkClass('/dashboard')} onClick={() => setIsOpen(false)}>
                    <LayoutDashboard size={20} /> <span className="font-medium">Dashboard</span>
                  </Link>
                  <Link href="/guru" className={linkClass('/guru')} onClick={() => setIsOpen(false)}>
                    <GraduationCap size={20} /> <span className="font-medium">Data Guru</span>
                  </Link>
                  <Link href="/absensi-guru" className={linkClass('/absensi-guru')} onClick={() => setIsOpen(false)}>
                    <ClipboardCheck size={20} /> <span className="font-medium">Absensi Guru</span>
                  </Link>
                  {role?.toLowerCase().includes('guru') ? (
                    <Link href="/jadwal-mengajar" className={linkClass('/jadwal-mengajar')} onClick={() => setIsOpen(false)}>
                      <BookOpen size={20} /> <span className="font-medium">Jadwal Mengajar</span>
                    </Link>
                  ) : (
                    <Link href="/rekap-mengajar" className={linkClass('/rekap-mengajar')} onClick={() => setIsOpen(false)}>
                      <BookOpen size={20} /> <span className="font-medium">Rekap Mengajar</span>
                    </Link>
                  )}
                </div>
              </div>
            )}

            {/* AKADEMIK */}
            {hasAccess('akademik') && (
              <div>
                <h4 className="text-xs font-semibold text-slate-400 mb-3 px-2">AKADEMIK</h4>
                <div className="flex flex-col gap-1">
                  <Link href="/students" className={linkClass('/students')} onClick={() => setIsOpen(false)}>
                    <Users size={20} /> <span className="font-medium">Data Siswa</span>
                  </Link>
                  <Link href="/classroom" className={linkClass('/classroom')} onClick={() => setIsOpen(false)}>
                    <School size={20} /> <span className="font-medium">Classroom</span>
                  </Link>
                  <Link href="/modul-pembelajaran" className={linkClass('/modul-pembelajaran')} onClick={() => setIsOpen(false)}>
                    <BookOpen size={20} /> <span className="font-medium">Modul Pembelajaran</span>
                  </Link>
                </div>
              </div>
            )}

            {/* FINANCE */}
            {canViewFinance && (
              <div>
                <h4 className="text-xs font-semibold text-slate-400 mb-3 px-2">FINANCE</h4>
                <div className="flex flex-col gap-1">
                  <Link href="/finance/general" className={linkClass('/finance/general')} onClick={() => setIsOpen(false)}>
                    <Wallet size={20} /> <span className="font-medium">Keuangan Umum</span>
                  </Link>
                  <Link href="/finance/spp" className={linkClass('/finance/spp')} onClick={() => setIsOpen(false)}>
                    <CreditCard size={20} /> <span className="font-medium">Infaq Sekolah</span>
                  </Link>
                  <Link href="/finance/savings" className={linkClass('/finance/savings')} onClick={() => setIsOpen(false)}>
                    <PiggyBank size={20} /> <span className="font-medium">Tabungan Siswa</span>
                  </Link>
                </div>
              </div>
            )}

            {/* KONTEN */}
            {hasAccess('content') && (
              <div>
                <h4 className="text-xs font-semibold text-slate-400 mb-3 px-2">KONTEN FRONTEND</h4>
                <div className="flex flex-col gap-1">
                  <Link href="/content/posts" className={linkClass('/content/posts')} onClick={() => setIsOpen(false)}>
                    <FileText size={20} /> <span className="font-medium">Berita & Artikel</span>
                  </Link>
                  <Link href="/content/galleries" className={linkClass('/content/galleries')} onClick={() => setIsOpen(false)}>
                    <ImageIcon size={20} /> <span className="font-medium">Galeri</span>
                  </Link>
                  <Link href="/content/banners" className={linkClass('/content/banners')} onClick={() => setIsOpen(false)}>
                    <Megaphone size={20} /> <span className="font-medium">Banners</span>
                  </Link>
                  <Link href="/content/testimonials" className={linkClass('/content/testimonials')} onClick={() => setIsOpen(false)}>
                    <MessageSquare size={20} /> <span className="font-medium">Testimoni</span>
                  </Link>
                  <Link href="/contact-messages" className={linkClass('/contact-messages')} onClick={() => setIsOpen(false)}>
                    <Inbox size={20} /> <span className="font-medium">Pesan Kontak</span>
                  </Link>
                </div>
              </div>
            )}

            {/* KONTEN untuk Staff (hanya Berita & Artikel) */}
            {canViewContentPosts && (
              <div>
                <h4 className="text-xs font-semibold text-slate-400 mb-3 px-2">KONTEN SEKOLAH</h4>
                <div className="flex flex-col gap-1">
                  <Link href="/content/posts" className={linkClass('/content/posts')} onClick={() => setIsOpen(false)}>
                    <FileText size={20} /> <span className="font-medium">Berita & Artikel</span>
                  </Link>
                </div>
              </div>
            )}

            {/* SISTEM */}
            {(hasAccess('reports') || hasAccess('users')) && (
              <div>
                <h4 className="text-xs font-semibold text-slate-400 mb-3 px-2">SISTEM & LAPORAN</h4>
                <div className="flex flex-col gap-1">
                  {hasAccess('reports') && (
                    <Link href="/reports" className={linkClass('/reports')} onClick={() => setIsOpen(false)}>
                      <BarChart3 size={20} /> <span className="font-medium">Laporan Kepsek</span>
                    </Link>
                  )}
                  {hasAccess('reports') && (
                    <Link href="/reports/logs" className={linkClass('/reports/logs')} onClick={() => setIsOpen(false)}>
                      <Activity size={20} /> <span className="font-medium">Activity Log</span>
                    </Link>
                  )}
                  {hasAccess('users') && (
                    <Link href="/users" className={linkClass('/users')} onClick={() => setIsOpen(false)}>
                      <UserCog size={20} /> <span className="font-medium">Manajemen User</span>
                    </Link>
                  )}
                </div>
              </div>
            )}

          </nav>
        </div>

        {/* Logout button at the bottom */}
        <div className="border-t border-slate-100 pt-4 mt-auto">
          {userName && (
            <div className="px-3 py-2 mb-2 text-sm text-slate-500 font-medium truncate">
              👤 {userName}
            </div>
          )}
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-red-600 hover:bg-red-50 transition w-full text-left font-medium"
          >
            <LogOut size={20} />
            <span>Keluar</span>
          </button>
        </div>
      </aside>
    </>
  );
}
