#!/bin/bash
# ===== BADGENODE | REC-006 CACHE HTTP (SAFE, NO CODE CHANGE) =====
# Obiettivo: configurare caching per asset statici con public/_headers.
# Modifiche minime: crea/aggiorna solo public/_headers + report .txt.
# Rollback: cp -r .backups/REC006_$ts/* ./
# NOTE: su Render potrebbe essere necessario "Clear build cache" per attivare i nuovi header.

set -euo pipefail
ts=$(date +%Y%m%d-%H%M%S)
RUN_ID="REC006-$ts-$RANDOM"
echo "==> RUN_ID: $RUN_ID"

# 1) Backup conservativo
mkdir -p ".backups/REC006_$ts"
cp -vr public ".backups/REC006_$ts/" 2>/dev/null | cat || true

# 2) Prepara struttura e _headers (idempotente)
mkdir -p public

# Contenuto headers: policy prudente.
# - Default (/*): no caching dell'HTML (max-age=0, must-revalidate)
# - Asset generici /assets/*: caching 7 giorni (immutable)
# - Icone e media pesanti: 1 anno (immutable)
# - Sorgenti map (se esistono): cache breve
HEADERS_FILE="public/_headers"
cat > "$HEADERS_FILE" <<'H'
/*
  Cache-Control: public, max-age=0, must-revalidate

/assets/*
  Cache-Control: public, max-age=604800, immutable

/assets/styles/*
  Cache-Control: public, max-age=604800, immutable

/assets/scripts/*
  Cache-Control: public, max-age=604800, immutable

/assets/icons/*
  Cache-Control: public, max-age=31536000, immutable

/*.map
  Cache-Control: public, max-age=86400
H

echo "[OK] Scritto $HEADERS_FILE"

# 3) Note di deploy (promemoria operativo)
cat > REC006_DEPLOY_NOTES.txt <<TXT
BADGENODE — Note Deploy REC-006
Data: $ts
Cosa è stato fatto:
- Creato/aggiornato public/_headers per abilitare caching asset statici.

Cosa fare su Render:
1) Esegui un deploy con "Clear build cache".
2) Apri la app, verifica nella rete (DevTools) che gli asset /assets/* abbiano Cache-Control come da _headers.
3) Verifica che l'HTML (/, /index.html, ecc.) abbia max-age=0; must-revalidate.

Note:
- Se il tuo ambiente Render non legge public/_headers, configura le policy header dalla dashboard.
- Nessuna modifica a HTML/JS/CSS dell'app.
TXT

# 4) Report sintetico
REPORT="REC006_REPORT.txt"
cat > "$REPORT" <<LOG
# ===== BADGENODE REC-006 REPORT =====
# Data: $ts
# RUN_ID: $RUN_ID
# Obiettivo: caching asset statici via public/_headers

## FILE CREATI/MODIFICATI
- public/_headers
- REC006_DEPLOY_NOTES.txt (solo note operative)

## POLICY INSERITE
- HTML (/*): Cache-Control: public, max-age=0, must-revalidate
- /assets/*: Cache-Control: public, max-age=604800, immutable
- /assets/styles/*: max-age=604800, immutable
- /assets/scripts/*: max-age=604800, immutable
- /assets/icons/*: max-age=31536000, immutable
- /*.map: max-age=86400

## VALIDAZIONI SUGGERITE (post-deploy con Clear build cache)
1) Apri DevTools → Network → ricarica la pagina.
2) Seleziona un file sotto /assets/scripts/ o /assets/styles/:
   - Intestazione attesa: Cache-Control: public, max-age=604800, immutable
3) Seleziona il documento (Doc/HTML):
   - Intestazione attesa: Cache-Control: public, max-age=0, must-revalidate

## BACKUP
- Cartella: .backups/REC006_$ts/
- Rollback: cp -r .backups/REC006_$ts/* ./

# ===== FINE REPORT =====
LOG

echo "==> COMPLETATO. Vedi $REPORT e REC006_DEPLOY_NOTES.txt"
