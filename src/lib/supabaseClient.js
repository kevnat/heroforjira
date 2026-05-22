import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Returns null when env vars are missing — the app and hook both guard against this.
// Without Supabase, board state persists to localStorage only (single-browser).
export const supabase = url && key ? createClient(url, key) : null;
