"use client";

import React, { useState } from "react";
import DashboardTab from "@/components/finance/spp/DashboardTab";
import ManageTab from "@/components/finance/spp/ManageTab";
import { LayoutDashboard, FileSpreadsheet } from "lucide-react";

export default function SPPPage() {
  const [activeMenu, setActiveMenu] = useState<"DASHBOARD" | "MANAGE">("DASHBOARD");

  return (
    <div className="bg-slate-50 min-h-screen p-6">
      <div className="w-full space-y-6">
        
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Sistem Pembayaran Infaq Sekolah</h1>
          <p className="text-slate-500 mt-1 text-sm">Kelola tagihan, pantau pembayaran, dan rekapitulasi bulanan Infaq siswa.</p>
        </div>

        {/* Main Navigation Tabs */}
        <div className="flex border-b border-slate-200 overflow-x-auto">
          <button
            onClick={() => setActiveMenu("DASHBOARD")}
            className={`flex items-center gap-2 px-6 py-4 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap ${
              activeMenu === "DASHBOARD" 
                ? "border-blue-600 text-blue-600" 
                : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
            }`}
          >
            <LayoutDashboard className="w-4 h-4" /> Ringkasan Dashboard
          </button>
          <button
            onClick={() => setActiveMenu("MANAGE")}
            className={`flex items-center gap-2 px-6 py-4 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap ${
              activeMenu === "MANAGE" 
                ? "border-blue-600 text-blue-600" 
                : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
            }`}
          >
            <FileSpreadsheet className="w-4 h-4" /> Data Tagihan Siswa
          </button>
        </div>

        {/* Tab Contents */}
        <div className="pt-2">
          {activeMenu === "DASHBOARD" && <DashboardTab />}
          {activeMenu === "MANAGE" && <ManageTab />}
        </div>
        
      </div>
    </div>
  );
}

