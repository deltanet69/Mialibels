import React from 'react';
import { Sidebar } from '@/components/portal/Sidebar';
import { Navbar } from '@/components/portal/Navbar';

import { SidebarProvider } from '@/components/portal/SidebarProvider';
import { GlobalAttendanceScanner } from '@/components/portal/GlobalAttendanceScanner';

// Root layout untuk route group (dashboard)
// Sidebar sekarang Server Component — baca session dari JWT cookie langsung
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-slate-50 font-sans text-slate-900 print:block print:min-h-0 print:bg-white">
      <div className="flex-1 flex flex-col w-0 min-w-0 print:block print:w-full print:min-w-full">
        <SidebarProvider>
          <div className="flex flex-1 overflow-hidden h-screen w-full print:block print:h-auto print:overflow-visible">
            <Sidebar />
            
            <div className="flex-1 flex flex-col w-0 overflow-hidden relative min-h-0 bg-white md:bg-transparent rounded-none md:rounded-l-3xl shadow-[0_0_40px_rgba(0,0,0,0.05)] border-l border-slate-200 print:block print:w-full print:overflow-visible print:rounded-none print:shadow-none print:border-none print:bg-white">
              <Navbar />
              
              <main className="flex-1 overflow-x-hidden overflow-y-auto print:block print:overflow-visible">
                <div className="p-4 md:p-8 md:pb-12 h-full mx-auto w-full print:p-0 print:h-auto">
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
