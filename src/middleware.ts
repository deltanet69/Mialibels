import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { getJwtSecretKey, getLogoutCookieOptions } from '@/lib/jwt';

// ─────────────────────────────────────────────────────────────────────────────
// Domain / Subdomain Config
// ─────────────────────────────────────────────────────────────────────────────

const BASE_DOMAIN    = 'miattaqwa15.sch.id';
const ADMIN_SUB      = 'smart';   // smart.miattaqwa15.sch.id
const PARENT_SUB     = 'parent';  // parent.miattaqwa15.sch.id
const ABSEN_SUB      = 'absen';   // absen.miattaqwa15.sch.id
const SPMB_SUB       = 'spmb';    // spmb.miattaqwa15.sch.id
const PPDB_SUB       = 'ppdb';    // ppdb.miattaqwa15.sch.id (legacy alias)

// ─────────────────────────────────────────────────────────────────────────────
// Route Groups
// ─────────────────────────────────────────────────────────────────────────────

/** Routes that are fully public — no auth required */
const PUBLIC_PATHS: string[] = [
  '/',
  '/login',
  '/berita',
  '/galeri',
  '/tentang',
  '/prestasi',
  '/kontak',
  '/spmb',
  '/spmb-app',
  '/ppdb',
  '/ppdb-app',
  '/absen',
  '/absen-siswa',
  '/kelas1',
  '/parent/login',
  '/parent/change-password',
];

/** API routes that are publicly accessible (no session check) */
const PUBLIC_API_PREFIXES: string[] = [
  '/api/auth/login',
  '/api/auth/logout',
  '/api/auth/parent-login',
  '/api/auth/parent-change-password',
  '/api/attendance-siswa',
  '/api/attendance/scan',
  '/api/public',
  '/api/posts',
  '/api/galleries',
  '/api/banners',
  '/api/testimonials',
  '/api/staffs',         // public staff list for frontend
  '/api/spmb/settings',
  '/api/spmb/register',
  '/api/spmb/upload',
  '/api/spmb/status',
  '/api/spmb/documents',
  '/api/ppdb/settings',
  '/api/ppdb/register',
  '/api/ppdb/upload',
  '/api/ppdb/status',
  '/api/ppdb/documents',
];

/** Admin portal pages — require valid admin_session */
const ADMIN_PREFIXES: string[] = [
  '/dashboard',
  '/students',
  '/academic',
  '/classroom',
  '/guru',
  '/absensi-guru',
  '/attendance',
  '/finance',
  '/content',
  '/reports',
  '/users',
  '/profile',
];

/** API routes that require admin_session */
const ADMIN_API_PREFIXES: string[] = [
  '/api/students',
  '/api/classrooms',
  '/api/guru',
  '/api/attendance',
  '/api/dashboard',
  '/api/finance',
  '/api/spp',
  '/api/savings',
  '/api/content',
  '/api/reports',
  '/api/users',
  '/api/profile',
  '/api/schedules',
  '/api/logs',
  '/api/notifications',
  '/api/infos',
  '/api/spmb/admin',
  '/api/ppdb/admin',
];

/** Parent portal — requires valid parent_session */
const PARENT_PREFIX = '/parent/dashboard';

/** Parent API — requires valid parent_session */
const PARENT_API_PREFIX = '/api/parent';

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function matchesAny(pathname: string, prefixes: string[]): boolean {
  return prefixes.some((prefix) =>
    pathname === prefix || pathname.startsWith(prefix + '/') || pathname.startsWith(prefix + '?')
  );
}

function isPublicPath(pathname: string): boolean {
  // Exact match or starts with /berita/, /galeri/, etc.
  return PUBLIC_PATHS.some(
    (p) => pathname === p || pathname.startsWith(p + '/') || pathname.startsWith(p + '?')
  );
}

async function verifyJWT(token: string): Promise<{ payload: any } | null> {
  try {
    const { payload } = await jwtVerify(token, getJwtSecretKey());
    return { payload };
  } catch {
    return null;
  }
}

function clearSessionCookie(res: NextResponse, req: NextRequest, name: string) {
  const cookieOptions = getLogoutCookieOptions(req);
  res.cookies.set(name, '', cookieOptions);
  res.cookies.set(name, '', {
    httpOnly: true,
    secure: cookieOptions.secure,
    sameSite: 'lax',
    maxAge: 0,
    path: '/',
  });
}

