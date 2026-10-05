const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env' });

async function migrate() {
  // We will run raw SQL via RPC or just tell the user to do it if we can't.
  // Wait, Supabase js client doesn't support raw SQL by default unless we use postgres connection.
  // But we have 'pg' installed in package.json!
  const { Client } = require('pg');
  const connectionString = process.env.DATABASE_URL; // Let's see if we have this
  if (!connectionString) {
    console.log("No DATABASE_URL found.");
    return;
  }
  
  const client = new Client({ connectionString });
  await client.connect();
  try {
    await client.query(`ALTER TABLE students ADD COLUMN IF NOT EXISTS gender text;`);
    await client.query(`ALTER TABLE students ADD COLUMN IF NOT EXISTS address text;`);
    console.log("Columns added successfully!");
  } catch (e) {
    console.error(e);
  } finally {
    await client.end();
  }
}

migrate();
