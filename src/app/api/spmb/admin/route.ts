import { NextRequest } from 'next/server'
import { GET as ppdbGET, PUT as ppdbPUT, DELETE as ppdbDELETE } from '@/app/api/ppdb/admin/route'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  return ppdbGET(req)
}

export async function PUT(req: NextRequest) {
  return ppdbPUT(req)
}

export async function DELETE(req: NextRequest) {
  return ppdbDELETE(req)
}
