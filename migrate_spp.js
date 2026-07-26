const { loadEnvConfig } = require('@next/env');
loadEnvConfig(process.cwd());

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const MONTHS = {
  "Januari": 1, "Februari": 2, "Maret": 3, "April": 4, "Mei": 5, "Juni": 6,
  "Juli": 7, "Agustus": 8, "September": 9, "Oktober": 10, "November": 11, "Desember": 12
};

async function migrate() {
  console.log("Memulai migrasi Infaq ke spp_invoices...");
  
  const res = await fetch(`${supabaseUrl}/rest/v1/general_invoices?type=eq.Infaq&select=*`, {
    headers: {
      apikey: supabaseKey,
      Authorization: `Bearer ${supabaseKey}`
    }
  });
  
  if (!res.ok) {
    console.error("Gagal mengambil data general_invoices:", await res.text());
    return;
  }
  
  const invoices = await res.json();
  console.log(`Ditemukan ${invoices.length} tagihan Infaq di general_invoices.`);
  
  let migratedCount = 0;
  
  for (const inv of invoices) {
    if (!inv.items || !Array.isArray(inv.items)) continue;
    
    let allMigrated = true;
    for (const item of inv.items) {
      if (!item.name || !item.name.startsWith("Infaq Sekolah")) {
         allMigrated = false;
         continue;
      }
      
      const parts = item.name.replace("Infaq Sekolah - ", "").trim().split(" ");
      const monthStr = parts[0];
      const yearStr = parts[1];
      const month = MONTHS[monthStr] || 1;
      const year = parseInt(yearStr) || new Date().getFullYear();
      
      const amount = item.amount || 0;
      const paid_amount = item.paid_amount || 0;
      let status = "UNPAID";
      if (paid_amount >= amount && amount > 0) status = "PAID";
      else if (paid_amount > 0) status = "PARTIAL";
      
      let due_date = inv.due_date;
      if (!due_date) {
         // Create a due date, e.g. 10th of the billed month
         const d = new Date(year, month - 1, 10);
         due_date = d.toISOString();
      }
      
      const sppData = {
        student_id: inv.student_id,
        title: item.name,
        amount: amount,
        month: month,
        year: year,
        due_date: due_date,
        status: status,
        paid_amount: paid_amount,
        payment_method: inv.payment_method,
        bukti_transfer: inv.bukti_transfer,
        created_at: inv.created_at,
        updated_at: inv.updated_at
      };
      
      const insertRes = await fetch(`${supabaseUrl}/rest/v1/spp_invoices`, {
        method: 'POST',
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify(sppData)
      });
      
      if (!insertRes.ok) {
        console.error("Gagal insert ke spp_invoices:", await insertRes.text());
        allMigrated = false;
      } else {
        migratedCount++;
      }
    }
    
    if (allMigrated) {
      await fetch(`${supabaseUrl}/rest/v1/general_invoices?id=eq.${inv.id}`, {
        method: 'DELETE',
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`
        }
      });
    }
  }
  
  console.log(`Migrasi selesai! Berhasil memigrasi ${migratedCount} tagihan per bulan.`);
}

migrate();
