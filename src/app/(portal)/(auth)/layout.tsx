import '../../globals.css';
import React from 'react';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-slate-50 font-sans text-slate-900">
        {children}
      </body>
    </html>
  );
}
