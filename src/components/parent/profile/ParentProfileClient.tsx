'use client';

import React from 'react';
import { ParentProfileProps } from './types';
import { ParentProfileMobile } from './ParentProfileMobile';
import { ParentProfileDesktop } from './ParentProfileDesktop';

export * from './types';

export function ParentProfileClient({ student }: ParentProfileProps) {
  const formatCurrency = (n: number) =>
    new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(n);

  return (
    <div className="w-full max-w-full">
      {/* 📱 MOBILE FIRST EXPERIENCE (md:hidden) */}
      <div className="md:hidden">
        <ParentProfileMobile
          student={student}
          formatCurrency={formatCurrency}
        />
      </div>

      {/* 💻 DESKTOP EXPERIENCE (hidden md:block) */}
      <div className="hidden md:block">
        <ParentProfileDesktop
          student={student}
          formatCurrency={formatCurrency}
        />
      </div>
    </div>
  );
}
