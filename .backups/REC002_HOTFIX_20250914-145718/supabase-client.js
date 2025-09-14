import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

let _client = null
function _readConfig () {
  const cfg = (globalThis?.config) || globalThis || {}
  const url = cfg.SUPABASE_URL || globalThis.SUPABASE_URL || (typeof window !== 'undefined' && window.BADGENODE_CONFIG?.SUPABASE_URL) || 'https://txmjqrnitfsiytbytxlc.supabase.co'
  const key = cfg.SUPABASE_ANON_KEY || globalThis.SUPABASE_ANON_KEY || (typeof window !== 'undefined' && window.BADGENODE_CONFIG?.SUPABASE_ANON_KEY) || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR4bWpxcm5pdGZzaXl0Ynl0eGxjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE1MzY1MDcsImV4cCI6MjA2NzExMjUwN30.lag16Oxh_UQL4WOeU9-pVxIzvUyiNQMhKUY5Y5s9DPg'
  if (!url || !key) throw new Error('[Supabase] Config mancante: SUPABASE_URL / SUPABASE_ANON_KEY')
  return { url, key }
}

export function getSupabaseClient () {
  if (_client) return _client
  const { url, key } = _readConfig()
  _client = createClient(url, key, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
  })
  // Legacy bridge per codice esistente
  if (typeof window !== 'undefined') {
    window.supabase = _client
    window.supabaseClient = _client
  }
  return _client
}

// Export eager per import diretti
export const supabaseClient = getSupabaseClient()
export default supabaseClient

// Utility per gestione errori
export function gestisciErroreSupabase(error) {
  if (error?.code === 'PGRST116') return 'Nessun dato trovato';
  if (error?.message?.includes('invalid key')) return 'Errore configurazione - contattare amministratore';
  return error?.message || 'Errore di sistema';
}