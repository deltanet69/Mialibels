import React from 'react'
import { Metadata } from 'next'
import AbsensiSiswaAcademicClient from '@/components/portal/academic/AbsensiSiswaAcademicClient'

export const metadata: Metadata = {
  title: 'Rekap Absensi Siswa | MI Attaqwa 15 Babelan',
  description: 'Monitoring dan rekapitulasi presensi siswa seluruh rombel kelas MI Attaqwa 15 Babelan.'
}

export default function AcademicAbsensiSiswaPage() {
  return <AbsensiSiswaAcademicClient />
}
