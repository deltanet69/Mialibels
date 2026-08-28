'use client';

import React, { useState } from 'react';
import { Send, CheckCircle2, AlertCircle, Loader2, Sparkles } from 'lucide-react';

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
    <div className="bg-white rounded-[2.5rem] p-8 md:p-10 shadow-xl shadow-slate-900/5 border border-gray-100">
      <div className="mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-50 border border-teal-100 text-primary-dark font-body text-xs font-bold uppercase tracking-wider mb-2.5">
          <Sparkles className="w-3 h-3 text-accent" />
          <span>Formulir Pesan</span>
        </div>
        <h3 className="font-headline font-black text-2xl text-secondary">
          Kirim Pesan ke Madrasah
        </h3>
        <p className="font-body text-gray-500 text-sm mt-1">
          Silakan isi formulir di bawah ini, tim kami akan merespons pesan Anda secepatnya.
        </p>
      </div>

      {status === 'success' && (
        <div className="mb-6 p-4 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-start gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          <div>
            <h4 className="font-headline font-bold text-sm text-emerald-800">Pesan Berhasil Terkirim!</h4>
            <p className="font-body text-xs text-emerald-700 mt-0.5">Terima kasih, pesan Anda telah kami terima. Cek email Anda untuk konfirmasi otomatis.</p>
          </div>
        </div>
      )}

      {status === 'error' && (
        <div className="mb-6 p-4 rounded-2xl bg-red-50 border border-red-100 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
          <div>
            <h4 className="font-headline font-bold text-sm text-red-800">Gagal Mengirim Pesan</h4>
            <p className="font-body text-xs text-red-600 mt-0.5">{errorMessage}</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-600 uppercase tracking-wider ml-1">Nama Lengkap <span className="text-red-500">*</span></label>
            <input 
              type="text" 
              name="name"
              required
              value={formData.name}
              onChange={handleChange}
              placeholder="Nama Anda"
              className="w-full px-4 py-3.5 bg-slate-50/80 border border-gray-200/90 rounded-2xl focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/10 transition outline-none font-body text-gray-800 text-sm"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-600 uppercase tracking-wider ml-1">Alamat Email <span className="text-red-500">*</span></label>
            <input 
              type="email" 
              name="email"
              required
              value={formData.email}
              onChange={handleChange}
              placeholder="email@domain.com"
              className="w-full px-4 py-3.5 bg-slate-50/80 border border-gray-200/90 rounded-2xl focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/10 transition outline-none font-body text-gray-800 text-sm"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-600 uppercase tracking-wider ml-1">Nomor WhatsApp / Telp</label>
            <input 
              type="text" 
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder="08123456789"
              className="w-full px-4 py-3.5 bg-slate-50/80 border border-gray-200/90 rounded-2xl focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/10 transition outline-none font-body text-gray-800 text-sm"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-600 uppercase tracking-wider ml-1">Subjek / Topik <span className="text-red-500">*</span></label>
            <input 
              type="text" 
              name="subject"
              required
              value={formData.subject}
              onChange={handleChange}
              placeholder="Contoh: Informasi SPMB / Biaya"
              className="w-full px-4 py-3.5 bg-slate-50/80 border border-gray-200/90 rounded-2xl focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/10 transition outline-none font-body text-gray-800 text-sm"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-bold text-gray-600 uppercase tracking-wider ml-1">Isi Pesan <span className="text-red-500">*</span></label>
          <textarea 
            name="message"
            required
            rows={4}
            value={formData.message}
            onChange={handleChange}
            placeholder="Tuliskan pertanyaan atau pesan Anda secara detail..."
            className="w-full px-4 py-3.5 bg-slate-50/80 border border-gray-200/90 rounded-2xl focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/10 transition outline-none font-body text-gray-800 text-sm resize-y"
          ></textarea>
        </div>

        <button
          type="submit"
          disabled={status === 'loading'}
          className="btn-tactile w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 rounded-full font-body text-sm font-bold bg-btn-secondary text-white shadow-xl shadow-orange-950/20 hover:shadow-2xl hover:brightness-110 disabled:opacity-60 disabled:cursor-not-allowed mt-2 transition-all"
        >
          {status === 'loading' ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> <span>Mengirim Pesan...</span></>
          ) : (
            <><Send className="w-4 h-4" /> <span>Kirim Pesan Sekarang</span></>
          )}
        </button>
      </form>
    </div>
  );
}
