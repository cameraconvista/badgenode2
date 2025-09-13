// timbrature-data.js

import { supabaseClient } from './supabase-client.js';
import { normalizzaData } from './calendar-utils.js';

// Cache per evitare richieste duplicate
const cache = new Map();
const CACHE_TTL = 30000; // 30 secondi

export async function caricaDati(pin, dataInizio, dataFine) {
  if (!pin) return { dipendente: null, timbrature: [] };

  // Chiave cache
  const cacheKey = `${pin}_${dataInizio}_${dataFine}`;
  const cached = cache.get(cacheKey);
  
  // Verifica cache
  if (cached && (Date.now() - cached.timestamp) < CACHE_TTL) {
    console.log('✅ Dati caricati da cache');
    return cached.data;
  }

  try {
    console.log('🔄 Caricamento dati da server...');
    
    // Prima fetch del dipendente SEMPRE
    const { data: utenteData, error: utenteError } = await supabaseClient
      .from('utenti')
      .select('nome, cognome, email, ore_contrattuali')
      .eq('pin', pin)
      .single();

    if (utenteError) throw new Error("Errore recupero utente: " + utenteError.message);

    const dipendente = utenteData ? {
      nome: utenteData.nome,
      cognome: utenteData.cognome,
      email: utenteData.email,
      ore_contrattuali: utenteData.ore_contrattuali
    } : null;

    // Poi fetch delle timbrature (può essere vuota) - Fix timestamp range
    const dataInizioISO = `${dataInizio}T00:00:00.000Z`;
    const dataFineISO = `${dataFine}T23:59:59.999Z`;
    
    const { data, error } = await supabaseClient
      .from("timbrature")
      .select("*")
      .eq("pin", pin)
      .gte("created_at", dataInizioISO)
      .lte("created_at", dataFineISO)
      .order("created_at", { ascending: true })
      .order("ore", { ascending: true });

    if (error) throw new Error("Errore recupero timbrature: " + error.message);

    // Filtra solo le timbrature (rimuovi dati utente)
    const timbrature = (data || []).map(t => ({
      id: t.id,
      tipo: t.tipo,
      pin: t.pin,
      nome: t.nome,
      cognome: t.cognome,
      data: t.data,
      ore: t.ore,
      giornologico: t.giornologico
    }));

    // Applica filtro aggiuntivo solo se necessario (per giornologico)
    const timbratureFiltrate = timbrature.filter(t => {
      const dataRiferimento = normalizzaData(t.giornologico || t.data);
      return dataRiferimento >= dataInizio && dataRiferimento <= dataFine;
    });

    const result = { dipendente, timbrature: timbratureFiltrate };
    
    // Salva in cache
    cache.set(cacheKey, {
      data: result,
      timestamp: Date.now()
    });

    // ✅ LOG DIAGNOSTICI COMPLETI per troubleshooting
    console.log('🔍 AUDIT QUERY RISULTATI:', {
      pin: pin,
      rangeQuery: `${dataInizioISO} → ${dataFineISO}`,
      utenteFound: !!utenteData,
      recordsRaw: data?.length || 0,
      recordsFiltrati: timbratureFiltrate.length,
      primoRecord: timbratureFiltrate[0]?.created_at || 'N/A',
      ultimoRecord: timbratureFiltrate[timbratureFiltrate.length - 1]?.created_at || 'N/A'
    });

    if (utenteError) {
      console.error('❌ ERRORE UTENTE:', utenteError.message, utenteError.code);
    }
    
    if (error) {
      console.error('❌ ERRORE TIMBRATURE:', error.message, error.code);
    }

    if (timbratureFiltrate.length === 0) {
      console.warn('⚠️ NESSUN RECORD TROVATO per PIN:', pin, 'nel range:', dataInizio, '→', dataFine);
    }

    console.log(`✅ Caricati ${timbratureFiltrate.length} record dal server`);
    return result;
    
  } catch (error) {
    console.error('❌ Errore caricamento dati:', error);
    alert(error.message);
    return { dipendente: null, timbrature: [] };
  }
}

// Funzione per pulire cache quando necessario
export function pulisciCache() {
  cache.clear();
  console.log('🧹 Cache pulita');
}
