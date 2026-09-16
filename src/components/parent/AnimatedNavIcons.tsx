'use client';

import React from 'react';

interface IconProps {
  isActive: boolean;
  className?: string;
}

/**
 * 🏠 Animated Home Icon (21st.dev style)
 * Features glowing interior chimney/door + gentle roof lift on active
 */
export function AnimatedHomeIcon({ isActive, className = '' }: IconProps) {
  return (
    <div className={`relative flex items-center justify-center ${className}`}>
      <svg
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={isActive ? "2.2" : "1.8"}
        strokeLinecap="round"
        strokeLinejoin="round"
        className={`transition-all duration-300 ${isActive
            ? 'scale-110 text-cyan-300 drop-shadow-[0_0_8px_rgba(34,211,238,0.6)]'
            : 'text-slate-400 group-hover:text-slate-200'
          }`}
      >
        {/* Roof with subtle bounce */}
        <path
          d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"
          className={isActive ? 'stroke-cyan-300' : 'stroke-current'}
        />
        {/* Glowing Doorway / Interior */}
        <path
          d="M9 22V12h6v10"
          className={`transition-all duration-300 ${isActive
              ? 'fill-cyan-400/25 stroke-cyan-200 animate-pulse'
              : 'fill-transparent stroke-current'
            }`}
        />
        {/* Sparkle dot above roof when active */}
        {isActive && (
          <circle cx="12" cy="5" r="1.2" className="fill-cyan-300 stroke-none animate-ping" />
        )}
      </svg>
    </div>
  );
}

/**
 * 🎓 Animated Classroom / Graduation Cap Icon (21st.dev style)
 * Features swinging tassel animation + glowing mortarboard
 */
export function AnimatedGraduationIcon({ isActive, className = '' }: IconProps) {
  return (
    <div className={`relative flex items-center justify-center ${className}`}>
      <svg
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={isActive ? "2.2" : "1.8"}
        strokeLinecap="round"
        strokeLinejoin="round"
        className={`transition-all duration-300 ${isActive
            ? 'scale-110 text-cyan-300 drop-shadow-[0_0_8px_rgba(34,211,238,0.6)]'
            : 'text-slate-400 group-hover:text-slate-200'
          }`}
      >
        {/* Mortarboard Rhombus Top */}
        <path
          d="M21.42 10.922a1 1 0 0 0-.019-1.838L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.08a1 1 0 0 0 0 1.832l8.57 3.908a2 2 0 0 0 1.66 0z"
          className={`transition-all duration-300 ${isActive ? 'fill-cyan-500/20 stroke-cyan-300' : 'fill-transparent stroke-current'}`}
        />
        {/* Base Cap Body */}
        <path d="M6 13v4a6 3 0 0 0 12 0v-4" />
        {/* Swinging Tassel Line */}
        <path
          d="M20 10v6"
          className={`origin-top transition-transform duration-700 ${isActive ? 'animate-[wiggle_1.5s_ease-in-out_infinite] stroke-cyan-200' : 'stroke-current'
            }`}
          style={{ transformOrigin: '20px 10px' }}
        />
        {/* Tassel Ball */}
        <circle cx="20" cy="16.5" r="1" className={isActive ? 'fill-cyan-300 stroke-none animate-pulse' : 'fill-current stroke-none'} />
      </svg>
    </div>
  );
}

/**
 * 💳 Animated Finance / Administration Icon (21st.dev style)
 * Features sliding card effect + pulsing security chip
 */
