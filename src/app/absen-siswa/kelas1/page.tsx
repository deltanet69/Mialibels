import React from 'react'
import type { Metadata } from 'next'
import AbsenKelas1ClientPage from '@/components/frontend/absen/AbsenKelas1ClientPage'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Absensi Siswa Kelas 1 (Gedung 2) - MI Attaqwa 15',
  description: 'Halaman standby absensi siswa terpadu Kelas 1 (1B, 1C, 1D) MI Attaqwa 15 Babelan',
}

export default function Page() {
  return <AbsenKelas1ClientPage />
}
