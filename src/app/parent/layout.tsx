import type { Metadata } from 'next'
import './parent.css'

export const metadata: Metadata = {
  title: 'Portal Wali Murid - MI Attaqwa 15 Babelan',
  description: 'Portal khusus Wali Murid MI Attaqwa 15 Babelan untuk memantau perkembangan akademik, kehadiran, dan tagihan SPP anak.',
}

export default function ParentRootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-full bg-slate-50 text-slate-900 font-sans">
      {children}
    </div>
  )
}
