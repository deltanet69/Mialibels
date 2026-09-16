'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ParentLoginDesktop } from '@/components/parent/login/ParentLoginDesktop';
import { ParentLoginMobile } from '@/components/parent/login/ParentLoginMobile';

export default function ParentLoginPage() {
  const [nis, setNis] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/auth/parent-login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({ nis, password }),
      });

      let data: any = {};
      try {
        data = await res.json();
      } catch (jsonErr) {
        console.error('Failed to parse JSON response:', jsonErr);
      }

      if (!res.ok) {
        throw new Error(data?.error || `Login gagal (${res.status}). Periksa kembali ID Siswa dan Password Anda.`);
      }

      // Hard navigation on success to ensure cookie inclusion and fresh server rendering
      window.location.href = '/parent/dashboard';
      
    } catch (err: any) {
      console.error('Parent sign in catch block:', err);
      const msg = err instanceof Error ? err.message : (typeof err === 'object' ? JSON.stringify(err) : String(err));
      setError(msg || 'Terjadi kesalahan saat masuk.');
      setLoading(false);
    }
  };

  const loginProps = {
    nis,
    setNis,
    password,
    setPassword,
    loading,
    error,
    handleLogin,
  };

  return (
    <>
      <ParentLoginDesktop {...loginProps} />
      <ParentLoginMobile {...loginProps} />
    </>
  );
}
