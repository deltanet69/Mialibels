import React from 'react';

export default function AdministrasiLoading() {
  return (
    <div className="w-full min-h-screen bg-[#f4f7fb]">
      {/* Mobile skeleton */}
      <div className="md:hidden">
        <div
          className="relative overflow-hidden"
          style={{
            background: 'linear-gradient(180deg, #163364ff 0%, #1e4480ff 55%, #1557bf 100%)',
            paddingTop: '32px',
            paddingBottom: '75px',
            paddingLeft: '20px',
            paddingRight: '20px',
          }}
        >
          <div
            className="absolute top-0 right-0 w-48 h-48 rounded-full pointer-events-none opacity-20"
            style={{ marginRight: '-48px', marginTop: '-48px', background: 'radial-gradient(circle, #38bdf8 0%, rgba(255,255,255,0) 70%)' }}
          />
          <div className="flex justify-between items-start relative z-10">
            <div>
              <div className="h-7 w-36 bg-white/20 rounded-lg animate-pulse mb-2" />
              <div className="h-3.5 w-52 bg-white/10 rounded-md animate-pulse" />
            </div>
            <div className="w-11 h-11 rounded-full bg-white/20 animate-pulse" />
          </div>
        </div>
        <div className="px-4 relative z-20" style={{ marginTop: '-35px' }}>
          <div className="bg-white rounded-2xl p-1.5 shadow-xl border border-slate-100 flex gap-1">
            {[1,2,3].map((i) => (
              <div key={i} className="flex-1 h-14 rounded-xl bg-slate-100 animate-pulse" />
            ))}
          </div>
        </div>
        <div className="px-4 mt-5 space-y-4">
          {/* Hero card skeleton */}
          <div className="rounded-2xl p-5 animate-pulse" style={{ background: 'linear-gradient(135deg, #1e40af 0%, #0284c7 100%)' }}>
            <div className="h-3 w-32 bg-white/30 rounded mb-2" />
            <div className="h-9 w-48 bg-white/30 rounded mb-2" />
            <div className="h-5 w-40 bg-white/20 rounded" />
          </div>
          {/* 2-column stat cards */}
          <div className="grid grid-cols-2 gap-2.5">
            <div className="bg-white rounded-2xl p-3.5 border border-slate-100 shadow-sm animate-pulse">
              <div className="h-2.5 w-20 bg-slate-100 rounded mb-2" />
              <div className="h-5 w-28 bg-slate-100 rounded mb-1" />
              <div className="h-3 w-16 bg-slate-100 rounded" />
            </div>
            <div className="bg-white rounded-2xl p-3.5 border border-slate-100 shadow-sm animate-pulse">
              <div className="h-2.5 w-20 bg-slate-100 rounded mb-2" />
              <div className="h-5 w-28 bg-slate-100 rounded mb-1" />
              <div className="h-3 w-16 bg-slate-100 rounded" />
            </div>
          </div>
          {/* List items */}
          {[1,2,3].map((i) => (
            <div key={i} className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm animate-pulse">
              <div className="flex justify-between items-center mb-2">
                <div className="h-4 w-24 bg-slate-100 rounded" />
                <div className="h-5 w-16 bg-slate-100 rounded-full" />
              </div>
              <div className="h-3 w-32 bg-slate-100 rounded mb-2" />
              <div className="h-8 w-full bg-slate-100 rounded-xl" />
            </div>
          ))}
        </div>
      </div>
      {/* Desktop skeleton */}
      <div className="hidden md:block space-y-4">
        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm animate-pulse">
          <div className="h-6 w-48 bg-slate-100 rounded mb-4" />
          <div className="flex gap-3">
            {[1,2,3].map((i) => (
              <div key={i} className="flex-1 h-10 bg-slate-100 rounded-xl" />
            ))}
          </div>
        </div>
        {[1,2,3,4].map((i) => (
          <div key={i} className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm animate-pulse">
            <div className="h-5 w-32 bg-slate-100 rounded mb-3" />
            <div className="h-4 bg-slate-100 rounded w-full" />
          </div>
        ))}
      </div>
    </div>
  );
}
