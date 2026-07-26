"use client";

import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { Plus, Trash2, Search, Filter, Eye, Download, Info, CheckCircle2, MessageCircle, User, ChevronUp, ChevronDown, Clock } from "lucide-react";
import { SppInvoiceDetailModal } from "@/components/finance/spp/SppInvoiceDetailModal";

// Constants outside component = never re-created
const STATUS_COLORS: Record<string, string> = {
  "PAID": "bg-emerald-100 text-emerald-700",
  "UNPAID": "bg-red-100 text-red-700",
  "PARTIAL": "bg-amber-100 text-amber-700",
  "PENDING_VERIFICATION": "bg-blue-100 text-blue-700",
  "LATE": "bg-red-100 text-red-700 font-bold"
};
const STATUS_LABELS: Record<string, string> = {
  "PAID": "Lunas",
  "UNPAID": "Belum Bayar",
  "PARTIAL": "Mencicil",
  "PENDING_VERIFICATION": "Menunggu Verifikasi",
  "LATE": "Terlambat"
};

export default function ManageTab() {
  // Raw data from server (only changes when month/year changes)
  const [allInvoices, setAllInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "" });
  
  // Server-side filters (trigger API call)
  const [filterMonth, setFilterMonth] = useState(new Date().getMonth() + 1);
  const [filterYear, setFilterYear] = useState(new Date().getFullYear());

  // Client-side filters (instant, no API call)
  const [filterClass, setFilterClass] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterPayment, setFilterPayment] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' } | null>(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);

  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const SortIcon = ({ columnKey }: { columnKey: string }) => {
    if (sortConfig?.key !== columnKey) return <ChevronUp className="w-3 h-3 opacity-20 inline-block ml-1" />;
    return sortConfig.direction === 'asc' 
      ? <ChevronUp className="w-3 h-3 inline-block ml-1" />
      : <ChevronDown className="w-3 h-3 inline-block ml-1" />;
  };

  // Detail Modal
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(null);

  // Generate Modal
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [genMonth, setGenMonth] = useState(new Date().getMonth() + 1);
  const [genYear, setGenYear] = useState(new Date().getFullYear());
  const [genTargetType, setGenTargetType] = useState<'all' | 'class' | 'student'>('all');
  const [genClassId, setGenClassId] = useState("");
  const [genStudentId, setGenStudentId] = useState("");
  const [classes, setClasses] = useState<{ id: string; name: string }[]>([]);
  
  // Student search states for Generate Modal
  const [searchGenQuery, setSearchGenQuery] = useState('');
  const [searchGenResults, setSearchGenResults] = useState<any[]>([]);
  const [isGenSearching, setIsGenSearching] = useState(false);
  const [selectedGenStudentName, setSelectedGenStudentName] = useState('');
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // WA Bulk Send
  const [isSendingWA, setIsSendingWA] = useState(false);
  const [waProgress, setWaProgress] = useState(0);
  const [waTotal, setWaTotal] = useState(0);
  const [waCurrentName, setWaCurrentName] = useState("");

  // Fetch from server ONLY when month or year changes
  const fetchInvoices = useCallback(async (month: number, year: number) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ month: month.toString(), year: year.toString() });
      const res = await fetch(`/api/spp/manage?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setAllInvoices(data.data);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInvoices(filterMonth, filterYear);
  }, [filterMonth, filterYear, fetchInvoices]);

  useEffect(() => {
    if (showGenerateModal && classes.length === 0) {
      fetch('/api/classrooms').then(r => r.json()).then(data => {
        if (data.success) setClasses(data.data);
      }).catch(console.error);
    }
  }, [showGenerateModal]);

  const handleSearchStudent = (query: string) => {
    setSearchGenQuery(query);
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);

    if (query.trim().length < 2) {
      setSearchGenResults([]);
      return;
    }

    setIsGenSearching(true);
    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/students?search=${encodeURIComponent(query)}`);
        const data = await res.json();
        if (data.success) setSearchGenResults(data.data);
      } catch (err) {
        console.error('Failed to search students', err);
      } finally {
        setIsGenSearching(false);
      }
    }, 500);
  };

  const handleSelectStudent = (student: any) => {
    setGenStudentId(student.id);
    setSelectedGenStudentName(`${student.name} (${student.student_number}) - ${student.class}`);
    setSearchGenQuery('');
    setSearchGenResults([]);
  };

  const handleDeleteInfaq = async (invoiceId: string, itemName: string, status: string) => {
    if (status === 'PAID') {
      setMessage({ text: 'Tidak dapat menghapus item infaq dari tagihan yang sudah lunas penuh.', type: 'error' });
      return;
    }
    if (!confirm(`Hapus ${itemName} dari tagihan ini?\n(Hanya item ini yang akan dihapus dari rincian tagihan umum).`)) return;
    
    setActionLoading(true);
    setMessage({ text: "", type: "" });
    try {
      const res = await fetch(`/api/spp/manage`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ invoiceId, itemName })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal menghapus');
      setMessage({ text: 'Item infaq berhasil dihapus', type: 'success' });
      fetchInvoices(filterMonth, filterYear);
    } catch (err: any) {
      setMessage({ text: err.message, type: 'error' });
    } finally {
      setActionLoading(false);
    }
  };

  // Client-side filtering (instant, zero latency)
  const invoices = useMemo(() => {
    let result = allInvoices;
    if (filterClass) result = result.filter(inv => inv.student_class === filterClass);
    if (filterStatus) result = result.filter(inv => inv.status === filterStatus);
    if (filterPayment) result = result.filter(inv => inv.payment_method === filterPayment);
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(inv =>
        inv.student_name?.toLowerCase().includes(q) ||
        inv.student_number?.toLowerCase().includes(q)
      );
    }
    
    if (sortConfig) {
      result = [...result].sort((a, b) => {
        if (sortConfig.key === 'name') {
          return sortConfig.direction === 'asc' 
            ? (a.student_name || '').localeCompare(b.student_name || '')
            : (b.student_name || '').localeCompare(a.student_name || '');
        }
        if (sortConfig.key === 'status') {
          return sortConfig.direction === 'asc' 
            ? (a.status || '').localeCompare(b.status || '')
            : (b.status || '').localeCompare(a.status || '');
        }
        if (sortConfig.key === 'amount') {
          return sortConfig.direction === 'asc' 
            ? (a.amount || 0) - (b.amount || 0)
            : (b.amount || 0) - (a.amount || 0);
        }
        if (sortConfig.key === 'sisa') {
          const sisaA = (a.amount || 0) - (a.paid_amount || 0);
          const sisaB = (b.amount || 0) - (b.paid_amount || 0);
          return sortConfig.direction === 'asc' ? sisaA - sisaB : sisaB - sisaA;
        }
        return 0;
      });
    } else {
      // Default stable sort (by name ascending) to prevent jumping when updated
      result = [...result].sort((a, b) => (a.student_name || '').localeCompare(b.student_name || ''));
    }

    return result;
  }, [allInvoices, filterClass, filterStatus, filterPayment, searchQuery, sortConfig]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filterClass, filterStatus, filterPayment, searchQuery, sortConfig, allInvoices, itemsPerPage]);

  const totalPages = Math.ceil(invoices.length / itemsPerPage);
  const paginatedInvoices = invoices.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handleInvoiceUpdated = () => {
    fetchInvoices(filterMonth, filterYear);
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (genTargetType === 'class' && !genClassId) {
      setMessage({ text: 'Kelas wajib dipilih', type: 'error' }); return;
    }
    if (genTargetType === 'student' && !genStudentId) {
      setMessage({ text: 'Siswa wajib dipilih', type: 'error' }); return;
    }

    setActionLoading(true);
    setMessage({ text: "", type: "" });
    try {
      const res = await fetch("/api/finance/infaq/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          month: genMonth, 
          year: genYear,
          targetType: genTargetType,
          classId: genClassId,
          studentId: genStudentId
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal membuat tagihan Infaq");
      setMessage({ text: data.message || "Berhasil membuat tagihan Infaq", type: "success" });
      setShowGenerateModal(false);
      // Data Infaq masuk ke general_invoices, bukan spp_invoices lagi
      // Namun untuk sementara kita refresh jika ternyata API lama / manajemen lokal memerlukannya
      setFilterMonth(genMonth);
      setFilterYear(genYear);
      fetchInvoices(genMonth, genYear);
    } catch (error: any) {
      setMessage({ text: error.message, type: "error" });
    } finally {
      setActionLoading(false);
    }
  };

  const handleBulkSendWA = async () => {
    const targetInvoices = allInvoices.filter(inv => inv.status !== 'PAID');

    if (targetInvoices.length === 0) {
      setMessage({ text: "Tidak ada tagihan tertunggak untuk dikirim.", type: "error" });
      return;
    }

    if (!confirm(`Kirim notifikasi WA ke ${targetInvoices.length} tagihan siswa menunggak? Proses ini membutuhkan waktu (4 detik per pesan).`)) return;

    setIsSendingWA(true);
    setWaTotal(targetInvoices.length);
    setWaProgress(0);
    setMessage({ text: "", type: "" });

    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < targetInvoices.length; i++) {
      const inv = targetInvoices[i];
      setWaCurrentName(inv.student_name || "Siswa");
      
      try {
        const res = await fetch("/api/spp/wa-notify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ invoice_id: inv.id, item_name: inv._item_name })
        });
        
        if (res.ok) successCount++;
        else failCount++;
      } catch (error) {
        failCount++;
      }

      setWaProgress(i + 1);
      
      if (i < targetInvoices.length - 1) {
        await new Promise(r => setTimeout(r, 4000));
      }
    }

    setIsSendingWA(false);
    setMessage({ text: `Selesai! Berhasil kirim: ${successCount}, Gagal: ${failCount}`, type: "success" });
  };

  const handleSingleSendWA = async (invoiceId: string, itemName: string, studentName: string) => {
    if (!confirm(`Kirim notifikasi tagihan ke WA orang tua ${studentName}?`)) return;
    setActionLoading(true);
    try {
      const res = await fetch("/api/spp/wa-notify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invoice_id: invoiceId, item_name: itemName })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal mengirim notifikasi");
      setMessage({ text: data.message || "Notifikasi WA berhasil dikirim", type: "success" });
    } catch (err: any) {
      setMessage({ text: err.message, type: "error" });
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Filter & Search Bar */}
      <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-4">
        
        <div className="flex flex-col md:flex-row justify-between gap-4">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" placeholder="Cari Nama / NISN..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-xl outline-none focus:border-blue-500"
            />
          </div>
          <div className="flex gap-2 w-full md:w-auto">
            <button 
              onClick={() => setShowGenerateModal(true)}
              className="w-full md:w-auto bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-xl text-sm font-semibold transition-colors flex items-center justify-center gap-2 shadow-sm"
            >
              <Plus className="w-4 h-4" /> Buat Tagihan Infaq
            </button>
            <button 
              onClick={handleBulkSendWA}
              disabled={isSendingWA}
              className="w-full md:w-auto bg-green-600 hover:bg-green-700 text-white px-5 py-2 rounded-xl text-sm font-semibold transition-colors flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
            >
              <MessageCircle className="w-4 h-4" /> {isSendingWA ? "Mengirim..." : "Kirim WA Massal"}
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
            <Filter className="w-4 h-4 text-slate-400" />
            <span className="text-xs font-medium text-slate-500">Filter:</span>
          </div>
          {/* Month & Year = Server filter */}
          <select value={filterMonth} onChange={(e) => setFilterMonth(Number(e.target.value))} className="border border-slate-200 bg-white rounded-lg text-sm px-3 py-1.5 outline-none focus:border-blue-500">
            {Array.from({length: 12}, (_, i) => i + 1).map(m => <option key={m} value={m}>Bulan {m}</option>)}
          </select>
          <select value={filterYear} onChange={(e) => setFilterYear(Number(e.target.value))} className="border border-slate-200 bg-white rounded-lg text-sm px-3 py-1.5 outline-none focus:border-blue-500">
            {[2024, 2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          {/* Class/Status/Method = Instant client filter */}
          <select value={filterClass} onChange={(e) => setFilterClass(e.target.value)} className="border border-slate-200 bg-white rounded-lg text-sm px-3 py-1.5 outline-none focus:border-blue-500">
            <option value="">Semua Kelas</option>
            <optgroup label="Kelas 1"><option value="1A">1A</option><option value="1B">1B</option><option value="1C">1C</option><option value="1D">1D</option></optgroup>
            <optgroup label="Kelas 2"><option value="2A">2A</option><option value="2B">2B</option><option value="2C">2C</option><option value="2D">2D</option></optgroup>
            <optgroup label="Kelas 3"><option value="3A">3A</option><option value="3B">3B</option><option value="3C">3C</option><option value="3D">3D</option></optgroup>
            <optgroup label="Kelas 4"><option value="4A">4A</option><option value="4B">4B</option><option value="4C">4C</option><option value="4D">4D</option></optgroup>
            <optgroup label="Kelas 5"><option value="5A">5A</option><option value="5B">5B</option><option value="5C">5C</option><option value="5D">5D</option></optgroup>
            <optgroup label="Kelas 6"><option value="6A">6A</option><option value="6B">6B</option><option value="6C">6C</option><option value="6D">6D</option></optgroup>
          </select>
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="border border-slate-200 bg-white rounded-lg text-sm px-3 py-1.5 outline-none focus:border-blue-500">
            <option value="">Semua Status</option>
            <option value="PAID">Lunas</option><option value="PARTIAL">Mencicil</option>
            <option value="UNPAID">Belum Bayar</option><option value="PENDING_VERIFICATION">Menunggu Verifikasi</option>
          </select>
          <select value={filterPayment} onChange={(e) => setFilterPayment(e.target.value)} className="border border-slate-200 bg-white rounded-lg text-sm px-3 py-1.5 outline-none focus:border-blue-500">
            <option value="">Metode (Semua)</option>
            <option value="TRANSFER">Transfer</option><option value="CASH">Tunai (TU)</option>
          </select>
        </div>
      </div>

      {isSendingWA && (
        <div className="bg-white p-5 rounded-2xl border border-green-200 shadow-sm space-y-2">
          <div className="flex justify-between text-sm font-semibold text-green-700">
            <span>Mengirim Notifikasi WA Massal...</span>
            <span>{waProgress} / {waTotal}</span>
          </div>
          <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
            <div 
              className="bg-green-500 h-full transition-all duration-300"
              style={{ width: `${waTotal > 0 ? (waProgress / waTotal) * 100 : 0}%` }}
            ></div>
          </div>
          <p className="text-xs text-slate-500 text-center">Sedang mengirim ke: <span className="font-semibold text-slate-700">{waCurrentName}</span> (Mohon jangan tutup halaman ini)</p>
        </div>
      )}

      {message.text && (
        <div className={`p-4 rounded-xl text-sm font-medium ${message.type === 'error' ? 'bg-red-50 text-red-600 border border-red-200' : 'bg-emerald-50 text-emerald-600 border border-emerald-200'}`}>
          {message.text}
        </div>
      )}

      {/* Main Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-slate-50 text-slate-500 border-b border-slate-100">
              <tr>
                <th className="px-5 py-4 font-medium text-center w-12">No</th>
                <th 
                  className="px-5 py-4 font-medium cursor-pointer hover:text-slate-800 select-none"
                  onClick={() => handleSort('name')}
                >
                  Nama Siswa <SortIcon columnKey="name" />
                </th>
                <th className="px-5 py-4 font-medium">Kelas</th>
                <th className="px-5 py-4 font-medium">Tagihan</th>
                <th 
                  className="px-5 py-4 font-medium cursor-pointer hover:text-slate-800 select-none"
                  onClick={() => handleSort('amount')}
                >
                  Total <SortIcon columnKey="amount" />
                </th>
                <th 
                  className="px-5 py-4 font-medium cursor-pointer hover:text-slate-800 select-none"
                  onClick={() => handleSort('sisa')}
                >
                  Sisa <SortIcon columnKey="sisa" />
                </th>
                <th 
                  className="px-5 py-4 font-medium cursor-pointer hover:text-slate-800 select-none"
                  onClick={() => handleSort('status')}
                >
                  Status <SortIcon columnKey="status" />
                </th>
                <th className="px-5 py-4 font-medium text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                // Skeleton rows
                Array.from({length: 5}).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-5 py-4"><div className="h-4 bg-slate-100 rounded w-6 mx-auto" /></td>
                    <td className="px-5 py-4"><div className="h-4 bg-slate-100 rounded w-24" /></td>
                    <td className="px-5 py-4"><div className="h-4 bg-slate-100 rounded w-36" /></td>
                    <td className="px-5 py-4"><div className="h-4 bg-slate-100 rounded w-12" /></td>
                    <td className="px-5 py-4"><div className="h-6 bg-slate-100 rounded-full w-20" /></td>
                    <td className="px-5 py-4"><div className="h-4 bg-slate-100 rounded w-24" /></td>
                    <td className="px-5 py-4"><div className="h-4 bg-slate-100 rounded w-24" /></td>
                    <td className="px-5 py-4"><div className="h-4 bg-slate-100 rounded w-16" /></td>
                    <td className="px-5 py-4"><div className="h-8 bg-slate-100 rounded w-16 ml-auto" /></td>
                  </tr>
                ))
              ) : paginatedInvoices.length === 0 ? (
                <tr><td colSpan={9} className="text-center py-10 text-slate-400">Tidak ada tagihan ditemukan.</td></tr>
              ) : (
                paginatedInvoices.map((inv, idx) => (
                  <tr key={inv.id} className="hover:bg-slate-50">
                    <td className="px-5 py-4 text-center text-slate-400">{(currentPage - 1) * itemsPerPage + idx + 1}</td>
                    <td className="px-5 py-4">
                      <div 
                        className="font-semibold text-blue-600 hover:text-blue-800 hover:underline cursor-pointer transition-colors"
                        onClick={() => setSelectedInvoiceId(inv.id)}
                      >
                        {inv.student_name || '-'}
                      </div>
                      <div className="text-xs text-slate-400 mt-0.5">{inv.student_nisn || inv.student_number || '-'}</div>
                    </td>
                    <td className="px-5 py-4 text-slate-600">{inv.student_class || '-'}</td>
                    <td className="px-5 py-4 text-slate-600 text-sm">{inv.title}</td>
                    <td className="px-5 py-4 font-semibold text-slate-800">Rp {inv.amount.toLocaleString("id-ID")}</td>
                    <td className="px-5 py-4 font-semibold">
                      {(inv.amount - (inv.paid_amount || 0)) > 0
                        ? <span className="text-red-500">Rp {(inv.amount - (inv.paid_amount || 0)).toLocaleString("id-ID")}</span>
                        : <span className="text-emerald-500">Lunas</span>
                      }
                    </td>
                    <td className="px-5 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${STATUS_COLORS[inv.status] || "bg-slate-100 text-slate-600"}`}>
                        {STATUS_LABELS[inv.status] || inv.status}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right space-x-2">
                      <button 
                        onClick={() => setSelectedInvoiceId(inv.id)}
                        className="px-3 py-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors font-medium text-xs inline-flex items-center gap-1"
                      >
                        <Eye className="w-3 h-3" /> Detail Infaq
                      </button>
                      <button 
                        onClick={() => handleSingleSendWA(inv.id, inv._item_name, inv.student_name)}
                        className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition-colors inline-flex"
                        title="Kirim WA Tagihan"
                      >
                        <MessageCircle className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteInfaq(inv.id, inv._item_name, inv.status)}
                        className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors inline-flex"
                        title="Hapus Infaq"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Card View */}
        <div className="md:hidden divide-y divide-slate-100">
          {loading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="p-4 space-y-3 animate-pulse">
                <div className="h-4 bg-slate-100 rounded w-1/2" />
                <div className="h-4 bg-slate-100 rounded w-3/4" />
                <div className="h-4 bg-slate-100 rounded w-1/4" />
              </div>
            ))
          ) : paginatedInvoices.length === 0 ? (
            <div className="px-6 py-10 text-center text-slate-500 text-sm">Belum ada data tagihan.</div>
          ) : (
            paginatedInvoices.map((inv) => {
              const sisa = Number(inv.amount) - Number(inv.paid_amount || 0);
              
              let statusBadge = <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 font-semibold text-[10px]">Belum Bayar</span>;
              if (inv.status === 'PAID') statusBadge = <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-700 font-semibold text-[10px] flex items-center gap-1 w-max"><CheckCircle2 className="w-2.5 h-2.5" /> Lunas</span>;
              if (inv.status === 'PARTIAL') statusBadge = <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-700 font-semibold text-[10px] flex items-center gap-1 w-max"><Clock className="w-2.5 h-2.5" /> Cicilan</span>;
              if (inv.status === 'PENDING_VERIFICATION') statusBadge = <span className="px-2 py-0.5 rounded-md bg-blue-100 text-blue-700 font-semibold text-[10px]">Menunggu Verifikasi</span>;

              return (
                <div key={inv.id} className="p-4 hover:bg-slate-50 transition cursor-pointer" onClick={() => setSelectedInvoiceId(inv.id)}>
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <div className="font-semibold text-blue-600 text-sm">{inv.student_name}</div>
                      <div className="text-[11px] text-slate-400">Kls: {inv.student_class} • NISN: {inv.student_nisn || inv.student_number || '-'}</div>
                    </div>
                    {statusBadge}
                  </div>
                  <div className="text-sm font-medium text-slate-700 mb-2 truncate" title={inv.title}>{inv.title}</div>
                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-50">
                    <div>
                      <div className="text-[10px] text-slate-400 uppercase">Total Tagihan</div>
                      <div className="font-semibold text-slate-800 text-sm">Rp {Number(inv.amount).toLocaleString('id-ID')}</div>
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={(e) => { e.stopPropagation(); handleSingleSendWA(inv.id, inv._item_name, inv.student_name); }}
                        className="px-2 py-1 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 disabled:opacity-50 rounded-md transition"
                        title="Kirim Notifikasi WA"
                      >
                        <MessageCircle size={14} />
                      </button>
                      <div className="text-right">
                        <div className="text-[10px] text-slate-400 uppercase">Sisa Tagihan</div>
                        <div className="font-semibold text-red-500 text-sm">
                          {sisa > 0 ? `Rp ${sisa.toLocaleString('id-ID')}` : <span className="text-emerald-500">Lunas</span>}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
        
        {/* Pagination UI */}
        {!loading && invoices.length > 0 && (
          <div className="p-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-50/50">
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <span>Tampilkan</span>
              <select
                value={itemsPerPage}
                onChange={e => setItemsPerPage(Number(e.target.value))}
                className="border border-slate-200 rounded-lg px-2 py-1.5 outline-none focus:border-blue-500 bg-white"
              >
                <option value={20}>20</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
              <span>dari {invoices.length} data</span>
            </div>
            
            <div className="flex items-center gap-3">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                className="px-4 py-2 text-sm border border-slate-200 bg-white rounded-xl hover:bg-slate-50 disabled:opacity-50 transition font-medium text-slate-600"
              >
                Sebelumnya
              </button>
              <span className="text-sm font-semibold text-slate-700">
                {currentPage} <span className="text-slate-400 font-normal">/ {totalPages || 1}</span>
              </span>
              <button
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                className="px-4 py-2 text-sm border border-slate-200 bg-white rounded-xl hover:bg-slate-50 disabled:opacity-50 transition font-medium text-slate-600"
              >
                Selanjutnya
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Detail Data Siswa Modal */}
      {selectedInvoiceId && (
        <SppInvoiceDetailModal
          invoiceId={selectedInvoiceId}
          onClose={() => setSelectedInvoiceId(null)}
          onUpdated={handleInvoiceUpdated}
        />
      )}

      {/* Generate Modal */}
      {showGenerateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h3 className="text-lg font-bold text-slate-800">Buat Tagihan Infaq Bulanan</h3>
              <button onClick={() => setShowGenerateModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>
            <form onSubmit={handleGenerate} className="p-6 space-y-4">
              <div className="bg-blue-50 p-4 rounded-xl text-sm text-blue-700 border border-blue-100">
                Data ini otomatis masuk ke <b>Database SPP/Infaq</b> yang terpisah dari Keuangan Umum.<br/>
                Jika siswa memiliki tagihan aktif sebelumnya, maka akan ada dua tagihan Infaq, namun saat pengingat WA dikirimkan, semua tagihan yang belum lunas akan direkap otomatis. Nominal disesuaikan otomatis (Fullday: 160rb, Reguler: 60rb).
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Target Tagihan</label>
                <select 
                  value={genTargetType} 
                  onChange={(e: any) => setGenTargetType(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl text-sm px-4 py-2 outline-none focus:border-blue-500"
                >
                  <option value="all">Seluruh Siswa Aktif</option>
                  <option value="class">Berdasarkan Kelas</option>
                  <option value="student">Per Siswa (Individu)</option>
                </select>
              </div>

              {genTargetType === 'class' && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Pilih Kelas</label>
                  <select
                    value={genClassId}
                    onChange={e => setGenClassId(e.target.value)}
                    className="w-full px-4 py-2 border border-slate-200 rounded-xl outline-none focus:border-blue-500 text-sm"
                  >
                    <option value="">-- Pilih Kelas --</option>
                    {classes.map(cls => (
                      <option key={cls.id} value={cls.id}>{cls.name}</option>
                    ))}
                  </select>
                </div>
              )}

              {genTargetType === 'student' && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Cari Siswa</label>
                  {genStudentId ? (
                    <div className="flex items-center justify-between p-3 border border-blue-200 bg-blue-50 rounded-xl">
                      <div className="flex items-center gap-2">
                        <User size={16} className="text-blue-500" />
                        <span className="text-sm font-semibold text-blue-800">{selectedGenStudentName}</span>
                      </div>
                      <button 
                        type="button"
                        onClick={() => {
                          setGenStudentId('')
                          setSelectedGenStudentName('')
                        }}
                        className="text-xs text-red-500 hover:text-red-700 font-medium"
                      >
                        Ganti
                      </button>
                    </div>
                  ) : (
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search size={16} className="text-slate-400" />
                      </div>
                      <input
                        type="text"
                        value={searchGenQuery}
                        onChange={(e) => handleSearchStudent(e.target.value)}
                        placeholder="Ketik Nama atau NISN..."
                        className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 focus:border-blue-500 outline-none transition text-sm"
                      />
                      
                      {searchGenQuery.length >= 2 && (
                        <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg max-h-48 overflow-y-auto">
                          {isGenSearching ? (
                            <div className="p-3 text-center text-sm text-slate-500">Mencari...</div>
                          ) : searchGenResults.length > 0 ? (
                            <ul className="py-1">
                              {searchGenResults.map(student => (
                                <li 
                                  key={student.id}
                                  onClick={() => handleSelectStudent(student)}
                                  className="px-4 py-2 hover:bg-slate-50 cursor-pointer border-b border-slate-50 last:border-0"
                                >
                                  <div className="font-semibold text-slate-800 text-sm">{student.name}</div>
                                  <div className="text-xs text-slate-500">{student.student_number} • {student.class}</div>
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <div className="p-3 text-center text-sm text-slate-500">Siswa tidak ditemukan</div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Bulan</label>
                  <select value={genMonth} onChange={e => setGenMonth(Number(e.target.value))} className="w-full border border-slate-200 rounded-xl text-sm px-4 py-2 outline-none focus:border-blue-500">
                    {Array.from({length: 12}, (_, i) => i + 1).map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Tahun</label>
                  <select value={genYear} onChange={e => setGenYear(Number(e.target.value))} className="w-full border border-slate-200 rounded-xl text-sm px-4 py-2 outline-none focus:border-blue-500">
                    {[2024, 2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>
              </div>
              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setShowGenerateModal(false)} className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-semibold transition-colors">Batal</button>
                <button type="submit" disabled={actionLoading} className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition-colors disabled:opacity-50">
                  {actionLoading ? "Memproses..." : "Buat Tagihan Infaq"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
