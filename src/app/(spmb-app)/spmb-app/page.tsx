import React from 'react'
import type { Metadata } from 'next'
import PpdbClientPage from '@/components/frontend/ppdb/PpdbClientPage'
import { getSpmbSettings } from '@/lib/spmb-settings'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export const metadata: Metadata = {
  title: 'Pendaftaran SPMB Online | MI Attaqwa 15 Babelan',
  description: 'Portal Sistem Penerimaan Murid Baru (SPMB) Online MI Attaqwa 15 Babelan. Isi formulir, cek status, dan unggah berkas pendaftaran.',
}

export default async function SpmbAppPage() {
  const settings = await getSpmbSettings()
  return <PpdbClientPage initialSettings={settings} />
}