function getSubdomain(req: NextRequest): 'admin' | 'parent' | 'absen' | 'spmb' | null {
  const forwardedHost = req.headers.get('x-forwarded-host') || '';
  const forwardedServer = req.headers.get('x-forwarded-server') || '';
  const hostHeader = req.headers.get('host') || '';
  const nextHostname = req.nextUrl.hostname || '';

  const hosts = [forwardedHost, forwardedServer, hostHeader, nextHostname];
  
  for (const h of hosts) {
    if (!h) continue;
    const hostname = h.split(',')[0].split(':')[0].toLowerCase().trim();
    
    if (hostname.startsWith('spmb.') || hostname.startsWith('ppdb.')) return 'spmb';
    if (hostname.startsWith('parent.')) return 'parent';
    if (hostname.startsWith('smart.') || hostname.startsWith('admin.')) return 'admin';
    if (hostname.startsWith('absen.')) return 'absen';
  }

  // Fallback check on combined raw strings (in case Proxy strips exact hostname but leaves it in referer/origin etc)
  const rawInfo = [
    ...hosts,
    req.headers.get('referer') || '',
    req.headers.get('origin') || ''
  ].join(' ').toLowerCase();

  // Make sure it matches subdomain and not just the main domain path
  if (rawInfo.includes('spmb.miattaqwa15') || rawInfo.includes('spmb.localhost')) return 'spmb';
  if (rawInfo.includes('parent.miattaqwa15') || rawInfo.includes('parent.localhost')) return 'parent';
  if (rawInfo.includes('smart.miattaqwa15') || rawInfo.includes('smart.localhost')) return 'admin';
  if (rawInfo.includes('absen.miattaqwa15') || rawInfo.includes('absen.localhost')) return 'absen';

  return null;
}

