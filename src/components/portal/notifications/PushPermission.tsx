"use client";

import { useEffect, useState } from "react";
import { BellRing, X } from "lucide-react";
import { usePushSubscription } from "@/hooks/useNotifications";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { motion, AnimatePresence } from "framer-motion";

export function PushPermission() {
  const { isSubscribed, permission, subscribeToPush } = usePushSubscription();
  const [dismissed, setDismissed] = useState(false);

  // Hide if already subscribed, permanently denied, or dismissed by user
  if (isSubscribed || permission === "denied" || dismissed) {
    return null;
  }

  // Also only show on client
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="mb-6"
      >
        <Alert className="bg-primary/5 border-primary/20 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 rounded-full hover:bg-primary/10 text-muted-foreground"
              onClick={() => setDismissed(true)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <BellRing className="h-5 w-5 text-primary mt-0.5" />
          <AlertTitle className="text-primary font-semibold">Aktifkan Notifikasi Real-time</AlertTitle>
          <AlertDescription className="text-muted-foreground mt-1 text-sm flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
            <p>
              Dapatkan pemberitahuan langsung saat anak Anda menempelkan absen, serta informasi tagihan terbaru.
            </p>
            <Button 
              size="sm" 
              onClick={subscribeToPush}
              className="w-full sm:w-auto shadow-sm"
            >
              Aktifkan Sekarang
            </Button>
          </AlertDescription>
        </Alert>
      </motion.div>
    </AnimatePresence>
  );
}
