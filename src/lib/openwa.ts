export const OPENWA_URL = process.env.WA_GATEWAY_URL || 'http://localhost:2785';
export const OPENWA_SESSION_ID = process.env.WA_SESSION_ID || process.env.OPENWA_SESSION || '';
export const OPENWA_SESSION_NAME = process.env.WA_SESSION_NAME || 'test-mi';
export const OPENWA_API_KEY = process.env.WA_API_KEY || '';

/**
 * Resolve session identifier:
 * - Jika WA_SESSION_ID berisi UUID (36 karakter), langsung dipakai.
 * - Jika tidak, otomatis cari UUID berdasarkan nama session dari API.
 */
export async function resolveSessionId(): Promise<string> {
  // Jika sudah UUID lengkap (format: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx)
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (OPENWA_SESSION_ID && uuidRegex.test(OPENWA_SESSION_ID)) {
    return OPENWA_SESSION_ID;
  }

  // Jika bukan UUID atau kosong, ambil dari API berdasarkan nama
  const sessionName = OPENWA_SESSION_ID || OPENWA_SESSION_NAME;
  const res = await fetch(`${OPENWA_URL}/api/sessions`, {
    headers: { 'X-Api-Key': OPENWA_API_KEY }
  });

  if (!res.ok) throw new Error(`Gagal mengambil daftar session OpenWA: ${res.status}`);

  const data = await res.json();
  const sessions: Array<{ id: string; name: string; status: string }> = data?.value || data || [];

  const match = sessions.find(s => s.name === sessionName || s.id === sessionName);
  if (!match) throw new Error(`Session '${sessionName}' tidak ditemukan di OpenWA. Pastikan sudah connect.`);
  if (match.status !== 'ready') throw new Error(`Session '${match.name}' belum aktif (status: ${match.status}). Scan QR code terlebih dahulu di OpenWA dashboard.`);

  return match.id;
}

/**
 * Format nomor HP Indonesia menjadi format WhatsApp (628xxx@c.us)
 */
export function formatWAPhone(phone: string): string {
  if (!phone) return '';
  
  // Hapus karakter non-digit kecuali +
  let cleaned = phone.replace(/[^\d+]/g, '');
  
  // Ganti +62 jadi 62
  if (cleaned.startsWith('+62')) {
    cleaned = cleaned.substring(1);
  }
  // Ganti 08 jadi 628
  else if (cleaned.startsWith('0')) {
    cleaned = '62' + cleaned.substring(1);
  }
  
  if (!cleaned) return '';
  
  // Tambahkan @c.us jika belum ada
  return `${cleaned}@c.us`;
}

/**
 * Kirim pesan teks melalui OpenWA
 */
export async function sendWhatsAppMessage(phone: string, text: string) {
  const chatId = formatWAPhone(phone);
  
  if (!chatId) {
    throw new Error('Nomor HP tidak valid');
  }

  // Auto-resolve UUID session
  const sessionId = await resolveSessionId();

  const payload = {
    chatId: chatId,
    text: text
  };

  const send = (id: string) => fetch(`${OPENWA_URL}/api/sessions/${id}/messages/send-text`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Api-Key': OPENWA_API_KEY
    },
    body: JSON.stringify(payload)
  })

  try {
    let res = await send(sessionId)

    // Session dari env bisa basi (hosting menyimpan env lama): coba session lain yang sedang 'ready'.
    if (res.status === 400) {
      const errorText = await res.text()
      if (!/not active/i.test(errorText)) throw new Error(`OpenWA API Error: ${res.status} ${errorText}`)
      const list = await fetch(`${OPENWA_URL}/api/sessions`, { headers: { 'X-Api-Key': OPENWA_API_KEY } })
      const data = list.ok ? await list.json() : null
      const sessions: Array<{ id: string; name: string; status: string }> = data?.value || data || []
      const ready = sessions.filter((x) => x.status === 'ready' && x.id !== sessionId)
      const alt = ready.find((x) => x.name === OPENWA_SESSION_NAME) || ready[0]
      if (!alt) {
        throw new Error(`OpenWA: session ${sessionId} tidak aktif dan tidak ada session lain yang 'ready' (${sessions.map((x) => `${x.name}=${x.status}`).join(', ') || 'daftar session kosong'}). Scan QR di dashboard OpenWA.`)
      }
      res = await send(alt.id)
    }

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`OpenWA API Error: ${res.status} ${errorText}`);
    }

    return await res.json();
  } catch (error) {
    console.error('Failed to send WA message:', error);
    throw error;
  }
}

