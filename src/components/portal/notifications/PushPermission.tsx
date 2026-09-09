"use client";

import { useEffect, useState } from "react";
import { BellRing, X } from "lucide-react";
import { usePushSubscription } from "@/hooks/useNotifications";

export function PushPermission() {
  const { isSubscribed, permission, subscribeToPush } = usePushSubscription();
  const [dismissed, setDismissed] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted || isSubscribed || permission === "denied" || dismissed) {
    return null;
  }

  return (
    <div className="mb-6 bg-blue-50/80 border border-blue-200/80 rounded-2xl p-4 sm:p-5 relative overflow-hidden shadow-xs font-sans animate-in fade-in slide-in-from-top-2 duration-200">
      <button
        className="absolute top-3 right-3 p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-white/60 transition cursor-pointer"
        onClick={() => setDismissed(true)}
        aria-label="Tutup"
      >
        <X size={16} />
      </button>

      <div className="flex items-start gap-3.5 pr-8">
        <div className="w-10 h-10 bg-blue-600 text-white rounded-xl flex items-center justify-center shrink-0 shadow-xs">
          <BellRing size={20} />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-bold text-slate-900">Aktifkan Notifikasi Real-time</h4>
          <p className="text-xs text-slate-600 mt-1 leading-relaxed">
            Dapatkan pemberitahuan langsung saat anak Anda menempelkan absensi tap kartu atau info tagihan baru.
          </p>
          <div className="mt-3">
            <button
              onClick={subscribeToPush}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition cursor-pointer inline-flex items-center gap-1.5"
            >
              <span>Aktifkan Sekarang</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
