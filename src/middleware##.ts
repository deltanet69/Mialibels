import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET!);

// ─────────────────────────────────────────────────────────────────────────────
// Domain config
// ─────────────────────────────────────────────────────────────────────────────

const BASE_DOMAIN = 'miattaqwa15.sch.id';        // canonical base domain
const ADMIN_SUBDOMAIN = 'smart';                  // smart.miattaqwa15.sch.id
const PARENT_SUBDOMAIN = 'parent';               // parent.miattaqwa15.sch.id

// ─────────────────────────────────────────────────────────────────────────────
// Route groups (used when NOT on a subdomain, i.e. main site / localhost)
// ─────────────────────────────────────────────────────────────────────────────

/** Public pages on main site */
const PUBLIC_PATHS: string[] = [
  '/',
  '/login',
  '/news',
  '/galeri',
  '/tentang',
  '/prestasi',
  '/kontak',
  '/parent/login',
  '/parent/change-password',
];

/** Publicly accessible API prefixes */
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
  '/api/staffs',
];

/** Admin portal pages — require admin_session */
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

/** Admin API routes — require admin_session */
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

/** Parent portal pages */
const PARENT_PREFIX = '/parent/dashboard';

/** Parent API routes */
const PARENT_API_PREFIX = '/api/parent';

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function matchesAny(pathname: string, prefixes: string[]): boolean {
  return prefixes.some(
    (prefix) =>
      pathname === prefix ||
      pathname.startsWith(prefix + '/') ||
      pathname.startsWith(prefix + '?')
  );
}

