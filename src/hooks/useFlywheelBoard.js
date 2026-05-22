import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient.js';

const SUPABASE_KEYS = ['pfr_overrides', 'pfr_hidden', 'pfr_techdebt', 'pfr_groom', 'pfr_notes', 'pfr_ranks'];

function lsGet(key, fallback) {
  try { const v = localStorage.getItem(key); return v !== null ? JSON.parse(v) : fallback; }
  catch { return fallback; }
}
function lsSet(key, val) {
  try { localStorage.setItem(key, JSON.stringify(val)); } catch {}
}
function getEditSession() {
  try {
    const v = JSON.parse(localStorage.getItem('pfr_edit_session') || 'null');
    return !!(v && v.expiry > Date.now());
  } catch { return false; }
}

export function useFlywheelBoard() {
  const [overrides,   setOverridesState]  = useState(() => lsGet('pfr_overrides', {}));
  const [hidden,      setHiddenState]     = useState(() => lsGet('pfr_hidden',    []));
  const [showTD,      setShowTDState]     = useState(() => lsGet('pfr_techdebt',  false));
  const [groomState,  setGroomStateRaw]   = useState(() => lsGet('pfr_groom',     {}));
  const [notes,       setNotesRaw]        = useState(() => lsGet('pfr_notes',     {}));
  const [ranks,       setRanksRaw]        = useState(() => lsGet('pfr_ranks',     {}));
  const [loaded,      setLoaded]          = useState(false);
  const [isEditMode,  setIsEditMode]      = useState(() => getEditSession());

  // The passphrase hash lives in VITE_EDIT_PASSPHRASE_HASH (set in Netlify env vars).
  // Generate it with:  echo -n "yourpassword" | shasum -a 256
  const storedHash = import.meta.env.VITE_EDIT_PASSPHRASE_HASH || null;

  useEffect(() => {
    if (!supabase) { setLoaded(true); return; }

    (async () => {
      try {
        const { data, error } = await supabase
          .from('flywheel_board_state')
          .select('key, value')
          .in('key', SUPABASE_KEYS);
        if (error) throw error;

        const byKey = {};
        (data || []).forEach(row => { byKey[row.key] = row.value; });

        if (byKey.pfr_overrides !== undefined) { setOverridesState(byKey.pfr_overrides); lsSet('pfr_overrides', byKey.pfr_overrides); }
        if (byKey.pfr_hidden    !== undefined) { setHiddenState(byKey.pfr_hidden);        lsSet('pfr_hidden',    byKey.pfr_hidden); }
        if (byKey.pfr_techdebt  !== undefined) { setShowTDState(byKey.pfr_techdebt);      lsSet('pfr_techdebt',  byKey.pfr_techdebt); }
        if (byKey.pfr_groom     !== undefined) { setGroomStateRaw(byKey.pfr_groom);       lsSet('pfr_groom',     byKey.pfr_groom); }
        if (byKey.pfr_notes     !== undefined) { setNotesRaw(byKey.pfr_notes);            lsSet('pfr_notes',     byKey.pfr_notes); }
        if (byKey.pfr_ranks     !== undefined) { setRanksRaw(byKey.pfr_ranks);            lsSet('pfr_ranks',     byKey.pfr_ranks); }
      } catch (err) {
        console.warn('useFlywheelBoard: Supabase load failed, using localStorage', err);
      } finally {
        setLoaded(true);
      }
    })();
  }, []);

  const persist = useCallback(async (key, value) => {
    lsSet(key, value);
    if (!supabase) return;
    try {
      await supabase
        .from('flywheel_board_state')
        .upsert({ key, value, updated_at: new Date().toISOString() }, { onConflict: 'key' });
    } catch (err) {
      console.warn('useFlywheelBoard: Supabase write failed', err);
    }
  }, []);

  const setOverrides  = useCallback(next => { setOverridesState(next);  persist('pfr_overrides', next); }, [persist]);
  const setHidden     = useCallback(next => { setHiddenState(next);     persist('pfr_hidden',    next); }, [persist]);
  const setShowTD     = useCallback(next => { setShowTDState(next);     persist('pfr_techdebt',  next); }, [persist]);
  const setGroomState = useCallback(next => { setGroomStateRaw(next);   persist('pfr_groom',     next); }, [persist]);
  const setNotes      = useCallback(next => { setNotesRaw(next);        persist('pfr_notes',     next); }, [persist]);
  const setRanks      = useCallback(next => { setRanksRaw(next);        persist('pfr_ranks',     next); }, [persist]);

  const enterEditMode = useCallback(async (passphrase) => {
    if (!storedHash) return false;
    const encoder    = new TextEncoder();
    const hashBuffer = await crypto.subtle.digest('SHA-256', encoder.encode(passphrase));
    const hashHex    = Array.from(new Uint8Array(hashBuffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
    if (hashHex === storedHash) {
      lsSet('pfr_edit_session', { expiry: Date.now() + 24 * 60 * 60 * 1000 });
      setIsEditMode(true);
      return true;
    }
    return false;
  }, [storedHash]);

  const exitEditMode = useCallback(() => {
    localStorage.removeItem('pfr_edit_session');
    setIsEditMode(false);
  }, []);

  return { overrides, setOverrides, hidden, setHidden, showTD, setShowTD, groomState, setGroomState, notes, setNotes, ranks, setRanks, loaded, isEditMode, enterEditMode, exitEditMode };
}
