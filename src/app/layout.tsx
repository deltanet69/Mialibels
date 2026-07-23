import type { Metadata } from 'next'

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
    <html lang="id">
      <body>
        {children}
      </body>
    </html>
  )
}
