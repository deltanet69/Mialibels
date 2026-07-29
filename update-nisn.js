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
    const { data: students, error: fetchError } = await supabase
      .from('students')
      .select('id, name, class, nisn')
      .in('class', ['Kelas 1A', 'Kelas 1B', 'Kelas 1C', 'Kelas 1D'])
      .or('nisn.is.null,nisn.eq.');

    if (fetchError) throw fetchError;

    if (!students || students.length === 0) {
      console.log('Tidak ada siswa kelas 1 A-D yang membutuhkan dummy NISN.');
      return;
    }

    const updates = [];
    for (let i = 0; i < students.length; i++) {
      const student = students[i];
      // Generate 6 digit dummy string
      const dummyNisn = Math.floor(100000 + Math.random() * 900000).toString();
      console.log(`Updating ${student.name} with dummy NISN ${dummyNisn}`);
      updates.push(
        supabase
          .from('students')
          .update({ nisn: dummyNisn })
          .eq('id', student.id)
      );
    }

    await Promise.all(updates);

    console.log(`Berhasil men-generate dummy NISN untuk ${students.length} siswa kelas 1 A-D.`);
  } catch (err) {
    console.error("Error:", err);
  }
}

run();
