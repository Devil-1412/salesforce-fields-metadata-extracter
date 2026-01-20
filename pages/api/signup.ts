import type { NextApiRequest, NextApiResponse } from 'next';
import { getServiceRoleClient } from '@lib/supabaseClient';

interface SignupResponse {
  success: boolean;
  message?: string;
  user?: { id: string | null; email: string };
  error?: string;
}

const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 10;
const ipStore = new Map<string, { count: number; start: number }>();

function rateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = ipStore.get(ip) || { count: 0, start: now };
  if (now - entry.start > RATE_LIMIT_WINDOW_MS) {
    entry.count = 1;
    entry.start = now;
  } else {
    entry.count += 1;
  }
  ipStore.set(ip, entry);
  return entry.count <= RATE_LIMIT_MAX;
}

function normalizeEmail(email: unknown): string {
  return String(email || '').trim().toLowerCase();
}

function isStrongPassword(pw: unknown): boolean {
  if (!pw || typeof pw !== 'string') return false;
  return pw.length >= 8 && /[a-zA-Z]/.test(pw) && /[0-9]/.test(pw);
}

export default async function handler(req: NextApiRequest, res: NextApiResponse<SignupResponse>) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  const forwarded = req.headers['x-forwarded-for'];
  const ip = (Array.isArray(forwarded) ? forwarded[0] : forwarded) || (req.socket as { remoteAddress?: string })?.remoteAddress || 'unknown';
  
  if (!rateLimit(ip)) {
    return res.status(429).json({ success: false, error: 'Too many requests. Try again later.' });
  }

  const { email, password, fullName } = req.body || {};

  const normalizedEmail = normalizeEmail(email);
  if (!normalizedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
    return res.status(400).json({ success: false, error: 'Invalid email address.' });
  }
  if (!isStrongPassword(password)) {
    return res.status(400).json({
      success: false,
      error: 'Password must be at least 8 characters and include letters and numbers.',
    });
  }

  const supabase = getServiceRoleClient();

  try {
    const { data: existingUsers, error: listError } = await supabase.auth.admin.listUsers({});

    if (listError) {
      console.error('Error checking existing user:', listError);
    } else {
      const existingUser = existingUsers?.users?.find((u) => u.email?.toLowerCase() === normalizedEmail);
      if (existingUser) {
        return res.status(409).json({ success: false, error: 'User already exists.' });
      }
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { fullName },
      },
    });

    if (error) {
      console.error('Supabase createUser error:', error);
      return res.status(500).json({ success: false, error: error.message });
    }

    if (data.user) {
      const profileInsert = await supabase.from('profiles').insert([
        {
          id: data.user.id,
          email: normalizedEmail,
          full_name: fullName || null,
          created_at: new Date().toISOString(),
        },
      ]);
      
      if (profileInsert.error) {
        console.error('Failed insert profile:', profileInsert.error);
      }
    }

    return res.status(201).json({
      success: true,
      message: 'User created. Please verify your email if required.',
      user: {
        id: data.user?.id ?? null,
        email: data.user?.email ?? normalizedEmail,
      },
    });
  } catch (err) {
    console.error('Unexpected signup error:', err);
    return res.status(500).json({ success: false, error: 'Signup failed. Try again later.' });
  }
}
