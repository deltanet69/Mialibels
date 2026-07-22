'use client'

import React from 'react'
import { Printer } from 'lucide-react'

export default function PrintButton() {
  return (
    <button 
      onClick={() => window.print()} 
      className="print:hidden bg-blue-600 text-white px-5 py-2.5 rounded-lg shadow hover:bg-blue-700 font-semibold flex items-center gap-2 mx-auto"
    >
      <Printer size={18} /> Cetak Struk
    </button>
  )
}
