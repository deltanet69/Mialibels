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
  UserCircle2, 
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
      <div className="flex flex-col justify-center items-center h-80 gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <span className="text-xs font-semibold text-slate-500">Memuat Ruang Kelas...</span>
      </div>
    );
  }

  if (error || !classroom) {
    notFound();
  }

  const tabs = [
    { id: 'overview', label: 'Overview & Statistik', icon: LayoutDashboard },
    { id: 'schedule', label: 'Jadwal Pelajaran', icon: CalendarDays },
    { id: 'attendance', label: 'Absensi Siswa', icon: ClipboardCheck },
    { id: 'info', label: 'Pengumuman Kelas', icon: Megaphone },
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
    <div className="space-y-6">
      {/* Back to Classroom Listing Navigation */}
      <div>
        <Link 
          href="/classroom" 
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-blue-600 bg-white/70 hover:bg-blue-50 px-4 py-2 rounded-full border border-slate-200/80 transition-all shadow-2xs"
        >
          <ArrowLeft size={14} />
          <span>Kembali ke Seluruh Kelas</span>
        </Link>
      </div>

      {/* Hero Class Profile Card */}
      <div className="bg-white rounded-[2.5rem] p-6 sm:p-8 border border-slate-200/80 shadow-sm relative overflow-hidden">
        {/* Subtle mesh lights */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-full blur-3xl -mt-20 -mr-20 opacity-70 pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 w-60 h-60 bg-gradient-to-tr from-cyan-50 to-blue-50 rounded-full blur-2xl -mb-20 opacity-60 pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 sm:gap-6">
            {/* Playful Class Code Box */}
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-gradient-to-br from-[#002957] via-[#0c3868] to-[#1d4ed8] text-white flex items-center justify-center font-headline font-black text-3xl sm:text-4xl shadow-md shadow-blue-900/20 shrink-0">
              {classroom.name}
            </div>

            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-blue-700 font-body text-xs font-bold uppercase tracking-wider mb-2">
                <Sparkles className="w-3.5 h-3.5 text-accent" />
                <span>Rombongan Belajar Aktif</span>
              </div>
              <h1 className="font-headline font-black text-2xl sm:text-3xl text-secondary tracking-tight">
                Kelas {classroom.name}
              </h1>
              <p className="font-body text-xs sm:text-sm text-slate-500 mt-0.5">
                Ruang belajar interaktif MI Attaqwa 15 Babelan.
              </p>

              {/* Informative Pills */}
              <div className="flex flex-wrap items-center gap-2.5 mt-3.5">
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-slate-50 border border-slate-200/80 rounded-full text-xs font-medium text-slate-700">
                  <GraduationCap className="w-4 h-4 text-blue-600" />
                  <span className="text-slate-400">Wali Kelas:</span>
                  <span className="font-bold text-slate-800">{classroom.homeroomTeacher || 'Belum Ditugaskan'}</span>
                </div>

                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-slate-50 border border-slate-200/80 rounded-full text-xs font-medium text-slate-700">
                  <Users className="w-4 h-4 text-emerald-600" />
                  <span className="text-slate-400">Total Murid:</span>
                  <span className="font-bold text-slate-800">{classroom.enrolledStudents || 0} Siswa</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs Bar */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-1.5 flex flex-wrap sm:flex-nowrap gap-1.5 overflow-x-auto hide-scrollbar">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-5 py-3 rounded-xl font-headline font-bold text-xs sm:text-sm transition-all whitespace-nowrap flex-1 justify-center sm:flex-none sm:justify-start cursor-pointer
                ${isActive 
                  ? 'bg-blue-600 text-white shadow-xs' 
                  : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Content Display */}
      <div className="transition-all duration-300">
        {renderContent()}
      </div>
    </div>
  );
}
