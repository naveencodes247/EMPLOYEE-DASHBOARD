import { handleLoginRequest } from '../server/loginHandler.ts';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

async function testLoginHandler() {
  console.log('Testing handleLoginRequest with process.env:');
  console.log('VITE_SUPABASE_URL:', process.env.VITE_SUPABASE_URL);
  console.log('VITE_SUPABASE_ANON_KEY:', process.env.VITE_SUPABASE_ANON_KEY);

  const testCases = [
    { id: 'ADM01', pass: process.env.ADMIN_PASSWORD || process.env.ADMIN_PASSWORD || '' },
    { id: 'EMP1', pass: process.env.EMPLOYEE_PASSWORD || process.env.EMPLOYEE_PASSWORD || '' },
    { id: 'EMP2', pass: process.env.EMPLOYEE_PASSWORD || process.env.EMPLOYEE_PASSWORD || '' },
    { id: 'MAN01', pass: process.env.MANAGER_PASSWORD || process.env.MANAGER_PASSWORD || '' },
  ];

  for (const tc of testCases) {
    const res = await handleLoginRequest({
      employeeId: tc.id,
      password: tc.pass,
      clientIp: '127.0.0.1',
    });
    console.log(`[${tc.id}] Status: ${res.status}, success: ${res.body.success}, role: ${res.body.role}, error: ${res.body.error}`);
  }
}

testLoginHandler();
