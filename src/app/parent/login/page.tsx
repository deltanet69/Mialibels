'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Lock, User, ArrowRight, ShieldCheck, Info } from 'lucide-react'

export default function ParentLoginPage() {
  const [nis, setNis] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/auth/parent-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nis, password }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Login gagal')
      }

      router.push('/parent/dashboard')
    } catch (err: any) {
      setError(err.message)
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-4">
      <div className="max-w-[1000px] w-full bg-white rounded-3xl shadow-xl overflow-hidden flex flex-col md:flex-row">
        
        {/* Left Side - Image & Brand */}
        <div className="w-full md:w-1/2 bg-[#002957] p-8 md:p-12 text-white flex flex-col justify-between relative overflow-hidden hidden md:flex">
          <div className="absolute inset-0 z-0">
            <Image 
              src="/bgheader.png" 
              alt="Background" 
              fill 
              className="object-cover opacity-20"
            />
          </div>
          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 bg-white/10 px-4 py-2 rounded-full border border-white/20 backdrop-blur-md mb-8">
              <ShieldCheck className="text-primary w-5 h-5" />
              <span className="font-bold text-sm tracking-wide">PORTAL ORANG TUA</span>
            </div>
            <h1 className="font-headline font-black text-4xl mb-4 leading-tight">
              Pantau Perkembangan Akademik & Tagihan Anak Anda.
            </h1>
            <p className="text-gray-300 font-body text-lg max-w-md">
              Sistem Informasi Terpadu MI Attaqwa 15 Babelan. Dirancang khusus untuk memberikan kemudahan bagi Wali Murid.
            </p>
          </div>
          
          <div className="relative z-10 flex items-center gap-4 border-t border-white/10 pt-8 mt-12">
            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shrink-0">
              <span className="text-[#002957] font-black text-xl">15</span>
            </div>
            <div>
              <div className="font-bold">MI Attaqwa 15 Babelan</div>
              <div className="text-sm text-gray-400">Terakreditasi A (Unggul)</div>
            </div>
          </div>
        </div>

        {/* Right Side - Login Form */}
        <div className="w-full md:w-1/2 p-8 md:p-12 flex flex-col justify-center bg-white">
          <div className="md:hidden flex items-center gap-3 mb-8">
             <div className="w-10 h-10 bg-[#002957] rounded-full flex items-center justify-center shrink-0">
              <span className="text-white font-black">15</span>
            </div>
            <span className="font-bold text-xl text-[#002957]">MI Attaqwa 15</span>
          </div>

          <div className="mb-10">
            <h2 className="text-2xl md:text-3xl font-bold text-slate-800 mb-2">Selamat Datang 👋</h2>
            <p className="text-slate-500">Silakan login untuk mengakses Portal Wali Murid.</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            {error && (
              <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm font-medium border border-red-100 flex items-start gap-3">
                <Info className="w-5 h-5 shrink-0 mt-0.5" />
                {error}
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-sm font-bold text-slate-700 ml-1">Nomor Induk Siswa Nasional (NISN)</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                <input
                  type="text"
                  required
                  value={nis}
                  onChange={(e) => setNis(e.target.value)}
                  className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition outline-none text-slate-800 font-medium"
                  placeholder="Misal: 2023001"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-bold text-slate-700 ml-1">Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition outline-none text-slate-800 font-medium"
                  placeholder="••••••••"
                />
              </div>
              <p className="text-xs text-slate-500 ml-2 mt-1">Default password: mialibels15</p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#002957] hover:bg-blue-800 text-white font-bold py-4 rounded-2xl transition shadow-lg shadow-blue-900/20 flex items-center justify-center gap-2 group disabled:opacity-70 disabled:cursor-not-allowed mt-4"
            >
              {loading ? 'Memeriksa Data...' : 'Masuk ke Portal'}
              {!loading && <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />}
            </button>
          </form>

        </div>
      </div>
    </div>
  )
}
