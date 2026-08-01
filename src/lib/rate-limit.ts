// Simple in-memory rate limiter
// Catatan: Di lingkungan Serverless (Vercel), ini membatasi per-instance (cold start me-reset).
// Namun tetap cukup efektif menahan serangan brute-force beruntun.

type RateLimitRecord = {
  count: number;
  resetTime: number;
};

const rateLimitMap = new Map<string, RateLimitRecord>();

// Bersihkan cache yang expired setiap 1 menit
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [key, record] of rateLimitMap.entries()) {
      if (now > record.resetTime) {
        rateLimitMap.delete(key);
      }
    }
  }, 60000);
}

export function checkRateLimit(ip: string, limit: number, windowMs: number): { success: boolean; reset: number } {
  const now = Date.now();
  const record = rateLimitMap.get(ip);

  if (!record) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + windowMs });
    return { success: true, reset: now + windowMs };
  }

  if (now > record.resetTime) {
    record.count = 1;
    record.resetTime = now + windowMs;
    return { success: true, reset: record.resetTime };
  }

  if (record.count >= limit) {
    return { success: false, reset: record.resetTime };
  }

  record.count++;
  return { success: true, reset: record.resetTime };
}

export function getIp(request: Request): string {
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim();
  }
  // Fallback if no x-forwarded-for (e.g. localhost)
  return '127.0.0.1';
}
