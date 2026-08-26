import React from 'react'
import type { Metadata } from 'next'
import AbsenClientPage from '@/components/frontend/absen/AbsenClientPage'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Absensi Guru - MI Attaqwa 15',
  description: 'Halaman standby absensi guru MI Attaqwa 15',
}

export default function AbsenPage() {
  return <AbsenClientPage />
}
