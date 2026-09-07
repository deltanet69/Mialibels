import { NextRequest } from 'next/server'

export const JWT_SECRET_STRING = process.env.JWT_SECRET || 'mi15-attaqwa-babelan-bekasi-super-secret-jwt-key-2026'

export function getJwtSecretKey(): Uint8Array {
  return new TextEncoder().encode(JWT_SECRET_STRING)
}

/**
 * Returns cookie configuration matching the domain environment.
 * If running on *.miattaqwa15.sch.id, sets domain to .miattaqwa15.sch.id
 * so session cookies are cleanly accessible across subdomains (smart, parent, absen, spmb).
 */
export function getAuthCookieOptions(req?: NextRequest, maxAgeSeconds = 7 * 24 * 60 * 60) {
  let domain: string | undefined = undefined
  let isSecure = process.env.NODE_ENV === 'production'

  if (req) {
    const host = req.headers.get('host') || req.nextUrl?.hostname || ''
    const cleanHost = host.split(':')[0].toLowerCase()
    if (cleanHost.endsWith('miattaqwa15.sch.id')) {
      domain = '.miattaqwa15.sch.id'
    }
    
    // Automatically disable secure flag if accessed via HTTP locally/IP in production
    const isLocalOrIp = cleanHost === 'localhost' || /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(cleanHost)
    const proto = req.headers.get('x-forwarded-proto') || req.nextUrl?.protocol || ''
    if (isLocalOrIp || proto === 'http' || proto === 'http:') {
      isSecure = false
    }
  }

  return {
    httpOnly: true,
    secure: isSecure,
    sameSite: 'lax' as const,
    maxAge: maxAgeSeconds,
    path: '/',
    ...(domain ? { domain } : {}),
  }
}

export function getLogoutCookieOptions(req?: NextRequest) {
  return getAuthCookieOptions(req, 0)
}
