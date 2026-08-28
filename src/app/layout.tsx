import type { Metadata } from 'next'
import { Open_Sans, Archivo } from 'next/font/google'
import './globals.css'

const openSans = Open_Sans({
  subsets: ['latin'],
  variable: '--font-open-sans',
  display: 'swap',
})

const archivo = Archivo({
  subsets: ['latin'],
  variable: '--font-archivo',
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
    <html lang="id" className={`${openSans.variable} ${archivo.variable} antialiased`}>
      <body>
        {children}
      </body>
    </html>
  )
}
