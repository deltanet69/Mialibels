import React from 'react';

export interface ParentLoginProps {
  nis: string;
  setNis: (v: string) => void;
  password: string;
  setPassword: (v: string) => void;
  loading: boolean;
  error: string | null;
  handleLogin: (e: React.FormEvent) => void;
}
