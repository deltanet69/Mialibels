const fs = require('fs');
const env = fs.readFileSync('.env', 'utf-8').split('\n').reduce((acc, line) => {
  const [key, ...val] = line.split('=');
  if(key) acc[key.trim()] = val.join('=').trim().replace(/['"]/g, '');
  return acc;
}, {});

const URL = env.NEXT_PUBLIC_SUPABASE_URL + '/rest/v1/general_invoices?select=id,student_id,title,type,items&type=eq.Infaq';
const KEY = env.SUPABASE_SERVICE_ROLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

async function doFetch(url) {
  const res = await fetch(url, {
    headers: { 'apikey': KEY, 'Authorization': `Bearer ${KEY}` }
  });
  return await res.json();
}

async function run() {
  const invoices = await doFetch(URL);
  console.log("Total Infaq invoices:", invoices.length);
  if (invoices.length > 0) {
     console.log("First invoice items:", JSON.stringify(invoices[0].items, null, 2));
  }
}
run().catch(console.error);
