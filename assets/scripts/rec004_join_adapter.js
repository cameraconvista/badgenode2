// REC-004 — Adapter "prefer view" con fallback automatico.
// Uso consigliato: import { fetchStoricoJoin } from './rec004_join_adapter.js'
import { supabaseClient as supabase } from './supabase-client.js';

/**
 * Restituisce { utente: {pin,nome,cognome,ore_contrattuali}, timbrature: [] }
 * Prova la view v_timbrature_utenti; se non esiste, fa doppia query classica.
 */
export async function fetchStoricoJoin(pin, startISO, endISO) {
  const pinNum = parseInt(pin, 10);

  // 1) Tentativo con VIEW
  try {
    const { data, error, status } = await supabase
      .from('v_timbrature_utenti')
      .select('id,pin,tipo,data,ore,giornologico,created_at,nome,cognome,ore_contrattuali')
      .eq('pin', pinNum)
      .gte('data', startISO)
      .lte('data', endISO)
      .order('data', { ascending: true })
      .order('ore', { ascending: true });

    if (!error && Array.isArray(data)) {
      const utente = data.length
        ? { pin: pinNum, nome: data[0].nome, cognome: data[0].cognome, ore_contrattuali: data[0].ore_contrattuali }
        : await fetchUtente(pinNum); // se range vuoto, recupera comunque l'anagrafica

      const timbrature = data.map(r => ({
        id: r.id, pin: r.pin, tipo: r.tipo, data: r.data, ore: r.ore, giornologico: r.giornologico, created_at: r.created_at
      }));
      return { utente, timbrature, used: 'view' };
    }

    // Se la view non esiste (42P01) o 406/404, cadiamo nel fallback
    if (error) console.info('[REC004] view fallback:', error.message || error);
  } catch (e) {
    console.info('[REC004] view try failed → fallback', e?.message || e);
  }

  // 2) Fallback: doppia query classica
  const utente = await fetchUtente(pinNum);
  const { data: timb, error: tErr } = await supabase
    .from('timbrature')
    .select('id,pin,tipo,data,ore,giornologico,created_at')
    .eq('pin', pinNum)
    .gte('data', startISO)
    .lte('data', endISO)
    .order('data', { ascending: true })
    .order('ore', { ascending: true });

  if (tErr) throw tErr;
  return { utente, timbrature: timb || [], used: 'fallback' };
}

async function fetchUtente(pinNum) {
  const { data, error } = await supabase
    .from('utenti')
    .select('pin,nome,cognome,ore_contrattuali')
    .eq('pin', pinNum)
    .single();
  if (error && error.code !== 'PGRST116') throw error;
  return data || { pin: pinNum, nome: '', cognome: '', ore_contrattuali: null };
}

/* ==== REC004-SAFE WRAPPER (idempotente) ==== 
   Normalizza i parametri e richiama la JOIN esistente.
   Non cambia l'implementazione interna: la protegge da PIN non numerici e date non ISO. */
export function __rec004_coercePin(v){
  const n = Number.parseInt(String(v ?? '').trim(), 10);
  if (!Number.isFinite(n)) throw new Error('PIN_NAN');
  return n;
}
export function __rec004_toISO(v){
  try { return new Date(v).toISOString(); } catch { return null; }
}

/** Wrapper sicuro: usa l'implementazione esistente se presente */
export async function fetchStoricoJoinSafe(params){
  const pin = __rec004_coercePin(params?.pin);
  const inizioISO = __rec004_toISO(params?.inizio);
  const fineISO   = __rec004_toISO(params?.fine);
  if (!inizioISO || !fineISO) throw new Error('RANGE_INVALID');

  // Diag a supporto
  if (typeof window !== 'undefined') {
    window.__REC004__ = window.__REC004__ || {};
    window.__REC004__.diag = { pin, inizioISO, fineISO };
  }

  // Se l'implementazione base esiste, riusala con parametri sani
  try{
    if (typeof fetchStoricoJoin === 'function') {
      return await fetchStoricoJoin({ pin, inizio: inizioISO, fine: fineISO });
    }
  }catch(e){
    // Propaga l'errore: il call-site farà fallback
    throw e;
  }
  throw new Error('BASE_JOIN_MISSING');
}

// Esporta helper su window per debug (non richiesto dal runtime)
if (typeof window !== 'undefined') {
  window.__REC004__ = window.__REC004__ || {};
  window.__REC004__.fetchStoricoJoinSafe = fetchStoricoJoinSafe;
  window.__REC004__.coercePin = __rec004_coercePin;
}