function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some(
    (p) =>
      pathname === p ||
      pathname.startsWith(p + '/') ||
      pathname.startsWith(p + '?')
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

/** Detect which subdomain is being used (returns 'admin', 'parent', or null) */
function getSubdomain(req: NextRequest): 'admin' | 'parent' | null {
  const host = req.headers.get('host') ?? '';

  // Remove port if present (e.g. localhost:3000)
  const hostname = host.split(':')[0];

  if (
    hostname === `${ADMIN_SUBDOMAIN}.${BASE_DOMAIN}` ||
    hostname === `${ADMIN_SUBDOMAIN}.localhost`
  ) {
    return 'admin';
  }

  if (
    hostname === `${PARENT_SUBDOMAIN}.${BASE_DOMAIN}` ||
    hostname === `${PARENT_SUBDOMAIN}.localhost`
  ) {
    return 'parent';
  }

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
    /\.(ico|png|jpg|jpeg|svg|webp|gif|woff2?|ttf|otf|css|js|map)$/.test(pathname)
  ) {
    return NextResponse.next();
  }

  const subdomain = getSubdomain(request);

  // ══════════════════════════════════════════════════════════════════════════
  // ADMIN SUBDOMAIN — smart.miattaqwa15.sch.id
  // ══════════════════════════════════════════════════════════════════════════
  if (subdomain === 'admin') {
    // Public login page on admin subdomain
    if (pathname === '/login') return NextResponse.next();

    // Admin API
    if (matchesAny(pathname, ADMIN_API_PREFIXES)) {
      const token = request.cookies.get('admin_session')?.value;
      if (!token) {
        return NextResponse.json(
          { error: 'Unauthorized. Sesi tidak ditemukan.' },
          { status: 401 }
        );
      }
      const verified = await verifyJWT(token);
      if (!verified) {
        const res = NextResponse.json(
          { error: 'Sesi tidak valid atau sudah kadaluarsa.' },
          { status: 401 }
        );
        res.cookies.delete('admin_session');
        return res;
      }
      return NextResponse.next();
    }

    // Admin pages — require valid admin_session
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
      const res = NextResponse.redirect(loginUrl);
      res.cookies.delete('admin_session');
      return res;
    }

    // RBAC role checks
    const role = verified.payload.role as string;
    if (matchesAny(pathname, ['/users']) && role !== 'superadmin') {
      return NextResponse.redirect(new URL('/dashboard?error=no_access', request.url));
    }
    if (matchesAny(pathname, ['/finance']) && !['superadmin', 'kepsek'].includes(role)) {
      return NextResponse.redirect(new URL('/dashboard?error=no_access', request.url));
    }

    return NextResponse.next();
  }

  // ══════════════════════════════════════════════════════════════════════════
  // PARENT SUBDOMAIN — parent.miattaqwa15.sch.id
  // ══════════════════════════════════════════════════════════════════════════
  if (subdomain === 'parent') {
    // Public login pages for parent
    if (
      pathname === '/parent/login' ||
      pathname === '/parent/change-password' ||
      pathname === '/login'
    ) {
      return NextResponse.next();
    }

    // Parent API routes
    if (pathname.startsWith(PARENT_API_PREFIX)) {
      const token = request.cookies.get('parent_session')?.value;
      if (!token) {
        return NextResponse.json(
          { error: 'Unauthorized. Sesi orang tua tidak ditemukan.' },
          { status: 401 }
        );
      }
      const verified = await verifyJWT(token);
      if (!verified) {
        const res = NextResponse.json(
          { error: 'Sesi tidak valid atau sudah kadaluarsa.' },
          { status: 401 }
        );
        res.cookies.delete('parent_session');
        return res;
      }
      return NextResponse.next();
    }

    // Parent pages — require valid parent_session
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
      const res = NextResponse.redirect(loginUrl);
      res.cookies.delete('parent_session');
      return res;
    }

    return NextResponse.next();
  }

  // ══════════════════════════════════════════════════════════════════════════
  // MAIN SITE — miattaqwa15.sch.id or localhost
  // ══════════════════════════════════════════════════════════════════════════

  // Public pages
  if (isPublicPath(pathname)) return NextResponse.next();

  // Public API
  if (matchesAny(pathname, PUBLIC_API_PREFIXES)) return NextResponse.next();

  // Admin API (accessible from main domain too)
  if (matchesAny(pathname, ADMIN_API_PREFIXES)) {
    const token = request.cookies.get('admin_session')?.value;
    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized. Sesi tidak ditemukan.' },
        { status: 401 }
      );
    }
    const verified = await verifyJWT(token);
    if (!verified) {
      const res = NextResponse.json(
        { error: 'Sesi tidak valid atau sudah kadaluarsa.' },
        { status: 401 }
      );
      res.cookies.delete('admin_session');
      return res;
    }
    return NextResponse.next();
  }

  // Parent API
  if (pathname.startsWith(PARENT_API_PREFIX)) {
    const token = request.cookies.get('parent_session')?.value;
    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized. Sesi orang tua tidak ditemukan.' },
        { status: 401 }
      );
    }
    const verified = await verifyJWT(token);
    if (!verified) {
      const res = NextResponse.json(
        { error: 'Sesi tidak valid atau sudah kadaluarsa.' },
        { status: 401 }
      );
      res.cookies.delete('parent_session');
      return res;
    }
    return NextResponse.next();
  }

  // Admin pages
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
      const res = NextResponse.redirect(loginUrl);
      res.cookies.delete('admin_session');
      return res;
    }

    const role = verified.payload.role as string;
    if (matchesAny(pathname, ['/users']) && role !== 'superadmin') {
      return NextResponse.redirect(new URL('/dashboard?error=no_access', request.url));
    }
    if (matchesAny(pathname, ['/finance']) && !['superadmin', 'kepsek'].includes(role)) {
      return NextResponse.redirect(new URL('/dashboard?error=no_access', request.url));
    }

    return NextResponse.next();
  }

  // Parent pages
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
      const res = NextResponse.redirect(loginUrl);
      res.cookies.delete('parent_session');
      return res;
    }
    return NextResponse.next();
  }

  // Default: allow through
  return NextResponse.next();
}

// ─────────────────────────────────────────────────────────────────────────────
// Matcher
// ─────────────────────────────────────────────────────────────────────────────

export const config = {
  matcher: [
    /*
     * Match everything EXCEPT:
     * - _next/static, _next/image (Next.js internal)
     * - Public static files with extensions
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
