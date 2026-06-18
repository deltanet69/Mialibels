'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { supabase } from '../../lib/supabase/client';
import { 
  LayoutDashboard, 
  Users, 
  GraduationCap, 
  ClipboardCheck, 
  Wallet, 
  CreditCard, 
  PiggyBank, 
  FileText, 
  Image as ImageIcon, 
  Megaphone, 
  MessageSquare,
  BarChart3,
  UserCog,
  Hexagon,
  School,
  LogOut
} from 'lucide-react';

export function Sidebar() {
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    async function getProfile() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: admin } = await supabase
            .from('admins')
            .select('role')
            .eq('id', user.id)
            .single();
          
          if (admin) {
            setRole(admin.role);
          }
        }
      } catch (err) {
        console.error('Error fetching role:', err);
      } finally {
        setLoading(false);
      }
    }
    getProfile();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  const isActive = (path: string) => {
    return pathname === path || pathname.startsWith(path + '/');
  };

  const linkClass = (path: string) => {
    return `flex items-center gap-3 px-3 py-2.5 rounded-xl transition ${
      isActive(path) 
        ? 'bg-blue-600 text-white shadow-sm' 
        : 'text-slate-600 hover:bg-slate-50 hover:text-blue-600'
    }`;
  };

  if (loading) {
    return (
      <aside className="w-64 bg-white border-r border-slate-100 min-h-screen p-4 flex flex-col gap-6">
        <div className="flex items-center gap-2 mb-2 px-2">
          <div className="bg-blue-600 text-white p-1.5 rounded-lg animate-pulse">
            <Hexagon size={24} className="fill-current" />
          </div>
          <span className="text-xl font-bold text-slate-800 animate-pulse">Loading...</span>
        </div>
      </aside>
    );
  }

  // Helper to determine role access
  const hasAccess = (section: 'main' | 'akademik' | 'finance' | 'content' | 'reports' | 'users') => {
    if (!role) return false;
    if (role === 'superadmin') return true;

    switch (section) {
      case 'main':
      case 'akademik':
        return true; // All roles can see main & akademik pages (guru, students, classroom, attendance)
      case 'finance':
        return role === 'bendahara';
      case 'content':
        return role === 'admin';
      case 'reports':
        return role === 'kepsek';
      case 'users':
        return false; // Only superadmin has access, handled above
      default:
        return false;
    }
  };

  return (
    <aside className="w-64 bg-white border-r border-slate-100 min-h-screen p-4 flex flex-col gap-6 justify-between overflow-y-auto">
      <div className="flex flex-col gap-6">
        {/* Brand */}
        <div className="flex items-center gap-2 mb-2 px-2 sticky top-0 bg-white py-2 z-10">
          <div className="bg-blue-600 text-white p-1.5 rounded-lg">
            <Hexagon size={24} className="fill-current" />
          </div>
          <span className="text-xl font-bold text-slate-800">MI Attaqwa 15</span>
        </div>
        
        {/* Navigation */}
        <nav className="flex flex-col gap-6 flex-grow">
          
          {/* MAIN */}
          {hasAccess('main') && (
            <div>
              <h4 className="text-xs font-semibold text-slate-400 mb-3 px-2">MAIN</h4>
              <div className="flex flex-col gap-1">
                <Link href="/dashboard" className={linkClass('/dashboard')}>
                  <LayoutDashboard size={20} /> <span className="font-medium">Dashboard</span>
                </Link>
                <Link href="/guru" className={linkClass('/guru')}>
                  <GraduationCap size={20} /> <span className="font-medium">Data Guru</span>
                </Link>
              </div>
            </div>
          )}

          {/* AKADEMIK */}
          {hasAccess('akademik') && (
            <div>
              <h4 className="text-xs font-semibold text-slate-400 mb-3 px-2">AKADEMIK</h4>
              <div className="flex flex-col gap-1">
                <Link href="/students" className={linkClass('/students')}>
                  <Users size={20} /> <span className="font-medium">Data Siswa</span>
                </Link>
                <Link href="/classroom" className={linkClass('/classroom')}>
                  <School size={20} /> <span className="font-medium">Classroom</span>
                </Link>
                <Link href="/attendance" className={linkClass('/attendance')}>
                  <ClipboardCheck size={20} /> <span className="font-medium">Absensi</span>
                </Link>
              </div>
            </div>
          )}

          {/* FINANCE */}
          {hasAccess('finance') && (
            <div>
              <h4 className="text-xs font-semibold text-slate-400 mb-3 px-2">FINANCE</h4>
              <div className="flex flex-col gap-1">
                <Link href="/finance/general" className={linkClass('/finance/general')}>
                  <Wallet size={20} /> <span className="font-medium">Keuangan Umum</span>
                </Link>
                <Link href="/finance/spp" className={linkClass('/finance/spp')}>
                  <CreditCard size={20} /> <span className="font-medium">SPP Sekolah</span>
                </Link>
                <Link href="/finance/savings" className={linkClass('/finance/savings')}>
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
                <Link href="/content/posts" className={linkClass('/content/posts')}>
                  <FileText size={20} /> <span className="font-medium">Berita & Artikel</span>
                </Link>
                <Link href="/content/galleries" className={linkClass('/content/galleries')}>
                  <ImageIcon size={20} /> <span className="font-medium">Galeri</span>
                </Link>
                <Link href="/content/banners" className={linkClass('/content/banners')}>
                  <Megaphone size={20} /> <span className="font-medium">Banners</span>
                </Link>
                <Link href="/content/testimonials" className={linkClass('/content/testimonials')}>
                  <MessageSquare size={20} /> <span className="font-medium">Testimoni</span>
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
                  <Link href="/reports" className={linkClass('/reports')}>
                    <BarChart3 size={20} /> <span className="font-medium">Laporan Kepsek</span>
                  </Link>
                )}
                {hasAccess('users') && (
                  <Link href="/users" className={linkClass('/users')}>
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
        <button 
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-red-600 hover:bg-red-50 transition w-full text-left font-medium"
        >
          <LogOut size={20} />
          <span>Keluar</span>
        </button>
      </div>
    </aside>
  );
}

