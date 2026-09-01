'use client';

import React, { useState, useEffect, use } from 'react';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ClassroomOverview } from '@/components/classroom/ClassroomOverview';
import { ClassroomSchedule } from '@/components/classroom/ClassroomSchedule';
import { ClassroomAttendance } from '@/components/classroom/ClassroomAttendance';
import { ClassroomInfo } from '@/components/classroom/ClassroomInfo';
import { 
  LayoutDashboard, 
  CalendarDays, 
  ClipboardCheck, 
  Megaphone, 
  Loader2, 
  ArrowLeft, 
  Users, 
  GraduationCap, 
  Sparkles 
} from 'lucide-react';

export default function ClassroomDetailPage(props: { params: Promise<{ slug: string }> }) {
  const [activeTab, setActiveTab] = useState('overview');
  const [classroom, setClassroom] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  
  const params = use(props.params);
  const slug = params.slug;
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [classRes, userRes] = await Promise.all([
          fetch(`/api/classrooms/${slug}?_t=` + Date.now()),
          fetch('/api/auth/me')
        ]);
        const classData = await classRes.json();
        const userData = await userRes.json();
        
        if (classData.success && classData.data) {
          setClassroom(classData.data);
        } else {
          setError(true);
        }

        if (userData.success && userData.user) {
          setUser(userData.user);
        }
      } catch (err) {
        setError(true);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [slug]);
  
  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center h-60 gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <span className="text-xs font-semibold text-slate-500">Memuat Ruang Kelas...</span>
      </div>
    );
  }

  if (error || !classroom) {
    notFound();
  }

  const tabs = [
    { id: 'overview', label: 'Overview', shortLabel: 'Overview', icon: LayoutDashboard },
    { id: 'schedule', label: 'Jadwal Pelajaran', shortLabel: 'Jadwal', icon: CalendarDays },
    { id: 'attendance', label: 'Absensi Siswa', shortLabel: 'Absensi', icon: ClipboardCheck },
    { id: 'info', label: 'Pengumuman', shortLabel: 'Info', icon: Megaphone },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return <ClassroomOverview totalStudents={classroom.enrolledStudents} classroomId={classroom.id} classroomSlug={slug} />;
      case 'schedule':
        return <ClassroomSchedule classroomId={classroom.id} user={user} homeroomTeacherId={classroom.homeroomTeacherId} />;
      case 'attendance':
        return <ClassroomAttendance classroomId={classroom.id} />;
      case 'info':
        return <ClassroomInfo classroomId={classroom.id} />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Back Nav */}
      <div>
        <Link 
          href="/classroom" 
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-blue-600 bg-white/70 hover:bg-blue-50 px-4 py-2.5 rounded-full border border-slate-200/80 transition-all shadow-2xs active:scale-95"
        >
          <ArrowLeft size={14} />
          <span>Kembali ke Seluruh Kelas</span>
        </Link>
      </div>

      {/* Hero Class Profile Card */}
      <div className="bg-white rounded-2xl sm:rounded-[2.5rem] p-5 sm:p-8 border border-slate-200/80 shadow-sm relative overflow-hidden">
        {/* Background mesh */}
        <div className="absolute top-0 right-0 w-56 sm:w-80 h-56 sm:h-80 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-full blur-3xl -mt-16 -mr-16 opacity-70 pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 w-40 sm:w-60 h-40 sm:h-60 bg-gradient-to-tr from-cyan-50 to-blue-50 rounded-full blur-2xl -mb-16 opacity-60 pointer-events-none" />
        
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-5">
          <div className="flex items-center gap-4 sm:gap-6">
            {/* Class code badge */}
            <div className="w-16 h-16 sm:w-24 sm:h-24 rounded-2xl sm:rounded-3xl bg-gradient-to-br from-[#002957] via-[#0c3868] to-[#1d4ed8] text-white flex items-center justify-center font-headline font-black text-2xl sm:text-4xl shadow-md shadow-blue-900/20 shrink-0">
              {classroom.name}
            </div>

            <div className="min-w-0 flex-1">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-blue-700 font-body text-[11px] font-bold uppercase tracking-wider mb-2">
                <Sparkles className="w-3 h-3 text-amber-500 shrink-0" />
                <span>Rombongan Belajar</span>
              </div>
              <h1 className="font-headline font-black text-xl sm:text-3xl text-slate-900 tracking-tight leading-tight">
                Kelas {classroom.name}
              </h1>
              <p className="font-body text-xs text-slate-500 mt-0.5">
                Ruang belajar interaktif MI Attaqwa 15 Babelan
              </p>

              {/* Info pills - scroll on tiny screens */}
              <div className="flex flex-wrap items-center gap-2 mt-3">
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 border border-slate-200/80 rounded-full text-xs font-medium text-slate-700 min-w-0">
                  <GraduationCap className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                  <span className="text-slate-400 shrink-0">Wali:</span>
                  <span className="font-bold text-slate-800 truncate max-w-[140px] sm:max-w-none">{classroom.homeroomTeacher || 'Belum Ditugaskan'}</span>
                </div>

                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 border border-slate-200/80 rounded-full text-xs font-medium text-slate-700">
                  <Users className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span className="font-bold text-slate-800">{classroom.enrolledStudents || 0} Siswa</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs Bar — scrollable on mobile */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-1.5 overflow-x-auto hide-scrollbar">
        <div className="flex gap-1.5 min-w-max sm:min-w-0">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 sm:px-5 py-2.5 sm:py-3 rounded-xl font-headline font-bold text-xs sm:text-sm transition-all whitespace-nowrap cursor-pointer active:scale-95
                  ${isActive 
                    ? 'bg-blue-600 text-white shadow-xs' 
                    : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                  }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span className="hidden xs:inline sm:inline">{tab.label}</span>
                <span className="inline xs:hidden sm:hidden">{tab.shortLabel}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Content */}
      <div className="transition-all duration-200">
        {renderContent()}
      </div>
    </div>
  );
}
