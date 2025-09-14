#!/bin/bash
# ===== BADGENODE | REC-004 FIX PIN NaN (SAFE WRAPPER + CALL SITE) =====
# Scopo: evitare 400 "invalid input syntax for type integer: 'NaN'" nella JOIN.
# Come: aggiunge wrapper fetchStoricoJoinSafe (coerce PIN + ISO date) e lo usa in timbrature-data.js.
# Sicurezza: backup, patch idempotente, nessun cambio layout/CRUD/export.
# Rollback: cp -r .backups/REC004_PINFIX_$ts/* ./

set -euo pipefail
ts=$(date +%Y%m%d-%H%M%S)
RUN_ID="REC004-PINFIX-$ts-$RANDOM"
echo "==> RUN_ID: $RUN_ID"

mkdir -p ".backups/REC004_PINFIX_$ts"
cp -vr assets/scripts/rec004_join_adapter.js assets/scripts/timbrature-data.js storico.html ".backups/REC004_PINFIX_$ts/" 2>/dev/null | cat || true

# 1) Aggiunge wrapper sicuro nel join adapter (solo se non già presente)
if [ -f assets/scripts/rec004_join_adapter.js ]; then
  if ! grep -q 'fetchStoricoJoinSafe' assets/scripts/rec004_join_adapter.js; then
    cat >> assets/scripts/rec004_join_adapter.js <<'JS'

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
JS
    echo "[PATCH] Wrapper fetchStoricoJoinSafe aggiunto a rec004_join_adapter.js"
  else
    echo "[INFO] Wrapper già presente (skip)"
  fi
else
  echo "[WARN] rec004_join_adapter.js non trovato (skip)"
fi

# 2) Aggiorna il call-site in timbrature-data.js per preferire il wrapper safe
if [ -f assets/scripts/timbrature-data.js ]; then
  # Preferisci il wrapper nella condizione
  sed -i.bak -E 's/mod\?\.\s*fetchStoricoJoin\s*&&/(mod?.fetchStoricoJoinSafe || mod?.fetchStoricoJoin) \&\&/g' assets/scripts/timbrature-data.js || true
  # Sostituisci la chiamata diretta con selezione funzione sicura
  sed -i.bak -E 's/await\s+mod\.fetchStoricoJoin\s*\(/const __fn = (mod?.fetchStoricoJoinSafe || mod?.fetchStoricoJoin);\n        const res = await __fn(/g' assets/scripts/timbrature-data.js || true
  rm -f assets/scripts/timbrature-data.js.bak
  echo "[PATCH] Call-site aggiornato: usa fetchStoricoJoinSafe se disponibile"
else
  echo "[WARN] timbrature-data.js non trovato (skip)"
fi

# 3) Report
cat > REC004_PINFIX_REPORT.txt <<LOG
# ===== BADGENODE REC-004 PINFIX REPORT =====
# Data: $ts
# RUN_ID: $RUN_ID
# Obiettivo: impedire 'pin = NaN' nella JOIN e usare il wrapper sicuro.

## FILE MODIFICATI
- assets/scripts/rec004_join_adapter.js
  * Aggiunto: fetchStoricoJoinSafe(), __rec004_coercePin(), __rec004_toISO()
  * Esposto su window.__REC004__ { fetchStoricoJoinSafe, coercePin, diag }
- assets/scripts/timbrature-data.js
  * Call-site modificato per preferire fetchStoricoJoinSafe

## COME VALIDARE
1) Apri "storico" e osserva la console:
   - Atteso (JOIN ok): "[REC004] JOIN view attiva: N righe (fallback disabilitato)"
   - In caso di errori di input: non più 400 per 'NaN' (il wrapper blocca o corregge).
2) Debug rapido:
   - window.__REC004__.diag  → mostra { pin, inizioISO, fineISO } usati per la JOIN.
3) Export PDF/XLSX e CRUD devono restare invariati.

## ROLLBACK
cp -r .backups/REC004_PINFIX_$ts/* ./

# ===== FINE REPORT =====
LOG

echo "==> COMPLETATO. Vedi REC004_PINFIX_REPORT.txt"
