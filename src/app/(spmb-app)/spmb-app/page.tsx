import React from 'react'
import type { Metadata } from 'next'
import PpdbClientPage from '@/components/frontend/ppdb/PpdbClientPage'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Pendaftaran SPMB Online | MI Attaqwa 15 Babelan',
  description: 'Portal Sistem Penerimaan Murid Baru (SPMB) Online MI Attaqwa 15 Babelan. Isi formulir, cek status, dan unggah berkas pendaftaran.',
}

export default function SpmbAppPage() {
  return <PpdbClientPage />
}
