import type { Metadata } from 'next'
import { Open_Sans, Oswald } from 'next/font/google'
import '../globals.css'

const openSans = Open_Sans({
  subsets: ['latin'],
  variable: '--font-open-sans',
  display: 'swap',
})

const oswald = Oswald({
  subsets: ['latin'],
  variable: '--font-oswald',
  display: 'swap',
})

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
    <html lang="id" className={`${openSans.variable} ${oswald.variable} h-full antialiased`}>
      <body className="min-h-full bg-[#F8FAFC] text-slate-900">
        {children}
      </body>
    </html>
  )
}
