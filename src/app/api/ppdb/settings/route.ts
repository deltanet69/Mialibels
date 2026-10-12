// @ts-nocheck
import { NextResponse } from 'next/server'
import { getSpmbSettings } from '@/lib/spmb-settings'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET() {
  try {
    const data = await getSpmbSettings()
    return NextResponse.json({
      success: true,
      data
    }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0'
      }
    })
  } catch (error: any) {
    console.error('SPMB Settings API Error:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
