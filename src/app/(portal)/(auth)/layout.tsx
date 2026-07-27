import React from 'react';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div lang="en">
      <div className="bg-slate-50 font-sans text-slate-900">
        {children}
      </div>
    </div>
  );
}
