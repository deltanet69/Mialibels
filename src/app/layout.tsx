import type { Metadata } from 'next'
import { Open_Sans, Oswald } from 'next/font/google'
import './globals.css'

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
  title: 'MI Attaqwa 15 Babelan',
  description: 'Sistem Informasi MI Attaqwa 15 Babelan',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="id" className={`${openSans.variable} ${oswald.variable} antialiased`}>
      <body>
        {children}
      </body>
    </html>
  )
}
