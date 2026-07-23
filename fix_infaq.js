const { createClient } = require('@supabase/supabase-js');
const { loadEnvConfig } = require('@next/env');
loadEnvConfig(process.cwd());

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  { auth: { persistSession: false } }
);

async function fixInfaq() {
  console.log("Mencari tagihan yang tercampur atau tipe salah...");
  
  // Ambil semua tagihan yang memiliki item infaq ATAU memiliki judul infaq tapi tipe salah
  const { data: invoices, error } = await supabase
    .from('general_invoices')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error("Error fetching invoices:", error);
    return;
  }

  let mixedCount = 0;
  let typeFixedCount = 0;

  for (const inv of invoices) {
    // Kasus 1: Judulnya Tagihan Infaq Sekolah tapi type nya bukan Infaq
    if (inv.title === 'Tagihan Infaq Sekolah' && inv.type !== 'Infaq') {
      await supabase.from('general_invoices').update({ type: 'Infaq' }).eq('id', inv.id);
      typeFixedCount++;
      console.log(`[FIXED TYPE] Invoice ID: ${inv.id}`);
      continue;
    }

    // Kasus 2: Tagihan tercampur (Judul bukan Infaq, tapi ada item Infaq)
    if (inv.title !== 'Tagihan Infaq Sekolah' && Array.isArray(inv.items)) {
      const infaqItems = inv.items.filter(item => item.name && item.name.startsWith('Infaq Sekolah - '));
      const nonInfaqItems = inv.items.filter(item => !item.name || !item.name.startsWith('Infaq Sekolah - '));

      if (infaqItems.length > 0) {
        console.log(`[FOUND MIXED] Invoice ID: ${inv.id}. Memisahkan...`);
        
        const infaqTotal = infaqItems.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
        const nonInfaqTotal = nonInfaqItems.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);

        if (nonInfaqItems.length === 0) {
           // Jika aslinya kosong tanpa infaq, ubah saja ini menjadi infaq
           await supabase.from('general_invoices').update({
             title: "Tagihan Infaq Sekolah",
             type: "Infaq"
           }).eq('id', inv.id);
           typeFixedCount++;
           continue;
        }

        // Update tagihan asli agar hanya berisi item non-infaq
        await supabase.from('general_invoices').update({
          items: nonInfaqItems,
          total_amount: nonInfaqTotal
        }).eq('id', inv.id);

        // Buat tagihan baru HANYA untuk infaq items yang dipisah
        await supabase.from('general_invoices').insert({
          student_id: inv.student_id,
          title: "Tagihan Infaq Sekolah",
          type: "Infaq",
          items: infaqItems,
          total_amount: infaqTotal,
          paid_amount: 0,
          status: "UNPAID",
          note: "Dipisahkan dari tagihan umum oleh sistem"
        });

        mixedCount++;
      }
    }
  }

  console.log(`\nSelesai!`);
  console.log(`Tagihan campuran yang dipisah: ${mixedCount}`);
  console.log(`Tagihan yang diperbaiki tipenya: ${typeFixedCount}`);
}

fixInfaq();
