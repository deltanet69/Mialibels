'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { ClassroomProps, DAYS } from './types';
import { ParentClassroomMobile } from './ParentClassroomMobile';
import { ParentClassroomDesktop } from './ParentClassroomDesktop';
import { getWIBParts } from '@/lib/dateUtils';

export * from './types';

export function ParentClassroomClient({ 
  student, 
  initialSchedules, 
  initialAttendance = [], 
  initialSummary = null 
}: ClassroomProps) {
  const searchParams = useSearchParams();
  const urlTab = searchParams.get('tab') as 'jadwal' | 'rekap' | 'nilai' | 'raport' | null;
  const [activeTab, setActiveTab] = useState<'jadwal' | 'rekap' | 'nilai' | 'raport'>(urlTab || 'jadwal');
  
  // Real-time states
  const [currentTime, setCurrentTime] = useState<Date | null>(() => new Date());
  
  // Selected day for schedule
  const [selectedDay, setSelectedDay] = useState<string>(() => {
    const parts = getWIBParts(new Date());
    if (parts.dayOfWeek >= 1 && parts.dayOfWeek <= 5) {
      return ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat'][parts.dayOfWeek - 1];
    }
    return 'Senin';
  });

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 30000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (urlTab && ['jadwal', 'rekap', 'nilai', 'raport'].includes(urlTab)) {
      setActiveTab(urlTab);
    }
  }, [urlTab]);

  // Attendance state initialized with server-provided initial data
  const currentMonthWib = useMemo(() => getWIBParts(new Date()).month, []);
  const currentYearWib = useMemo(() => getWIBParts(new Date()).year, []);
  const [month, setMonth] = useState(currentMonthWib);
  const [year, setYear] = useState(currentYearWib);
  const [attendanceRecords, setAttendanceRecords] = useState<any[]>(initialAttendance);
  const [attendanceSummary, setAttendanceSummary] = useState<any>(initialSummary);
  const [loadingAttendance, setLoadingAttendance] = useState(false);

  useEffect(() => {
    // Only fetch if navigating to a different month than initial
    if (activeTab === 'rekap' && (month !== currentMonthWib || year !== currentYearWib)) {
      const fetchAttendance = async () => {
        setLoadingAttendance(true);
        try {
          const res = await fetch(`/api/parent/attendance?month=${month}&year=${year}`);
          const data = await res.json();
          if (data.data) {
            setAttendanceRecords(data.data);
            setAttendanceSummary(data.summary || null);
          }
        } catch (err) {
          console.error('Failed to load attendance:', err);
        } finally {
          setLoadingAttendance(false);
        }
      };
      fetchAttendance();
    } else if (activeTab === 'rekap' && month === currentMonthWib && year === currentYearWib) {
      // Restore initial data
      setAttendanceRecords(initialAttendance);
      setAttendanceSummary(initialSummary);
    }
  }, [activeTab, month, year, currentMonthWib, currentYearWib, initialAttendance, initialSummary]);

  const prevMonth = () => {
    if (month === 1) { setMonth(12); setYear(y => y - 1); }
    else setMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (month === 12) { setMonth(1); setYear(y => y + 1); }
    else setMonth(m => m + 1);
  };

  const filteredSchedules = useMemo(() => {
    return initialSchedules.filter(item => (item.day || '').toLowerCase() === selectedDay.toLowerCase());
  }, [initialSchedules, selectedDay]);

  return (
    <div className="w-full max-w-full">
      {/* 📱 MOBILE FIRST EXPERIENCE (md:hidden) */}
      <div className="md:hidden">
        <ParentClassroomMobile
          student={student}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          selectedDay={selectedDay}
          setSelectedDay={setSelectedDay}
          filteredSchedules={filteredSchedules}
          currentTime={currentTime}
          month={month}
          year={year}
          prevMonth={prevMonth}
          nextMonth={nextMonth}
          attendanceRecords={attendanceRecords}
          attendanceSummary={attendanceSummary}
          loadingAttendance={loadingAttendance}
        />
      </div>

      {/* 💻 DESKTOP EXPERIENCE (hidden md:block) */}
      <div className="hidden md:block">
        <ParentClassroomDesktop
          student={student}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          selectedDay={selectedDay}
          setSelectedDay={setSelectedDay}
          filteredSchedules={filteredSchedules}
          month={month}
          year={year}
          prevMonth={prevMonth}
          nextMonth={nextMonth}
          attendanceRecords={attendanceRecords}
          attendanceSummary={attendanceSummary}
          loadingAttendance={loadingAttendance}
        />
      </div>
    </div>
  );
}
