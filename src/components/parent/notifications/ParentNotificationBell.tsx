'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Bell, CheckCircle2, X, BellOff, ScanLine, CreditCard } from 'lucide-react';
import { useParentNotifications, AppNotification } from '../ParentNotificationProvider';

export function ParentNotificationBell() {
  const { notifications, unreadCount, markAsRead } = useParentNotifications();
  const [isOpen, setIsOpen] = useState(false);
  const [rendered, setRendered] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  const open = () => {
    setIsOpen(true);
    requestAnimationFrame(() => requestAnimationFrame(() => setRendered(true)));
  };

  const close = () => {
    setRendered(false);
    setTimeout(() => setIsOpen(false), 280);
  };

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) close();
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [isOpen]);

  const getIcon = (notif: AppNotification) => {
    if (notif.source === 'attendance' || notif.type === 'ATTENDANCE') {
      return <ScanLine size={15} strokeWidth={2.5} />;
    }
    if (notif.type === 'PAYMENT') return <CreditCard size={15} strokeWidth={2.5} />;
    return <CheckCircle2 size={15} strokeWidth={2.5} />;
  };

  const getAccentColor = (notif: AppNotification) => {
    if (notif.source === 'attendance' || notif.type === 'ATTENDANCE') return { bg: '#ecfdf5', icon: '#d1fae5', iconColor: '#059669', bar: '#10b981' };
    if (notif.type === 'PAYMENT') return { bg: '#fff7ed', icon: '#fed7aa', iconColor: '#c2410c', bar: '#f97316' };
    return { bg: '#eff6ff', icon: '#dbeafe', iconColor: '#1d4ed8', bar: '#3b82f6' };
  };

  return (
    <>
      {/* Bell Button */}
      <button
        onClick={open}
        style={{
          position: 'relative',
          width: '44px', height: '44px', borderRadius: '50%',
          backgroundColor: 'rgba(255,255,255,0.12)',
          border: '1px solid rgba(255,255,255,0.2)',
          backdropFilter: 'blur(10px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', flexShrink: 0,
          transition: 'background 150ms, transform 150ms',
        }}
      >
        <Bell size={20} color="#ffffff" />
        {unreadCount > 0 && (
          <span style={{
            position: 'absolute', top: '-2px', right: '-2px',
            width: '18px', height: '18px', borderRadius: '50%',
            backgroundColor: '#ef4444',
            color: '#fff', fontSize: '10px', fontWeight: 800,
            border: '2px solid rgba(30, 68, 128, 0.8)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            animation: 'bell-bounce 1.8s ease-in-out infinite',
          }}>
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      <style>{`
        @keyframes bell-bounce {
          0%, 80%, 100% { transform: scale(1); }
          40% { transform: scale(1.2); }
        }
        @keyframes notif-drop {
          from { opacity: 0; transform: translateY(-6px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes item-fadein {
          from { opacity: 0; transform: translateY(4px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      {/* Notification Dropdown Panel */}
      {isOpen && (
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 200,
            // Invisible click-away layer
          }}
        >
          {/* Dim overlay */}
          <div
            onClick={close}
            style={{
              position: 'absolute', inset: 0,
              backgroundColor: 'rgba(2, 6, 23, 0.3)',
              opacity: rendered ? 1 : 0,
              transition: 'opacity 280ms ease',
            }}
          />

          {/* Drop-down panel */}
          <div
            ref={panelRef}
            style={{
              position: 'absolute',
              top: '68px',       // just below the header
              left: '12px',
              right: '12px',
              maxHeight: '68vh',
              borderRadius: '20px',
              backgroundColor: '#ffffff',
              boxShadow: '0 12px 40px -6px rgba(2,6,23,0.28), 0 0 0 1px rgba(0,0,0,0.05)',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              opacity: rendered ? 1 : 0,
              transform: rendered ? 'translateY(0) scale(1)' : 'translateY(-8px) scale(0.97)',
              transformOrigin: 'top center',
              transition: 'opacity 280ms cubic-bezier(0.32,0.72,0,1), transform 280ms cubic-bezier(0.32,0.72,0,1)',
            }}
          >
            {/* Header */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '16px 18px 12px',
              borderBottom: '1px solid #f1f5f9',
              flexShrink: 0,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                  width: '32px', height: '32px', borderRadius: '10px',
                  backgroundColor: '#eff6ff', color: '#2563eb',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Bell size={16} strokeWidth={2.5} />
                </div>
                <div>
                  <h3 style={{ fontSize: '15px', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                    Notifikasi
                  </h3>
                  <p style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 500, margin: 0 }}>
                    {unreadCount > 0 ? `${unreadCount} belum dibaca` : 'Semua sudah dibaca'}
                  </p>
                </div>
              </div>
              <button
                onClick={close}
                style={{
                  width: '30px', height: '30px', borderRadius: '50%',
                  backgroundColor: '#f1f5f9', border: 'none',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', color: '#64748b',
                }}
              >
                <X size={16} strokeWidth={2.5} />
              </button>
            </div>

            {/* List */}
            <div style={{ overflowY: 'auto', flex: 1, padding: '10px' }}>
              {notifications.length === 0 ? (
                <div style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center',
                  padding: '40px 20px', gap: '10px',
                }}>
                  <div style={{
                    width: '52px', height: '52px', borderRadius: '50%',
                    backgroundColor: '#f1f5f9', color: '#cbd5e1',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <BellOff size={24} />
                  </div>
                  <p style={{ fontSize: '13px', fontWeight: 700, color: '#64748b', margin: 0 }}>
                    Belum ada notifikasi
                  </p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {notifications.map((notif, i) => {
                    const accent = getAccentColor(notif);
                    return (
                      <div
                        key={notif.id}
                        onClick={() => { if (!notif.is_read) markAsRead(notif.id); }}
                        style={{
                          position: 'relative',
                          backgroundColor: notif.is_read ? '#f8fafc' : accent.bg,
                          borderRadius: '14px',
                          padding: '11px 13px',
                          display: 'flex', alignItems: 'flex-start', gap: '10px',
                          cursor: notif.is_read ? 'default' : 'pointer',
                          opacity: notif.is_read ? 0.7 : 1,
                          border: notif.is_read ? '1px solid #f1f5f9' : `1px solid ${accent.icon}`,
                          animation: `item-fadein 250ms ease-out ${i * 35}ms both`,
                          overflow: 'hidden',
                        }}
                      >
                        {/* unread bar */}
                        {!notif.is_read && (
                          <div style={{
                            position: 'absolute', left: 0, top: '20%', bottom: '20%',
                            width: '3px', borderRadius: '0 2px 2px 0',
                            backgroundColor: accent.bar,
                          }} />
                        )}

                        {/* Icon */}
                        <div style={{
                          width: '30px', height: '30px', borderRadius: '8px',
                          backgroundColor: accent.icon, color: accent.iconColor,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          flexShrink: 0, marginTop: '1px',
                        }}>
                          {getIcon(notif)}
                        </div>

                        {/* Text */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{
                            fontSize: '12px', fontWeight: notif.is_read ? 600 : 800,
                            color: notif.is_read ? '#64748b' : '#0f172a',
                            margin: 0, lineHeight: 1.3,
                          }}>
                            {notif.title}
                          </p>
                          <p style={{
                            fontSize: '11px', color: '#64748b',
                            margin: '3px 0 0 0', lineHeight: 1.5,
                          }}>
                            {notif.message}
                          </p>
                          <p style={{
                            fontSize: '10px', color: '#94a3b8', fontWeight: 600,
                            margin: '4px 0 0 0',
                          }}>
                            {new Date(notif.created_at).toLocaleString('id-ID', {
                              day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
                            })} WIB
                          </p>
                        </div>

                        {/* Unread dot */}
                        {!notif.is_read && (
                          <div style={{
                            width: '7px', height: '7px', borderRadius: '50%',
                            backgroundColor: accent.bar, flexShrink: 0, marginTop: '4px',
                          }} />
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
