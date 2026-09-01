'use client'

import React, { useEffect, useState, useMemo, useCallback } from 'react'
import { Plus, UploadCloud, Search, Trash2, Edit3, Eye, Key, Loader2, Sparkles, Users, X, User, CheckCircle2, AlertTriangle, FileCheck2 } from 'lucide-react'
import { CsvImport } from '@/components/portal/students/CsvImport'
import { BulkPhotoUpload } from '@/components/portal/students/BulkPhotoUpload'
import { StudentForm } from '@/components/portal/students/StudentForm'
import { getDirectImageUrl } from '@/lib/imageUtils'
import Link from 'next/link'

// Exam eligibility helper
export function checkExamEligibility(student: any) {
  const rawClass = student.class || '';
  const isFullday = !!rawClass.match(/A$/i);
  const isClass6 = rawClass.startsWith('6');

  const targetMonths = ['Juli', 'Agustus', 'September', '7', '8', '9', 7, 8, 9];
  const sppInvoices = student.spp_invoices || [];
  const unpaidSeptemberSpp = sppInvoices.find((inv: any) => {
    const isTarget = targetMonths.includes(String(inv.month));
    const isPaid = inv.status === 'PAID';
    return isTarget && !isPaid;
  });
  const sppOk = !unpaidSeptemberSpp;

  const generalInvoices = student.general_invoices || [];
  const getPaid = (key: string) => {
    return generalInvoices
      .flatMap((inv: any) => inv.items || [])
      .filter((item: any) => (item.name || '').toLowerCase().includes(key.toLowerCase()))
      .reduce((sum: number, item: any) => sum + (Number(item.paid_amount) || 0), 0);
  };

  const paidBuku = getPaid('buku');
  const paidUlum = getPaid('ulangan');
  const paidAkhirTahun = getPaid('akhir tahun');

  const minBuku = isFullday ? 700000 : 300000;
  const minUlum = 110000;
  const minAkhirTahun = 600000;

  const bukuOk = paidBuku >= minBuku;
  const ulumOk = paidUlum >= minUlum;
  const akhirTahunOk = !isClass6 || paidAkhirTahun >= minAkhirTahun;

  const isEligible = sppOk && bukuOk && ulumOk && akhirTahunOk;

  const issues: string[] = [];
  if (!sppOk) issues.push('Infaq Sept belum lunas');
  if (!bukuOk) issues.push(`Buku kurang Rp ${(minBuku - paidBuku).toLocaleString('id-ID')}`);
  if (!ulumOk) issues.push(`ULUM kurang Rp ${(minUlum - paidUlum).toLocaleString('id-ID')}`);
  if (!akhirTahunOk) issues.push(`Akhir Tahun kurang Rp ${(minAkhirTahun - paidAkhirTahun).toLocaleString('id-ID')}`);

  return {
    isEligible,
    issues,
    sppOk,
    bukuOk,
    ulumOk,
    akhirTahunOk
  };
}

// Skeleton row component
function SkeletonRow() {
  return (
    <tr className="animate-pulse border-b border-slate-100">
      <td className="py-4 pr-4 pl-6"><div className="h-4.5 bg-slate-100 rounded-lg w-20" /></td>
      <td className="py-4 pr-4"><div className="h-4.5 bg-slate-100 rounded-lg w-36" /></td>
      <td className="py-4 pr-4"><div className="h-4.5 bg-slate-100 rounded-lg w-12" /></td>
      <td className="py-4 pr-4">
        <div className="h-4.5 bg-slate-100 rounded-lg w-28 mb-1" />
        <div className="h-3.5 bg-slate-100 rounded-lg w-20" />
      </td>
      <td className="py-4 pr-4"><div className="h-6 bg-slate-100 rounded-full w-20" /></td>
      <td className="py-4 pr-4"><div className="h-6 bg-slate-100 rounded-full w-16" /></td>
      <td className="py-4 pr-6 text-right"><div className="h-8 bg-slate-100 rounded-xl w-20 ml-auto" /></td>
    </tr>
  )
}

