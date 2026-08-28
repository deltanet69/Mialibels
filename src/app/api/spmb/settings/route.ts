import { GET as ppdbGET } from '@/app/api/ppdb/settings/route'

export const dynamic = 'force-dynamic'

export async function GET() {
  return ppdbGET()
}
