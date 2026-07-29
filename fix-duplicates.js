const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env' });
global.WebSocket = require('ws');

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  console.log('Testing direct SQL via Supabase...');
  
  // Try adding column via REST/PostgREST - this won't work directly
  // Instead let's try inserting without student_class to confirm the issue
  const { data: sample, error: sampleErr } = await supabase
    .from('general_invoices')
    .select('id, title, student_id')
    .limit(1);
  
  if (sampleErr) {
    console.error('Error fetching sample:', sampleErr.message);
    return;
  }
  
  console.log('Sample invoice columns visible:', Object.keys(sample[0] || {}));
  
  // Try to add the column using raw SQL (only works with service role)
  // Supabase JS doesn't support DDL directly, but we can try via the pg schema
  console.log('');
  console.log('NOTE: student_class column does not exist in general_invoices.');
  console.log('You need to add it manually via Supabase Dashboard > SQL Editor:');
  console.log('');
  console.log('ALTER TABLE general_invoices ADD COLUMN IF NOT EXISTS student_class VARCHAR(50);');
  console.log('');
  console.log('UPDATE general_invoices gi SET student_class = s.class FROM students s WHERE gi.student_id = s.id AND gi.student_class IS NULL;');
  console.log('');
  console.log('Also for spp_invoices if needed:');
  console.log('ALTER TABLE spp_invoices ADD COLUMN IF NOT EXISTS student_class VARCHAR(50);');
  console.log('UPDATE spp_invoices si SET student_class = s.class FROM students s WHERE si.student_id = s.id AND si.student_class IS NULL;');
}

run();