export default function StudentsPage() {
  const [allStudents, setAllStudents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const [search, setSearch] = useState('')
  const [classFilter, setClassFilter] = useState('all')
  const [examFilter, setExamFilter] = useState('all')
  
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)

  const [showImport, setShowImport] = useState(false)
  const [showPhotoUpload, setShowPhotoUpload] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [editingStudent, setEditingStudent] = useState<any | null>(null)
  const [regenerateResult, setRegenerateResult] = useState<string | null>(null)
  const [currentUser, setCurrentUser] = useState<any>(null)

  const [showGenerateModal, setShowGenerateModal] = useState(false)
  const [generateTarget, setGenerateTarget] = useState('all')
  const [generatingAccess, setGeneratingAccess] = useState(false)
  const [isResettingPasswords, setIsResettingPasswords] = useState(false)

  const fetchStudents = useCallback(async () => {
    setLoading(true)
    try {
      const [resStudents, resMe] = await Promise.all([
        fetch('/api/students?_t=' + Date.now()),
        fetch('/api/auth/me')
      ])
      const data = await resStudents.json()
      const dataMe = await resMe.json()
      if (data.success) {
        setAllStudents(data.data)
      }
      if (dataMe.success) {
        setCurrentUser(dataMe.user)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchStudents()
  }, [fetchStudents])

  const canEdit = currentUser?.role === 'superadmin' || currentUser?.role === 'staff' || currentUser?.role === 'staff_operator'
  const canGenerateParent = currentUser?.role === 'superadmin'

  const classes = useMemo(() => {
    const uniqueClasses = Array.from(new Set(allStudents.map(s => s.class).filter(Boolean)))
    return uniqueClasses.sort()
  }, [allStudents])

  const examStats = useMemo(() => {
    let eligible = 0;
    let notEligible = 0;
    allStudents.forEach(s => {
      const { isEligible } = checkExamEligibility(s);
      if (isEligible) eligible++;
      else notEligible++;
    });
    return { eligible, notEligible };
  }, [allStudents]);

  const filteredStudents = useMemo(() => {
    let filtered = allStudents

    if (classFilter !== 'all') {
      filtered = filtered.filter(s => s.class === classFilter)
    }

    if (examFilter === 'eligible') {
      filtered = filtered.filter(s => checkExamEligibility(s).isEligible)
    } else if (examFilter === 'not_eligible') {
      filtered = filtered.filter(s => !checkExamEligibility(s).isEligible)
    }

    if (search.trim()) {
      const q = search.toLowerCase()
      filtered = filtered.filter(s =>
        s.name?.toLowerCase().includes(q) ||
        s.student_number?.toLowerCase().includes(q) ||
        s.class?.toLowerCase().includes(q) ||
        s.nisn?.toLowerCase().includes(q)
      )
    }
    
    filtered.sort((a, b) => {
      const classA = a.class || ''
      const classB = b.class || ''
      if (classA !== classB) {
        return classA.localeCompare(classB)
      }
      
      const nameA = a.name || ''
      const nameB = b.name || ''
      return nameA.localeCompare(nameB)
    })

    return filtered
  }, [allStudents, search, classFilter, examFilter])

  useEffect(() => {
    setCurrentPage(1)
  }, [search, classFilter, examFilter, itemsPerPage])

  const totalPages = Math.ceil(filteredStudents.length / itemsPerPage)
  const paginatedStudents = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage
    return filteredStudents.slice(start, start + itemsPerPage)
  }, [filteredStudents, currentPage, itemsPerPage])

  const handleDelete = async (id: string, name: string) => {
    if (confirm(`Yakin ingin menghapus data siswa ${name}? Data SPP dan Tabungan terkait juga akan terhapus!`)) {
      try {
        const res = await fetch(`/api/students/${id}`, { method: 'DELETE' })
        if (res.ok) {
          setAllStudents(prev => prev.filter(s => s.id !== id))
        }
      } catch (err) {
        console.error(err)
      }
    }
  }

  const handleGenerateAccess = async () => {
    setGeneratingAccess(true)
    try {
      const res = await fetch('/api/students/generate-parent-access', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetClass: generateTarget })
      })
      const data = await res.json()
      
      if (res.ok) {
        let csvContent = "Nama siswa,NISN,Password akses,Nama orang tua,No hp orang tua\n";
        
        data.data.forEach((row: any) => {
          const cleanName = `"${(row.name || '').replace(/"/g, '""')}"`;
          const cleanNisn = `"${(row.nisn || '').replace(/"/g, '""')}"`;
          const cleanPass = `"${(row.password || '').replace(/"/g, '""')}"`;
          const cleanParent = `"${(row.parent_name || '').replace(/"/g, '""')}"`;
          const cleanPhone = `"${(row.parent_phone || '').replace(/"/g, '""')}"`;
          
          csvContent += `${cleanName},${cleanNisn},${cleanPass},${cleanParent},${cleanPhone}\n`;
        });

        const blob = new Blob(["\ufeff" + csvContent], { type: 'text/csv;charset=utf-8;' })
        const link = document.createElement('a')
        const url = URL.createObjectURL(blob)
        link.setAttribute('href', url)
        link.setAttribute('download', `Akses_Orang_Tua_${generateTarget === 'all' ? 'Semua' : 'Kelas_'+generateTarget}.csv`)
        link.style.visibility = 'hidden'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        
        setRegenerateResult(`✅ Berhasil generate password untuk ${data.data.length} siswa dan file CSV telah diunduh.`)
        setShowGenerateModal(false)
      } else {
        setRegenerateResult(`❌ Error: ${data.error}`)
      }
    } catch (err: any) {
      setRegenerateResult(`❌ Koneksi gagal: ${err.message}`)
    } finally {
      setGeneratingAccess(false)
    }
  }

  const handleResetAllPasswords = async () => {
    if (!confirm('⚠️ PERHATIAN! Aksi ini akan mereset SEMUA password orang tua. Seluruh akses yang pernah dibuat sebelumnya (termasuk password yang sudah diubah) akan tidak berlaku. Lanjutkan?')) return;
    setIsResettingPasswords(true);
    try {
      const res = await fetch('/api/students/reset-parent-passwords', { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        setRegenerateResult(`✅ ${data.message}`);
        setShowGenerateModal(false);
      } else {
        setRegenerateResult(`❌ Error: ${data.error}`);
      }
    } catch (err: any) {
      setRegenerateResult(`❌ Koneksi gagal: ${err.message}`);
    } finally {
      setIsResettingPasswords(false);
    }
  }

  return (
    <div className="font-sans space-y-6 sm:space-y-7 w-full pb-16">
      
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-sm">
        <div>
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-100 text-blue-700 text-xs font-bold uppercase tracking-wider mb-2.5">
            <Users size={13} />
            <span>Master Data Akademik</span>
          </div>
          <h1 className="font-sans font-extrabold text-2xl sm:text-3xl text-slate-900 tracking-tight">
            Data Seluruh Siswa
          </h1>
          <p className="font-sans text-xs sm:text-sm text-slate-500 mt-1">
            Kelola data profil siswa, NISN, kelas, dan akun akses wali murid madrasah.
          </p>
        </div>
        {canEdit && (
          <div className="flex items-center gap-2.5 w-full sm:w-auto flex-wrap">
            {canGenerateParent && (
              <button 
                onClick={() => setShowGenerateModal(true)}
                className="btn-tactile flex-1 sm:flex-none flex items-center justify-center gap-2 bg-indigo-50 border border-indigo-200/90 text-indigo-700 px-4 py-2.5 rounded-2xl hover:bg-indigo-100 transition text-xs font-bold shadow-2xs cursor-pointer"
              >
                <Key size={15} />
                <span>Akses Orang Tua</span>
              </button>
            )}
            <button 
              onClick={() => setShowImport(true)}
              className="btn-tactile flex-1 sm:flex-none flex items-center justify-center gap-2 bg-slate-50 border border-slate-200 text-slate-700 px-4 py-2.5 rounded-2xl hover:bg-slate-100 hover:text-slate-900 transition text-xs font-bold shadow-2xs cursor-pointer"
            >
              <UploadCloud size={15} />
              <span>Import CSV</span>
            </button>
            <button 
              onClick={() => setShowPhotoUpload(true)}
              className="btn-tactile flex-1 sm:flex-none flex items-center justify-center gap-2 bg-slate-50 border border-slate-200 text-slate-700 px-4 py-2.5 rounded-2xl hover:bg-slate-100 hover:text-slate-900 transition text-xs font-bold shadow-2xs cursor-pointer"
            >
              <UploadCloud size={15} />
              <span>Upload Foto</span>
            </button>
            <button 
              onClick={() => { setEditingStudent(null); setShowForm(true); }}
              className="btn-tactile flex-1 sm:flex-none flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-2xl transition text-xs font-bold shadow-md shadow-blue-600/20 cursor-pointer"
            >
              <Plus size={16} className="stroke-[2.5]" />
              <span>Tambah Siswa</span>
            </button>
          </div>
        )}
      </div>

      {/* Result notification */}
      {regenerateResult && (
        <div className={`px-5 py-4 rounded-2xl text-xs sm:text-sm font-semibold flex items-start justify-between gap-4 border ${
          regenerateResult.startsWith('✅') 
            ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
            : 'bg-rose-50 border-rose-200 text-rose-800'
        }`}>
          <span>{regenerateResult}</span>
          <button onClick={() => setRegenerateResult(null)} className="shrink-0 font-bold opacity-60 hover:opacity-100 cursor-pointer">
            <X size={16} />
          </button>
        </div>
      )}

      {/* Main Table Card */}
      <div className="bg-white p-5 sm:p-7 rounded-3xl shadow-sm border border-slate-200/80 space-y-6">
        
        {/* Search & Filter Bar */}
        <div className="flex flex-col lg:flex-row justify-between items-stretch lg:items-center gap-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto flex-1">
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input 
                type="text" 
                placeholder="Cari nama, NISN, atau kelas..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-9 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition text-xs sm:text-sm font-medium text-slate-800 outline-none"
              />
              {search && (
                <button 
                  onClick={() => setSearch('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded-full cursor-pointer"
                >
                  <X size={14} />
                </button>
              )}
            </div>
            
            <select
              value={classFilter}
              onChange={(e) => setClassFilter(e.target.value)}
              className="w-full sm:w-auto px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition text-xs sm:text-sm font-semibold text-slate-700 outline-none cursor-pointer"
            >
              <option value="all">Semua Kelas</option>
              {classes.map((c: any) => (
                <option key={c} value={c}>Kelas {c}</option>
              ))}
            </select>

            <select
              value={examFilter}
              onChange={(e) => setExamFilter(e.target.value)}
              className="w-full sm:w-auto px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition text-xs sm:text-sm font-semibold text-slate-700 outline-none cursor-pointer"
            >
              <option value="all">Semua Status Kartu Ujian</option>
              <option value="eligible">Eligible ({examStats.eligible})</option>
              <option value="not_eligible">Not Eligible ({examStats.notEligible})</option>
            </select>

            {!loading && (
              <span className="text-xs font-bold text-blue-800 bg-blue-50 px-3 py-1.5 rounded-full border border-blue-100 whitespace-nowrap shrink-0 ml-auto sm:ml-0">
                {filteredStudents.length} Siswa Ditemukan
              </span>
            )}
          </div>
        </div>

        {/* Desktop Table Layout */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-100 text-xs font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-4 pr-4 pl-5">NISN</th>
                <th className="py-4 pr-4">Nama Lengkap Siswa</th>
                <th className="py-4 pr-4">Kelas</th>
                <th className="py-4 pr-4">Wali Murid</th>
                <th className="py-4 pr-4">Status Siswa</th>
                <th className="py-4 pr-4">Kartu Ujian</th>
                <th className="py-4 pr-5 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-sans">
              {loading ? (
                Array.from({ length: 6 }).map((_, i) => <SkeletonRow key={i} />)
              ) : paginatedStudents.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-400 text-xs sm:text-sm">
                    {search || classFilter !== 'all' || examFilter !== 'all' ? `Tidak ada siswa yang sesuai filter pencarian.` : 'Tidak ada data siswa.'}
                  </td>
                </tr>
              ) : (
                paginatedStudents.map((student) => (
                  <tr key={student.id} className="hover:bg-blue-50/30 transition-colors group">
                    <td className="py-4 pr-4 pl-5">
                      <span className="font-sans font-semibold text-xs text-blue-700 bg-blue-50 px-2.5 py-1 rounded-xl border border-blue-100">
                        {student.nisn || '—'}
                      </span>
                    </td>
                    <td className="py-4 pr-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center overflow-hidden shrink-0 text-slate-500 text-xs font-bold">
                          {student.photo_url ? (
                            <img 
                              src={getDirectImageUrl(student.photo_url, 100)} 
                              alt={student.name}
                              className="w-full h-full object-cover"
                              onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                            />
                          ) : (
                            <User size={16} />
                          )}
                        </div>
                        <Link 
                          href={`/students/${student.id}`} 
                          className="font-sans font-bold text-[14px] sm:text-[15px] text-slate-900 hover:text-blue-600 transition-colors leading-snug"
                        >
                          {student.name}
                        </Link>
                      </div>
                    </td>
                    <td className="py-4 pr-4">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">
                        Kelas {student.class}
                      </span>
                    </td>
                    <td className="py-4 pr-4">
                      <div className="font-sans text-xs sm:text-sm font-semibold text-slate-800">
                        {student.parent_name || '—'}
                      </div>
                      <div className="font-sans text-xs text-slate-400 mt-0.5">
                        {student.parent_phone || '—'}
                      </div>
                    </td>
                    <td className="py-4 pr-4">
                      {student.is_active ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                          <span>Aktif</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                          <span>Nonaktif</span>
                        </span>
                      )}
                    </td>
                    {/* Kartu Ujian [Eligible / Not Eligible] */}
                    <td className="py-4 pr-4">
                      {(() => {
                        const { isEligible, issues } = checkExamEligibility(student);
                        if (isEligible) {
                          return (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 shadow-2xs">
                              <CheckCircle2 size={13} className="text-emerald-600" />
                              <span>Eligible</span>
                            </span>
                          );
                        }
                        return (
                          <div className="relative inline-block group/tooltip">
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-800 border border-rose-200 shadow-2xs cursor-help">
                              <AlertTriangle size={13} className="text-rose-600" />
                              <span>Not Eligible</span>
                            </span>
                            {/* Hover Tooltip */}
                            <div className="hidden group-hover/tooltip:block absolute left-0 bottom-full mb-1.5 z-30 w-52 p-2.5 bg-slate-900 text-white text-[11px] rounded-xl shadow-xl border border-slate-700 pointer-events-none">
                              <p className="font-bold text-rose-300 mb-1 flex items-center gap-1">
                                <AlertTriangle size={12} />
                                <span>Kekurangan Syarat:</span>
                              </p>
                              <ul className="list-disc list-inside space-y-0.5 text-slate-200 text-[10px] leading-tight">
                                {issues.map((iss, idx) => (
                                  <li key={idx}>{iss}</li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        );
                      })()}
                    </td>
                    <td className="py-4 pr-5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Link 
                          href={`/students/${student.id}`}
                          className="p-2 text-slate-400 hover:text-blue-700 hover:bg-blue-50 rounded-xl transition"
                          title="Detail Profil Siswa"
                        >
                          <Eye size={16} />
                        </Link>
                        {canEdit && (
                          <>
                            <button 
                              onClick={() => { setEditingStudent(student); setShowForm(true); }}
                              className="p-2 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-xl transition cursor-pointer"
                              title="Edit Siswa"
                            >
                              <Edit3 size={16} />
                            </button>
                            <button 
                              onClick={() => handleDelete(student.id, student.name)}
                              className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition cursor-pointer"
                              title="Hapus Siswa"
                            >
                              <Trash2 size={16} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Card Layout */}
        <div className="block sm:hidden space-y-3.5">
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-white border border-slate-100 p-4 rounded-2xl shadow-sm animate-pulse space-y-2">
                <div className="h-4.5 bg-slate-100 rounded w-32" />
                <div className="h-3.5 bg-slate-100 rounded w-24" />
              </div>
            ))
          ) : paginatedStudents.length === 0 ? (
            <div className="text-center py-10 text-slate-400 text-xs bg-slate-50 rounded-2xl border border-slate-100">
              {search || classFilter !== 'all' || examFilter !== 'all' ? `Tidak ada siswa yang sesuai filter pencarian.` : 'Tidak ada data siswa.'}
            </div>
          ) : (
            paginatedStudents.map((student) => {
              const { isEligible, issues } = checkExamEligibility(student);
              return (
                <div key={student.id} className="bg-white border border-slate-200/80 p-4.5 rounded-2xl shadow-2xs flex flex-col gap-3 relative font-sans">
                  <div className="flex justify-between items-start">
                    <div>
                      <Link href={`/students/${student.id}`} className="font-sans font-bold text-slate-900 text-base hover:text-blue-700 transition block mb-1">
                        {student.name}
                      </Link>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold bg-blue-50 text-blue-800 px-2.5 py-0.5 rounded-lg border border-blue-100">
                          Kelas {student.class}
                        </span>
                        <span className="text-xs text-slate-500 font-medium">NISN: {student.nisn || '—'}</span>
                      </div>
                    </div>
                    {student.is_active ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">Aktif</span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-50 text-rose-800 border border-rose-200">Nonaktif</span>
                    )}
                  </div>
                  
                  {/* Kartu Ujian Mobile Status */}
                  <div className="flex items-center justify-between text-xs py-1 border-t border-slate-50">
                    <span className="text-slate-400 font-medium">Kartu Ujian:</span>
                    {isEligible ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                        <CheckCircle2 size={12} className="text-emerald-600" />
                        <span>Eligible</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 text-rose-800 border border-rose-200" title={issues.join(', ')}>
                        <AlertTriangle size={12} className="text-rose-600" />
                        <span>Not Eligible ({issues.length})</span>
                      </span>
                    )}
                  </div>

                  <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs">
                    <div>
                      <span className="text-slate-400 block text-xs font-medium">Wali Murid</span>
                      <span className="font-semibold text-slate-800 text-xs sm:text-sm">{student.parent_name || '—'}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Link 
                        href={`/students/${student.id}`}
                        className="p-2 text-blue-700 bg-blue-50 rounded-xl"
                        title="Lihat Detail"
                      >
                        <Eye size={15} />
                      </Link>
                      {canEdit && (
                        <>
                          <button 
                            onClick={() => { setEditingStudent(student); setShowForm(true); }}
                            className="p-2 text-amber-700 bg-amber-50 rounded-xl cursor-pointer"
                            title="Edit"
                          >
                            <Edit3 size={15} />
                          </button>
                          <button 
                            onClick={() => handleDelete(student.id, student.name)}
                            className="p-2 text-rose-700 bg-rose-50 rounded-xl cursor-pointer"
                            title="Hapus"
                          >
                            <Trash2 size={15} />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Pagination Controls */}
        {!loading && filteredStudents.length > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between mt-6 gap-4 border-t border-slate-100 pt-6">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
              <span>Tampilkan</span>
              <select
                value={itemsPerPage}
                onChange={(e) => setItemsPerPage(Number(e.target.value))}
                className="px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 text-slate-700 font-bold cursor-pointer"
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
              <span>siswa per halaman</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="px-3.5 py-1.5 text-xs font-bold text-slate-600 bg-slate-50 border border-slate-200/90 rounded-xl hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
              >
                Sebelumnya
              </button>
              
              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }).map((_, i) => {
                  const page = i + 1;
                  if (
                    totalPages <= 5 || 
                    page === 1 || 
                    page === totalPages || 
                    (page >= currentPage - 1 && page <= currentPage + 1)
                  ) {
                    return (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`w-8 h-8 flex items-center justify-center text-xs font-bold rounded-xl transition cursor-pointer ${
                          currentPage === page 
                            ? 'bg-blue-600 text-white shadow-sm' 
                            : 'text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        {page}
                      </button>
                    )
                  }
                  
                  if (page === currentPage - 2 || page === currentPage + 2) {
                    return <span key={page} className="text-slate-400 text-xs">...</span>
                  }
                  
                  return null;
                })}
              </div>

              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="px-3.5 py-1.5 text-xs font-bold text-slate-600 bg-slate-50 border border-slate-200/90 rounded-xl hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
              >
                Selanjutnya
              </button>
            </div>
          </div>
        )}
      </div>

      {showImport && (
        <CsvImport 
          onSuccess={fetchStudents} 
          onClose={() => setShowImport(false)} 
        />
      )}

      {showPhotoUpload && (
        <BulkPhotoUpload 
          onSuccess={fetchStudents} 
          onClose={() => setShowPhotoUpload(false)} 
        />
      )}

      {showForm && (
        <StudentForm 
          initialData={editingStudent}
          onSuccess={fetchStudents} 
          onClose={() => { setShowForm(false); setEditingStudent(null); }}
        />
      )}

      {/* Modal Generate Akses */}
      {showGenerateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 font-sans">
          <div className="bg-white rounded-3xl p-7 w-full max-w-md shadow-2xl border border-slate-100">
            <h3 className="font-sans font-bold text-xl text-slate-900 mb-2 flex items-center gap-2">
              <Key className="text-indigo-600 w-5 h-5" />
              <span>Generate Akses Orang Tua</span>
            </h3>
            <p className="font-sans text-xs sm:text-sm text-slate-500 mb-6 leading-relaxed">
              Sistem akan membuat password unik secara acak dan mengunduh file CSV yang berisi data akses untuk dibagikan ke orang tua.
            </p>
            
            <div className="mb-6">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Target Kelas</label>
              <select
                value={generateTarget}
                onChange={(e) => setGenerateTarget(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 text-xs sm:text-sm font-semibold text-slate-800 transition outline-none cursor-pointer"
              >
                <option value="all">Semua Siswa</option>
                {classes.map((c: any) => (
                  <option key={c} value={c}>Kelas {c}</option>
                ))}
              </select>
            </div>
            
              <div className="mt-4 p-4 bg-rose-50 border border-rose-200 rounded-2xl">
                <p className="text-xs font-bold text-rose-700 mb-2">⚠️ Zona Berbahaya</p>
                <p className="text-xs text-rose-600 leading-relaxed mb-3">Reset seluruh password orang tua. Semua akses lama (termasuk yang sudah diubah) akan tidak berlaku. Gunakan setelah generate password baru.</p>
                <button
                  onClick={handleResetAllPasswords}
                  disabled={isResettingPasswords || generatingAccess}
                  className="px-4 py-2 bg-rose-600 text-white text-xs font-bold hover:bg-rose-700 rounded-xl transition flex items-center gap-2 disabled:opacity-70 cursor-pointer"
                >
                  {isResettingPasswords ? <><Loader2 size={14} className="animate-spin" /><span>Mereset...</span></> : <span>Reset Semua Password Orang Tua</span>}
                </button>
              </div>

              <div className="flex items-center gap-3 justify-end mt-4">
              <button 
                onClick={() => setShowGenerateModal(false)}
                disabled={generatingAccess}
                className="px-5 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-2xl transition cursor-pointer"
              >
                Batal
              </button>
              <button 
                onClick={handleGenerateAccess}
                disabled={generatingAccess}
                className="btn-tactile px-5 py-2.5 bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 rounded-2xl transition flex items-center gap-2 disabled:opacity-70 shadow-sm shadow-indigo-900/15 cursor-pointer"
              >
                {generatingAccess ? (
                  <>
                    <Loader2 size={15} className="animate-spin" />
                    <span>Memproses...</span>
                  </>
                ) : (
                  <>
                    <Key size={15} />
                    <span>Generate &amp; Download CSV</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
