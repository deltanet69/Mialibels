import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://ziijftyfmhpnlqcfhtht.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InppaWpmdHlmbWhwbmxxY2ZodGh0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDc2NzY4MCwiZXhwIjoyMDk2MzQzNjgwfQ._78e13TKrJT0TSL9Pgrc4Wo24KBIy5y83lDzbmw7iUQ";
const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  console.time('fetch_id');
  const { data, error } = await supabase
    .from('general_invoices')
    .select('id')
    .limit(3000);
  console.timeEnd('fetch_id');
  console.log('Count:', data?.length);
  
  console.time('fetch_items');
  const { data: d2, error: e2 } = await supabase
    .from('general_invoices')
    .select('items, students(class)')
    .limit(3000);
  console.timeEnd('fetch_items');
  console.log('Error:', e2?.message);
}
check();
