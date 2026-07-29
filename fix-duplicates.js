const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env' });
global.WebSocket = require('ws');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  try {
    console.log('Fetching students in 5A...');
    const { data: students, error: studentError } = await supabase
      .from('students')
      .select('id, name')
      .eq('class', '5A');

    if (studentError) throw studentError;
    if (!students || students.length === 0) {
      console.log('Tidak ada siswa di Kelas 5A atau nama kelas bukan "5A"');
      return;
    }

    const studentIds = students.map(s => s.id);
    
    console.log(`Found ${students.length} students. Fetching their general invoices...`);
    const { data: invoices, error: invoiceError } = await supabase
      .from('general_invoices')
      .select('*')
      .in('student_id', studentIds)
      .neq('type', 'Infaq')
      .order('created_at', { ascending: true }); // Oldest first

    if (invoiceError) throw invoiceError;
    
    console.log(`Found ${invoices.length} invoices. Grouping to find duplicates...`);

    // Group invoices by student_id and title (tagihan sama)
    const grouped = {};
    for (const inv of invoices) {
      const key = `${inv.student_id}_${inv.title}`;
      if (!grouped[key]) {
        grouped[key] = [];
      }
      grouped[key].push(inv);
    }

    const toDelete = [];
    let studentsAffected = 0;

    for (const key in grouped) {
      const group = grouped[key];
      // Jika ada lebih dari 1 tagihan dengan title dan student yang sama
      if (group.length > 1) {
        studentsAffected++;
        // Misalnya ada 2 tagihan. Kita pertahankan satu (yang pertama), hapus sisanya.
        // HANYA HAPUS YANG BELUM LUNAS (UNPAID)
        
        // Kita simpan invoice pertama (index 0)
        // Dan kita tandai invoice index 1 sampai habis untuk dihapus, jika statusnya UNPAID
        for (let i = 1; i < group.length; i++) {
          const invToDelete = group[i];
          if (invToDelete.status !== 'PAID') {
            toDelete.push(invToDelete.id);
          } else {
            console.log(`Warning: Duplicate tagihan ${invToDelete.title} sudah PAID, kita biarkan (ID: ${invToDelete.id})`);
          }
        }
      }
    }

    if (toDelete.length > 0) {
      console.log(`Found ${toDelete.length} duplicate UNPAID invoices across ${studentsAffected} students. Deleting...`);
      // Delete them
      const { error: delError } = await supabase
        .from('general_invoices')
        .delete()
        .in('id', toDelete);
        
      if (delError) throw delError;
      
      console.log(`Berhasil menghapus ${toDelete.length} tagihan ganda.`);
    } else {
      console.log('Tidak ditemukan tagihan double (atau yang double sudah lunas).');
    }

  } catch (err) {
    console.error('Error:', err);
  }
}

run();
