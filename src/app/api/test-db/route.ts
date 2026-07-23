import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  const { data, error } = await supabase.from('general_invoices').select('id, items').limit(10);
  return NextResponse.json({ data, error });
}