// ─────────────────────────────────────────────────────────────────────────────
// Proxy (formerly Middleware)
// ─────────────────────────────────────────────────────────────────────────────

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const cleanPath = pathname.replace(/\/+$/, '') || '/';

  // ── 1. Static assets & Next.js internals — ALWAYS allow ──────────────────
  if (
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/__nextjs') ||
    pathname.startsWith('/favicon') ||
    pathname.startsWith('/logomi') ||
    pathname.startsWith('/logosmart') ||
    pathname.startsWith('/kartu') ||
    pathname.startsWith('/public') ||
    /\.(ico|png|jpg|jpeg|svg|webp|gif|woff2?|ttf|otf|css|js|map|json|txt|xml|pdf)$/.test(pathname)
  ) {
    return NextResponse.next();
  }

  const subdomain = getSubdomain(request);

  // ══════════════════════════════════════════════════════════════════════════
  // SPMB SUBDOMAIN — spmb.miattaqwa15.sch.id
  // ══════════════════════════════════════════════════════════════════════════
  if (subdomain === 'spmb') {
    if (
      pathname === '/' ||
      pathname === '/spmb' ||
      pathname === '/ppdb'
    ) {
      return NextResponse.redirect(new URL('/spmb-app', request.url));
    }
    // Allow public API and static assets to pass through
    return NextResponse.next();
  }

  // ══════════════════════════════════════════════════════════════════════════
  // ABSEN SUBDOMAIN — absen.miattaqwa15.sch.id
  // ══════════════════════════════════════════════════════════════════════════
  if (subdomain === 'absen') {
    if (pathname === '/') {
      return NextResponse.rewrite(new URL('/absen', request.url));
    }
    
    // Redirect /1a, /1b, dll ke /absen-siswa/[kelas]
    if (cleanPath.match(/^\/[1-6][a-d]$/i)) {
      return NextResponse.rewrite(new URL(`/absen-siswa${cleanPath.toLowerCase()}`, request.url));
    }

    // Direct route /kelas1 ke /absen-siswa/kelas1
    if (cleanPath.toLowerCase() === '/kelas1') {
      return NextResponse.rewrite(new URL('/absen-siswa/kelas1', request.url));
    }

    // Allow public API and other routes (like /api/attendance/scan) to pass through
    return NextResponse.next();
  }

  // ── Global Rewrite for /1a.../6d and /kelas1 on main domain/localhost ────
  if (cleanPath.match(/^\/[1-6][a-d]$/i)) {
    return NextResponse.rewrite(new URL(`/absen-siswa${cleanPath.toLowerCase()}`, request.url));
  }
  if (cleanPath.toLowerCase() === '/kelas1') {
    return NextResponse.rewrite(new URL('/absen-siswa/kelas1', request.url));
  }

  // ══════════════════════════════════════════════════════════════════════════
  // ADMIN SUBDOMAIN — smart.miattaqwa15.sch.id
  // ══════════════════════════════════════════════════════════════════════════
  if (subdomain === 'admin') {
    // Always allow static/next internals (belt-and-suspenders)
    if (pathname.startsWith('/_next/') || /\.(ico|png|jpg|jpeg|svg|webp|gif|woff2?|ttf|otf|css|js|map)$/.test(pathname)) {
      return NextResponse.next();
    }

    if (pathname === '/') {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
    
    // Public: login page & all public API (auth login, logout, etc.)
    if (pathname === '/login') return NextResponse.next();
    if (matchesAny(pathname, PUBLIC_API_PREFIXES)) return NextResponse.next();

    // Admin API on subdomain — require admin_session
    if (matchesAny(pathname, ADMIN_API_PREFIXES)) {
      const token = request.cookies.get('admin_session')?.value;
      if (!token) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
      const verified = await verifyJWT(token);
      if (!verified) {
        const res = NextResponse.json({ error: 'Sesi tidak valid atau sudah kadaluarsa.' }, { status: 401 });
        clearSessionCookie(res, request, 'admin_session');
        return res;
      }
      return NextResponse.next();
    }

    // Admin pages on subdomain — require admin_session
    const token = request.cookies.get('admin_session')?.value;
    if (!token) {
      const url = new URL('/login', request.url);
      url.searchParams.set('from', pathname);
      return NextResponse.redirect(url);
    }
    const verified = await verifyJWT(token);
    if (!verified) {
      const url = new URL('/login', request.url);
      url.searchParams.set('expired', '1');
      const res = NextResponse.redirect(url);
      clearSessionCookie(res, request, 'admin_session');
      return res;
    }
    const role = verified.payload.role as string;
    if (matchesAny(pathname, ['/users']) && !['superadmin', 'kepsek', 'staff_operator'].includes(role))
      return NextResponse.redirect(new URL('/dashboard?error=no_access', request.url));
    if (matchesAny(pathname, ['/finance']) && !['superadmin', 'kepsek', 'administrasi', 'bendahara'].includes(role))
      return NextResponse.redirect(new URL('/dashboard?error=no_access', request.url));
    return NextResponse.next();
  }

  // ══════════════════════════════════════════════════════════════════════════
  // PARENT SUBDOMAIN — parent.miattaqwa15.sch.id
  // ══════════════════════════════════════════════════════════════════════════
  if (subdomain === 'parent') {
    // Always allow static/next internals (belt-and-suspenders)
    if (pathname.startsWith('/_next/') || /\.(ico|png|jpg|jpeg|svg|webp|gif|woff2?|ttf|otf|css|js|map)$/.test(pathname)) {
      return NextResponse.next();
    }

    if (pathname === '/' || pathname === '/parent') {
      const token = request.cookies.get('parent_session')?.value;
      if (!token) return NextResponse.redirect(new URL('/parent/login', request.url));
      return NextResponse.redirect(new URL('/parent/dashboard', request.url));
    }

    if (pathname === '/login') {
      return NextResponse.redirect(new URL('/parent/login', request.url));
    }

    if (pathname === '/dashboard') {
      return NextResponse.redirect(new URL('/parent/dashboard', request.url));
    }

    // Public: login page, change-password & all public API
    if (
      pathname === '/parent/login' ||
      pathname === '/parent/change-password'
    ) return NextResponse.next();
    if (matchesAny(pathname, PUBLIC_API_PREFIXES)) return NextResponse.next();

    // Parent API on subdomain — require parent_session
    if (pathname.startsWith(PARENT_API_PREFIX)) {
      const token = request.cookies.get('parent_session')?.value;
      if (!token) return NextResponse.json({ error: 'Unauthorized. Sesi orang tua tidak ditemukan.' }, { status: 401 });
      const verified = await verifyJWT(token);
      if (!verified) {
        const res = NextResponse.json({ error: 'Sesi tidak valid atau sudah kadaluarsa.' }, { status: 401 });
        clearSessionCookie(res, request, 'parent_session');
        return res;
      }
      return NextResponse.next();
    }

    // All other parent pages — require parent_session
    const token = request.cookies.get('parent_session')?.value;
    if (!token) {
      return NextResponse.redirect(new URL('/parent/login', request.url));
    }
    const verified = await verifyJWT(token);
    if (!verified) {
      const url = new URL('/parent/login', request.url);
      url.searchParams.set('expired', '1');
      const res = NextResponse.redirect(url);
      clearSessionCookie(res, request, 'parent_session');
      return res;
    }
    return NextResponse.next();
  }

  // ── 2. Public pages (main domain / localhost) ─────────────────────────────
  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  // ── 3. Public API prefixes ────────────────────────────────────────────────
  if (matchesAny(pathname, PUBLIC_API_PREFIXES)) {
    return NextResponse.next();
  }

  // ── 4. Admin API routes ───────────────────────────────────────────────────
  if (matchesAny(pathname, ADMIN_API_PREFIXES)) {
    const token = request.cookies.get('admin_session')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized. Sesi tidak ditemukan.' }, { status: 401 });
    }
    const verified = await verifyJWT(token);
    if (!verified) {
      const response = NextResponse.json({ error: 'Sesi tidak valid atau sudah kadaluarsa.' }, { status: 401 });
      clearSessionCookie(response, request, 'admin_session');
      return response;
    }
    return NextResponse.next();
  }

  // ── 5. Parent API routes ──────────────────────────────────────────────────
  if (pathname.startsWith(PARENT_API_PREFIX)) {
    const token = request.cookies.get('parent_session')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized. Sesi orang tua tidak ditemukan.' }, { status: 401 });
    }
    const verified = await verifyJWT(token);
    if (!verified) {
      const response = NextResponse.json({ error: 'Sesi tidak valid atau sudah kadaluarsa.' }, { status: 401 });
      clearSessionCookie(response, request, 'parent_session');
      return response;
    }
    return NextResponse.next();
  }

  // ── 6. Admin portal pages ─────────────────────────────────────────────────
  if (matchesAny(pathname, ADMIN_PREFIXES)) {
    const token = request.cookies.get('admin_session')?.value;

    if (!token) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('from', pathname);
      return NextResponse.redirect(loginUrl);
    }

    const verified = await verifyJWT(token);
    if (!verified) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('expired', '1');
      const response = NextResponse.redirect(loginUrl);
      clearSessionCookie(response, request, 'admin_session');
      return response;
    }

    // ── RBAC: Role-based route restriction ──────────────────────────────────
    const role = verified.payload.role as string;

    const SUPERADMIN_ONLY: string[] = ['/users'];
    const FINANCE_ONLY: string[] = ['/finance'];
    const USERS_ALLOWED: string[] = ['superadmin', 'kepsek', 'staff_operator'];

    if (matchesAny(pathname, SUPERADMIN_ONLY) && !USERS_ALLOWED.includes(role)) {
      return NextResponse.redirect(new URL('/dashboard?error=no_access', request.url));
    }

    if (matchesAny(pathname, FINANCE_ONLY) && !['superadmin', 'kepsek', 'administrasi', 'bendahara'].includes(role)) {
      return NextResponse.redirect(new URL('/dashboard?error=no_access', request.url));
    }

    return NextResponse.next();
  }

  // ── 7. Parent portal pages ────────────────────────────────────────────────
  if (pathname === '/parent' || pathname === '/parent/') {
    const token = request.cookies.get('parent_session')?.value;
    if (!token) {
      return NextResponse.redirect(new URL('/parent/login', request.url));
    }
    return NextResponse.redirect(new URL('/parent/dashboard', request.url));
  }

  if (pathname.startsWith(PARENT_PREFIX)) {

    const token = request.cookies.get('parent_session')?.value;

    if (!token) {
      return NextResponse.redirect(new URL('/parent/login', request.url));
    }

    const verified = await verifyJWT(token);
    if (!verified) {
      const loginUrl = new URL('/parent/login', request.url);
      loginUrl.searchParams.set('expired', '1');
      const response = NextResponse.redirect(loginUrl);
      clearSessionCookie(response, request, 'parent_session');
      return response;
    }

    return NextResponse.next();
  }

  // ── 8. Default: allow through ─────────────────────────────────────────────
  return NextResponse.next();
}

// ─────────────────────────────────────────────────────────────────────────────
// Matcher — only intercept relevant paths (skip static files)
// ─────────────────────────────────────────────────────────────────────────────

export const config = {
  matcher: [
    /*
     * Run middleware on EVERYTHING except:
     * - _next/static  (JS/CSS chunks — must NEVER be intercepted)
     * - _next/image   (image optimization)
     * - _next/webpack-hmr (HMR in dev)
     * - favicon.ico and other static file extensions
     */
    '/((?!_next\/static|_next\/image|_next\/webpack-hmr|favicon\.ico|sitemap\.xml|robots\.txt).*)',
  ],
};