export function AnimatedAdminIcon({ isActive, className = '' }: IconProps) {
  return (
    <div className={`relative flex items-center justify-center ${className}`}>
      <svg
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={isActive ? "2.2" : "1.8"}
        strokeLinecap="round"
        strokeLinejoin="round"
        className={`transition-all duration-300 ${isActive
            ? 'scale-110 text-cyan-300 drop-shadow-[0_0_8px_rgba(34,211,238,0.6)]'
            : 'text-slate-400 group-hover:text-slate-200'
          }`}
      >
        {/* Card Main Body */}
        <rect
          width="20"
          height="14"
          x="2"
          y="5"
          rx="3"
          className={`transition-all duration-300 ${isActive ? 'fill-cyan-500/20 stroke-cyan-300' : 'fill-transparent stroke-current'}`}
        />
        {/* Card Magnetic Stripe */}
        <line x1="2" x2="22" y1="10" y2="10" className={isActive ? 'stroke-cyan-400/70' : 'stroke-current'} />
        {/* Smart Card Chip / Security Dots */}
        <line
          x1="6"
          x2="10"
          y1="15"
          y2="15"
          className={isActive ? 'stroke-cyan-200 animate-pulse stroke-[2.5]' : 'stroke-current'}
        />
        <line x1="14" x2="18" y1="15" y2="15" className={isActive ? 'stroke-cyan-300/80' : 'stroke-current'} />
      </svg>
    </div>
  );
}

/**
 * 📢 Animated Megaphone / Info Icon (21st.dev style)
 * Features expanding soundwave pulses + active beacon
 */
export function AnimatedInfoIcon({ isActive, className = '' }: IconProps) {
  return (
    <div className={`relative flex items-center justify-center ${className}`}>
      <svg
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={isActive ? "2.2" : "1.8"}
        strokeLinecap="round"
        strokeLinejoin="round"
        className={`transition-all duration-300 ${isActive
            ? 'scale-110 text-cyan-300 drop-shadow-[0_0_8px_rgba(34,211,238,0.6)]'
            : 'text-slate-400 group-hover:text-slate-200'
          }`}
      >
        {/* Megaphone Cone Body */}
        <path
          d="m3 11 18-5v12L3 13v-2z"
          className={`transition-all duration-300 ${isActive ? 'fill-cyan-500/20 stroke-cyan-300' : 'fill-transparent stroke-current'}`}
        />
        {/* Megaphone Handle */}
        <path d="M11.6 16.8a3 3 0 1 1-5.8-1.6" />
        {/* Sound Wave Beams */}
        {isActive ? (
          <>
            <path d="M19 8c1.2 1.2 1.2 4.8 0 6" className="stroke-cyan-200 animate-pulse" />
            <path d="M22 6c2.5 2.5 2.5 7.5 0 10" className="stroke-cyan-300/60 animate-ping opacity-75" />
          </>
        ) : null}
      </svg>
    </div>
  );
}

/**
 * 👤 Animated Profile / User Icon (21st.dev style)
 * Features glowing aura halo + orbital ring
 */
export function AnimatedProfileIcon({ isActive, className = '' }: IconProps) {
  return (
    <div className={`relative flex items-center justify-center ${className}`}>
      <svg
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={isActive ? "2.2" : "1.8"}
        strokeLinecap="round"
        strokeLinejoin="round"
        className={`transition-all duration-300 ${isActive
            ? 'scale-110 text-cyan-300 drop-shadow-[0_0_8px_rgba(34,211,238,0.6)]'
            : 'text-slate-400 group-hover:text-slate-200'
          }`}
      >
        {/* User Head */}
        <circle
          cx="12"
          cy="7"
          r="4"
          className={`transition-all duration-300 ${isActive ? 'fill-cyan-500/25 stroke-cyan-200' : 'fill-transparent stroke-current'}`}
        />
        {/* User Body */}
        <path
          d="M20 21a8 8 0 0 0-16 0"
          className={isActive ? 'stroke-cyan-300' : 'stroke-current'}
        />
        {/* Orbital active aura ring around head */}
        {isActive && (
          <ellipse
            cx="12"
            cy="7"
            rx="6"
            ry="2.5"
            className="stroke-cyan-300/50 fill-none stroke-[1.2] animate-[spin_4s_linear_infinite]"
          />
        )}
      </svg>
    </div>
  );
}

/**
 * 📚 Animated Book / Jadwal Icon for Sub-tabs
 */
