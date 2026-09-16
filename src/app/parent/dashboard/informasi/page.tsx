import React from 'react';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import { getJwtSecretKey } from '@/lib/jwt';
import { ParentInformasiClient } from '@/components/parent/informasi/ParentInformasiClient';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Informasi Sekolah - Portal Wali Murid | MI Attaqwa 15',
  description: 'Papan pengumuman resmi, surat edaran, dan informasi penting MI Attaqwa 15 Babelan.',
};

export default async function ParentInformasiPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get('parent_session')?.value;
  if (!token) redirect('/parent/login');

  try {
    await jwtVerify(token, getJwtSecretKey());
  } catch {
    redirect('/parent/login');
  }

  return <ParentInformasiClient />;
}
