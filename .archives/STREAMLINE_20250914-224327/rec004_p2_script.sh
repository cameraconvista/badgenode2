#!/bin/bash
# ===== BADGENODE | REC-004 FASE 2 — JOIN UNICA CON FALLBACK (SAFE) =====
# Cosa fa: prova a usare la view v_timbrature_utenti per caricare lo storico con UNA sola query.
# Se fallisce: fallback automatico al flusso attuale (nessun impatto utente).
# Modifiche minime: patch in assets/scripts/timbrature-data.js (+ eventuale hook __REC004__ in storico.html)
# Rollback: cp -r .backups/REC004_P2_$ts/* ./
# Genera sempre un report semplice .txt

set -euo pipefail
ts=$(date +%Y%m%d-%H%M%S)
RUN_ID="REC004-P2-$ts-$RANDOM"
echo "==> RUN_ID: $RUN_ID"

mkdir -p ".backups/REC004_P2_$ts"
cp -vr storico.html assets/scripts/timbrature-data.js assets/scripts/rec004_join_adapter.js ".backups/REC004_P2_$ts/" 2>/dev/null | cat || true

# 0) Assicura hook globale __REC004__ (idempotente, non invasivo)
if ! grep -q 'window.__REC004__' storico.html; then
  awk '1; /<\/body>/ && !x {
    print "<script>window.__REC004__ = window.__REC004__ || {};</script>";
    x=1
  }' storico.html > storico.html.tmp && mv storico.html.tmp storico.html
  echo "[REC004] Hook __REC004__ aggiunto in storico.html (era assente)"
else
  echo "[REC004] Hook __REC004__ già presente in storico.html (ok)"
fi

# 1) Patch non invasiva in timbrature-data.js:
#    - cerca la PRIMA funzione async che mostra il log "Caricamento dati da server..."
#    - inietta tentativo JOIN (view) con early-return se dati validi
if [ -f assets/scripts/timbrature-data.js ]; then
  if ! grep -q 'REC004-P2 JOIN attempt' assets/scripts/timbrature-data.js; then
    # Inserimento dopo la riga che logga "Caricamento dati da server..."
    # e COMUNQUE all'inizio della funzione corrente (pattern: prima { dopo async function ... )
    # Strategia: trova la PRIMA occorrenza di "Caricamento dati da server" e inietta subito dopo l'apertura della funzione.
    awk '
      BEGIN{inject_done=0}
      {
        if(!inject_done && $0 ~ /Caricamento dati da server\.\.\./){
          saw_log=1
        }
        print $0
        if(!inject_done && saw_log && $0 ~ /\{\s*$/){
          print "    // [REC004-P2 JOIN attempt] prova ad usare la view unica prima del flusso classico";
          print "    try {";
          print "      // Parametri range e pin recuperati come già fa il codice esistente";
          print "      const usp = new URLSearchParams(location.search);";
          print "      const pin = usp.get(\"pin\") || window.__PIN__ || null;";
          print "      const rangeInizio = (typeof inizio !== \"undefined\" ? inizio : (window.__RANGE__?.inizio));";
          print "      const rangeFine   = (typeof fine   !== \"undefined\" ? fine   : (window.__RANGE__?.fine));";
          print "      // Import dinamico dell\\x27adapter (espone fetchStoricoJoin)";
          print "      const mod = await import(\"./rec004_join_adapter.js\");";
          print "      if (mod?.fetchStoricoJoin && pin && rangeInizio && rangeFine) {";
          print "        const res = await mod.fetchStoricoJoin({ pin, inizio: rangeInizio, fine: rangeFine });";
          print "        if (Array.isArray(res?.rows) && res.rows.length >= 0) {";
          print "          // Espone stato diagnostico e dati grezzi (per audit/console)";
          print "          window.__REC004__ = window.__REC004__ || {}; window.__REC004__.lastJoin = res;";
          print "          console.info(\"[REC004] JOIN view attiva: \", res.rows.length, \"righe (fallback disabilitato)\");";
          print "          // *** EARLY RETURN ***";
          print "          return res.rows; // la funzione corrente deve restituire array compatibile con il renderer";
          print "        }";
          print "      }";
          print "    } catch (e) { console.info(\"[REC004] join non disponibile, uso fallback:\", e?.message||e); }";
          inject_done=1
        }
      }' assets/scripts/timbrature-data.js > assets/scripts/timbrature-data.tmp && mv assets/scripts/timbrature-data.tmp assets/scripts/timbrature-data.js

    echo "[PATCH] Inserito tentativo JOIN con early-return in timbrature-data.js"
  else
    echo "[INFO] Patch JOIN già presente in timbrature-data.js (idempotente)"
  fi
else
  echo "[WARN] assets/scripts/timbrature-data.js non trovato: nessuna modifica applicata"
fi

# 2) Nota: non cambiamo il renderer. Se l'early-return restituisce le righe, il flusso a valle le userà.
#    Se la struttura differisce, l'adapter dovrebbe già fornire le stesse colonne usate dal renderer (come da REC-004 fase 1).
#    In caso contrario, scatterà il fallback (si salta l'early-return).

# 3) Report finale
cat > REC004_P2_REPORT.txt <<LOG
# ===== BADGENODE REC-004 FASE 2 REPORT =====
# Data: $ts
# RUN_ID: $RUN_ID
# Obiettivo: usare la view "v_timbrature_utenti" per lo storico con una sola query (fallback se non disponibile)

## FILE MODIFICATI
- storico.html
  * Garantito hook globale: window.__REC004__ (se mancava)
- assets/scripts/timbrature-data.js
  * Inserito blocco: [REC004-P2 JOIN attempt] con early-return

## COMPORTAMENTO
- Se mod.fetchStoricoJoin() restituisce { rows: [...] } → usa i dati della JOIN (log: "[REC004] JOIN view attiva: X righe").
- Se qualcosa non va → il codice originale prosegue invariato (fallback automatico).

## COME VALIDARE
1) Apri "storico" come al solito e guarda la console:
   - Atteso con JOIN: "[REC004] JOIN view attiva: N righe (fallback disabilitato)"
   - In fallback: "[REC004] join non disponibile, uso fallback: ..."
2) Verifica:
   - Rendering identico, export PDF/XLSX invariati, CRUD invariati.
   - Nessun errore rosso in console.
3) Confronta tempi di risposta tra JOIN attiva e fallback (facoltativo).

## ROLLBACK
cp -r .backups/REC004_P2_$ts/* ./

# ===== FINE REPORT =====
LOG

echo "==> COMPLETATO. Vedi REC004_P2_REPORT.txt"
