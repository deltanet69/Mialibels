import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = {
  title: 'Absensi Guru - MI Attaqwa 15',
  description: 'Halaman standby absensi guru MI Attaqwa 15',
}

export default function AbsenLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="antialiased bg-slate-900 text-white m-0 p-0 overflow-hidden min-h-screen">
      {children}
    </div>
  )
}
