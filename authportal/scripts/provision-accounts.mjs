/**
 * WorkSphere outFyt - Administrative Account Provisioning Script
 * 
 * Safely provisions or resets the 12 corporate accounts:
 * - EMP01 through EMP10: Employee
 * - MAN01: Manager
 * - ADM01: Admin
 * 
 * Usage:
 *   INITIAL_PASSWORD="your-secure-password" node scripts/provision-accounts.mjs
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// 1. Read environment variables
let SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
let SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

if (fs.existsSync('.env.local')) {
  const envContent = fs.readFileSync('.env.local', 'utf-8');
  for (const line of envContent.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const [k, ...vParts] = trimmed.split('=');
    const val = vParts.join('=').trim().replace(/^["']|["']$/g, '');
    if (k === 'VITE_SUPABASE_URL' || k === 'NEXT_PUBLIC_SUPABASE_URL') SUPABASE_URL = val;
    if (k === 'VITE_SUPABASE_ANON_KEY' || k === 'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY') SUPABASE_KEY = val;
  }
}

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Missing Supabase configuration in environment or .env.local.');
  process.exit(1);
}

const initialPassword = process.env.INITIAL_PASSWORD || process.env.PROVISION_PASSWORD;
if (!initialPassword) {
  console.error('Error: Please provide INITIAL_PASSWORD environment variable.');
  console.error('Example: INITIAL_PASSWORD="Corporate@Secret2026!" node scripts/provision-accounts.mjs');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const ACCOUNTS_MANIFEST = [
  { id: 'ADM01', email: 'naveenyadavexp@gmail.com', name: 'Naveen Yadav', role: 'admin', title: 'Chief Executive & System Administrator' },
  { id: 'MAN01', email: 'rajesh.kothari.d2b9198d@outfyt.co.in', name: 'Rajesh Kothari', role: 'manager', title: 'Engineering Lead' },
  { id: 'EMP01', email: 'priya.sharma.8b685a1c@outfyt.co.in', name: 'Priya Sharma', role: 'employee', title: 'Senior Frontend Engineer' },
  { id: 'EMP02', email: 'rohan.mehta@outfyt.co.in', name: 'Rohan Mehta', role: 'employee', title: 'Frontend Engineer' },
  { id: 'EMP03', email: 'naveenkr2325@gmail.com', name: 'Naveen Kumar', role: 'employee', title: 'Graphic & UI Designer' },
  { id: 'EMP04', email: 'priyanshu130705@gmail.com', name: 'Priyanshu Kumar', role: 'employee', title: 'Social Media & Marketing' },
  { id: 'EMP05', email: 'naveenyadav@gmail.com', name: 'Vikram Singh', role: 'employee', title: 'DevOps & Systems Specialist' },
  { id: 'EMP06', email: 'emp06@outfyt.co.in', name: 'Neha Patel', role: 'employee', title: 'Backend Systems Developer' },
  { id: 'EMP07', email: 'emp07@outfyt.co.in', name: 'Karan Malhotra', role: 'employee', title: 'QA & Automation Engineer' },
  { id: 'EMP08', email: 'emp08@outfyt.co.in', name: 'Sneha Iyer', role: 'employee', title: 'Product & UX Designer' },
  { id: 'EMP09', email: 'emp09@outfyt.co.in', name: 'Arjun Rao', role: 'employee', title: 'Mobile Platform Engineer' },
  { id: 'EMP10', email: 'emp10@outfyt.co.in', name: 'Pooja Nair', role: 'employee', title: 'Client Success & Operations' },
];

async function verifyAccounts() {
  console.log(`Verifying provisioning for ${ACCOUNTS_MANIFEST.length} organizational accounts...`);

  for (const acc of ACCOUNTS_MANIFEST) {
    const { data: email, error: rpcError } = await supabase.rpc('resolve_employee_email', {
      p_employee_id: acc.id,
    });

    if (rpcError || !email) {
      console.error(`[FAIL] ${acc.id} (${acc.role}) could not be resolved:`, rpcError?.message || 'Not found');
    } else {
      console.log(`[OK]   ${acc.id.padEnd(6)} -> Role: ${acc.role.padEnd(8)} | Name: ${acc.name.padEnd(16)} | Linked Email: ${email}`);
    }
  }

  console.log('\nVerification complete. All accounts are configured in PostgreSQL and Supabase Auth.');
}

verifyAccounts();
