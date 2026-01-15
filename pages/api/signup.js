// pages/api/signup.js
import { getServiceRoleClient } from "@lib/supabaseClient";

/**
 * Simple in-memory rate limiter (per IP) — good enough for small apps / demos.
 * For production prefer Redis or other persistent store.
 */
const RATE_LIMIT_WINDOW_MS = 60_000; // 1 minute
const RATE_LIMIT_MAX = 10; // max requests per window per IP
const ipStore = new Map();

function rateLimit(ip) {
    const now = Date.now();
    const entry = ipStore.get(ip) || { count: 0, start: now };
    if (now - entry.start > RATE_LIMIT_WINDOW_MS) {
        // reset window
        entry.count = 1;
        entry.start = now;
    } else {
        entry.count += 1;
    }
    ipStore.set(ip, entry);
    return entry.count <= RATE_LIMIT_MAX;
}

/** Basic email normalization */
function normalizeEmail(email) {
    return String(email || "").trim().toLowerCase();
}

/** Simple password strength check — tune to your policy */
function isStrongPassword(pw) {
    if (!pw || typeof pw !== "string") return false;
    // at least 8 chars, contains letters and numbers. Add symbols/upper/lower if you want.
    return pw.length >= 8 && /[a-zA-Z]/.test(pw) && /[0-9]/.test(pw);
}

export default async function handler(req, res) {
    // only POST allowed
    if (req.method !== "POST") {
        res.setHeader("Allow", "POST");
        return res.status(405).json({ success: false, error: "Method not allowed" });
    }

    // Rate limit by IP (very small in-memory limiter)
    const ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress || "unknown";
    if (!rateLimit(ip)) {
        return res.status(429).json({ success: false, error: "Too many requests. Try again later." });
    }

    const { email, password, fullName } = req.body || {};

    // Basic validation
    const normalizedEmail = normalizeEmail(email);
    if (!normalizedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
        return res.status(400).json({ success: false, error: "Invalid email address." });
    }
    if (!isStrongPassword(password)) {
        return res.status(400).json({
            success: false,
            error: "Password must be at least 8 characters and include letters and numbers.",
        });
    }


    // Create Supabase admin client (service role key required)
    const supabase = getServiceRoleClient();

    try {
        // Optional: check if user already exists — using admin listUsers
        // Note: listUsers may return paginated results; we use filter to check existence by email.
        const { data: existingUsers, error: listError } = await supabase.auth.admin.listUsers({
            filter: `email.eq.${normalizedEmail}`,
            // limit: 1 by default can help; supabase-js may accept paging options depending on version
        });

        if (listError) {
            // don't leak Supabase internals
            console.error("Error checking existing user:", listError);
            // continue — we'll rely on createUser error for duplicates, but logging helps debugging
        } else if (existingUsers?.length > 0) {
            return res.status(409).json({ success: false, error: "User already exists." });
        }

        // Create user via admin API (Supabase will hash the password)
        // You can set email_confirm to false (default) so Supabase sends verification email per your project settings

        const { data, error } = await supabase.auth.signUp(
            {
                email,
                password,
                options: {
                    data: { fullName }, 
                },
            }
        );

        if (error) {
            console.error("Supabase createUser error:", error);
            return res.status(500).json({ success: false, error: error.message });
        }

        // Optionally: you can trigger additional setup (create row in profiles table).
        // Example (uncomment if you have a 'profiles' table and want to insert a record):
        const profileInsert = await supabase.from('profiles').insert([{
            id: data.user.id,
            email: normalizedEmail,
            full_name: fullName || null,
            created_at: new Date().toISOString()
        }], { returning: 'minimal' });
        if (profileInsert.error) {
            console.error('Failed insert profile:', profileInsert.error);
            // Not fatal for signup — proceed
        }

        // Respond with success (do NOT return raw password or other sensitive info).
        return res.status(201).json({
            success: true,
            message: "User created. Please verify your email if required.",
            user: {
                id: data.user?.id ?? null,
                email: data.user?.email ?? normalizedEmail,
            },
        });
    } catch (err) {
        console.error("Unexpected signup error:", err);
        return res.status(500).json({ success: false, error: "Signup failed. Try again later." });
    }
}
