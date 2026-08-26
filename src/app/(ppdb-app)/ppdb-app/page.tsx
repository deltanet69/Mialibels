import React from 'react'
import type { Metadata } from 'next'
import PpdbClientPage from '@/components/frontend/ppdb/PpdbClientPage'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Pendaftaran PPDB Online | MI Attaqwa 15 Babelan',
  description: 'Portal Pendaftaran Peserta Didik Baru (PPDB) Online MI Attaqwa 15 Babelan. Isi formulir, cek status, dan unggah berkas pendaftaran.',
}

export default function PpdbAppPage() {
  return <PpdbClientPage />
}
