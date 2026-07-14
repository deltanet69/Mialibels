import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET!);

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

// ─────────────────────────────────────────────────────────────────────────────
// Middleware
// ─────────────────────────────────────────────────────────────────────────────

export async function proxy(request: NextRequest) {
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

  // ── 2. Public pages ───────────────────────────────────────────────────────
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
