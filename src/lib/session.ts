import { jwtVerify } from 'jose'
import { cookies } from 'next/headers'
import { getJwtSecretKey } from '@/lib/jwt'
import { UserRole } from './rbac'

export type { UserRole }

export type SessionUser = {
  id: string
  email?: string
  name: string
  role: UserRole | string
  staffId?: string
  studentId?: string
  nis?: string
  nisn?: string
}

/**
 * Reads the admin session cookie and verifies the JWT entirely on the server.
 * Zero network requests — O(1) latency.
 */
export async function getSession(): Promise<SessionUser | null> {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('admin_session')?.value
    if (!token) return null

    const { payload } = await jwtVerify(token, getJwtSecretKey())

    return {
      id: payload.sub as string,
      email: payload.email as string | undefined,
      name: (payload.name || payload.email || 'Admin') as string,
      role: (payload.role || 'admin') as string,
      staffId: payload.staffId as string | undefined,
    }
  } catch {
    return null
  }
}

/**
 * Reads the parent session cookie and verifies the JWT.
 */
export async function getParentSession(): Promise<SessionUser | null> {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('parent_session')?.value
    if (!token) return null

    const { payload } = await jwtVerify(token, getJwtSecretKey())

    return {
      id: payload.sub as string,
      name: ((payload.studentName || payload.parentName || 'Orang Tua') as string),
      role: 'parent',
      studentId: payload.sub as string,
      nis: payload.nis as string | undefined,
      nisn: payload.nisn as string | undefined,
    }
  } catch {
    return null
  }
}

/**
 * Verifies either admin_session or parent_session.
 * Pass `request` when calling from a Route Handler (API route).
 * Omit `request` when calling from a Server Component.
 */
export async function getAnySession(request?: any): Promise<SessionUser | null> {
  let adminToken: string | undefined
  let parentToken: string | undefined

  if (request?.cookies) {
    // Route Handler context — use request.cookies directly
    adminToken = request.cookies.get('admin_session')?.value
    parentToken = request.cookies.get('parent_session')?.value
  } else {
    // Server Component context — use next/headers cookies()
    try {
      const cookieStore = await cookies()
      adminToken = cookieStore.get('admin_session')?.value
      parentToken = cookieStore.get('parent_session')?.value
    } catch {
      return null
    }
  }

  const secret = getJwtSecretKey()

  if (adminToken) {
    try {
      const { payload } = await jwtVerify(adminToken, secret)
      return {
        id: payload.sub as string,
        email: payload.email as string | undefined,
        name: (payload.name || payload.email || 'Admin') as string,
        role: (payload.role || 'admin') as string,
        staffId: payload.staffId as string | undefined,
      }
    } catch {}
  }

  if (parentToken) {
    try {
      const { payload } = await jwtVerify(parentToken, secret)
      return {
        id: payload.sub as string,
        name: ((payload.studentName || payload.parentName || 'Orang Tua') as string),
        role: 'parent',
        studentId: payload.sub as string,
        nis: payload.nis as string | undefined,
        nisn: payload.nisn as string | undefined,
      }
    } catch {}
  }

  return null
}
