import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET!);

// ─────────────────────────────────────────────────────────────────────────────
// Domain / Subdomain Config
// ─────────────────────────────────────────────────────────────────────────────

const BASE_DOMAIN    = 'miattaqwa15.sch.id';
const ADMIN_SUB      = 'smart';   // smart.miattaqwa15.sch.id
const PARENT_SUB     = 'parent';  // parent.miattaqwa15.sch.id
const ABSEN_SUB      = 'absen';   // absen.miattaqwa15.sch.id

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
  '/parent/login',
  '/parent/change-password',
];

/** API routes that are publicly accessible (no session check) */
const PUBLIC_API_PREFIXES: string[] = [
  '/api/auth/login',
  '/api/auth/logout',
  '/api/auth/parent-login',
  '/api/auth/parent-change-password',
  '/api/public',
  '/api/posts',
  '/api/galleries',
  '/api/banners',
  '/api/testimonials',
  '/api/staffs',         // public staff list for frontend
];

/** Admin portal pages — require valid admin_session */
const ADMIN_PREFIXES: string[] = [
  '/dashboard',
  '/students',
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
  '/api/finance',
  '/api/content',
  '/api/reports',
  '/api/users',
  '/api/profile',
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
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return { payload };
  } catch {
    return null;
  }
}

/** Returns 'admin', 'parent', or null based on the Host header */
function getSubdomain(req: NextRequest): 'admin' | 'parent' | 'absen' | null {
  const hostname = (req.headers.get('host') ?? '').split(':')[0];
  if (hostname === `${ADMIN_SUB}.${BASE_DOMAIN}` || hostname === `${ADMIN_SUB}.localhost`) return 'admin';
  if (hostname === `${PARENT_SUB}.${BASE_DOMAIN}` || hostname === `${PARENT_SUB}.localhost`) return 'parent';
  if (hostname === `${ABSEN_SUB}.${BASE_DOMAIN}` || hostname === `${ABSEN_SUB}.localhost`) return 'absen';
  return null;
}

// ─────────────────────────────────────────────────────────────────────────────
// Middleware
// ─────────────────────────────────────────────────────────────────────────────

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ── 1. Static assets & Next.js internals ─────────────────────────────────
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    pathname.startsWith('/logomi') ||
    /\.(ico|png|jpg|jpeg|svg|webp|gif|woff2?|ttf|otf|css|js|map)$/.test(pathname)
  ) {
    return NextResponse.next();
  }

  const subdomain = getSubdomain(request);

  // ══════════════════════════════════════════════════════════════════════════
  // ABSEN SUBDOMAIN — absen.miattaqwa15.sch.id
  // ══════════════════════════════════════════════════════════════════════════
  if (subdomain === 'absen') {
    if (pathname === '/') {
      return NextResponse.rewrite(new URL('/absen', request.url));
    }
    
    // Redirect /1a, /1b, dll ke /absen-siswa/[kelas]
    if (pathname.match(/^\/[1-6][a-d]$/i)) {
      return NextResponse.rewrite(new URL(`/absen-siswa${pathname.toLowerCase()}`, request.url));
    }

    // Allow public API and other routes (like /api/attendance/scan) to pass through
    return NextResponse.next();
  }

  // ══════════════════════════════════════════════════════════════════════════
  // ADMIN SUBDOMAIN — smart.miattaqwa15.sch.id
  // ══════════════════════════════════════════════════════════════════════════
  if (subdomain === 'admin') {
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
        res.cookies.delete('admin_session');
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
      res.cookies.delete('admin_session');
      return res;
    }
    const role = verified.payload.role as string;
    if (matchesAny(pathname, ['/users']) && role !== 'superadmin')
      return NextResponse.redirect(new URL('/dashboard?error=no_access', request.url));
    if (matchesAny(pathname, ['/finance']) && !['superadmin', 'kepsek'].includes(role))
      return NextResponse.redirect(new URL('/dashboard?error=no_access', request.url));
    return NextResponse.next();
  }

  // ══════════════════════════════════════════════════════════════════════════
  // PARENT SUBDOMAIN — parent.miattaqwa15.sch.id
  // ══════════════════════════════════════════════════════════════════════════
  if (subdomain === 'parent') {
    if (pathname === '/') {
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
        res.cookies.delete('parent_session');
        return res;
      }
      return NextResponse.next();
    }

    // All other parent pages — require parent_session
    const token = request.cookies.get('parent_session')?.value;
    if (!token) {
      const url = new URL('/parent/login', request.url);
      url.searchParams.set('from', pathname);
      return NextResponse.redirect(url);
    }
    const verified = await verifyJWT(token);
    if (!verified) {
      const url = new URL('/parent/login', request.url);
      url.searchParams.set('expired', '1');
      const res = NextResponse.redirect(url);
      res.cookies.delete('parent_session');
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
      response.cookies.delete('admin_session');
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
      response.cookies.delete('parent_session');
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
      response.cookies.delete('admin_session');
      return response;
    }

    // ── RBAC: Role-based route restriction ──────────────────────────────────
    const role = verified.payload.role as string;

    const SUPERADMIN_ONLY: string[] = ['/users'];
    const FINANCE_ONLY: string[] = ['/finance'];

    if (matchesAny(pathname, SUPERADMIN_ONLY) && role !== 'superadmin') {
      // Redirect to dashboard with access denied notice
      return NextResponse.redirect(new URL('/dashboard?error=no_access', request.url));
    }

    if (matchesAny(pathname, FINANCE_ONLY) && !['superadmin', 'kepsek'].includes(role)) {
      return NextResponse.redirect(new URL('/dashboard?error=no_access', request.url));
    }

    return NextResponse.next();
  }

  // ── 7. Parent portal pages ────────────────────────────────────────────────
  if (pathname.startsWith(PARENT_PREFIX)) {
    const token = request.cookies.get('parent_session')?.value;

    if (!token) {
      const loginUrl = new URL('/parent/login', request.url);
      loginUrl.searchParams.set('from', pathname);
      return NextResponse.redirect(loginUrl);
    }

    const verified = await verifyJWT(token);
    if (!verified) {
      const loginUrl = new URL('/parent/login', request.url);
      loginUrl.searchParams.set('expired', '1');
      const response = NextResponse.redirect(loginUrl);
      response.cookies.delete('parent_session');
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
     * Match everything EXCEPT:
     * - _next/static, _next/image  (Next.js internal)
     * - public static files with extensions
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
