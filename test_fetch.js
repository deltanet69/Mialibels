const url = 'https://ziijftyfmhpnlqcfhtht.supabase.co/rest/v1/general_invoices?select=items,students(class)&limit=3000';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InppaWpmdHlmbWhwbmxxY2ZodGh0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDc2NzY4MCwiZXhwIjoyMDk2MzQzNjgwfQ._78e13TKrJT0TSL9Pgrc4Wo24KBIy5y83lDzbmw7iUQ';

async function test() {
  console.time('fetch_3000');
  const res = await fetch(url, {
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`
    }
  });
  console.timeEnd('fetch_3000');
  const text = await res.text();
  console.log('Status:', res.status);
  console.log('Length:', text.length);
  if (text.length > 0 && text[0] === '[') {
     console.log('Count:', JSON.parse(text).length);
  } else {
     console.log('Error text:', text.substring(0, 100));
  }
}
test();
