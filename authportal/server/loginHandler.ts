import { createClient } from '@supabase/supabase-js';

// In-memory rate limiting map for login attempts
// Key: IP or employeeId, Value: { attempts: number, firstAttemptAt: number, lockedUntil?: number }
interface RateLimitRecord {
  attempts: number;
  firstAttemptAt: number;
  lockedUntil?: number;
}

const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const MAX_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes lockout

const rateLimitStore = new Map<string, RateLimitRecord>();

function cleanExpiredRateLimits() {
  const now = Date.now();
  for (const [key, record] of rateLimitStore.entries()) {
    if (record.lockedUntil && now > record.lockedUntil) {
      rateLimitStore.delete(key);
    } else if (now - record.firstAttemptAt > RATE_LIMIT_WINDOW_MS && !record.lockedUntil) {
      rateLimitStore.delete(key);
    }
  }
}

// Check rate limit for given identifier
export function checkRateLimit(identifier: string): { isAllowed: boolean; retryAfterSeconds?: number } {
  cleanExpiredRateLimits();
  const now = Date.now();
  const record = rateLimitStore.get(identifier);

  if (!record) {
    return { isAllowed: true };
  }

  if (record.lockedUntil && now < record.lockedUntil) {
    const retryAfter = Math.ceil((record.lockedUntil - now) / 1000);
    return { isAllowed: false, retryAfterSeconds: retryAfter };
  }

  return { isAllowed: true };
}

// Record a failed attempt
export function recordFailedAttempt(identifier: string) {
  const now = Date.now();
  const record = rateLimitStore.get(identifier);

  if (!record) {
    rateLimitStore.set(identifier, { attempts: 1, firstAttemptAt: now });
    return;
  }

  if (now - record.firstAttemptAt > RATE_LIMIT_WINDOW_MS) {
    rateLimitStore.set(identifier, { attempts: 1, firstAttemptAt: now });
    return;
  }

  record.attempts += 1;
  if (record.attempts >= MAX_ATTEMPTS) {
    record.lockedUntil = now + LOCKOUT_DURATION_MS;
  }
}

// Reset failed attempts upon successful login
export function resetRateLimit(identifier: string) {
  rateLimitStore.delete(identifier);
}

export interface LoginHandlerParams {
  employeeId: string;
  password: string;
  clientIp?: string;
  supabaseUrl?: string;
  supabaseAnonKey?: string;
}

export interface LoginHandlerResponse {
  status: number;
  body: {
    success: boolean;
    error?: string;
    session?: any;
    user?: any;
    profile?: any;
    role?: 'employee' | 'manager' | 'admin';
    retryAfterSeconds?: number;
  };
}

export async function handleLoginRequest({
  employeeId,
  password,
  clientIp = 'unknown-client',
  supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '',
  supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_ANON_KEY || '',
}: LoginHandlerParams): Promise<LoginHandlerResponse> {
  if (!supabaseUrl || !supabaseAnonKey) {
    return {
      status: 500,
      body: { success: false, error: 'Server authentication configuration is missing from environment.' },
    };
  }
  const cleanId = (employeeId || '').trim().toUpperCase();

  if (!cleanId) {
    return {
      status: 400,
      body: { success: false, error: 'Employee ID is required.' },
    };
  }

  if (!password) {
    return {
      status: 400,
      body: { success: false, error: 'Password is required.' },
    };
  }

  // 1. Check Rate Limiting by IP and Employee ID
  const ipRateCheck = checkRateLimit(`ip:${clientIp}`);
  if (!ipRateCheck.isAllowed) {
    return {
      status: 429,
      body: {
        success: false,
        error: `Too many login attempts. Please wait ${Math.ceil((ipRateCheck.retryAfterSeconds || 900) / 60)} minutes before trying again.`,
        retryAfterSeconds: ipRateCheck.retryAfterSeconds,
      },
    };
  }

  const idRateCheck = checkRateLimit(`id:${cleanId}`);
  if (!idRateCheck.isAllowed) {
    return {
      status: 429,
      body: {
        success: false,
        error: `Account ${cleanId} has been temporarily locked due to multiple failed login attempts. Please wait ${Math.ceil((idRateCheck.retryAfterSeconds || 900) / 60)} minutes.`,
        retryAfterSeconds: idRateCheck.retryAfterSeconds,
      },
    };
  }

  // 2. Initialize Supabase client
  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  // 3. Resolve Employee ID to registered account email via RPC
  let accountEmail = '';
  try {
    const { data: resolvedEmail, error: rpcError } = await supabase.rpc('resolve_employee_email', {
      p_employee_id: cleanId,
    });

    if (rpcError || !resolvedEmail || typeof resolvedEmail !== 'string') {
      recordFailedAttempt(`ip:${clientIp}`);
      recordFailedAttempt(`id:${cleanId}`);
      return {
        status: 401,
        body: { success: false, error: 'Invalid Employee ID or password.' },
      };
    }

    accountEmail = resolvedEmail;
  } catch {
    recordFailedAttempt(`ip:${clientIp}`);
    recordFailedAttempt(`id:${cleanId}`);
    return {
      status: 401,
      body: { success: false, error: 'Invalid Employee ID or password.' },
    };
  }

  // 4. Authenticate against Supabase Auth (verifying real password)
  try {
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: accountEmail,
      password: password,
    });

    if (authError || !authData.user || !authData.session) {
      recordFailedAttempt(`ip:${clientIp}`);
      recordFailedAttempt(`id:${cleanId}`);
      return {
        status: 401,
        body: { success: false, error: 'Invalid Employee ID or password.' },
      };
    }

    // 5. Query user profile using the authenticated session
    const authClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Authorization: `Bearer ${authData.session.access_token}`,
        },
      },
      auth: { persistSession: false },
    });

    const { data: profile, error: profileError } = await authClient
      .from('profiles')
      .select('*')
      .eq('id', authData.user.id)
      .single();

    if (profileError || !profile) {
      return {
        status: 403,
        body: { success: false, error: 'User profile record not found in organizational directory.' },
      };
    }

    if (profile.account_status !== 'active') {
      return {
        status: 403,
        body: { success: false, error: `Account status is ${profile.account_status}. Please contact system administrator.` },
      };
    }

    // Reset rate limit on successful authentication
    resetRateLimit(`ip:${clientIp}`);
    resetRateLimit(`id:${cleanId}`);
    if (/^EMP[0-9]+$/.test(cleanId)) {
      const num = parseInt(cleanId.slice(3), 10);
      resetRateLimit(`id:EMP${num}`);
      resetRateLimit(`id:EMP${String(num).padStart(2, '0')}`);
    } else if (/^ADM[0-9]+$/.test(cleanId)) {
      const num = parseInt(cleanId.slice(3), 10);
      resetRateLimit(`id:ADM${num}`);
      resetRateLimit(`id:ADM${String(num).padStart(2, '0')}`);
    } else if (/^MAN[0-9]+$/.test(cleanId)) {
      const num = parseInt(cleanId.slice(3), 10);
      resetRateLimit(`id:MAN${num}`);
      resetRateLimit(`id:MAN${String(num).padStart(2, '0')}`);
    }

    return {
      status: 200,
      body: {
        success: true,
        session: authData.session,
        user: authData.user,
        profile,
        role: profile.role,
      },
    };
  } catch (err: any) {
    return {
      status: 500,
      body: { success: false, error: err?.message || 'Authentication service error.' },
    };
  }
}
