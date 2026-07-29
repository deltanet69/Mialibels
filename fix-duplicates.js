const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env' });
global.WebSocket = require('ws');

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  // Get all July 2026 invoices
  const { data, error } = await supabase
    .from('spp_invoices')
    .select('id, student_id, status, created_at, title')
    .eq('month', 7)
    .eq('year', 2026)
    .order('created_at', { ascending: true }); // oldest first

  if (error) { console.error(error); return; }

  console.log('Total July 2026 invoices:', data.length);

  // Group by student_id + title to find duplicates
  const groups = {};
  for (const inv of data) {
    const key = `${inv.student_id}_${inv.title}`;
    if (!groups[key]) groups[key] = [];
    groups[key].push(inv);
  }

  const toDelete = [];
  let studentsAffected = 0;

  for (const key in groups) {
    const group = groups[key];
    if (group.length > 1) {
      studentsAffected++;
      // Keep the FIRST (oldest), delete the rest — but only UNPAID ones
      for (let i = 1; i < group.length; i++) {
        if (group[i].status !== 'PAID') {
          toDelete.push(group[i].id);
        } else {
          console.log(`Skipping PAID duplicate: ${group[i].id}`);
        }
      }
    }
  }

  console.log(`Found ${toDelete.length} duplicate UNPAID invoices across ${studentsAffected} students.`);

  if (toDelete.length > 0) {
    const { error: delError } = await supabase
      .from('spp_invoices')
      .delete()
      .in('id', toDelete);

    if (delError) { console.error('Delete error:', delError); return; }
    console.log(`Berhasil menghapus ${toDelete.length} tagihan ganda.`);
  } else {
    console.log('Tidak ada tagihan ganda yang perlu dihapus.');
  }
}

run();
