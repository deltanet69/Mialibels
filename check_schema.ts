const supabaseUrl = "https://ziijftyfmhpnlqcfhtht.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InppaWpmdHlmbWhwbmxxY2ZodGh0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDc2NzY4MCwiZXhwIjoyMDk2MzQzNjgwfQ._78e13TKrJT0TSL9Pgrc4Wo24KBIy5y83lDzbmw7iUQ";

async function check() {
  const res = await fetch(`${supabaseUrl}/rest/v1/?apikey=${supabaseKey}`, {
    headers: {
      Authorization: `Bearer ${supabaseKey}`
    }
  });
  
  const data = await res.json();
  const sppInvoices = data.definitions.spp_invoices;
  console.log("SPP Invoices Schema:", JSON.stringify(sppInvoices, null, 2));
  const generalInvoices = data.definitions.general_invoices;
  console.log("General Invoices Schema:", JSON.stringify(generalInvoices, null, 2));
}
check();
