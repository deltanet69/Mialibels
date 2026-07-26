const supabaseUrl = "https://ziijftyfmhpnlqcfhtht.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InppaWpmdHlmbWhwbmxxY2ZodGh0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDc2NzY4MCwiZXhwIjoyMDk2MzQzNjgwfQ._78e13TKrJT0TSL9Pgrc4Wo24KBIy5y83lDzbmw7iUQ";

async function check() {
  const res = await fetch(`${supabaseUrl}/rest/v1/?apikey=${supabaseKey}`, {
    headers: {
      Authorization: `Bearer ${supabaseKey}`
    }
  });
  
  const data = await res.json();
  const students = data.definitions.students;
  console.log("Students Schema:", JSON.stringify(students, null, 2));
  
  const studentAttendances = data.definitions.student_attendances;
  console.log("Student Attendances Schema:", JSON.stringify(studentAttendances, null, 2));

  const attendances = data.definitions.attendances;
  console.log("Attendances (Guru) Schema:", JSON.stringify(attendances, null, 2));
}
check();
