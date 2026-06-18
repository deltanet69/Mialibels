'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../../../lib/supabase/client';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        console.error('Auth error:', authError);
        throw new Error(authError.message);
      }

      if (data?.user) {
        // Query the admin's role to confirm they have permission
        const { data: admin, error: dbError } = await supabase
          .from('admins')
          .select('role, is_active')
          .eq('id', data.user.id)
          .single();

        if (dbError) {
          console.error('DB error fetching admin role:', dbError);
          await supabase.auth.signOut();
          throw new Error(`Database error: ${dbError.message}`);
        }

        if (!admin) {
          await supabase.auth.signOut();
          throw new Error('Access denied. You are not authorized as an administrator.');
        }

        if (!admin.is_active) {
          await supabase.auth.signOut();
          throw new Error('Access denied. Your admin account is inactive.');
        }

        // Redirect on success
        router.push('/dashboard');
        router.refresh();
      }
    } catch (err: any) {
      console.error('Sign in catch block:', err);
      const msg = err instanceof Error ? err.message : (typeof err === 'object' ? JSON.stringify(err) : String(err));
      setError(msg || 'An error occurred during sign in.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 font-sans">
      <div className="w-full max-w-md bg-white p-8 rounded-lg shadow-sm border border-slate-200">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-slate-800">Admin Portal</h1>
          <p className="text-slate-500 text-sm mt-1">Sign in to your account</p>
        </div>
        
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded text-sm">
            {error}
          </div>
        )}
        
        <form className="space-y-4" onSubmit={handleLogin}>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
            <input 
              type="email" 
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
              placeholder="admin@miattaqwa15.sch.id"
              disabled={loading}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
            <input 
              type="password" 
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
              placeholder="••••••••"
              disabled={loading}
            />
          </div>
          
          <button 
            type="submit"
            disabled={loading}
            className="w-full bg-slate-900 text-white font-medium py-2 px-4 rounded hover:bg-slate-800 transition mt-4 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? 'Signing In...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
}

