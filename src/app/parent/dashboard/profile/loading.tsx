import React from 'react';

export default function ProfileLoading() {
  return (
    <div className="w-full min-h-screen bg-[#f4f7fb]">
      <div className="md:hidden">
        <div
          className="relative overflow-hidden"
          style={{
            background: 'linear-gradient(180deg, #163364ff 0%, #1e4480ff 55%, #1557bf 100%)',
            paddingTop: '32px',
            paddingBottom: '82px',
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
              <div className="h-7 w-28 bg-white/20 rounded-lg animate-pulse mb-2" />
              <div className="h-3.5 w-44 bg-white/10 rounded-md animate-pulse" />
            </div>
            <div className="w-11 h-11 rounded-full bg-white/20 animate-pulse" />
          </div>
          <div className="h-4 w-36 bg-white/15 rounded-md animate-pulse mt-3.5" />
        </div>
        <div className="px-4 relative z-20" style={{ marginTop: '-56px' }}>
          <div className="bg-white rounded-2xl p-5 shadow-xl border border-slate-100 animate-pulse">
            <div className="flex gap-4 items-start mb-4">
              <div className="w-16 h-16 rounded-2xl bg-slate-100 shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="flex gap-1.5">
                  <div className="h-5 w-16 bg-slate-100 rounded-full" />
                  <div className="h-5 w-20 bg-slate-100 rounded-full" />
                </div>
                <div className="h-5 w-40 bg-slate-100 rounded" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 pt-3 border-t border-slate-100">
              <div className="bg-slate-50 rounded-2xl p-2.5 border border-slate-100">
                <div className="h-2.5 w-20 bg-slate-100 rounded mb-1.5" />
                <div className="h-3.5 w-24 bg-slate-100 rounded" />
              </div>
              <div className="bg-slate-50 rounded-2xl p-2.5 border border-slate-100">
                <div className="h-2.5 w-20 bg-slate-100 rounded mb-1.5" />
                <div className="h-3.5 w-24 bg-slate-100 rounded" />
              </div>
            </div>
          </div>
        </div>
        <div className="px-4 mt-4 space-y-3">
          {[1,2,3].map((i) => (
            <div key={i} className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm animate-pulse">
              <div className="h-4 w-24 bg-slate-100 rounded mb-3" />
              <div className="space-y-2">
                <div className="h-3.5 bg-slate-100 rounded w-full" />
                <div className="h-3.5 bg-slate-100 rounded w-3/4" />
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="hidden md:block space-y-4">
        {[1,2,3].map((i) => (
          <div key={i} className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm animate-pulse">
            <div className="h-5 w-32 bg-slate-100 rounded mb-4" />
            <div className="h-4 bg-slate-100 rounded w-full" />
          </div>
        ))}
      </div>
    </div>
  );
}
