import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;
const client = createClient(SUPABASE_URL, ANON_KEY);

async function checkBuckets() {
  const { data: adminEmail } = await client.rpc('resolve_employee_email', { p_employee_id: 'ADM01' });
  const adminClient = createClient(SUPABASE_URL, ANON_KEY);
  await adminClient.auth.signInWithPassword({
    email: adminEmail,
    password: process.env.ADMIN_PASSWORD || process.env.ADMIN_PASSWORD || ''
  });

  const { data: buckets, error: bErr } = await adminClient.storage.listBuckets();
  if (bErr) console.error('Buckets error:', bErr);
  else console.log('Existing buckets:', buckets);
}

checkBuckets();
