import React from 'react';

export default function DashboardLoading() {
  return (
    <div className="w-full min-h-screen bg-[#f4f7fb]">
      <div className="md:hidden">
        <div
          className="relative overflow-hidden"
          style={{
            background: 'linear-gradient(180deg, #163364ff 0%, #1e4480ff 55%, #1557bf 100%)',
            paddingTop: '20px',
            paddingBottom: '80px',
            paddingLeft: '20px',
            paddingRight: '20px',
          }}
        >
          <div
            className="absolute top-0 right-0 w-48 h-48 rounded-full pointer-events-none opacity-20"
            style={{ marginRight: '-48px', marginTop: '-48px', background: 'radial-gradient(circle, #38bdf8 0%, rgba(255,255,255,0) 70%)' }}
          />
          <div className="flex justify-between items-center mb-5 relative z-10">
            <div>
              <div className="h-3 w-20 bg-white/20 rounded mb-1.5 animate-pulse" />
              <div className="h-6 w-36 bg-white/20 rounded animate-pulse" />
            </div>
            <div className="w-11 h-11 rounded-full bg-white/20 animate-pulse" />
          </div>
          <div className="grid grid-cols-2 gap-2.5 relative z-10">
            {[1,2].map((i) => (
              <div key={i} className="bg-white/15 rounded-2xl p-3.5 animate-pulse">
                <div className="h-2.5 w-20 bg-white/20 rounded mb-2" />
                <div className="h-7 w-24 bg-white/20 rounded" />
              </div>
            ))}
          </div>
        </div>
        <div className="px-4 relative z-20" style={{ marginTop: '-40px' }}>
          <div className="bg-white rounded-2xl p-4 shadow-xl border border-slate-100 animate-pulse mb-4">
            <div className="h-4 w-32 bg-slate-100 rounded mb-3" />
            <div className="flex gap-2">
              {[1,2,3,4,5].map((i) => (
                <div key={i} className="flex-1 h-12 rounded-xl bg-slate-100" />
              ))}
            </div>
          </div>
          {[1,2].map((i) => (
            <div key={i} className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm animate-pulse mb-3">
              <div className="h-4 w-28 bg-slate-100 rounded mb-3" />
              <div className="space-y-2">
                <div className="h-3.5 bg-slate-100 rounded" />
                <div className="h-3.5 bg-slate-100 rounded w-3/4" />
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="hidden md:block p-6 space-y-4">
        {[1,2,3].map((i) => (
          <div key={i} className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm animate-pulse">
            <div className="h-5 w-40 bg-slate-100 rounded mb-4" />
            <div className="h-4 bg-slate-100 rounded w-full mb-2" />
            <div className="h-4 bg-slate-100 rounded w-3/4" />
          </div>
        ))}
      </div>
    </div>
  );
}
