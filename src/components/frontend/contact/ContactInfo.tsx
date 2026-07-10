'use client';

import React from 'react';
import { MapPin, Phone, MessageCircle, Mail, Clock } from 'lucide-react';

const CONTACT_DETAILS = [
  {
    title: 'Telepon',
    detail: '(021) 8XXX-XXXX',
    icon: Phone,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    link: 'tel:0218XXXXXXX'
  },
  {
    title: 'WhatsApp',
    detail: '+62 8XX-XXXX-XXXX',
    icon: MessageCircle,
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-50',
    link: 'https://wa.me/628XXXXXXXXXX'
  },
  {
    title: 'Email',
    detail: 'info@miattaqwa15.sch.id',
    icon: Mail,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
    link: 'mailto:info@miattaqwa15.sch.id'
  }
];

export default function ContactInfo() {
  return (
    <div className="flex flex-col gap-8">
      {/* Alamat Section */}
      <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 flex items-start gap-5 hover:shadow-md transition-shadow">
        <div className="w-14 h-14 rounded-2xl bg-red-50 flex items-center justify-center shrink-0">
          <MapPin className="w-7 h-7 text-red-500" />
        </div>
        <div>
          <h3 className="font-headline font-bold text-xl text-secondary mb-3">Alamat Lengkap</h3>
          <p className="font-body text-gray-600 leading-relaxed">
            <strong>MI Attaqwa 15 Babelan Bekasi</strong><br />
            Jl. Raya Pasar Babelan RT.05/RW.01<br />
            Kec. Babelan, Kab. Bekasi<br />
            Jawa Barat - Indonesia
          </p>
        </div>
      </div>

      {/* Kontak Section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {CONTACT_DETAILS.map((contact, idx) => {
          const Icon = contact.icon;
          return (
            <a 
              key={idx} 
              href={contact.link}
              target={contact.title === 'WhatsApp' ? '_blank' : '_self'}
              rel="noopener noreferrer"
              className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex items-center gap-4 hover:shadow-md hover:border-blue-200 transition-all group"
            >
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${contact.bgColor} group-hover:scale-110 transition-transform`}>
                <Icon className={`w-6 h-6 ${contact.color}`} />
              </div>
              <div>
                <p className="font-body text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">{contact.title}</p>
                <p className="font-headline font-semibold text-secondary text-sm lg:text-base">{contact.detail}</p>
              </div>
            </a>
          );
        })}
      </div>

      {/* Jam Kerja TU */}
      <div className="bg-[#EFF3FB] rounded-3xl p-8 border border-blue-50 flex items-center gap-5">
        <div className="w-14 h-14 rounded-2xl bg-white flex items-center justify-center shrink-0 shadow-sm">
          <Clock className="w-7 h-7 text-primary" />
        </div>
        <div>
          <h3 className="font-headline font-bold text-lg text-secondary mb-1">Jam Kerja Tata Usaha (TU)</h3>
          <p className="font-body text-gray-600 font-medium">Senin - Jumat | 08.00 - 14.00 WIB</p>
        </div>
      </div>
    </div>
  );
}
