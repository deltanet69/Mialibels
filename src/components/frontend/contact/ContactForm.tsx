'use client';

import React, { useState } from 'react';
import { Send, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

export default function ContactForm() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: ''
  });

  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    setErrorMessage('');

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Terjadi kesalahan saat mengirim pesan.');
      }

      setStatus('success');
      setFormData({ name: '', email: '', phone: '', subject: '', message: '' });

      // Reset success message after 5 seconds
      setTimeout(() => setStatus('idle'), 5000);

    } catch (err: any) {
      setStatus('error');
      setErrorMessage(err.message);
    }
  };

  return (
    <div className="bg-white rounded-3xl p-8 md:p-10 shadow-xl border border-gray-100">
      <h3 className="font-headline font-bold text-2xl text-secondary mb-2">
        Kirim Pesan
      </h3>
      <p className="font-body text-gray-500 mb-8">
        Silakan isi form di bawah ini dan kami akan segera merespons pesan Anda.
      </p>

      {status === 'success' && (
        <div className="mb-6 p-4 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-start gap-3 animate-fade-in-up">
          <CheckCircle2 className="w-6 h-6 text-emerald-500 shrink-0 mt-0.5" />
          <div>
            <h4 className="font-semibold text-emerald-800">Pesan Terkirim!</h4>
            <p className="text-sm text-emerald-600 mt-1">Pesan Anda telah kami terima. Cek email Anda untuk konfirmasi otomatis.</p>
          </div>
        </div>
      )}

      {status === 'error' && (
        <div className="mb-6 p-4 rounded-2xl bg-red-50 border border-red-100 flex items-start gap-3 animate-fade-in-up">
          <AlertCircle className="w-6 h-6 text-red-500 shrink-0 mt-0.5" />
          <div>
            <h4 className="font-semibold text-red-800">Gagal Mengirim Pesan</h4>
            <p className="text-sm text-red-600 mt-1">{errorMessage}</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="space-y-1.5">
            <label className="text-sm font-bold text-gray-700 ml-1">Nama Lengkap <span className="text-red-500">*</span></label>
            <input 
              type="text" 
              name="name"
              required
              value={formData.name}
              onChange={handleChange}
              placeholder="Contoh: Budi Santoso"
              className="w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition outline-none font-body text-gray-800"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-bold text-gray-700 ml-1">Alamat Email <span className="text-red-500">*</span></label>
            <input 
              type="email" 
              name="email"
              required
              value={formData.email}
              onChange={handleChange}
              placeholder="Contoh: budi@email.com"
              className="w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition outline-none font-body text-gray-800"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="space-y-1.5">
            <label className="text-sm font-bold text-gray-700 ml-1">Nomor Telepon / WA</label>
            <input 
              type="text" 
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder="Contoh: 08123456789"
              className="w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition outline-none font-body text-gray-800"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-bold text-gray-700 ml-1">Subjek <span className="text-red-500">*</span></label>
            <input 
              type="text" 
              name="subject"
              required
              value={formData.subject}
              onChange={handleChange}
              placeholder="Contoh: Pertanyaan PPDB"
              className="w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition outline-none font-body text-gray-800"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-bold text-gray-700 ml-1">Isi Pesan <span className="text-red-500">*</span></label>
          <textarea 
            name="message"
            required
            rows={5}
            value={formData.message}
            onChange={handleChange}
            placeholder="Tuliskan pesan Anda di sini..."
            className="w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition outline-none font-body text-gray-800 resize-y"
          ></textarea>
        </div>

        <button
          type="submit"
          disabled={status === 'loading'}
          className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-4 rounded-2xl font-body text-base font-bold bg-btn-primary text-white shadow-lg shadow-blue-900/20 transition-all duration-300 hover:bg-[#001d3d] hover:shadow-xl hover:-translate-y-0.5 disabled:opacity-70 disabled:cursor-not-allowed mt-2"
        >
          {status === 'loading' ? (
            <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Mengirim Pesan...</>
          ) : (
            <><Send className="w-5 h-5 mr-2" /> Kirim Pesan</>
          )}
        </button>
      </form>
    </div>
  );
}
