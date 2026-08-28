import { NextRequest } from 'next/server'
import { POST as ppdbPOST } from '@/app/api/ppdb/documents/route'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  return ppdbPOST(req)
}
