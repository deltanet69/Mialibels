import React from 'react';
import { Sidebar } from '@/components/portal/Sidebar';
import { Navbar } from '@/components/portal/Navbar';
import '../../globals.css';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="flex min-h-screen bg-slate-50 font-sans text-slate-900">
        {/* Sidebar */}
        <Sidebar />
        
        {/* Main Content */}
        <div className="flex-1 flex flex-col min-w-0">
          <Navbar />
          
          {/* Page Content */}
          <main className="flex-1 p-6 overflow-auto">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
