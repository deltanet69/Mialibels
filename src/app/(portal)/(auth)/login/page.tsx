'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Lock, Mail, ArrowRight, Loader2, Sparkles, ShieldCheck } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Terjadi kesalahan saat login.');
      }

      // Redirect on success
      router.push('/dashboard');
      router.refresh();
      
    } catch (err: any) {
      console.error('Sign in catch block:', err);
      const msg = err instanceof Error ? err.message : (typeof err === 'object' ? JSON.stringify(err) : String(err));
      setError(msg || 'An error occurred during sign in.');
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-[#F4F7FC] font-sans antialiased">
      {/* Left Pane - Brand Showcase */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-gradient-to-br from-[#002957] via-[#092c53] to-[#1e40af] overflow-hidden items-center justify-center p-12 text-white">
        {/* Background Image with Overlay */}
        <div className="absolute inset-0">
          <Image 
            src="/images/student_activity.png"
            alt="School background"
            fill
            className="object-cover opacity-20 object-center"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#002957]/95 via-[#002957]/80 to-transparent" />
        </div>

        {/* Ambient Glows */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-400/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-amber-400/15 rounded-full blur-3xl translate-y-1/2 -translate-x-1/3" />
        
        {/* Content over background */}
        <div className="relative z-10 text-center max-w-xl">
          <div className="inline-flex items-center gap-2 py-1.5 px-4 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-accent font-body text-xs font-bold uppercase tracking-wider mb-6">
            <Sparkles className="w-3.5 h-3.5 text-accent" />
            <span>SMART Portal v2.0</span>
          </div>

          <h2 className="font-headline font-black text-4xl xl:text-5xl leading-tight mb-5 text-white">
            Sistem Manajemen Akademik &amp; Administrasi Terpadu
          </h2>
          <p className="font-body text-blue-100 text-base leading-relaxed mb-8">
            Platform terintegrasi bagi dewan guru, tata usaha, dan pimpinan madrasah MI Attaqwa 15 Babelan.
          </p>

          <div className="grid grid-cols-2 gap-4 text-left">
            <div className="bg-white/10 backdrop-blur-md border border-white/15 p-4 rounded-2xl">
              <ShieldCheck className="w-5 h-5 text-cyan-300 mb-2" />
              <p className="font-headline font-bold text-sm text-white">Keamanan Terverifikasi</p>
              <p className="font-body text-xs text-blue-200 mt-0.5">Akses role-based aman dengan proteksi multi-layer.</p>
            </div>
            <div className="bg-white/10 backdrop-blur-md border border-white/15 p-4 rounded-2xl">
              <Sparkles className="w-5 h-5 text-amber-300 mb-2" />
              <p className="font-headline font-bold text-sm text-white">Data Real-time</p>
              <p className="font-body text-xs text-blue-200 mt-0.5">Sinkronisasi presensi, nilai, dan infaq sekolah.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right Pane - Form Login */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 lg:p-16">
        <div className="w-full max-w-md bg-white rounded-[2.5rem] p-8 sm:p-10 shadow-sm border border-slate-200/80 space-y-6">
          {/* Logo & Header */}
          <div className="text-center">
            <div className="flex justify-center mb-6">
              <Image 
                src="/logosmart/smartlogo.png" 
                alt="Logo SMART" 
                width={180} 
                height={180}
                className="object-contain"
                priority
              />
            </div>
            <h1 className="font-headline font-black text-2xl text-secondary">
              Masuk ke SMART Portal
            </h1>
            <p className="font-body text-xs text-slate-500 mt-1">
              Gunakan akun resmi madrasah yang telah terdaftar
            </p>
          </div>

          {error && (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-3">
              <div className="p-1 bg-rose-100 text-rose-600 rounded-lg shrink-0 mt-0.5">
                <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="flex-1">
                <h4 className="font-headline font-bold text-xs text-rose-800">Login Gagal</h4>
                <p className="font-body text-xs text-rose-600 mt-0.5">{error}</p>
              </div>
            </div>
          )}

          <form className="space-y-4" onSubmit={handleLogin}>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider ml-1">Email / Username</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail size={16} />
                </div>
                <input 
                  type="email" 
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3.5 bg-slate-50/80 border border-slate-200/90 rounded-2xl focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 text-xs font-medium text-slate-800 transition-all outline-none"
                  placeholder="admin@miattaqwa15.sch.id"
                  disabled={loading}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between ml-1">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Kata Sandi</label>
                <Link href="/contact" className="text-xs font-bold text-blue-700 hover:text-blue-900 transition-colors">
                  Lupa Password?
                </Link>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock size={16} />
                </div>
                <input 
                  type="password" 
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3.5 bg-slate-50/80 border border-slate-200/90 rounded-2xl focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 text-xs font-medium text-slate-800 transition-all outline-none"
                  placeholder="••••••••"
                  disabled={loading}
                />
              </div>
            </div>

            <div className="pt-2">
              <button 
                type="submit"
                disabled={loading}
                className="btn-tactile w-full flex items-center justify-center gap-2 py-4 px-6 rounded-full font-headline text-sm font-bold text-white bg-gradient-to-r from-blue-600 to-blue-700 shadow-sm shadow-blue-900/10 hover:brightness-105 transition-all disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
              >
                {loading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>Memverifikasi Akun...</span>
                  </>
                ) : (
                  <>
                    <span>Masuk Sekarang</span>
                    <ArrowRight size={16} />
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Footnote */}
          <div className="pt-4 border-t border-slate-100 text-center">
            <p className="text-xs text-slate-500">
              Butuh bantuan akses akun?{' '}
              <Link href="/contact" className="font-bold text-blue-700 hover:text-blue-900 transition-colors">
                Hubungi Administrator
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

