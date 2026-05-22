-- Run this once in your Supabase project's SQL editor.
-- It creates a single key/value table used to sync board state
-- (column overrides, notes, card order, snapshots) across teammates.

create table if not exists flywheel_board_state (
  key        text primary key,
  value      jsonb,
  updated_at timestamptz default now()
);

alter table flywheel_board_state enable row level security;

-- Public read + write: safe for internal team use since board state isn't sensitive.
-- The Supabase anon key is intentionally public — it's designed to be in the browser.
--
-- Want tighter control? Remove the write policy and route board-state writes through
-- a Netlify function that uses SUPABASE_SERVICE_ROLE_KEY (server-side only).
create policy "anon read"  on flywheel_board_state for select using (true);
create policy "anon write" on flywheel_board_state for all    using (true);
