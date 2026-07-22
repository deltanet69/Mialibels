'use client'

import React, { useEffect, useState, useRef } from 'react'
import { Bell, X } from 'lucide-react'
import { supabase } from '../../lib/supabase/client'

export function GlobalAttendanceScanner() {
  const [toast, setToast] = useState<{show: boolean, message: string}>({show: false, message: ''})
  const toastTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  
  const clientIdRef = useRef(Math.random().toString(36).substring(7))
  const broadcastChannelRef = useRef<any>(null)
  
  // RFID Scanner Buffer
  const rfidBuffer = useRef<string>('')
  const scanTimeout = useRef<NodeJS.Timeout | null>(null)

  const showToast = (message: string) => {
    setToast({show: true, message})
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current)
    toastTimeoutRef.current = setTimeout(() => setToast({show: false, message: ''}), 5000)
  }
  const showToastRef = useRef(showToast)
  showToastRef.current = showToast

  // ================================================================
  // Supabase Realtime Broadcast Listener
  // ================================================================
  useEffect(() => {
    const channel = supabase.channel('mia-attendance-sync')
    
    channel
      .on(
        'broadcast',
        { event: 'scan_result' },
        (payload) => {
          const data = payload.payload
          if (data.sender === clientIdRef.current) return // Ignore own broadcast
          const msg = data.success ? (data.message || 'Scan absensi berhasil!') : (data.error || 'Scan absensi gagal')
          showToastRef.current(msg)
          
          // Notify local dashboard components (like absensi-guru/page.tsx)
          window.dispatchEvent(new CustomEvent('mia_local_scan', { detail: data }))
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          broadcastChannelRef.current = channel
        }
      })
      
    return () => { supabase.removeChannel(channel) }
  }, [])

  // ================================================================
  // Global RFID Scanner Listener
  // ================================================================
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) return

      if (e.key === 'Enter') {
        const scannedRfid = rfidBuffer.current.trim()
        if (scannedRfid.length > 3) {
          handleScan(scannedRfid)
        }
        rfidBuffer.current = ''
        return
      }

      if (e.key.length === 1 && /[a-zA-Z0-9]/.test(e.key)) {
        rfidBuffer.current += e.key
        
        if (scanTimeout.current) clearTimeout(scanTimeout.current)
        scanTimeout.current = setTimeout(() => {
          rfidBuffer.current = ''
        }, 150)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      if (scanTimeout.current) clearTimeout(scanTimeout.current)
    }
  }, [])

  const handleScan = async (rfid: string) => {
    try {
      const res = await fetch('/api/attendance/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rfid })
      })
      const data = await res.json()
      
      if (!res.ok) throw new Error(data.error || 'Gagal memproses kartu')
      
      showToastRef.current(data.message || 'Scan berhasil!')

      // Notify local dashboard components
      window.dispatchEvent(new CustomEvent('mia_local_scan', { detail: {
        success: true,
        message: data.message,
        action: data.action,
        staff: data.staff
      }}))

      // Broadcast to other windows/devices via Supabase
      if (broadcastChannelRef.current) {
        broadcastChannelRef.current.send({
          type: 'broadcast',
          event: 'scan_result',
          payload: {
            sender: clientIdRef.current,
            success: true,
            message: data.message,
            action: data.action,
            staff: data.staff
          }
        })
      }

    } catch (err: any) {
      showToastRef.current(err.message || 'Gagal memproses kartu')

      // Notify local dashboard components
      window.dispatchEvent(new CustomEvent('mia_local_scan', { detail: {
        success: false,
        message: err.message || 'Gagal memproses kartu'
      }}))

      // Broadcast error too
      if (broadcastChannelRef.current) {
        broadcastChannelRef.current.send({
          type: 'broadcast',
          event: 'scan_result',
          payload: {
            sender: clientIdRef.current,
            success: false,
            message: err.message || 'Gagal memproses kartu'
          }
        })
      }
    }
  }

  if (!toast.show) return null

  return (
    <div className="fixed bottom-6 right-6 z-[99999] animate-in slide-in-from-bottom-5 fade-in duration-300 pointer-events-none">
      <div className="bg-white border border-emerald-100 shadow-lg shadow-emerald-100/50 rounded-2xl p-4 pr-12 flex items-center gap-4 relative pointer-events-auto">
        <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center flex-shrink-0">
          <Bell size={20} className="animate-pulse" />
        </div>
        <div>
          <h4 className="text-emerald-800 font-bold text-sm">Notifikasi</h4>
          <p className="text-emerald-600 font-medium text-sm mt-0.5">{toast.message}</p>
        </div>
        <button 
          onClick={() => setToast({show: false, message: ''})}
          className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  )
}
