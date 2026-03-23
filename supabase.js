// ══════════════════════════════════════════════
//  LUCA — Supabase Client
//  Replace YOUR_* values after creating project
// ══════════════════════════════════════════════

const SUPABASE_URL     = 'https://ymqwfuiudifubllpkgip.supabase.co'   // e.g. https://xyzxyz.supabase.co
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InltcXdmdWl1ZGlmdWJsbHBrZ2lwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQyMDA2NDYsImV4cCI6MjA4OTc3NjY0Nn0.7HEFNINEw9yp42wgx2024-hxprBdp0u7F8oGsZQ67gQ'     // eyJhbGc... (safe to expose)

const { createClient } = window.supabase

const db = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession:      true,   // stay logged in across tabs/reloads
    autoRefreshToken:    true,   // silently refresh expired tokens
    detectSessionInUrl:  true    // handle OAuth + magic link redirects
  }
})