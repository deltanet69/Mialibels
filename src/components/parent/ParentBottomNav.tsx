'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  AnimatedHomeIcon,
  AnimatedGraduationIcon,
  AnimatedAdminIcon,
  AnimatedInfoIcon,
  AnimatedProfileIcon,
} from './AnimatedNavIcons';

import { useParentNotifications } from '@/components/parent/ParentNotificationProvider';

interface NavItem {
  label: string;
  href: string;
  renderIcon: (isActive: boolean) => React.ReactNode;
  activeMatch: (pathname: string) => boolean;
  showPing?: boolean;
}

export function ParentBottomNav() {
  const pathname = usePathname();
  const { unreadCount, unpaidBillsCount } = useParentNotifications();

  const navItems: NavItem[] = [
    {
      label: 'Home',
      href: '/parent/dashboard',
      renderIcon: (isActive) => <AnimatedHomeIcon isActive={isActive} />,
      activeMatch: (p) => p === '/parent/dashboard',
    },
    {
      label: 'Kelas',
      href: '/parent/dashboard/classroom',
      renderIcon: (isActive) => <AnimatedGraduationIcon isActive={isActive} />,
      activeMatch: (p) => p.startsWith('/parent/dashboard/classroom') || p.startsWith('/parent/dashboard/attendance'),
    },
    {
      label: 'Admin',
      href: '/parent/dashboard/administrasi',
      renderIcon: (isActive) => <AnimatedAdminIcon isActive={isActive} />,
      activeMatch: (p) =>
        p.startsWith('/parent/dashboard/administrasi') ||
        p.startsWith('/parent/dashboard/spp') ||
        p.startsWith('/parent/dashboard/general') ||
        p.startsWith('/parent/dashboard/savings'),
      showPing: unpaidBillsCount > 0,
    },
    {
      label: 'Info',
      href: '/parent/dashboard/informasi',
      renderIcon: (isActive) => <AnimatedInfoIcon isActive={isActive} />,
      activeMatch: (p) => p.startsWith('/parent/dashboard/informasi'),
      showPing: unreadCount > 0,
    },
    {
      label: 'Profil',
      href: '/parent/dashboard/profile',
      renderIcon: (isActive) => <AnimatedProfileIcon isActive={isActive} />,
      activeMatch: (p) => p.startsWith('/parent/dashboard/profile') || p.startsWith('/parent/dashboard/change-password'),
    },
  ];

  return (
    <div
      className="md:hidden fixed bottom-3 left-0 right-0 z-50 px-3 pointer-events-none flex justify-center"
      style={{
        position: 'fixed',
        bottom: '12px',
        left: 0,
        right: 0,
        zIndex: 50,
        padding: '0 12px',
        pointerEvents: 'none',
        display: 'flex',
        justifyContent: 'center',
      }}
      suppressHydrationWarning
    >
      <nav
        aria-label="Navigasi Utama Portal Wali Murid"
        className="pointer-events-auto w-full max-w-md py-2.5 px-3 bg-[#1d2d52] rounded-[24px] border border-slate-600/50 shadow-[0_16px_36px_-4px_rgba(2,6,23,0.85)] transition-all duration-300"
        style={{
          backgroundColor: '#1a3b70',
          background: '#1d2b4dff',
          borderRadius: '20px',
          // border: '1px solid rgba(255, 255, 255, 0.15)',
          boxShadow: '0 16px 36px -4px rgba(66, 90, 197, 0.19), 0 0 0 1px rgba(55, 57, 165, 0.73)',
          width: '100%',
          maxWidth: '430px',
          pointerEvents: 'auto',
        }}
        suppressHydrationWarning
      >
        <div 
          className="flex items-center justify-between gap-1 w-full"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '4px',
            width: '100%',
          }}
        >
          {navItems.map((item) => {
            const isActive = item.activeMatch(pathname);

            return (
              <Link
                key={item.href}
                href={item.href}
                prefetch={true}
                className="relative flex-1 flex flex-col items-center justify-center py-1.5 px-1 touch-manipulation transition-all duration-200 group cursor-pointer active:scale-95 select-none"
                style={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '6px 4px',
                  textDecoration: 'none',
                  position: 'relative',
                  backgroundColor: 'transparent',
                  background: 'transparent',
                  border: 'none',
                  boxShadow: 'none',
                  borderRadius: 0,
                }}
              >
                {/* Icon Container with Micro-animation */}
                <div 
                  className="flex items-center justify-center h-6 w-6 relative transition-transform duration-200"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: '24px',
                    width: '24px',
                    position: 'relative',
                  }}
                >
                  {item.renderIcon(isActive)}
                  {item.showPing && (
                    <span 
                      className="absolute top-0 right-0 w-2 h-2 bg-rose-500 rounded-full border border-[#1d2d52] animate-pulse" 
                      style={{
                        position: 'absolute',
                        top: 0,
                        right: 0,
                        width: '8px',
                        height: '8px',
                        backgroundColor: '#f43f5e',
                        borderRadius: '50%',
                        border: '1px solid #1d2d52'
                      }}
                    />
                  )}
                </div>

                {/* Nav Label */}
                <span
                  className={`text-[11px] tracking-tight mt-1 transition-colors duration-200 ${
                    isActive
                      ? 'text-white font-extrabold'
                      : 'text-slate-400 font-medium group-hover:text-slate-200'
                  }`}
                  style={{
                    fontSize: '11px',
                    marginTop: '4px',
                    letterSpacing: '-0.01em',
                    fontWeight: isActive ? 800 : 500,
                    color: isActive ? '#ffffff' : '#94a3b8',
                    lineHeight: 1.1,
                    textAlign: 'center',
                  }}
                >
                  {item.label}
                </span>

                {/* Glowing Dot indicator for active tab (clean, no box/border) */}
                {isActive && (
                  <span 
                    className="w-1.5 h-1.5 rounded-full mt-1 animate-pulse"
                    style={{
                      width: '5px',
                      height: '5px',
                      borderRadius: '50%',
                      backgroundColor: '#22d3ee',
                      marginTop: '3px',
                      boxShadow: '0 0 8px #22d3ee',
                    }}
                  />
                )}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