export function AnimatedBookTabIcon({ isActive, className = '' }: IconProps) {
  return (
    <div className={`relative flex items-center justify-center ${className}`}>
      <svg
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={isActive ? "2.2" : "1.8"}
        strokeLinecap="round"
        strokeLinejoin="round"
        className={`transition-all duration-300 ${
          isActive
            ? 'scale-110 text-blue-600 drop-shadow-[0_2px_8px_rgba(37,99,235,0.35)]'
            : 'text-slate-400 hover:text-slate-600'
        }`}
      >
        <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" className={isActive ? 'fill-blue-50 stroke-blue-600' : 'fill-transparent stroke-current'} />
        <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" className={isActive ? 'fill-blue-50 stroke-blue-600' : 'fill-transparent stroke-current'} />
        {isActive && (
          <path d="M6 8h2m-2 4h2m10-4h2m-2 4h2" className="stroke-blue-400 stroke-[1.5] animate-pulse" />
        )}
      </svg>
    </div>
  );
}

/**
 * 📋 Animated Attendance / Clipboard Icon for Sub-tabs
 */
export function AnimatedAttendanceTabIcon({ isActive, className = '' }: IconProps) {
  return (
    <div className={`relative flex items-center justify-center ${className}`}>
      <svg
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={isActive ? "2.2" : "1.8"}
        strokeLinecap="round"
        strokeLinejoin="round"
        className={`transition-all duration-300 ${
          isActive
            ? 'scale-110 text-blue-600 drop-shadow-[0_2px_8px_rgba(37,99,235,0.35)]'
            : 'text-slate-400 hover:text-slate-600'
        }`}
      >
        <rect width="8" height="4" x="8" y="2" rx="1" ry="1" className={isActive ? 'fill-blue-100 stroke-blue-600' : 'fill-transparent stroke-current'} />
        <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" className={isActive ? 'stroke-blue-600' : 'stroke-current'} />
        <path d="m9 14 2 2 4-4" className={`transition-all duration-300 ${isActive ? 'stroke-blue-600 stroke-[2.4] animate-pulse' : 'stroke-current'}`} />
      </svg>
    </div>
  );
}

/**
 * 🏆 Animated Award / Nilai Icon for Sub-tabs
 */
export function AnimatedAwardTabIcon({ isActive, className = '' }: IconProps) {
  return (
    <div className={`relative flex items-center justify-center ${className}`}>
      <svg
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={isActive ? "2.2" : "1.8"}
        strokeLinecap="round"
        strokeLinejoin="round"
        className={`transition-all duration-300 ${
          isActive
            ? 'scale-110 text-blue-600 drop-shadow-[0_2px_8px_rgba(37,99,235,0.35)]'
            : 'text-slate-400 hover:text-slate-600'
        }`}
      >
        <path d="m8 21 4-2 4 2v-4.5l-4-2-4 2z" className={isActive ? 'fill-blue-100 stroke-blue-600' : 'fill-transparent stroke-current'} />
        <circle cx="12" cy="8" r="6" className={isActive ? 'fill-blue-50 stroke-blue-600' : 'fill-transparent stroke-current'} />
        {isActive && (
          <circle cx="12" cy="8" r="2.5" className="fill-blue-500 stroke-none animate-ping opacity-60" />
        )}
      </svg>
    </div>
  );
}

/**
 * 📜 Animated Report / Raport Icon for Sub-tabs
 */
export function AnimatedReportTabIcon({ isActive, className = '' }: IconProps) {
  return (
    <div className={`relative flex items-center justify-center ${className}`}>
      <svg
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={isActive ? "2.2" : "1.8"}
        strokeLinecap="round"
        strokeLinejoin="round"
        className={`transition-all duration-300 ${
          isActive
            ? 'scale-110 text-blue-600 drop-shadow-[0_2px_8px_rgba(37,99,235,0.35)]'
            : 'text-slate-400 hover:text-slate-600'
        }`}
      >
        <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" className={isActive ? 'fill-blue-50 stroke-blue-600' : 'fill-transparent stroke-current'} />
        <path d="M14 2v4a2 2 0 0 0 2 2h4" />
        <path d="M10 9H8" />
        <path d="M16 13H8" />
        <path d="M16 17H8" />
        {isActive && (
          <circle cx="15" cy="17" r="1.5" className="fill-blue-600 stroke-none animate-pulse" />
        )}
      </svg>
    </div>
  );
}

/**
 * 💳 Animated Card / SPP Icon for Sub-tabs
 */
