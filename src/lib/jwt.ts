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

  if (req) {
    const host = req.headers.get('host') || req.nextUrl?.hostname || ''
    const cleanHost = host.split(':')[0].toLowerCase()
    if (cleanHost.endsWith('miattaqwa15.sch.id')) {
      domain = '.miattaqwa15.sch.id'
    }
  }

  const isProduction = process.env.NODE_ENV === 'production'

  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax' as const,
    maxAge: maxAgeSeconds,
    path: '/',
    ...(domain ? { domain } : {}),
  }
}

export function getLogoutCookieOptions(req?: NextRequest) {
  return getAuthCookieOptions(req, 0)
}
