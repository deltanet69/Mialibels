import React from 'react'
import { ParentSidebar } from '@/components/parent/ParentSidebar'
import { ParentNavbar } from '@/components/parent/ParentNavbar'

export default function ParentDashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-[#F8FAFC] font-sans text-slate-900">
      {/* Sidebar for Desktop / Hidden on Mobile (Mobile will use bottom nav if preferred, or hamburger menu) */}
      <ParentSidebar />
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        <ParentNavbar />
        
        {/* Page Content */}
        <main className="flex-1 p-4 md:p-6 overflow-auto pb-24 md:pb-6">
          {children}
        </main>
      </div>
    </div>
  )
}
