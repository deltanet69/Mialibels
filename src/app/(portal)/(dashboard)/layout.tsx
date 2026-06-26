import React from 'react';
import { Sidebar } from '@/components/portal/Sidebar';
import { Navbar } from '@/components/portal/Navbar';
import '../../globals.css';

import { SidebarProvider } from '@/components/portal/SidebarProvider';

// Root layout untuk route group (dashboard)
// Sidebar sekarang Server Component — baca session dari JWT cookie langsung
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body className="flex min-h-screen bg-slate-50 font-sans text-slate-900">
        <SidebarProvider>
          {/* Sidebar — Server Component, baca session langsung dari cookie */}
          <Sidebar />

          {/* Main Content */}
          <div className="flex-1 flex flex-col min-w-0">
            <Navbar />

            {/* Page Content */}
            <main className="flex-1 p-6 overflow-auto">
              {children}
            </main>
          </div>
        </SidebarProvider>
      </body>
    </html>
  );
}
