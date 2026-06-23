'use client'

import React, { useEffect, useState } from 'react'
import { Plus, Search, Trash2, Edit3, Eye, FileText, Filter } from 'lucide-react'
import Link from 'next/link'
import { PostForm } from '@/components/portal/posts/PostForm'

export default function PostsPage() {
  const [posts, setPosts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingPost, setEditingPost] = useState<any | null>(null)

  const fetchPosts = async () => {
    setLoading(true)
    try {
      let url = `/api/posts?search=${encodeURIComponent(search)}`
      if (categoryFilter) {
        url += `&category=${encodeURIComponent(categoryFilter)}`
      }

      const res = await fetch(url)
      const data = await res.json()
      if (data.success) {
        setPosts(data.data)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const delay = setTimeout(() => {
      fetchPosts()
    }, 500)
    return () => clearTimeout(delay)
  }, [search, categoryFilter])

  const handleDelete = async (id: string, title: string) => {
    if (confirm(`Yakin ingin menghapus postingan "${title}"?`)) {
      try {
        const res = await fetch(`/api/posts/${id}`, { method: 'DELETE' })
        if (res.ok) fetchPosts()
      } catch (err) {
        console.error(err)
      }
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Berita & Artikel</h1>
          <p className="text-slate-500">Kelola konten berita, artikel, dan pengumuman madrasah.</p>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button
            onClick={() => { setEditingPost(null); setShowForm(true); }}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-xl hover:bg-blue-700 transition shadow-sm font-medium"
          >
            <Plus size={18} />
            Tambah Konten
          </button>
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
          <div className="relative w-full sm:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input
              type="text"
              placeholder="Cari judul konten..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition outline-none"
            />
          </div>

          <div className="relative w-full sm:w-auto min-w-[200px]">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition outline-none appearance-none"
            >
              <option value="">Semua Kategori</option>
              <option value="Berita Sekolah">Berita Sekolah</option>
              <option value="Artikel Pendidikan">Artikel Pendidikan</option>
              <option value="Pengumuman">Pengumuman</option>
              <option value="Prestasi">Prestasi</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-100 text-sm font-semibold text-slate-500 uppercase tracking-wider">
                <th className="pb-3 pr-4">Judul</th>
                <th className="pb-3 pr-4">Kategori</th>
                <th className="pb-3 pr-4">Penulis</th>
                <th className="pb-3 pr-4">Tanggal</th>
                <th className="pb-3 pr-4">Views</th>
                <th className="pb-3 pr-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="text-center py-10 text-slate-500">Memuat data...</td>
                </tr>
              ) : posts.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-10 text-slate-500">Tidak ada konten ditemukan.</td>
                </tr>
              ) : (
                posts.map((post) => (
                  <tr key={post.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition group">
                    <td className="py-4 pr-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
                          <FileText size={20} />
                        </div>
                        <div>
                          <div className="font-medium text-slate-800 line-clamp-1">{post.title}</div>
                          <div className="text-xs text-slate-500 mt-0.5 font-mono">{post.slug}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 pr-4">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-slate-100 text-slate-600">
                        {post.category}
                      </span>
                    </td>
                    <td className="py-4 pr-4 text-sm text-slate-600">{post.author}</td>
                    <td className="py-4 pr-4 text-sm text-slate-600">
                      {new Date(post.created_at).toLocaleDateString('id-ID', {
                        day: 'numeric', month: 'long', year: 'numeric'
                      })}
                    </td>
                    <td className="py-4 pr-4 text-sm font-medium text-slate-700">
                      <div className="flex items-center gap-1.5">
                        <Eye size={14} className="text-slate-400" />
                        {post.view_count || 0}
                      </div>
                    </td>
                    <td className="py-4 pr-4 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition">
                        <Link
                          href={`/news/${post.slug}`}
                          target="_blank"
                          className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                          title="Lihat di Website"
                        >
                          <Eye size={18} />
                        </Link>
                        <button
                          onClick={() => { setEditingPost(post); setShowForm(true); }}
                          className="p-1.5 text-slate-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition"
                          title="Edit"
                        >
                          <Edit3 size={18} />
                        </button>
                        <button
                          onClick={() => handleDelete(post.id, post.title)}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                          title="Hapus"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showForm && (
        <PostForm
          initialData={editingPost}
          onSuccess={fetchPosts}
          onClose={() => { setShowForm(false); setEditingPost(null); }}
        />
      )}
    </div>
  )
}
