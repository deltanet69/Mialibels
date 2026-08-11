'use client'

import React, { useState, useEffect } from 'react'
import { Calendar, Clock, BookOpen, AlertCircle, PlayCircle, CheckCircle2 } from 'lucide-react'

export function GuruScheduleClient({ schedules = [] }: { schedules: any[] }) {
  const [currentTime, setCurrentTime] = useState(new Date())

  // Update time every minute to check running subject
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000)
    return () => clearInterval(timer)
  }, [])

  const currentMinutes = currentTime.getHours() * 60 + currentTime.getMinutes()

  const getStatus = (start: string, end: string) => {
    if (!start || !end) return 'unknown'
    const [startH, startM] = start.split(':').map(Number)
    const [endH, endM] = end.split(':').map(Number)
    const startMins = startH * 60 + startM
    const endMins = endH * 60 + endM

    if (currentMinutes >= startMins && currentMinutes <= endMins) return 'running'
    if (currentMinutes < startMins) {
      if (startMins - currentMinutes <= 15) return 'incoming_soon' // <= 15 mins
      return 'incoming'
    }
    return 'finished'
  }

  // Find incoming
  const nextSchedule = schedules.find(s => {
    const status = getStatus(s.start_time, s.end_time)
    return status === 'incoming' || status === 'incoming_soon'
  })

  return (
    <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <Calendar className="text-blue-500" size={24} />
            Jadwal Mengajar Hari Ini
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Menampilkan jadwal pelajaran Anda untuk hari ini.
          </p>
        </div>
        <div className="text-right">
          <p className="text-sm font-semibold text-slate-500">Waktu Sekarang</p>
          <p className="text-xl font-bold text-slate-800 font-mono">
            {currentTime.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>
      </div>

      {nextSchedule && getStatus(nextSchedule.start_time, nextSchedule.end_time) === 'incoming_soon' && (
        <div className="mb-6 bg-blue-50 border border-blue-200 text-blue-800 p-4 rounded-xl flex items-center gap-4 animate-pulse">
          <AlertCircle className="text-blue-500" size={28} />
          <div>
            <h4 className="font-bold">Kelas Selanjutnya Segera Dimulai!</h4>
            <p className="text-sm">
              Mata Pelajaran {nextSchedule.name} di {nextSchedule.classroom?.name} akan dimulai pukul {nextSchedule.start_time.slice(0, 5)}.
            </p>
          </div>
        </div>
      )}

      {schedules.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed border-slate-200 rounded-2xl">
          <BookOpen className="mx-auto text-slate-300 mb-3" size={48} />
          <h3 className="text-lg font-bold text-slate-700">Tidak ada jadwal</h3>
          <p className="text-slate-500">Anda tidak memiliki jadwal mengajar hari ini.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {schedules.map((s, idx) => {
            const status = getStatus(s.start_time, s.end_time)
            
            let statusColor = 'bg-slate-50 border-slate-100'
            let icon = <Clock className="text-slate-400" size={20} />
            let badge = null

            if (status === 'running') {
              statusColor = 'bg-emerald-50 border-emerald-200 shadow-md ring-2 ring-emerald-500/20'
              icon = <PlayCircle className="text-emerald-500 animate-pulse" size={24} />
              badge = <span className="bg-emerald-500 text-white text-xs font-bold px-2 py-1 rounded-md ml-auto">SEDANG BERJALAN</span>
            } else if (status === 'finished') {
              statusColor = 'bg-slate-50 opacity-60 border-slate-200 grayscale-[0.5]'
              icon = <CheckCircle2 className="text-slate-400" size={20} />
              badge = <span className="text-xs font-bold text-slate-400 ml-auto">SELESAI</span>
            } else if (status === 'incoming_soon') {
              statusColor = 'bg-blue-50 border-blue-200'
              icon = <AlertCircle className="text-blue-500" size={20} />
              badge = <span className="bg-blue-100 text-blue-700 text-xs font-bold px-2 py-1 rounded-md ml-auto">SEGERA</span>
            }

            return (
              <div key={s.id || idx} className={`flex items-center gap-4 p-4 rounded-2xl border transition-all ${statusColor}`}>
                <div className="flex-shrink-0 w-24 text-center">
                  <div className="text-lg font-bold text-slate-800 font-mono">
                    {s.start_time.slice(0, 5)}
                  </div>
                  <div className="text-xs font-semibold text-slate-500">s.d</div>
                  <div className="text-sm font-semibold text-slate-600 font-mono">
                    {s.end_time.slice(0, 5)}
                  </div>
                </div>

                <div className="h-12 w-px bg-slate-200 mx-2" />

                <div className="flex-grow">
                  <h3 className="text-lg font-bold text-slate-800">{s.name}</h3>
                  <p className="text-sm font-semibold text-blue-600 flex items-center gap-1 mt-0.5">
                    <BookOpen size={14} /> Kelas {s.classroom?.name || '-'}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  {badge}
                  {icon}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
