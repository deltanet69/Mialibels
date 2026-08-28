import React from 'react'
import { ParentSidebar } from '@/components/parent/ParentSidebar'
import { ParentNavbar } from '@/components/parent/ParentNavbar'
import { ParentSidebarProvider } from '@/components/parent/ParentSidebarProvider'
import { cookies } from 'next/headers'
import { jwtVerify } from 'jose'

const JWT_SECRET = process.env.JWT_SECRET || 'mialibels_jwt_secret_fallback_key_2026'

import { redirect } from 'next/navigation'

async function getSessionData() {
  const cookieStore = await cookies()
  const token = cookieStore.get('parent_session')?.value
  if (!token) redirect('/parent/login') // Also enforce login just in case
  try {
    const secret = new TextEncoder().encode(JWT_SECRET)
    const { payload } = await jwtVerify(token, secret)
    return {
      studentName: (payload.studentName as string) || '',
      parentName: (payload.parentName as string) || '',
      isDefaultPassword: payload.isDefaultPassword === true,
    }
  } catch {
    redirect('/parent/login')
  }
}

export default async function ParentDashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getSessionData()

  // Redirect to change-password if they are using the default password
  if (session.isDefaultPassword) {
    redirect('/parent/change-password')
  }

  return (
    <div className="flex min-h-screen bg-slate-50 font-sans text-slate-900">
      <ParentSidebarProvider>
        <ParentSidebar />
        
        <div className="flex-1 flex flex-col min-w-0">
          <ParentNavbar studentName={session.studentName} parentName={session.parentName} />
          
          <main className="flex-1 p-4 md:p-6 overflow-auto">
            {children}
          </main>
        </div>
      </ParentSidebarProvider>
    </div>
  )
}

