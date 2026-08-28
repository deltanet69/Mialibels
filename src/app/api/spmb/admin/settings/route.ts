import { NextRequest } from 'next/server'
import { GET as ppdbGET, PUT as ppdbPUT } from '@/app/api/ppdb/admin/settings/route'

export const dynamic = 'force-dynamic'

export async function GET() {
  return ppdbGET()
}

export async function PUT(req: NextRequest) {
  return ppdbPUT(req)
}
