const { SignJWT } = require('jose');
const crypto = require('crypto');
require('dotenv').config({ path: '.env' });

async function run() {
  const secretKey = process.env.JWT_SECRET || 'mi15-attaqwa-babelan-bekasi-super-secret-jwt-key-2026';
  const secret = new TextEncoder().encode(secretKey);

  const { createClient } = require('@supabase/supabase-js');
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
  const { data: students } = await supabase.from('students').select('id, name').limit(1);
  const student = students[0];
  
  const token = await new SignJWT({ sub: student.id, role: 'parent', name: student.name })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('24h')
    .sign(secret);

  const body = {
    gender: 'Laki-laki',
    birth_place: 'Bekasi',
    birth_date: '2010-01-01',
    address: 'Jl. Test 123'
  };

  const res = await fetch('http://localhost:3000/api/parent/profile', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': `parent_session=${token}`
    },
    body: JSON.stringify(body)
  });

  const text = await res.text();
  console.log('Status:', res.status);
  console.log('Response:', text);
}

run();
