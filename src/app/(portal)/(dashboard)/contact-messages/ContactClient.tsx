'use client';

import React, { useState } from 'react';
import { Mail, Phone, Calendar, User, Search } from 'lucide-react';
import type { ContactMessage } from './page';

export default function ContactClient({ initialMessages }: { initialMessages: ContactMessage[] }) {
  const [messages] = useState<ContactMessage[]>(initialMessages);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMessage, setSelectedMessage] = useState<ContactMessage | null>(null);

  const formatWhatsApp = (phone: string) => {
    let cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.startsWith('0')) {
      cleanPhone = '62' + cleanPhone.substring(1);
    }
    return 'https://wa.me/' + cleanPhone;
  };

  const filteredMessages = messages.filter(m =>
    m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getButtonClass = (id: string) => {
    const base = 'w-full text-left p-4 rounded-xl transition-all duration-200 border ';
    return base + (selectedMessage?.id === id
      ? 'bg-blue-50 border-blue-100'
      : 'hover:bg-gray-50 border-transparent');
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-12rem)] font-body">
      {/* Sidebar List */}
      <div className="w-full lg:w-1/4 bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden flex flex-col h-full">
        <div className="p-4 border-b border-gray-100 bg-gray-50/50">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Cari nama, email, atau subjek..."
              className="w-full pl-9 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="overflow-y-auto flex-1 p-2 space-y-1">
          {filteredMessages.length === 0 ? (
            <div className="text-center p-8 text-gray-500 text-sm">
              Tidak ada pesan ditemukan.
            </div>
          ) : (
            filteredMessages.map((msg) => (
              <button
                key={msg.id}
                onClick={() => setSelectedMessage(msg)}
                className={getButtonClass(msg.id)}
              >
                <div className="flex justify-between items-start mb-1">
                  <span className="font-semibold text-gray-900 truncate pr-2 text-sm">{msg.name}</span>
                  <span className="text-xs text-gray-400 whitespace-nowrap mt-0.5">
                    {new Date(msg.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                  </span>
                </div>
                <div className="text-sm font-medium text-gray-700 truncate mb-1">{msg.subject}</div>
                <div className="text-xs text-gray-500 truncate">{msg.message}</div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Detail View */}
      <div className="w-full lg:w-2/3 bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden flex flex-col h-full">
        {selectedMessage ? (
          <div className="flex flex-col h-full">
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-xl font-bold text-gray-900 mb-4">{selectedMessage.subject}</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                <div className="flex items-center gap-3 text-sm">
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 shrink-0">
                    <User className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{selectedMessage.name}</p>
                    <p className="text-gray-500 text-xs">Pengirim</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-sm">
                  <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
                    <Mail className="w-4 h-4" />
                  </div>
                  <div>
                    <a href={'mailto:' + selectedMessage.email} className="font-medium text-blue-600 hover:underline">
                      {selectedMessage.email}
                    </a>
                    <p className="text-gray-500 text-xs">Email</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-sm">
                  <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 shrink-0">
                    <Phone className="w-4 h-4" />
                  </div>
                  <div>
                    {selectedMessage.phone ? (
                      <a
                        href={formatWhatsApp(selectedMessage.phone)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium text-blue-600 hover:underline flex items-center gap-1"
                      >
                        {selectedMessage.phone}
                        <span className="text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full font-semibold">WA</span>
                      </a>
                    ) : (
                      <span className="font-medium text-gray-400">-</span>
                    )}
                    <p className="text-gray-500 text-xs">No. Telepon / WA</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-sm">
                  <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 shrink-0">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">
                      {new Date(selectedMessage.created_at).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}
                    </p>
                    <p className="text-gray-500 text-xs">Waktu Kirim</p>
                  </div>
                </div>

              </div>
            </div>

            <div className="p-6 flex-1 overflow-y-auto bg-gray-50/30">
              <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
                <p className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wider">Isi Pesan</p>
                <div className="text-gray-700 leading-relaxed whitespace-pre-wrap text-[15px]">
                  {selectedMessage.message}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-gray-400 p-8 text-center">
            <Mail className="w-16 h-16 mb-4 text-gray-200" />
            <p className="text-lg font-medium text-gray-500">Pilih Pesan</p>
            <p className="text-sm mt-1">Pilih salah satu pesan di samping untuk melihat detailnya.</p>
          </div>
        )}
      </div>
    </div>
  );
}
