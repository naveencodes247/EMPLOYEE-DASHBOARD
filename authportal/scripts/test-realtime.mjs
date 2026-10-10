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

async function testRealtime() {
  console.log('Testing Supabase Realtime on tasks table...');
  const channel = client
    .channel('tasks-realtime-test')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, (payload) => {
      console.log('Realtime change received on tasks:', payload);
    })
    .subscribe((status) => {
      console.log('Channel subscription status:', status);
    });

  // Wait 3 seconds
  await new Promise(r => setTimeout(r, 3000));
  client.removeChannel(channel);
  console.log('Test completed.');
}

testRealtime();
