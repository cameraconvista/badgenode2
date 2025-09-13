// 🗄️ BADGEBOX Supabase Client - Modulo ES puro
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// 🔧 CONFIGURAZIONE CENTRALIZZATA - Attesa config runtime
async function getSupabaseConfig() {
  // Attendi che il config sia caricato (max 5 secondi)
  for (let i = 0; i < 50; i++) {
    if (typeof window !== 'undefined' && window.BADGENODE_CONFIG) {
      console.log('✅ Runtime config trovato dopo', i * 100, 'ms');
      return {
        url: window.BADGENODE_CONFIG.SUPABASE_URL,
        key: window.BADGENODE_CONFIG.SUPABASE_ANON_KEY
      };
    }
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  console.warn('⚠️ Runtime config non trovato, uso fallback');
  return {
    url: 'https://txmjqrnitfsiytbytxlc.supabase.co',
    key: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR4bWpxcm5pdGZzaXl0Ynl0eGxjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE1MzY1MDcsImV4cCI6MjA2NzExMjUwN30.lag16Oxh_UQL4WOeU9-pVxIzvUyiNQMhKUY5Y5s9DPg'
  };
};

// 🔍 VALIDAZIONE CONFIGURAZIONE - Con controlli avanzati
async function validateConfig() {
  const config = await getSupabaseConfig();
  const envSource = window.BADGENODE_CONFIG ? 'RUNTIME' : 'FALLBACK';

  // Controllo presenza variabili
  if (!config.url || !config.key) {
    throw new Error(`❌ Configurazione Supabase mancante:
    - URL: ${config.url ? '✅' : '❌'}
    - KEY: ${config.key ? '✅' : '❌'}
    
    Verifica file config.js o variabili ambiente.`);
  }
  
  // Controllo formato URL
  if (!config.url.startsWith('https://') || !config.url.includes('.supabase.co')) {
    throw new Error(`❌ URL Supabase non valido: ${config.url}`);
  }
  
  // Controllo formato JWT token
  if (!config.key.includes('.') || config.key.split('.').length !== 3) {
    throw new Error(`❌ Chiave Supabase non valida (formato JWT atteso)`);
  }
  
  console.log(`🔧 Configurazione Supabase validata (${envSource}):`, {
    url: config.url,
    keyPrefix: config.key.substring(0, 20) + '...'
  });
  
  return config;
}

// ✅ INIZIALIZZAZIONE ASINCRONA - Client Supabase con attesa config
let supabaseClient = null;

async function initializeSupabaseClient() {
  try {
    const config = await validateConfig();
    supabaseClient = createClient(config.url, config.key);
    console.log('✅ Supabase client inizializzato immediatamente');
    return supabaseClient;
  } catch (error) {
    console.error('❌ Errore critico Supabase:', error);
    throw error;
  }
}

// Auto-inizializzazione
initializeSupabaseClient().catch(console.error);

// Export del client e funzioni
export { supabaseClient, initializeSupabaseClient };

// Utility per gestione errori
export function gestisciErroreSupabase(error) {
  if (error?.code === 'PGRST116') return 'Nessun dato trovato';
  if (error?.message?.includes('invalid key')) return 'Errore configurazione - contattare amministratore';
  return error?.message || 'Errore di sistema';
}