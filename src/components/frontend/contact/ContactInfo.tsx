'use client';

import React from 'react';
import { MapPin, Phone, MessageCircle, Mail, Clock, ArrowUpRight } from 'lucide-react';

const CONTACT_DETAILS = [
  {
    title: 'Telepon Kantor',
    detail: '(021) 8923-XXXX',
    icon: Phone,
    color: 'text-teal-700',
    bgColor: 'bg-teal-50 border-teal-100',
    link: 'tel:0218923XXXX'
  },
  {
    title: 'WhatsApp Official',
    detail: '+62 812-XXXX-XXXX',
    icon: MessageCircle,
    color: 'text-emerald-700',
    bgColor: 'bg-emerald-50 border-emerald-100',
    link: 'https://wa.me/62812XXXXXXXX'
  },
  {
    title: 'Surat Elektronik (Email)',
    detail: 'info@miattaqwa15.sch.id',
    icon: Mail,
    color: 'text-indigo-700',
    bgColor: 'bg-indigo-50 border-indigo-100',
    link: 'mailto:info@miattaqwa15.sch.id'
  }
];

export default function ContactInfo() {
  return (
    <div className="flex flex-col gap-6">
      {/* Alamat Section */}
      <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-gray-100/90 flex items-start gap-5 hover:shadow-md transition-all">
        <div className="w-13 h-13 rounded-2xl bg-teal-50 border border-teal-100 flex items-center justify-center shrink-0 shadow-2xs">
          <MapPin className="w-6 h-6 text-primary" />
        </div>
        <div>
          <h3 className="font-headline font-bold text-xl text-secondary mb-2">Lokasi Madrasah</h3>
          <p className="font-body text-gray-500 leading-relaxed text-sm">
            <strong className="text-secondary">MI Attaqwa 15 Babelan</strong><br />
            Jl. Raya Ps. Babelan No.1, RT.05/RW.01,<br />
            Babelan Kota, Kec. Babelan,<br />
            Kabupaten Bekasi, Jawa Barat 17610
          </p>
        </div>
      </div>

      {/* Kontak Section */}
      <div className="flex flex-col gap-3.5">
        {CONTACT_DETAILS.map((contact, idx) => {
          const Icon = contact.icon;
          return (
            <a 
              key={idx} 
              href={contact.link}
              target={contact.title.includes('WhatsApp') ? '_blank' : '_self'}
              rel="noopener noreferrer"
              className="btn-tactile bg-white rounded-2xl p-5 shadow-2xs border border-gray-100/90 flex items-center justify-between hover:border-teal-200 hover:shadow-sm transition-all group"
            >
              <div className="flex items-center gap-4">
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 border ${contact.bgColor} group-hover:scale-105 transition-transform shadow-2xs`}>
                  <Icon className={`w-5 h-5 ${contact.color}`} />
                </div>
                <div>
                  <p className="font-body text-xs font-bold text-gray-400 uppercase tracking-wider mb-0.5">{contact.title}</p>
                  <p className="font-headline font-semibold text-secondary text-sm sm:text-base">{contact.detail}</p>
                </div>
              </div>
              <ArrowUpRight className="w-4 h-4 text-gray-300 group-hover:text-primary transition-colors" />
            </a>
          );
        })}
      </div>

    </div>
  );
}
