import React from 'react';
import { Sidebar } from '@/components/portal/Sidebar';
import { Navbar } from '@/components/portal/Navbar';
import '../../globals.css';

import { SidebarProvider } from '@/components/portal/SidebarProvider';
import { GlobalAttendanceScanner } from '@/components/portal/GlobalAttendanceScanner';

// Root layout untuk route group (dashboard)
// Sidebar sekarang Server Component — baca session dari JWT cookie langsung
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-slate-50 font-sans text-slate-900">
      <div className="flex-1 flex flex-col w-0 min-w-0">
        <SidebarProvider>
          <div className="flex flex-1 overflow-hidden h-screen w-full">
            <Sidebar />
            
            <div className="flex-1 flex flex-col w-0 overflow-hidden relative min-h-0 bg-white md:bg-transparent rounded-none md:rounded-l-3xl shadow-[0_0_40px_rgba(0,0,0,0.05)] border-l border-slate-200">
              <Navbar />
              
              <main className="flex-1 overflow-x-hidden overflow-y-auto">
                <div className="p-4 md:p-8 md:pb-12 h-full mx-auto max-w-[1400px]">
                  {children}
                </div>
              </main>
            </div>
            
            {/* Global RFID Scanner & Notifications */}
            <GlobalAttendanceScanner />
          </div>
        </SidebarProvider>
      </div>
    </div>
  );
}