export function AnimatedCardTabIcon({ isActive, className = '' }: IconProps) {
  return (
    <div className={`relative flex items-center justify-center ${className}`}>
      <svg
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={isActive ? "2.2" : "1.8"}
        strokeLinecap="round"
        strokeLinejoin="round"
        className={`transition-all duration-300 ${
          isActive
            ? 'scale-110 text-blue-600 drop-shadow-[0_2px_8px_rgba(37,99,235,0.35)]'
            : 'text-slate-400 hover:text-slate-600'
        }`}
      >
        <rect width="20" height="14" x="2" y="5" rx="3" className={isActive ? 'fill-blue-50 stroke-blue-600' : 'fill-transparent stroke-current'} />
        <line x1="2" x2="22" y1="10" y2="10" />
        <line x1="6" x2="10" y1="15" y2="15" className={isActive ? 'stroke-blue-600 stroke-[2.2] animate-pulse' : 'stroke-current'} />
      </svg>
    </div>
  );
}

/**
 * 🧾 Animated Receipt / Umum Icon for Sub-tabs
 */
export function AnimatedReceiptTabIcon({ isActive, className = '' }: IconProps) {
  return (
    <div className={`relative flex items-center justify-center ${className}`}>
      <svg
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={isActive ? "2.2" : "1.8"}
        strokeLinecap="round"
        strokeLinejoin="round"
        className={`transition-all duration-300 ${
          isActive
            ? 'scale-110 text-blue-600 drop-shadow-[0_2px_8px_rgba(37,99,235,0.35)]'
            : 'text-slate-400 hover:text-slate-600'
        }`}
      >
        <path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z" className={isActive ? 'fill-blue-50 stroke-blue-600' : 'fill-transparent stroke-current'} />
        <path d="M8 7h8" />
        <path d="M8 11h8" />
        <path d="M8 15h5" />
      </svg>
    </div>
  );
}

/**
 * 🐷 Animated Piggy / Savings Icon for Sub-tabs
 */
export function AnimatedPiggyTabIcon({ isActive, className = '' }: IconProps) {
  return (
    <div className={`relative flex items-center justify-center ${className}`}>
      <svg
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={isActive ? "2.2" : "1.8"}
        strokeLinecap="round"
        strokeLinejoin="round"
        className={`transition-all duration-300 ${
          isActive
            ? 'scale-110 text-blue-600 drop-shadow-[0_2px_8px_rgba(37,99,235,0.35)]'
            : 'text-slate-400 hover:text-slate-600'
        }`}
      >
        <path d="M19 5c-1.5 0-2.8 1.4-3 2-3.5-1.5-11-.3-11 5 0 1.8 0 3 2 4.5V20h4v-2h3v2h4v-4c1-.5 1.7-1 2-2h2v-4h-2c0-1-.5-1.5-1-2V5z" className={isActive ? 'fill-blue-50 stroke-blue-600' : 'fill-transparent stroke-current'} />
        <path d="M2 9v1c0 1.1.9 2 2 2h1" />
        <circle cx="14" cy="11" r="1" className="fill-current stroke-none" />
        {isActive && (
          <circle cx="11" cy="6" r="1.5" className="fill-blue-500 stroke-none animate-bounce" />
        )}
      </svg>
    </div>
  );
}

/**
 * 🔲 Animated All / Grid Icon for Sub-tabs
 */
export function AnimatedAllTabIcon({ isActive, className = '' }: IconProps) {
  return (
    <div className={`relative flex items-center justify-center ${className}`}>
      <svg
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={isActive ? "2.2" : "1.8"}
        strokeLinecap="round"
        strokeLinejoin="round"
        className={`transition-all duration-300 ${
          isActive
            ? 'scale-110 text-blue-600 drop-shadow-[0_2px_8px_rgba(37,99,235,0.35)]'
            : 'text-slate-400 hover:text-slate-600'
        }`}
      >
        <rect width="7" height="7" x="3" y="3" rx="1.5" className={isActive ? 'fill-blue-100 stroke-blue-600 animate-pulse' : 'fill-transparent stroke-current'} />
        <rect width="7" height="7" x="14" y="3" rx="1.5" className={isActive ? 'fill-blue-50 stroke-blue-600' : 'fill-transparent stroke-current'} />
        <rect width="7" height="7" x="14" y="14" rx="1.5" className={isActive ? 'fill-blue-50 stroke-blue-600' : 'fill-transparent stroke-current'} />
        <rect width="7" height="7" x="3" y="14" rx="1.5" className={isActive ? 'fill-blue-50 stroke-blue-600' : 'fill-transparent stroke-current'} />
      </svg>
    </div>
  );
}

