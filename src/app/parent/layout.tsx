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
      <body className="min-h-full bg-slate-50 text-slate-900 font-sans">
        <style dangerouslySetInnerHTML={{__html: `
          h1, h2, h3, h4, h5, h6 {
            font-family: var(--font-open-sans), sans-serif !important;
          }
        `}} />
        {children}
      </body>
    </html>
  )
}
