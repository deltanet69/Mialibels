'use client';

import React, { useState, useEffect, use } from 'react';
import { notFound } from 'next/navigation';
import { ClassroomOverview } from '@/components/classroom/ClassroomOverview';
import { ClassroomSchedule } from '@/components/classroom/ClassroomSchedule';
import { ClassroomAttendance } from '@/components/classroom/ClassroomAttendance';
import { ClassroomInfo } from '@/components/classroom/ClassroomInfo';
import { LayoutDashboard, CalendarDays, ClipboardCheck, Megaphone, Loader2 } from 'lucide-react';

export default function ClassroomDetailPage(props: { params: Promise<{ slug: string }> }) {
  const [activeTab, setActiveTab] = useState('overview');
  const [classroom, setClassroom] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  
  const params = use(props.params);
  const slug = params.slug;
  
  useEffect(() => {
    const fetchClassroom = async () => {
      try {
        const res = await fetch(`/api/classrooms/${slug}`);
        const data = await res.json();
        if (data.success && data.data) {
          setClassroom(data.data);
        } else {
          setError(true);
        }
      } catch (err) {
        setError(true);
      } finally {
        setLoading(false);
      }
    };
    
    fetchClassroom();
  }, [slug]);
  
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error || !classroom) {
    notFound();
  }

  const tabs = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'schedule', label: 'Jadwal Kelas', icon: CalendarDays },
    { id: 'attendance', label: 'Absensi', icon: ClipboardCheck },
    { id: 'info', label: 'Informasi', icon: Megaphone },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return <ClassroomOverview totalStudents={classroom.enrolledStudents} classroomId={classroom.id} />;
      case 'schedule':
        return <ClassroomSchedule classroomId={classroom.id} />;
      case 'attendance':
        return <ClassroomAttendance classroomId={classroom.id} />;
      case 'info':
        return <ClassroomInfo classroomId={classroom.id} />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Profile */}
      <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-100 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-full blur-3xl -mt-20 -mr-20 opacity-60" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold text-3xl shadow-lg shadow-blue-500/30">
              {classroom.name.charAt(0)}
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-800 mb-2">Kelas {classroom.name}</h1>
              <div className="flex items-center gap-4 text-sm font-medium text-slate-500">
                <span className="flex items-center gap-1.5 px-3 py-1 bg-slate-100 rounded-full">
                  Wali Kelas: <span className="text-slate-700">{classroom.homeroomTeacher}</span>
                </span>
                <span className="flex items-center gap-1.5 px-3 py-1 bg-slate-100 rounded-full">
                  {classroom.enrolledStudents} Siswa
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-2 flex flex-wrap sm:flex-nowrap gap-2 overflow-x-auto hide-scrollbar">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium text-sm transition-all whitespace-nowrap flex-1 justify-center sm:flex-none sm:justify-start
                ${isActive 
                  ? 'bg-blue-50 text-blue-700 shadow-sm' 
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
            >
              <tab.icon className={`w-4 h-4 ${isActive ? 'text-blue-600' : 'text-slate-400'}`} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div className="transition-all duration-300 animate-in fade-in slide-in-from-bottom-4">
        {renderContent()}
      </div>
    </div>
  );
}
