import React from 'react'
import { ParentSidebar } from '@/components/parent/ParentSidebar'
import { ParentNavbar } from '@/components/parent/ParentNavbar'
import { ParentSidebarProvider } from '@/components/parent/ParentSidebarProvider'
import { cookies } from 'next/headers'
import { jwtVerify } from 'jose'

const JWT_SECRET = process.env.JWT_SECRET!

async function getSessionData() {
  const cookieStore = await cookies()
  const token = cookieStore.get('parent_session')?.value
  if (!token) return { studentName: '', parentName: '' }
  try {
    const secret = new TextEncoder().encode(JWT_SECRET)
    const { payload } = await jwtVerify(token, secret)
    return {
      studentName: (payload.studentName as string) || '',
      parentName: (payload.parentName as string) || '',
    }
  } catch {
    return { studentName: '', parentName: '' }
  }
}

export default async function ParentDashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getSessionData()

  return (
    <div className="flex min-h-screen bg-slate-50 font-sans text-slate-900">
      <ParentSidebarProvider>
        <ParentSidebar />
        
        <div className="flex-1 flex flex-col min-w-0">
          <ParentNavbar studentName={session.studentName} parentName={session.parentName} />
          
          <main className="flex-1 p-6 overflow-auto">
            {children}
          </main>
        </div>
      </ParentSidebarProvider>
    </div>
  )
}