/**
 * 📢 Animated Megaphone / Pengumuman Icon for Sub-tabs
 */
export function AnimatedMegaphoneTabIcon({ isActive, className = '' }: IconProps) {
  return (
    <div className={`relative flex items-center justify-center ${className}`}>
      <svg
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={isActive ? "2.2" : "1.8"}
        strokeLinecap="round"
        strokeLinejoin="round"
        className={`transition-all duration-300 ${
          isActive
            ? 'scale-110 text-blue-600 drop-shadow-[0_2px_8px_rgba(37,99,235,0.35)]'
            : 'text-slate-400 hover:text-slate-600'
        }`}
      >
        <path d="m3 11 18-5v12L3 14v-3z" className={isActive ? 'fill-blue-50 stroke-blue-600' : 'fill-transparent stroke-current'} />
        <path d="M11.6 16.8a3 3 0 1 1-5.8-1.6" />
        {isActive && (
          <>
            <path d="M21 9a4 4 0 0 1 0 6" className="stroke-blue-500 animate-ping opacity-60" />
            <circle cx="21" cy="12" r="1" className="fill-blue-600 stroke-none" />
          </>
        )}
      </svg>
    </div>
  );
}

/**
 * 📅 Animated Calendar / Kegiatan Icon for Sub-tabs
 */
export function AnimatedCalendarTabIcon({ isActive, className = '' }: IconProps) {
  return (
    <div className={`relative flex items-center justify-center ${className}`}>
      <svg
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={isActive ? "2.2" : "1.8"}
        strokeLinecap="round"
        strokeLinejoin="round"
        className={`transition-all duration-300 ${
          isActive
            ? 'scale-110 text-blue-600 drop-shadow-[0_2px_8px_rgba(37,99,235,0.35)]'
            : 'text-slate-400 hover:text-slate-600'
        }`}
      >
        <rect width="18" height="18" x="3" y="4" rx="2" className={isActive ? 'fill-blue-50 stroke-blue-600' : 'fill-transparent stroke-current'} />
        <line x1="16" x2="16" y1="2" y2="6" />
        <line x1="8" x2="8" y1="2" y2="6" />
        <line x1="3" x2="21" y1="10" y2="10" />
        {isActive ? (
          <path d="m9 16 2 2 4-4" className="stroke-blue-600 stroke-[2.2] animate-pulse" />
        ) : (
          <path d="M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01" />
        )}
      </svg>
    </div>
  );
}

/**
 * 💰 Animated Coins / Keuangan Icon for Sub-tabs
 */
export function AnimatedCoinsTabIcon({ isActive, className = '' }: IconProps) {
  return (
    <div className={`relative flex items-center justify-center ${className}`}>
      <svg
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={isActive ? "2.2" : "1.8"}
        strokeLinecap="round"
        strokeLinejoin="round"
        className={`transition-all duration-300 ${
          isActive
            ? 'scale-110 text-blue-600 drop-shadow-[0_2px_8px_rgba(37,99,235,0.35)]'
            : 'text-slate-400 hover:text-slate-600'
        }`}
      >
        <circle cx="8" cy="8" r="6" className={isActive ? 'fill-blue-100 stroke-blue-600' : 'fill-transparent stroke-current'} />
        <path d="M18.09 10.37A6 6 0 1 1 10.34 18" className={isActive ? 'stroke-blue-600' : 'stroke-current'} />
        <path d="M7 6h2v4H7z" className={isActive ? 'fill-blue-600 stroke-none' : 'fill-current stroke-none'} />
        {isActive && (
          <circle cx="16" cy="14" r="1.5" className="fill-blue-600 stroke-none animate-ping opacity-60" />
        )}
      </svg>
    </div>
  );
}

